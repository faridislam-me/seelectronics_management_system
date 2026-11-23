"use server";

import { db } from "@/db/drizzle";
import {
  customers,
  driveAddMoneyRequests,
  mobileRechargeRequests,
  referralBonuses,
  referralPaymentRequests,
} from "@/db/schema";
import { verifyCustomerSession } from "@/actions/customerActions";
import { verifySession } from "@/lib";
import { generateRandomId } from "@/utils";
import * as topup from "@/lib/successtopup";
import { getRechargePacksWithCache } from "@/lib/rechargePackCache";
import { operatorMatchesNumber, OPERATOR_MISMATCH_MESSAGE } from "@/lib/operatorDetect";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { after as afterResponse } from "next/server";

const UNAUTHORIZED = { success: false as const, message: "Unauthorized" };

/**
 * Opportunistic recharge reconciliation scheduled to run AFTER the response is
 * sent (so it never slows the recharge). A recharge is only "accepted" when it
 * returns result:true — the operator can still fail it minutes later. On a Hobby
 * plan we can't add a frequent cron, so every recharge sweeps the recent backlog
 * of still-"completed" recharges and auto-refunds any the provider has since
 * failed. Best-effort; errors are swallowed.
 */
const sweepRechargesAfterResponse = () => {
  afterResponse(async () => {
    try {
      const { reconcileRecharges } = await import("@/lib/rechargeReconcile");
      await reconcileRecharges();
    } catch (e) {
      console.error("post-recharge reconcile sweep failed:", e);
    }
  });
};

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

const reqCode = () => "RCH" + generateRandomId(5).replace(/^SE/, "");

const OPERATORS: Record<string, string> = {
  grameenphone: "Grameenphone",
  banglalink: "Banglalink",
  robi: "Robi",
  airtel: "Airtel",
  teletalk: "Teletalk",
  skitto: "Skitto",
};

/** Customer: submit and auto-process a mobile recharge */
export const requestMobileRecharge = async (input: {
  rechargePhone: string;
  operator: string;
  amount: number;
  rechargeType?: string;
  packageId?: string;
  driverRef?: string;
}) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const { rechargePhone, operator, amount, rechargeType = "recharge", packageId, driverRef } = input;

    if (!rechargePhone?.trim()) return { success: false, message: "রিচার্জ নম্বর আবশ্যক" };
    if (!operator || !OPERATORS[operator]) return { success: false, message: "অপারেটর নির্বাচন করুন" };
    if (!amount || amount < 20) return { success: false, message: "ন্যূনতম রিচার্জ ৳২০" };

    // Guard against an operator/number mismatch (e.g. GP tab selected but a 019
    // Banglalink number) — wrong recharges were going through and deducting money.
    // Prefix-based (not 100% due to MNP) but blocks the obvious wrong-operator case.
    if (!operatorMatchesNumber(operator, rechargePhone.trim()).ok) {
      return { success: false as const, code: "OPERATOR_MISMATCH" as const, message: OPERATOR_MISMATCH_MESSAGE };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: {
        customerId: true,
        name: true,
        phone: true,
        referralBalance: true,
        driveBalance: true,
        driveKycStatus: true,
      },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    // Drive / bundle packs are paid from the separate, KYC-gated drive wallet;
    // ordinary recharge and regular packs from the referral balance.
    const isDrive = rechargeType === "drive_pack" || rechargeType === "drive_offer";

    if (isDrive) {
      if (!driverRef?.trim()) {
        return { success: false, message: "ড্রাইভার আইডি / রেফারেন্স নম্বর আবশ্যক" };
      }
      if (customer.driveKycStatus !== "approved") {
        return { success: false, message: "ড্রাইভ প্যাক কিনতে আগে ড্রাইভ KYC অনুমোদন প্রয়োজন" };
      }
      if (Number(customer.driveBalance) < amount) {
        return { success: false, message: `অপর্যাপ্ত ড্রাইভ ব্যালেন্স। আপনার ড্রাইভ ব্যালেন্স: ৳${Number(customer.driveBalance).toLocaleString()}` };
      }
    } else if (Number(customer.referralBalance) < amount) {
      return { success: false, message: `অপর্যাপ্ত ব্যালেন্স। আপনার ব্যালেন্স: ৳${Number(customer.referralBalance).toLocaleString()}` };
    }

    // Which reseller pool funds this: drive packs/offers from the provider drive
    // balance, everything else from the main balance.
    const pool: topup.ResellerPool = isDrive ? "drive" : "main";

    // Pre-check OUR SuccessTopup reseller balance BEFORE attempting the recharge.
    // If it is empty/insufficient we cannot fulfil the purchase, so return a
    // structured API_BALANCE_EMPTY result (the UI shows a popup) and SMS the
    // admin to refill the API balance (throttled). A null result = couldn't
    // determine → don't block; the post-attempt error match is the backstop.
    const preBal = await topup.checkResellerBalance(amount, pool);
    if (preBal && !preBal.ok) {
      try {
        const { notifyAdminApiBalanceEmpty } = await import("@/lib/adminVoiceNotify");
        await notifyAdminApiBalanceEmpty(pool);
      } catch (e) {
        console.error("notifyAdminApiBalanceEmpty (customer pre-check) failed:", e);
      }
      return {
        success: false as const,
        code: topup.API_BALANCE_EMPTY,
        message: topup.API_BALANCE_EMPTY_MESSAGE,
      };
    }

    let code = reqCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.mobileRechargeRequests.findFirst({
        where: eq(mobileRechargeRequests.requestCode, code),
        columns: { id: true },
      });
      if (!exists) break;
      code = reqCode();
    }

    const trxid = `SE${Date.now()}${code}`;

    // Call SuccessTopup API
    const apiRes = await topup.recharge({
      number: rechargePhone.trim(),
      operator,
      amount,
      trxid,
      packageId: packageId || undefined,
    });

    const isSuccess = apiRes.result === true;

    // Provider rejected the recharge because OUR reseller balance is insufficient
    // (backstop for the pre-check above). Treat it like an empty-balance outage:
    // don't record a customer-facing rejection, popup + throttled admin SMS.
    if (!isSuccess && topup.isResellerBalanceError(apiRes)) {
      try {
        const { notifyAdminApiBalanceEmpty } = await import("@/lib/adminVoiceNotify");
        await notifyAdminApiBalanceEmpty(pool);
      } catch (e) {
        console.error("notifyAdminApiBalanceEmpty (customer post-error) failed:", e);
      }
      return {
        success: false as const,
        code: topup.API_BALANCE_EMPTY,
        message: topup.API_BALANCE_EMPTY_MESSAGE,
      };
    }

    await db.insert(mobileRechargeRequests).values({
      requestCode: code,
      customerId: customer.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      rechargePhone: rechargePhone.trim(),
      operator: operator as any,
      amount,
      rechargeType,
      packageId: packageId || null,
      driverRef: isDrive ? driverRef!.trim() : null,
      apiTrxId: trxid,
      apiStatus: isSuccess ? "Success" : (apiRes.message || "Failed"),
      status: isSuccess ? "completed" : "rejected",
      rejectReason: isSuccess ? null : (apiRes.message || "API রিচার্জ ব্যর্থ"),
      processedAt: new Date(),
    });

    if (isSuccess) {
      // Atomic guarded deduct from the correct wallet (neon-http has no
      // interactive transactions, so the gte guard prevents a concurrent
      // overdraft instead of a check-then-write race).
      if (isDrive) {
        await db
          .update(customers)
          .set({ driveBalance: sql`${customers.driveBalance} - ${amount}` })
          .where(and(eq(customers.customerId, customer.customerId), gte(customers.driveBalance, amount)));
      } else {
        await db
          .update(customers)
          .set({ referralBalance: sql`${customers.referralBalance} - ${amount}` })
          .where(and(eq(customers.customerId, customer.customerId), gte(customers.referralBalance, amount)));
      }
    }

    revalidatePath("/customer/referral");
    revalidatePath("/recharge-requests");

    if (isSuccess) {
      // Sweep the recent recharge backlog after responding, so a previously
      // accepted-then-failed recharge gets auto-refunded promptly.
      sweepRechargesAfterResponse();
      const updatedCustomer = await db.query.customers.findFirst({
        where: eq(customers.customerId, customer.customerId),
        columns: { referralBalance: true, driveBalance: true },
      });
      return {
        success: true,
        requestCode: code,
        message: "রিচার্জ সম্পন্ন হয়েছে ✓",
        detail: {
          phone: rechargePhone.trim(),
          operator: OPERATORS[operator] || operator,
          operatorKey: operator,
          amount,
          trxId: trxid,
          wallet: isDrive ? ("drive" as const) : ("referral" as const),
          newBalance: Number(
            (isDrive ? updatedCustomer?.driveBalance : updatedCustomer?.referralBalance) ?? 0,
          ),
          newDriveBalance: Number(updatedCustomer?.driveBalance ?? 0),
          time: new Date().toISOString(),
        },
      };
    }
    return { success: false, message: apiRes.message || "রিচার্জ ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।" };
  } catch (error) {
    console.error("requestMobileRecharge error:", error);
    return { success: false, message: "রিচার্জ প্রক্রিয়া ব্যর্থ হয়েছে" };
  }
};

/** Customer: list own recharge requests */
export const getMyRechargeRequests = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const rows = await db
      .select()
      .from(mobileRechargeRequests)
      .where(eq(mobileRechargeRequests.customerId, session.customer.customerId))
      .orderBy(desc(mobileRechargeRequests.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getMyRechargeRequests error:", error);
    return { success: false, message: "রিচার্জ তালিকা আনা যায়নি" };
  }
};

/**
 * Fetch available bundle packages from SuccessTopup for the recharge pack UIs.
 *
 * `type` selects the dataset: "regular" = standard operator bundles (the
 * রেগুলার প্যাক screen, paid from referral balance), "drive" = the special
 * drive offers (ড্রাইভ প্যাক / ড্রাইভ অফার screens, paid from the drive wallet).
 * Defaults to "regular" so an un-typed caller gets the regular packs.
 */
export const getDrivePackages = async (
  operator: string,
  type: "regular" | "drive" = "regular",
) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    // Cache-backed: serve live packs when the API has them, otherwise the
    // last-known cached packs so the list never shows empty at night.
    const data = await getRechargePacksWithCache(operator, type);
    return { success: true, data };
  } catch (error) {
    console.error("getDrivePackages error:", error);
    return { success: false, message: "প্যাকেজ লোড করা যায়নি" };
  }
};

/** Admin: list all recharge requests */
export const getRechargeRequests = async ({
  query = "",
  status,
}: {
  query?: string;
  status?: string;
}) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const q = `%${query}%`;
    const where = and(
      query
        ? or(
            ilike(mobileRechargeRequests.requestCode, q),
            ilike(mobileRechargeRequests.customerName, q),
            ilike(mobileRechargeRequests.customerPhone, q),
            ilike(mobileRechargeRequests.rechargePhone, q),
          )
        : undefined,
      status ? eq(mobileRechargeRequests.status, status as any) : undefined,
    );

    const rows = await db
      .select()
      .from(mobileRechargeRequests)
      .where(where)
      .orderBy(desc(mobileRechargeRequests.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getRechargeRequests error:", error);
    return { success: false, message: "রিচার্জ তালিকা আনা যায়নি" };
  }
};

/** Admin: check API status for a transaction */
export const checkRechargeStatus = async (code: string) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const req = await db.query.mobileRechargeRequests.findFirst({
      where: eq(mobileRechargeRequests.requestCode, code),
    });
    if (!req || !req.apiTrxId) return { success: false, message: "ট্র্যানজেকশন পাওয়া যায়নি" };

    const res = await topup.checkStatus(req.apiTrxId);
    return { success: true, data: res };
  } catch (error) {
    console.error("checkRechargeStatus error:", error);
    return { success: false, message: "স্ট্যাটাস চেক ব্যর্থ" };
  }
};

/** Admin: manually complete or reject a recharge request */
export const reviewRechargeRequest = async (
  code: string,
  action: "complete" | "reject",
  payload?: { rejectReason?: string; adminNotes?: string },
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const req = await db.query.mobileRechargeRequests.findFirst({
      where: eq(mobileRechargeRequests.requestCode, code),
    });
    if (!req) return { success: false, message: "অনুরোধ পাওয়া যায়নি" };
    if (req.status === "completed") return { success: false, message: "ইতোমধ্যে সম্পন্ন" };
    if (req.status === "rejected") return { success: false, message: "ইতোমধ্যে প্রত্যাখ্যাত" };

    if (action === "reject") {
      await db
        .update(mobileRechargeRequests)
        .set({
          status: "rejected",
          rejectReason: payload?.rejectReason,
          adminNotes: payload?.adminNotes,
          processedAt: new Date(),
        })
        .where(eq(mobileRechargeRequests.id, req.id));

      revalidatePath("/recharge-requests");
      return { success: true, message: "অনুরোধ প্রত্যাখ্যাত হয়েছে" };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, req.customerId),
      columns: { referralBalance: true },
    });
    if (!customer || Number(customer.referralBalance) < req.amount) {
      return { success: false, message: "গ্রাহকের ব্যালেন্স অপর্যাপ্ত" };
    }

    await db
      .update(mobileRechargeRequests)
      .set({
        status: "completed",
        adminNotes: payload?.adminNotes,
        processedAt: new Date(),
      })
      .where(eq(mobileRechargeRequests.id, req.id));

    await db
      .update(customers)
      .set({
        referralBalance: sql`${customers.referralBalance} - ${req.amount}`,
      })
      .where(eq(customers.customerId, req.customerId));

    revalidatePath("/recharge-requests");
    revalidatePath("/customer/referral");
    return { success: true, message: "রিচার্জ সম্পন্ন ও ব্যালেন্স কর্তন হয়েছে" };
  } catch (error) {
    console.error("reviewRechargeRequest error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

const DRIVE_METHOD_LABELS: Record<string, string> = {
  bkash: "বিকাশ",
  nagad: "নগদ",
  rocket: "রকেট",
};

const RECHARGE_TYPE_LABELS: Record<string, string> = {
  recharge: "রিচার্জ",
  regular_pack: "রেগুলার প্যাক",
  drive_pack: "ড্রাইভ প্যাক",
  drive_offer: "ড্রাইভ অফার",
};

export type CustomerMoneyHistoryRow = {
  id: string;
  /**
   * "recharge" = mobile recharge, "drive" = drive add-money top-up,
   * "referral_earning" = referral bonus earned from a referred customer's
   * purchase, "referral_payout" = referral balance cash-out request (bKash/Nagad).
   */
  kind: "recharge" | "drive" | "referral_earning" | "referral_payout";
  /** রিচার্জ / ড্রাইভ / রেফারেল আয় / রেফারেল পেমেন্ট */
  typeLabel: string;
  /** Method as stored: "recharge" for recharges, বিকাশ / নগদ / রকেট for drive & payouts. */
  method: string;
  /** Operator key for the recharge icon (recharge rows only). */
  operatorKey?: string;
  /**
   * Recharged number (recharge), sender wallet number (drive add-money),
   * payout wallet number (referral_payout), or the referred customer's name
   * (referral_earning — the source of the bonus).
   */
  number: string;
  /** Operator display name (recharge rows only). */
  operator?: string;
  amount: number;
  status: string;
  createdAt: string;
};

/**
 * Admin: combined money history for ONE customer — mobile recharges
 * (mobileRechargeRequests), drive add-money top-ups (driveAddMoneyRequests),
 * referral earnings (referralBonuses — bonus earned when a customer the user
 * referred makes a purchase) and referral payout/cash-out requests
 * (referralPaymentRequests — withdrawing the referral balance via bKash/Nagad),
 * newest first. Lets an admin see, exactly like the customer sees on their own
 * phone, who recharged when, how much referral money they earned and from whom,
 * and how they cashed it out. Admin-gated and read-only.
 */
export const getCustomerMoneyHistory = async (customerId: string) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    if (!customerId) return { success: false as const, message: "customerId আবশ্যক" };

    const [recharges, driveTopups, referralEarnings, referralPayouts] = await Promise.all([
      db
        .select()
        .from(mobileRechargeRequests)
        .where(eq(mobileRechargeRequests.customerId, customerId))
        .orderBy(desc(mobileRechargeRequests.createdAt)),
      db
        .select()
        .from(driveAddMoneyRequests)
        .where(eq(driveAddMoneyRequests.customerId, customerId))
        .orderBy(desc(driveAddMoneyRequests.createdAt)),
      db
        .select()
        .from(referralBonuses)
        .where(eq(referralBonuses.referrerCustomerId, customerId))
        .orderBy(desc(referralBonuses.createdAt)),
      db
        .select()
        .from(referralPaymentRequests)
        .where(eq(referralPaymentRequests.customerId, customerId))
        .orderBy(desc(referralPaymentRequests.createdAt)),
    ]);

    const rechargeRows: CustomerMoneyHistoryRow[] = recharges.map((r) => ({
      id: `rch-${r.id}`,
      kind: "recharge" as const,
      typeLabel: RECHARGE_TYPE_LABELS[r.rechargeType] || "রিচার্জ",
      method: "recharge",
      operatorKey: r.operator,
      number: r.rechargePhone,
      operator: OPERATORS[r.operator] || r.operator,
      amount: Number(r.amount),
      status: r.status,
      createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt)).toISOString(),
    }));

    const driveRows: CustomerMoneyHistoryRow[] = driveTopups.map((d) => ({
      id: `drv-${d.id}`,
      kind: "drive" as const,
      typeLabel: "ড্রাইভ",
      method: DRIVE_METHOD_LABELS[d.method] || d.method,
      number: d.senderNumber,
      amount: Number(d.amount),
      status: d.status,
      createdAt: (d.createdAt instanceof Date ? d.createdAt : new Date(d.createdAt)).toISOString(),
    }));

    // Referral earnings: bonus credited to this customer for a referred
    // customer's purchase. Always a realised credit, so shown as "completed".
    const referralEarningRows: CustomerMoneyHistoryRow[] = referralEarnings.map((b) => ({
      id: `rfe-${b.id}`,
      kind: "referral_earning" as const,
      typeLabel: "রেফারেল আয়",
      method: "রেফারেল বোনাস",
      number: b.referredCustomerName,
      amount: Number(b.bonusEarned),
      status: "completed",
      createdAt: (b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)).toISOString(),
    }));

    // Referral payouts: cash-out requests of the referral balance (bKash/Nagad).
    const referralPayoutRows: CustomerMoneyHistoryRow[] = referralPayouts.map((p) => ({
      id: `rfp-${p.id}`,
      kind: "referral_payout" as const,
      typeLabel: "রেফারেল পেমেন্ট",
      method: DRIVE_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
      number: p.walletNumber,
      amount: Number(p.amount),
      status: p.status,
      createdAt: (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt)).toISOString(),
    }));

    const data = [
      ...rechargeRows,
      ...driveRows,
      ...referralEarningRows,
      ...referralPayoutRows,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true as const, data };
  } catch (error) {
    console.error("getCustomerMoneyHistory error:", error);
    return { success: false as const, message: "লেনদেন ইতিহাস আনা যায়নি" };
  }
};

/** Admin: get SuccessTopup account balance */
export const getTopupBalance = async () => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    const res = await topup.getBalance();
    if (!res.result) return { success: false, message: "ব্যালেন্স চেক ব্যর্থ" };
    return { success: true, balance: res.balance, driveBalance: res.driveBalance };
  } catch (error) {
    console.error("getTopupBalance error:", error);
    return { success: false, message: "ব্যালেন্স চেক ব্যর্থ" };
  }
};

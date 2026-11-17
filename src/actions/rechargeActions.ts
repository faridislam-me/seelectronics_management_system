"use server";

import { db } from "@/db/drizzle";
import { customers, driveAddMoneyRequests, mobileRechargeRequests } from "@/db/schema";
import { verifyCustomerSession } from "@/actions/customerActions";
import { verifySession } from "@/lib";
import { generateRandomId } from "@/utils";
import * as topup from "@/lib/successtopup";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const UNAUTHORIZED = { success: false as const, message: "Unauthorized" };

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

/** Fetch available drive/bundle packages from SuccessTopup */
export const getDrivePackages = async (operator: string) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const res = await topup.getDrives(operator);
    if (!res.result) return { success: false, message: "প্যাকেজ লোড করা যায়নি" };

    return { success: true, data: res.drives || [] };
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
  /** "recharge" = mobile recharge, "drive" = drive add-money top-up. */
  kind: "recharge" | "drive";
  /** রিচার্জ / ড্রাইভ */
  typeLabel: string;
  /** Method as stored: "recharge" for recharges, বিকাশ / নগদ / রকেট for drive. */
  method: string;
  /** Operator key for the recharge icon (recharge rows only). */
  operatorKey?: string;
  /** Recharged number (recharge) or sender wallet number (drive add-money). */
  number: string;
  /** Operator display name (recharge rows only). */
  operator?: string;
  amount: number;
  status: string;
  createdAt: string;
};

/**
 * Admin: combined money history for ONE customer — mobile recharges
 * (mobileRechargeRequests) plus drive add-money top-ups (driveAddMoneyRequests),
 * newest first. Lets an admin see who recharged when, how much, and how they
 * cashed out / topped up their drive wallet. Admin-gated and read-only.
 */
export const getCustomerMoneyHistory = async (customerId: string) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    if (!customerId) return { success: false as const, message: "customerId আবশ্যক" };

    const [recharges, driveTopups] = await Promise.all([
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

    const data = [...rechargeRows, ...driveRows].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

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

import "server-only";

import { notifyCustomer, notifyStaff } from "@/actions/notificationActions";
import { db } from "@/db/drizzle";
import { customers, mobileRechargeRequests, payments, staffs } from "@/db/schema";
import * as topup from "@/lib/successtopup";
import { and, eq, gt, ilike, lt, not, sql } from "drizzle-orm";

/**
 * Recharge reconciliation + auto-refund.
 *
 * SuccessTopup's /api/recharge returns `result:true` as soon as a recharge is
 * ACCEPTED (queued) — not when it is actually delivered. When the operator /
 * API later cancels or fails a recharge, the money the staff member (or a
 * customer) already paid was never returned and no one was told. This sweep
 * re-checks every recharge that is still marked "completed" against the
 * authoritative /api/status endpoint and, for any the provider reports as
 * FAILED/CANCELLED, returns the money to the payer's balance and notifies them
 * (in-app + push + SMS). Rows the provider confirms as delivered are tagged so
 * they are not re-checked; ones still "Processing" are left for the next sweep.
 *
 * Safety / correctness:
 *   - Money is returned ONLY on an explicit provider failure status. A status
 *     lookup that errors or is still "Processing"/unknown is treated as pending
 *     (classifyRechargeStatus), so a transient API hiccup can never trigger a
 *     wrong refund.
 *   - The refund is claimed with a single conditional UPDATE ... RETURNING that
 *     flips the row off "completed"; only the caller that actually flips the row
 *     proceeds to credit + notify, so overlapping sweeps can never double-refund
 *     (neon-http has no interactive transactions — this atomic claim replaces one).
 */

// Only look at recharges from the last 2 days. Recharges settle within minutes;
// after this window a still-"Processing" one is left alone (manual admin review).
const WINDOW_MS = 2 * 24 * 60 * 60 * 1000;
// Give a fresh recharge a moment to move past the initial "Processing" state
// before the first status check (avoids hammering the API on brand-new rows).
const SETTLE_MS = 60 * 1000;

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Marker appended to a row once the provider confirms delivery, so it is skipped next sweep. */
const VERIFIED = "[VERIFIED]";
const REFUNDED = "[REFUNDED]";

type ReconcileResult = {
  checked: number;
  refunded: number;
  verified: number;
  pending: number;
  errors: number;
};

export async function reconcileRecharges(): Promise<{
  success: true;
  staff: ReconcileResult;
  customer: ReconcileResult;
}> {
  const now = Date.now();
  const since = new Date(now - WINDOW_MS);
  const settledBefore = new Date(now - SETTLE_MS);

  const staff = await reconcileStaffRecharges(since, settledBefore);
  const customer = await reconcileCustomerRecharges(since, settledBefore);

  return { success: true, staff, customer };
}

/** Safe status check: any error → null (classified as "pending", i.e. no action). */
async function safeStatus(trxid: string): Promise<topup.RechargeOutcome> {
  try {
    const res = await topup.checkStatus(trxid);
    return topup.classifyRechargeStatus(res);
  } catch (e) {
    console.error(`reconcile: checkStatus(${trxid}) failed:`, e);
    return "pending";
  }
}

/**
 * Staff recharges are recorded as `payments` rows tagged `[RECHARGE] …` with
 * status "completed" (which counts AGAINST the staff's computed balance:
 * balance = SUM(credited) − SUM(status IN requested/pending/approved/completed)).
 * Refund = flip the row to "rejected" so it stops counting — the balance goes
 * back up by exactly the recharge amount; no separate credit row is needed.
 */
async function reconcileStaffRecharges(since: Date, settledBefore: Date): Promise<ReconcileResult> {
  const out: ReconcileResult = { checked: 0, refunded: 0, verified: 0, pending: 0, errors: 0 };

  const rows = await db
    .select({
      id: payments.id,
      staffId: payments.staffId,
      amount: payments.amount,
      transactionId: payments.transactionId,
      description: payments.description,
    })
    .from(payments)
    .where(
      and(
        ilike(payments.description, "[RECHARGE]%"),
        eq(payments.status, "completed"),
        gt(payments.date, since),
        lt(payments.date, settledBefore),
        not(ilike(payments.description, `%${VERIFIED}%`)),
      ),
    );

  for (const row of rows) {
    if (!row.transactionId) continue;
    out.checked++;
    const outcome = await safeStatus(row.transactionId);

    if (outcome === "pending") {
      out.pending++;
      continue;
    }

    if (outcome === "success") {
      // Confirmed delivered — tag so it is not re-checked next sweep. Atomic
      // claim (only the sweep that actually adds the tag notifies), so
      // overlapping sweeps can never send the "delivered" notification twice.
      const tagged = await db
        .update(payments)
        .set({ description: `${row.description ?? ""} ${VERIFIED}`.trim() })
        .where(
          and(
            eq(payments.id, row.id),
            eq(payments.status, "completed"),
            not(ilike(payments.description, `%${VERIFIED}%`)),
          ),
        )
        .returning({ id: payments.id });
      if (tagged.length === 0) continue; // another sweep already verified it
      out.verified++;
      try {
        const amt = Number(row.amount);
        const phone = (row.description?.match(/01\d{9}/) || [""])[0];
        await notifyStaff({
          staffId: row.staffId,
          phoneNumber: "",
          type: "recharge_delivered",
          message: `আপনার ${bdt(amt)} মোবাইল রিচার্জটি${phone ? ` (${phone})` : ""} সফলভাবে সম্পন্ন হয়েছে। TrxID: ${row.transactionId}`,
          shortMessage: `রিচার্জ সফল: ${bdt(amt)}${phone ? ` → ${phone}` : ""}`,
          link: "/staff/payment/recharge",
          sendSms: false,
        });
      } catch (e) {
        console.error(`reconcile: notifyStaff (delivered) failed for ${row.staffId}:`, e);
        out.errors++;
      }
      continue;
    }

    // outcome === "failed" → return the money. Atomic claim: only the sweep that
    // actually flips completed→rejected owns the refund/notification.
    const amt = Number(row.amount);
    const claimed = await db
      .update(payments)
      .set({
        status: "rejected",
        description: `${row.description ?? ""} ${REFUNDED}: রিচার্জ ব্যর্থ, ${bdt(amt)} ব্যালেন্সে ফেরত`.trim(),
      })
      .where(and(eq(payments.id, row.id), eq(payments.status, "completed")))
      .returning({ id: payments.id });

    if (claimed.length === 0) continue; // another sweep already refunded it

    out.refunded++;
    try {
      const staff = await db.query.staffs.findFirst({
        where: eq(staffs.staffId, row.staffId),
        columns: { phone: true },
      });
      await notifyStaff({
        staffId: row.staffId,
        phoneNumber: staff?.phone ?? "",
        type: "recharge_refund",
        message: `আপনার ${bdt(amt)} মোবাইল রিচার্জটি সম্পন্ন হয়নি (এপিআই/অপারেটর সমস্যা)। তাই ${bdt(amt)} আপনার ব্যালেন্সে আবার যোগ করে দেওয়া হয়েছে।`,
        shortMessage: `SE Electronics: রিচার্জ ব্যর্থ হওয়ায় ${bdt(amt)} আপনার ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
        link: "/staff/payment/recharge",
      });
    } catch (e) {
      console.error(`reconcile: notifyStaff failed for ${row.staffId}:`, e);
      out.errors++;
    }
  }

  return out;
}

/**
 * Customer recharges live in `mobile_recharge_requests` and the money was
 * deducted from the customer's referral wallet (or drive wallet for drive
 * packs/offers). Refund = flip status off "completed" (atomic claim) and credit
 * the amount back to the matching wallet.
 */
async function reconcileCustomerRecharges(since: Date, settledBefore: Date): Promise<ReconcileResult> {
  const out: ReconcileResult = { checked: 0, refunded: 0, verified: 0, pending: 0, errors: 0 };

  const rows = await db
    .select()
    .from(mobileRechargeRequests)
    .where(
      and(
        eq(mobileRechargeRequests.status, "completed"),
        gt(mobileRechargeRequests.createdAt, since),
        lt(mobileRechargeRequests.createdAt, settledBefore),
        not(eq(mobileRechargeRequests.apiStatus, VERIFIED)),
      ),
    );

  for (const row of rows) {
    if (!row.apiTrxId) continue;
    out.checked++;
    const outcome = await safeStatus(row.apiTrxId);

    if (outcome === "pending") {
      out.pending++;
      continue;
    }

    if (outcome === "success") {
      // Atomic claim, so overlapping sweeps never send "delivered" twice.
      const tagged = await db
        .update(mobileRechargeRequests)
        .set({ apiStatus: VERIFIED })
        .where(
          and(
            eq(mobileRechargeRequests.id, row.id),
            eq(mobileRechargeRequests.status, "completed"),
            not(eq(mobileRechargeRequests.apiStatus, VERIFIED)),
          ),
        )
        .returning({ id: mobileRechargeRequests.id });
      if (tagged.length === 0) continue; // another sweep already verified it
      out.verified++;
      try {
        const amt = Number(row.amount);
        await notifyCustomer({
          customerId: row.customerId,
          phoneNumber: row.customerPhone,
          type: "recharge_delivered",
          message: `আপনার ${bdt(amt)} রিচার্জটি (${row.rechargePhone}) সফলভাবে সম্পন্ন হয়েছে। TrxID: ${row.apiTrxId}`,
          shortMessage: `রিচার্জ সফল: ${bdt(amt)} → ${row.rechargePhone}`,
          link: "/customer/referral/recharge/history",
          sendSms: false,
        });
      } catch (e) {
        console.error(`reconcile: notifyCustomer (delivered) failed for ${row.customerId}:`, e);
        out.errors++;
      }
      continue;
    }

    // outcome === "failed" → return the money (atomic claim first).
    const amt = Number(row.amount);
    const isDrive = row.rechargeType === "drive_pack" || row.rechargeType === "drive_offer";
    const claimed = await db
      .update(mobileRechargeRequests)
      .set({
        status: "rejected",
        apiStatus: "Cancel",
        rejectReason: `রিচার্জ ব্যর্থ — ${bdt(amt)} ব্যালেন্সে ফেরত দেওয়া হয়েছে`,
        processedAt: new Date(),
      })
      .where(and(eq(mobileRechargeRequests.id, row.id), eq(mobileRechargeRequests.status, "completed")))
      .returning({ id: mobileRechargeRequests.id });

    if (claimed.length === 0) continue; // already refunded by another sweep

    // Credit the money back to the wallet it was taken from.
    if (isDrive) {
      await db
        .update(customers)
        .set({ driveBalance: sql`${customers.driveBalance} + ${amt}` })
        .where(eq(customers.customerId, row.customerId));
    } else {
      await db
        .update(customers)
        .set({ referralBalance: sql`${customers.referralBalance} + ${amt}` })
        .where(eq(customers.customerId, row.customerId));
    }

    out.refunded++;
    try {
      await notifyCustomer({
        customerId: row.customerId,
        phoneNumber: row.customerPhone,
        type: "recharge_refund",
        message: `আপনার ${bdt(amt)} রিচার্জটি (${row.rechargePhone}) সম্পন্ন হয়নি। তাই ${bdt(amt)} আপনার ${isDrive ? "ড্রাইভ " : ""}ব্যালেন্সে আবার যোগ করে দেওয়া হয়েছে।`,
        shortMessage: `SE Electronics: রিচার্জ ব্যর্থ হওয়ায় ${bdt(amt)} আপনার ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
        link: "/customer/referral",
      });
    } catch (e) {
      console.error(`reconcile: notifyCustomer failed for ${row.customerId}:`, e);
      out.errors++;
    }
  }

  return out;
}

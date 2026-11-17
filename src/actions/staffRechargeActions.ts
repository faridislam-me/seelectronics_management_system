"use server";

import { verifyStaffSession } from "@/actions";
import { getStaffBalance } from "@/actions/paymentRequestActions";
import { db } from "@/db/drizzle";
import { payments, staffs } from "@/db/schema";
import { verifySession } from "@/lib";
import * as topup from "@/lib/successtopup";
import { getRechargePacksWithCache } from "@/lib/rechargePackCache";
import { generateRandomId } from "@/utils";
import { and, desc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const OPERATORS: Record<string, string> = {
  grameenphone: "Grameenphone",
  banglalink: "Banglalink",
  robi: "Robi",
  airtel: "Airtel",
  teletalk: "Teletalk",
  skitto: "Skitto",
};

/**
 * Staff (technician / electrician) mobile recharge, paid from the staff's
 * available earnings balance.
 *
 * Staff balance is COMPUTED from the `payments` table
 * (SUM(credited) − SUM(requested/pending/processing/approved/completed)) — there
 * is no decrementable wallet column — so the debit is recorded as a `payments`
 * row with status "completed" (which counts against the balance), tagged in the
 * description with a `[RECHARGE]` prefix. See the ⚠️ note reported to the parent:
 * paymentMethod is a placeholder ("cash") because paymentTypesEnum has no
 * recharge/operator value, and these rows show up in the staff payout history.
 */
export const requestStaffMobileRecharge = async (input: {
  rechargePhone: string;
  operator: string;
  amount: number;
  /** When buying a regular pack, the SuccessTopup package id + its name. */
  packageId?: string;
  packName?: string;
}) => {
  try {
    const session = await verifyStaffSession();
    if (!session.isAuth || !session.userId) {
      return { success: false as const, message: "Unauthorized" };
    }
    const staffId = session.userId as string;

    const rechargePhone = input.rechargePhone?.trim();
    const { operator, amount } = input;

    if (!rechargePhone) return { success: false as const, message: "রিচার্জ নম্বর আবশ্যক" };
    if (!operator || !OPERATORS[operator]) return { success: false as const, message: "অপারেটর নির্বাচন করুন" };
    if (!amount || amount < 20) return { success: false as const, message: "ন্যূনতম রিচার্জ ৳২০" };

    const staff = await db.query.staffs.findFirst({
      where: eq(staffs.staffId, staffId),
      columns: { staffId: true, name: true },
    });
    if (!staff) return { success: false as const, message: "Staff not found" };

    const balanceRes = await getStaffBalance(staffId);
    const balance = balanceRes.success ? balanceRes.balance : 0;
    if (balance < amount) {
      return {
        success: false as const,
        code: "insufficient" as const,
        balance,
        message: `অপর্যাপ্ত ব্যালেন্স। আপনার ব্যালেন্স: ৳${Math.floor(balance).toLocaleString()}`,
      };
    }

    const trxid = `SE${Date.now()}${generateRandomId(4)}`;

    // Call the SuccessTopup provider (same gateway as the customer flow).
    const apiRes = await topup.recharge({
      number: rechargePhone,
      operator,
      amount,
      trxid,
      packageId: input.packageId || undefined,
    });
    const isSuccess = apiRes.result === true;

    if (!isSuccess) {
      return {
        success: false as const,
        message: apiRes.message || "রিচার্জ ব্যর্থ হয়েছে। পরে আবার চেষ্টা করুন।",
      };
    }

    // Record the debit so the computed balance reflects it.
    const paymentId = generateRandomId();
    const invoiceNumber = `RCH-${Date.now()}-${generateRandomId().slice(0, 8)}`;
    await db.insert(payments).values({
      paymentId,
      staffId,
      invoiceNumber,
      amount,
      paymentMethod: "cash", // placeholder — paymentTypesEnum has no recharge value
      status: "completed",
      transactionId: trxid,
      description: `[RECHARGE] ${OPERATORS[operator]} ${input.packName ? `প্যাক: ${input.packName} ` : ""}${rechargePhone} · TrxID ${trxid}`,
      date: new Date(),
    });

    revalidatePath("/staff/payment");
    revalidatePath("/staff/payment/recharge");
    revalidatePath("/staff/payment/payment-history");

    const after = await getStaffBalance(staffId);
    return {
      success: true as const,
      message: "রিচার্জ সম্পন্ন হয়েছে ✓",
      detail: {
        phone: rechargePhone,
        operator: OPERATORS[operator] || operator,
        operatorKey: operator,
        amount,
        trxId: trxid,
        newBalance: after.success ? after.balance : Math.max(0, balance - amount),
        time: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("requestStaffMobileRecharge error:", error);
    return { success: false as const, message: "রিচার্জ প্রক্রিয়া ব্যর্থ হয়েছে" };
  }
};

/**
 * Staff-side fetch of the available regular/bundle packages for an operator
 * (same SuccessTopup source the customer flow uses, but gated on a staff
 * session instead of a customer one). Used by the staff "রেগুলার প্যাক" flow.
 */
export const getStaffRechargePackages = async (operator: string) => {
  try {
    const session = await verifyStaffSession();
    if (!session.isAuth || !session.userId) {
      return { success: false as const, message: "Unauthorized" };
    }
    // Cache-backed: serve live packs when the API has them, otherwise the
    // last-known cached packs so the list never shows empty at night.
    const data = await getRechargePacksWithCache(operator);
    return { success: true as const, data };
  } catch (error) {
    console.error("getStaffRechargePackages error:", error);
    return { success: false as const, message: "প্যাকেজ লোড করা যায়নি" };
  }
};

// Operator display-name → key (for the recharge-history operator icon). The
// history rows store the display name inside the payment description.
const OPERATOR_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(OPERATORS).map(([k, v]) => [v.toLowerCase(), k]),
);

export type StaffRechargeHistoryRow = {
  id: string;
  operator: string;
  operatorKey: string;
  phone: string;
  amount: number;
  trxId: string;
  isPack: boolean;
  packName: string;
  status: string;
  date: string;
};

/**
 * Parse one `[RECHARGE]` payment row back into a StaffRechargeHistoryRow.
 * Shared by the staff-facing and admin-facing history fetchers. Robust to
 * small format drift — falls back gracefully.
 */
const parseRechargePayment = (r: {
  paymentId: string;
  amount: number;
  status: string;
  transactionId: string | null;
  description: string | null;
  date: Date | string;
}): StaffRechargeHistoryRow => {
  const body = (r.description || "").replace(/^\[RECHARGE\]\s*/, "");
  const operator = body.split(/\s+/)[0] || "";
  const operatorKey = OPERATOR_KEY[operator.toLowerCase()] || "grameenphone";
  const phone = (body.match(/01\d{9}/) || [""])[0];
  const packMatch = body.match(/প্যাক:\s*(.+?)\s+01\d{9}/);
  const trxId = r.transactionId || (body.match(/TrxID\s*(\S+)/)?.[1] ?? "");
  return {
    id: r.paymentId,
    operator,
    operatorKey,
    phone,
    amount: Number(r.amount),
    trxId,
    isPack: !!packMatch,
    packName: packMatch?.[1]?.trim() || "",
    status: r.status,
    date: (r.date instanceof Date ? r.date : new Date(r.date)).toISOString(),
  };
};

/**
 * Recent mobile recharges / packs this staff member made. They are stored as
 * `payments` rows tagged `[RECHARGE] <Operator> [প্যাক: <name> ]<phone> · TrxID <id>`
 * (see requestStaffMobileRecharge); this parses them back for the "সাম্প্রতিক
 * রিচার্জ" list. Robust to small format drift — falls back gracefully.
 */
export const getStaffRechargeHistory = async (limit = 20) => {
  try {
    const session = await verifyStaffSession();
    if (!session.isAuth || !session.userId) {
      return { success: false as const, message: "Unauthorized" };
    }
    const staffId = session.userId as string;

    const rows = await db.query.payments.findMany({
      where: and(eq(payments.staffId, staffId), ilike(payments.description, "[RECHARGE]%")),
      orderBy: [desc(payments.date)],
      limit,
      columns: { paymentId: true, amount: true, status: true, transactionId: true, description: true, date: true },
    });

    const data: StaffRechargeHistoryRow[] = rows.map(parseRechargePayment);

    return { success: true as const, data };
  } catch (error) {
    console.error("getStaffRechargeHistory error:", error);
    return { success: false as const, message: "রিচার্জ ইতিহাস আনা যায়নি" };
  }
};

/**
 * Admin: mobile-recharge history for a SPECIFIC staff member. Same `[RECHARGE]`
 * `payments` rows as getStaffRechargeHistory, but gated on an admin session and
 * scoped to the given staffId (used on the admin staff payment-history page).
 */
export const getStaffRechargeHistoryForAdmin = async (staffId: string, limit = 50) => {
  try {
    const admin = await verifySession(false, "admin");
    if (!admin) return { success: false as const, message: "Unauthorized" };
    if (!staffId) return { success: false as const, message: "staffId আবশ্যক" };

    const rows = await db.query.payments.findMany({
      where: and(eq(payments.staffId, staffId), ilike(payments.description, "[RECHARGE]%")),
      orderBy: [desc(payments.date)],
      limit,
      columns: { paymentId: true, amount: true, status: true, transactionId: true, description: true, date: true },
    });

    const data: StaffRechargeHistoryRow[] = rows.map(parseRechargePayment);
    return { success: true as const, data };
  } catch (error) {
    console.error("getStaffRechargeHistoryForAdmin error:", error);
    return { success: false as const, message: "রিচার্জ ইতিহাস আনা যায়নি" };
  }
};

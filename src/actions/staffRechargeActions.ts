"use server";

import { verifyStaffSession } from "@/actions";
import { getStaffBalance } from "@/actions/paymentRequestActions";
import { db } from "@/db/drizzle";
import { payments, staffs } from "@/db/schema";
import * as topup from "@/lib/successtopup";
import { generateRandomId } from "@/utils";
import { eq } from "drizzle-orm";
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
    const res = await topup.getDrives(operator);
    if (!res.result) return { success: false as const, message: "প্যাকেজ লোড করা যায়নি" };
    return { success: true as const, data: res.drives || [] };
  } catch (error) {
    console.error("getStaffRechargePackages error:", error);
    return { success: false as const, message: "প্যাকেজ লোড করা যায়নি" };
  }
};

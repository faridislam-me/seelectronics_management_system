"use server";

import { db } from "@/db/drizzle";
import { customers, mobileRechargeRequests } from "@/db/schema";
import { verifyCustomerSession } from "@/actions/customerActions";
import { verifySession } from "@/lib";
import { generateRandomId } from "@/utils";
import * as topup from "@/lib/successtopup";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
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
}) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const { rechargePhone, operator, amount, rechargeType = "recharge", packageId } = input;

    if (!rechargePhone?.trim()) return { success: false, message: "রিচার্জ নম্বর আবশ্যক" };
    if (!operator || !OPERATORS[operator]) return { success: false, message: "অপারেটর নির্বাচন করুন" };
    if (!amount || amount < 10) return { success: false, message: "ন্যূনতম রিচার্জ ৳১০" };

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: { customerId: true, name: true, phone: true, referralBalance: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    if (Number(customer.referralBalance) < amount) {
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
      apiTrxId: trxid,
      apiStatus: isSuccess ? "Success" : (apiRes.message || "Failed"),
      status: isSuccess ? "completed" : "rejected",
      rejectReason: isSuccess ? null : (apiRes.message || "API রিচার্জ ব্যর্থ"),
      processedAt: new Date(),
    });

    if (isSuccess) {
      await db
        .update(customers)
        .set({ referralBalance: sql`${customers.referralBalance} - ${amount}` })
        .where(eq(customers.customerId, customer.customerId));
    }

    revalidatePath("/customer/referral");
    revalidatePath("/recharge-requests");

    if (isSuccess) {
      const updatedCustomer = await db.query.customers.findFirst({
        where: eq(customers.customerId, customer.customerId),
        columns: { referralBalance: true },
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
          newBalance: Number(updatedCustomer?.referralBalance ?? 0),
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

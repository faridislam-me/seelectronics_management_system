"use server";

import { db } from "@/db/drizzle";
import { customers, driveBalanceKycRequests } from "@/db/schema";
import { verifyCustomerSession } from "@/actions/customerActions";
import { verifySession } from "@/lib";
import { generateRandomId } from "@/utils";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const UNAUTHORIZED = { success: false as const, message: "Unauthorized" };

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

const kycCode = () => "DKYC" + generateRandomId(5).replace(/^SE/, "");

/**
 * Customer: own drive wallet state — balance, KYC gate status and the latest
 * KYC request (so the UI can show pending / approved / rejected + reason).
 */
export const getMyDriveInfo = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: { driveBalance: true, driveKycStatus: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    const latest = await db.query.driveBalanceKycRequests.findFirst({
      where: eq(driveBalanceKycRequests.customerId, session.customer.customerId),
      orderBy: [desc(driveBalanceKycRequests.createdAt)],
    });

    return {
      success: true,
      data: {
        driveBalance: Number(customer.driveBalance ?? 0),
        kycStatus: customer.driveKycStatus ?? "pending",
        kyc: latest ?? null,
      },
    };
  } catch (error) {
    console.error("getMyDriveInfo error:", error);
    return { success: false, message: "ড্রাইভ তথ্য আনা যায়নি" };
  }
};

/** Customer: submit (or re-submit after rejection) a drive KYC request. */
export const submitDriveKyc = async (input: {
  fullName: string;
  nid: string;
  address: string;
  note?: string;
  documents?: string[];
}) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const fullName = input.fullName?.trim();
    const nid = input.nid?.trim();
    const address = input.address?.trim();
    if (!fullName || !nid || !address) {
      return { success: false, message: "নাম, এনআইডি ও ঠিকানা আবশ্যক" };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: { customerId: true, name: true, phone: true, driveKycStatus: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    // Block duplicate submissions while one is under review or already approved.
    const open = await db.query.driveBalanceKycRequests.findFirst({
      where: and(
        eq(driveBalanceKycRequests.customerId, customer.customerId),
        eq(driveBalanceKycRequests.status, "pending"),
      ),
      columns: { id: true },
    });
    if (open) return { success: false, message: "আপনার একটি KYC রিভিউ এর অপেক্ষায় আছে" };
    if (customer.driveKycStatus === "approved") {
      return { success: false, message: "আপনার KYC ইতোমধ্যে অনুমোদিত" };
    }

    let code = kycCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.driveBalanceKycRequests.findFirst({
        where: eq(driveBalanceKycRequests.requestCode, code),
        columns: { id: true },
      });
      if (!exists) break;
      code = kycCode();
    }

    await db.insert(driveBalanceKycRequests).values({
      requestCode: code,
      customerId: customer.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      fullName,
      nid,
      address,
      note: input.note?.trim() || null,
      documents: input.documents ?? [],
      status: "pending",
    });

    // Reflect the pending gate on the customer record.
    await db
      .update(customers)
      .set({ driveKycStatus: "pending" })
      .where(eq(customers.customerId, customer.customerId));

    try {
      const { notifyAdmin } = await import("./notificationActions");
      await notifyAdmin({
        type: "system",
        message: `New drive balance KYC from ${customer.name} (${customer.phone})`,
        link: "/drive-kyc",
      });
    } catch (e) {
      console.error("notifyAdmin (drive kyc) failed:", e);
    }

    revalidatePath("/customer/referral/recharge/drive");
    return { success: true, message: "KYC জমা হয়েছে, রিভিউ এর অপেক্ষায়", requestCode: code };
  } catch (error) {
    console.error("submitDriveKyc error:", error);
    return { success: false, message: "KYC জমা দেওয়া যায়নি" };
  }
};

/** Admin: list drive KYC requests (optional search + status filter). */
export const getDriveKycRequests = async ({
  query = "",
  status,
}: {
  query?: string;
  status?: string;
} = {}) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const q = `%${query}%`;
    const where = and(
      query
        ? or(
            ilike(driveBalanceKycRequests.requestCode, q),
            ilike(driveBalanceKycRequests.customerName, q),
            ilike(driveBalanceKycRequests.customerPhone, q),
            ilike(driveBalanceKycRequests.nid, q),
          )
        : undefined,
      status ? eq(driveBalanceKycRequests.status, status as any) : undefined,
    );

    const rows = await db
      .select()
      .from(driveBalanceKycRequests)
      .where(where)
      .orderBy(desc(driveBalanceKycRequests.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getDriveKycRequests error:", error);
    return { success: false, message: "KYC তালিকা আনা যায়নি" };
  }
};

/**
 * Admin: approve (and load an amount into driveBalance) or reject a KYC.
 * On approval the amount is ADDED to the customer's drive wallet atomically.
 */
export const reviewDriveKyc = async (
  code: string,
  action: "approve" | "reject",
  payload?: { amount?: number; adminNotes?: string; rejectReason?: string },
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const req = await db.query.driveBalanceKycRequests.findFirst({
      where: eq(driveBalanceKycRequests.requestCode, code),
    });
    if (!req) return { success: false, message: "অনুরোধ পাওয়া যায়নি" };
    if (req.status !== "pending") {
      return { success: false, message: "ইতোমধ্যে প্রক্রিয়াজাত" };
    }

    if (action === "reject") {
      await db
        .update(driveBalanceKycRequests)
        .set({
          status: "rejected",
          rejectReason: payload?.rejectReason,
          adminNotes: payload?.adminNotes,
          processedAt: new Date(),
        })
        .where(eq(driveBalanceKycRequests.id, req.id));
      await db
        .update(customers)
        .set({ driveKycStatus: "rejected" })
        .where(eq(customers.customerId, req.customerId));

      revalidatePath("/drive-kyc");
      revalidatePath("/customer/referral/recharge/drive");
      return { success: true, message: "KYC প্রত্যাখ্যাত হয়েছে" };
    }

    const amount = Math.max(0, Number(payload?.amount ?? 0));

    await db
      .update(driveBalanceKycRequests)
      .set({
        status: "approved",
        approvedAmount: amount,
        adminNotes: payload?.adminNotes,
        processedAt: new Date(),
      })
      .where(eq(driveBalanceKycRequests.id, req.id));

    await db
      .update(customers)
      .set({
        driveKycStatus: "approved",
        driveBalance: sql`${customers.driveBalance} + ${amount}`,
      })
      .where(eq(customers.customerId, req.customerId));

    try {
      const { notifyCustomer } = await import("./notificationActions");
      const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, req.customerId),
        columns: { customerId: true, phone: true },
      });
      if (customer) {
        await notifyCustomer({
          customerId: customer.customerId,
          phoneNumber: customer.phone,
          type: "system",
          message: `আপনার ড্রাইভ KYC অনুমোদিত হয়েছে। ড্রাইভ ব্যালেন্স যোগ হয়েছে ৳${amount.toLocaleString()}।`,
          link: "/customer/referral/recharge/drive",
        });
      }
    } catch (e) {
      console.error("notifyCustomer (drive kyc) failed:", e);
    }

    revalidatePath("/drive-kyc");
    revalidatePath("/customer/referral/recharge/drive");
    return { success: true, message: `KYC অনুমোদিত, ড্রাইভ ব্যালেন্স +৳${amount.toLocaleString()}` };
  } catch (error) {
    console.error("reviewDriveKyc error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

/**
 * Admin: manually adjust a customer's drive balance (top-up or correction).
 * A negative amount deducts but never takes the wallet below zero.
 */
export const adjustDriveBalance = async (
  customerId: string,
  amount: number,
  note?: string,
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    if (!customerId || !amount) return { success: false, message: "পরিমাণ আবশ্যক" };

    if (amount < 0) {
      // Guarded deduct: only succeeds if the balance stays >= 0.
      const need = Math.abs(amount);
      const res = await db
        .update(customers)
        .set({ driveBalance: sql`${customers.driveBalance} - ${need}` })
        .where(and(eq(customers.customerId, customerId), gte(customers.driveBalance, need)))
        .returning({ driveBalance: customers.driveBalance });
      if (res.length === 0) return { success: false, message: "ব্যালেন্স অপর্যাপ্ত" };
      revalidatePath("/drive-kyc");
      return { success: true, message: "ব্যালেন্স সমন্বয় হয়েছে", driveBalance: Number(res[0].driveBalance), note };
    }

    const res = await db
      .update(customers)
      .set({ driveBalance: sql`${customers.driveBalance} + ${amount}` })
      .where(eq(customers.customerId, customerId))
      .returning({ driveBalance: customers.driveBalance });
    if (res.length === 0) return { success: false, message: "গ্রাহক পাওয়া যায়নি" };

    revalidatePath("/drive-kyc");
    return { success: true, message: "ড্রাইভ ব্যালেন্স যোগ হয়েছে", driveBalance: Number(res[0].driveBalance), note };
  } catch (error) {
    console.error("adjustDriveBalance error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

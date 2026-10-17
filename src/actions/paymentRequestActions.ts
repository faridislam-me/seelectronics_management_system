"use server";

import { db } from "@/db/drizzle";
import { payments, staffs } from "@/db/schema";
import { sendSMS } from "@/lib";
import { generateRandomId } from "@/utils";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PaymentRequestSchema = z.object({
  staffId: z.string().min(1),
  serviceId: z.string().optional(),
  amount: z.coerce.number().min(1),
  description: z.string().optional(),
});

/**
 * Get staff's available (virtual) balance.
 * Balance = total added by admin (status='pending','processing','approved','requested')
 *          minus total completed/rejected.
 * Simplified: sum of amounts where status is NOT 'completed' and NOT 'rejected'.
 */
export async function getStaffBalance(staffId: string) {
  try {
    const addedResult = await db
      .select({ sum: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.staffId, staffId),
          sql`${payments.status} = 'credited'`,
        ),
      )
      .limit(1);

    const requestedResult = await db
      .select({ sum: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
      .from(payments)
      .where(
        and(
          eq(payments.staffId, staffId),
          sql`${payments.status} IN ('requested', 'pending', 'processing', 'approved', 'completed')`,
        ),
      )
      .limit(1);

    const totalAdded = addedResult[0]?.sum || 0;
    const totalRequested = requestedResult[0]?.sum || 0;
    const balance = totalAdded - totalRequested;

    return { success: true, balance: Math.max(0, balance) };
  } catch (error) {
    console.error(error);
    return { success: false, balance: 0 };
  }
}

/**
 * Staff requests money from their virtual balance.
 * Status is set to "requested" — admin must approve → pending → completed.
 * Staff can only request if they have sufficient available balance.
 */
export async function requestPayment(_prevState: any, formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData);
    const validated = PaymentRequestSchema.parse(rawData);

    const staffData = await db.query.staffs.findFirst({
      where: eq(staffs.staffId, validated.staffId),
    });

    if (!staffData) return { success: false, message: "Staff not found" };

    const method = staffData.paymentPreference;
    const hasWallet =
      ["bkash", "nagad", "rocket"].includes(method) && staffData.walletNumber;
    const hasBank = method === "bank" && staffData.bankInfo;

    if (method !== "cash" && !hasWallet && !hasBank) {
      return {
        success: false,
        message:
          "Set your payment method and account details first (Payment Settings).",
      };
    }

    // Check available balance
    const balanceRes = await getStaffBalance(validated.staffId);
    if (!balanceRes.success || balanceRes.balance < validated.amount) {
      return {
        success: false,
        message: `Insufficient balance. Available: ৳${Math.floor(balanceRes.balance).toLocaleString()}`,
      };
    }

    const paymentId = generateRandomId();
    const invoiceNumber = `REQ-${Date.now()}-${generateRandomId().slice(0, 8)}`;

    const insertPayload: Record<string, unknown> = {
      paymentId,
      staffId: validated.staffId,
      serviceId: validated.serviceId || null,
      invoiceNumber,
      amount: validated.amount,
      paymentMethod: method,
      description: validated.description ?? null,
      status: "requested", // NEW: starts as "requested"
      date: new Date(),
      ...(await (await import("@/lib/paymentSnapshot")).serviceCustomerSnapshot(validated.serviceId)),
    };
    if (hasWallet)
      (insertPayload as any).receiverWalletNumber = staffData.walletNumber;
    if (hasBank && staffData.bankInfo)
      (insertPayload as any).receiverBankInfo = staffData.bankInfo;

    await db
      .insert(payments)
      .values(insertPayload as typeof payments.$inferInsert);

    // Send SMS to admin
    if (process.env.ADMIN_PHONE_NUMBER) {
      const smsText = `New Payment Request: Staff ${staffData.name} requested ৳${validated.amount} (${method}). Check dashboard.`;
      await sendSMS(process.env.ADMIN_PHONE_NUMBER, smsText);
    }

    // Create admin notification
    try {
      const { adminNotifications } = await import("@/db/schema");
      await db.insert(adminNotifications).values({
        type: "payment_request",
        message: `${staffData.name} requested ৳${validated.amount} payment.`,
        link: "/payments",
      });
    } catch (e) {
      console.error("Failed to create admin notification:", e);
    }

    revalidatePath("/staff/profile");
    revalidatePath("/staff/payments");
    revalidatePath("/staff/payment");
    revalidatePath("/staff/payment/request");
    revalidatePath("/payments");
    return {
      success: true,
      message: "Payment request sent. Admin will be notified.",
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(error.issues);
      return {
        success: false,
        message: "Please fill all required fields correctly.",
      };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
}

export async function getStaffPaymentHistory(staffId: string) {
  try {
    const data = await db.query.payments.findMany({
      where: eq(payments.staffId, staffId),
      orderBy: (payments, { desc }) => [desc(payments.createdAt)],
    });
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch payment history" };
  }
}

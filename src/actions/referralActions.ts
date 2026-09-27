"use server";

import { db } from "@/db/drizzle";
import { customers, referralBonuses, referralPaymentRequests } from "@/db/schema";
import { verifySession } from "@/lib";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Fetches referral data for the logged-in customer
 */
export const getCustomerReferralData = async () => {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized" };

    const customerId = session.userId as string;
    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      columns: {
        referralBalance: true,
        vipCardNumber: true,
        name: true,
        phone: true,
      },
    });

    if (!customer) return { success: false, message: "Customer not found" };

    const rawBonuses = await db.query.referralBonuses.findMany({
      where: eq(referralBonuses.referrerCustomerId, customerId),
      orderBy: [desc(referralBonuses.createdAt)],
    });

    // Attach what each referred customer bought (from their invoice) so the
    // referrer can see name, products and amount.
    const referredIds = [...new Set(rawBonuses.map((b) => b.referredCustomerId).filter(Boolean))] as string[];
    const referred = referredIds.length
      ? await db.query.customers.findMany({
          where: inArray(customers.customerId, referredIds),
          columns: { customerId: true, invoiceNumber: true },
          with: { invoice: { columns: { invoiceNumber: true }, with: { products: { columns: { type: true, model: true, quantity: true } } } } },
        })
      : [];
    const byId = new Map(referred.map((c) => [c.customerId, c]));
    const bonuses = rawBonuses.map((b) => {
      const c = b.referredCustomerId ? byId.get(b.referredCustomerId) : undefined;
      return {
        ...b,
        invoiceNumber: c?.invoice?.invoiceNumber ?? c?.invoiceNumber ?? null,
        products: (c?.invoice?.products ?? []).map((p) => ({ type: p.type, model: p.model, quantity: p.quantity })),
      };
    });

    const requests = await db.query.referralPaymentRequests.findMany({
      where: eq(referralPaymentRequests.customerId, customerId),
      orderBy: [desc(referralPaymentRequests.createdAt)],
    });

    return {
      success: true,
      data: {
        balance: customer.referralBalance || 0,
        vipCardNumber: customer.vipCardNumber,
        name: customer.name,
        phone: customer.phone,
        bonuses,
        requests,
      },
    };
  } catch (error) {
    console.error("Error fetching referral data:", error);
    return { success: false, message: "Could not fetch referral data" };
  }
};

/**
 * Submits a referral payment request
 */

export const requestReferralPayment = async (data: {
  amount: number;
  paymentMethod: any;
  walletNumber: string;
}) => {
  try {
    const session = await verifySession(false, "customer");
    if (!session) return { success: false, message: "Unauthorized" };

    const customerId = session.userId as string;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
    });

    if (!customer) return { success: false, message: "Customer not found" };

    if (!customer.vipCardNumber || customer.vipStatus !== "approved") {
      return { success: false, message: "Only VIP members can request payouts" };
    }

    if (Number(customer.referralBalance) < data.amount) {
      return { success: false, message: "Insufficient balance" };
    }

    const { generateRandomId } = await import("@/utils");
    const requestId = `RPR-${generateRandomId().slice(0, 8).toUpperCase()}`;

    await db.insert(referralPaymentRequests).values({
      requestId,
      customerId,
      vipCardNumber: customer.vipCardNumber,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      walletNumber: data.walletNumber,
      status: "requested",
    });

    // Notify Admin
    try {
      const { notifyAdmin } = await import("./notificationActions");
      await notifyAdmin({
        type: "system",
        message: `New referral payout request of ৳${data.amount} from ${customer.name} (${customer.vipCardNumber})`,
        link: "/referral-payments",
      });
    } catch (e) {
      console.error("Failed to notify admin:", e);
    }

    revalidatePath("/customer/referral");
    return {
      success: true,
      message: "Payment request submitted successfully",
      requestId
    };
  } catch (error) {
    console.error("Error requesting referral payment:", error);
    return { success: false, message: "Failed to submit request" };
  }
};

/**
 * Fetches all referral payment requests for admin
 */
export const getAllReferralPaymentRequests = async () => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const data = await db.query.referralPaymentRequests.findMany({
      with: {
        customer: true,
      },
      orderBy: [desc(referralPaymentRequests.createdAt)],
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching referral payment requests:", error);
    return { success: false, message: "Could not fetch requests" };
  }
};

/**
 * Updates a referral payment request status (Admin)
 */
export const updateReferralPaymentStatus = async (
  id: string,
  data: {
    status: any;
    transactionId?: string;
    senderNumber?: string;
    adminNote?: string;
  }
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const request = await db.query.referralPaymentRequests.findFirst({
      where: eq(referralPaymentRequests.id, id),
    });

    if (!request) return { success: false, message: "Request not found" };
    if (request.status !== "requested" && request.status !== "processing") {
      return { success: false, message: "Request is already processed" };
    }

    // 1. Update request status
    await db
      .update(referralPaymentRequests)
      .set({
        status: data.status,
        transactionId: data.transactionId,
        senderNumber: data.senderNumber,
        adminNote: data.adminNote,
        processedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(referralPaymentRequests.id, id));

    // 2. If completed, deduct from customer balance
    if (data.status === "completed") {
      await db
        .update(customers)
        .set({
          referralBalance: sql`${customers.referralBalance} - ${request.amount}`,
        })
        .where(eq(customers.customerId, request.customerId));

      // Notify customer
      try {
        const { notifyCustomer } = await import("./notificationActions");
        const customer = await db.query.customers.findFirst({
          where: eq(customers.customerId, request.customerId),
        });
        if (customer) {
          await notifyCustomer({
            customerId: customer.customerId,
            phoneNumber: customer.phone,
            type: "system",
            message: `Your referral payout request for ৳${request.amount} has been completed via ${request.paymentMethod}.`,
            link: "/customer/referral",
          });
        }
      } catch (e) {
        console.error("Failed to notify customer:", e);
      }
    }

    revalidatePath("/referral-payments");
    revalidatePath("/customer/referral");
    return { success: true, message: `Request updated to ${data.status}` };
  } catch (error) {
    console.error("Error updating referral payment status:", error);
    return { success: false, message: "Failed to update request" };
  }
};

/**
 * Validates a referral VIP card number (Admin/Staff use)
 */
export const validateReferralVipCard = async (vipCardNumber: string) => {
  try {
    const referrer = await db.query.customers.findFirst({
      where: and(
        eq(customers.vipCardNumber, vipCardNumber),
        eq(customers.vipStatus, "approved")
      ),
      columns: {
        name: true,
        customerId: true,
      }
    });

    if (referrer) {
      return {
        success: true,
        message: "Valid VIP Card",
        data: { name: referrer.name }
      };
    } else {
      return { success: false, message: "Invalid or inactive VIP Card number" };
    }
  } catch (error) {
    console.error("Error validating VIP card:", error);
    return { success: false, message: "Validation failed" };
  }
};

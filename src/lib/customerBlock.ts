import { contactDetails } from "@/constants";
import { db } from "@/db/drizzle";
import { customers, products } from "@/db/schema";
import { eq } from "drizzle-orm";

/** 'due' = unpaid due (dashboard paused); 'misuse' = misuse/damage proven, warranty void. */
export type CustomerBlockReason = "due" | "misuse";

export const BLOCK_REASON_LABEL: Record<CustomerBlockReason, string> = {
  due: "বকেয়া টাকা পরিশোধ না করা",
  misuse: "অপব্যবহার/নষ্ট প্রমাণিত — ওয়ারেন্টি বাতিল",
};

/** Normalises stored/legacy values: anything other than 'misuse' counts as 'due'. */
export function blockReasonOf(value: string | null | undefined): CustomerBlockReason {
  return value === "misuse" ? "misuse" : "due";
}

type BlockableCustomer = {
  customerId: string;
  name: string;
  phone: string;
  isWarrantyStopped: boolean;
  warrantyStoppedAt: Date | null;
  invoice?: { products?: { id: string; warrantyEndDate: Date | null }[] | null } | null;
};

/**
 * Toggles a customer's block. Unblocking extends every product's warranty end
 * by the blocked duration (same for both reasons). Blocking stores the reason;
 * 'due' triggers the existing MRAM voice call, 'misuse' sends a short SMS.
 */
export async function toggleCustomerBlockCore(customer: BlockableCustomer, reason: CustomerBlockReason = "due") {
  if (customer.isWarrantyStopped) {
    const stoppedAt = customer.warrantyStoppedAt ? new Date(customer.warrantyStoppedAt) : new Date();
    const durationMs = Date.now() - stoppedAt.getTime();
    for (const prod of customer.invoice?.products ?? []) {
      const currentEnd = prod.warrantyEndDate ? new Date(prod.warrantyEndDate) : new Date();
      await db.update(products).set({ warrantyEndDate: new Date(currentEnd.getTime() + durationMs) }).where(eq(products.id, prod.id));
    }
    await db
      .update(customers)
      .set({ isWarrantyStopped: false, warrantyStoppedAt: null, warrantyStopReason: null })
      .where(eq(customers.customerId, customer.customerId));
    return { blocked: false as const };
  }

  await db
    .update(customers)
    .set({ isWarrantyStopped: true, warrantyStoppedAt: new Date(), warrantyStopReason: reason })
    .where(eq(customers.customerId, customer.customerId));

  if (reason === "misuse") {
    try {
      const { sendSMS } = await import("@/lib/sms");
      await sendSMS(
        customer.phone,
        `SE Electronics: প্রিয় ${customer.name}, পণ্যের অপব্যবহার/ক্ষতি প্রমাণিত হওয়ায় আপনার ওয়ারেন্টি বাতিল করা হয়েছে। বিস্তারিত: ${contactDetails.customerCare}`,
      );
    } catch (e) {
      console.error("Failed to send warranty-void SMS:", e);
    }
  } else {
    try {
      const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
      const ids = getMramBroadcastIds();
      if (ids?.customer_dashboard_disabled) {
        sendVoiceCall(customer.phone, ids.customer_dashboard_disabled, `Dashboard Disabled ${customer.customerId}`).catch((e) => console.error(e));
      }
    } catch (e) {
      console.error("Failed to send MRAM voice call:", e);
    }
  }
  return { blocked: true as const };
}

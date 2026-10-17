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
 * by the blocked duration (same for both reasons). Blocking stores the reason
 * and sends the customer one SMS and one voice call (lock or cancel wording).
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

  const sms =
    reason === "misuse"
      ? `SE Electronics: প্রিয় ${customer.name}, পণ্যের অপব্যবহার/ক্ষতি প্রমাণিত হওয়ায় আপনার ওয়ারেন্টি বাতিল করা হয়েছে। বিস্তারিত: ${contactDetails.customerCare}`
      : `SE Electronics: প্রিয় ${customer.name}, বকেয়া টাকা পরিশোধ না করায় আপনার ওয়ারেন্টি সাময়িক লক করা হয়েছে। টাকা পরিশোধ করলে আবার চালু হবে। বিস্তারিত: ${contactDetails.customerCare}`;
  // Due lock: MRAM_DUE_BLOCK_VOICE_ID (3753) overrides the JSON's customer_dashboard_disabled.
  // Cancel (misuse) uses its own recording when configured, else the lock recording.
  const voiceKeys = reason === "misuse" ? ["warranty_cancelled", "customer_dashboard_disabled"] : ["customer_dashboard_disabled"];
  const overrideId = reason === "due" ? Number(process.env.MRAM_DUE_BLOCK_VOICE_ID) || undefined : undefined;
  await notifyCustomerBySmsAndCall(customer.phone, sms, voiceKeys, `Warranty ${reason === "misuse" ? "Cancelled" : "Locked"} ${customer.customerId}`, overrideId);
  return { blocked: true as const };
}

/**
 * One SMS + one MRAM voice call to a customer. The call uses `broadcastId` if
 * given, else the first id found in MRAM_VOICE_BROADCAST_ID for `voiceKeys`,
 * and is skipped when none is configured. Failures are logged, never thrown.
 */
export async function notifyCustomerBySmsAndCall(phone: string, sms: string, voiceKeys: string[], title: string, broadcastId?: number) {
  try {
    const { sendSMS } = await import("@/lib/sms");
    await sendSMS(phone, sms);
  } catch (e) {
    console.error(`Failed to send SMS (${title}):`, e);
  }
  try {
    const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
    const ids = getMramBroadcastIds();
    const id = broadcastId || voiceKeys.map((k) => ids?.[k]).find(Boolean);
    if (id) await sendVoiceCall(phone, id, title);
    else console.warn(`No MRAM broadcast id for ${voiceKeys.join("/")}; call skipped (${title})`);
  } catch (e) {
    console.error(`Failed to send voice call (${title}):`, e);
  }
}

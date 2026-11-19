import "server-only";

import { sendVoiceCall } from "@/lib/mram";
import { sendSMS } from "@/lib/sms";

const ADMIN_PHONES = ["01322247774", "01322247772"];

/** Sends a short SMS to every admin phone. Never throws — best-effort notify. */
export async function notifyAdminSms(message: string) {
  try {
    await Promise.all(ADMIN_PHONES.map((phone) => sendSMS(phone, message)));
  } catch (e) {
    console.error("Admin SMS notify failed:", e);
  }
}

/*
 * "SuccessTopup API balance empty" admin alert, throttled so a burst of failed
 * recharges does not spam the admins. Simple in-memory timestamp guard: at most
 * one SMS per 30 minutes. This resets on a cold start / new serverless instance,
 * which is acceptable for a best-effort "please refill" nudge (worst case a few
 * more SMS across instances, never a flood from one). Never throws.
 */
const API_BALANCE_SMS_COOLDOWN_MS = 30 * 60 * 1000;
let lastApiBalanceSmsAt = 0;

export async function notifyAdminApiBalanceEmpty(pool: "main" | "drive" = "main") {
  const now = Date.now();
  if (now - lastApiBalanceSmsAt < API_BALANCE_SMS_COOLDOWN_MS) return;
  lastApiBalanceSmsAt = now; // reserve the window before sending (throttle a burst)
  const poolBn = pool === "drive" ? "ড্রাইভ" : "মূল";
  try {
    await notifyAdminSms(
      `SE Electronics: SuccessTopup API-এর ${poolBn} ব্যালেন্স শেষ/অপর্যাপ্ত। গ্রাহক ও স্টাফ রিচার্জ করতে পারছে না। দ্রুত API ব্যালেন্স রিচার্জ করুন।`,
    );
  } catch (e) {
    console.error("notifyAdminApiBalanceEmpty failed:", e);
  }
}

export const ADMIN_VOICE_IDS = {
  staff_application: 4648,
  customer_service_request: 4649,
  customer_subscription: 4650,
  staff_payment_request: 4651,
  customer_complaint: 4652,
  hearing_order_staff: 4637,
  hearing_settlement_customer: 4636,
  hearing_absent_customer: 4635,
  complaint_hearing_customer: 4620,
  complaint_hearing_staff: 4619,
  customer_chat: 4653,
  service_completed: 4654,
  installment_application: 4655,
  referral_withdraw: 4656,
} as const;

export type AdminVoiceEvent = keyof typeof ADMIN_VOICE_IDS;

export async function notifyAdminVoice(event: AdminVoiceEvent) {
  try {
    const broadcastId = ADMIN_VOICE_IDS[event];
    await sendVoiceCall(ADMIN_PHONES, broadcastId, `Admin Notify: ${event}`);
  } catch (e) {
    console.error(`Admin voice notify failed (${event}):`, e);
  }
}

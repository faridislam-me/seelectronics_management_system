import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { and, gte, lt, sql } from "drizzle-orm";
import { notifyCustomerBySmsAndCall } from "./customerBlock";

const DAY_MS = 24 * 60 * 60 * 1000;
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

// MRAM voice-call broadcast campaigns for a warranty that has ended. The 24-month
// campaign states "24 months" in the recording, so it is used ONLY for products
// whose warranty is 24 months (IPS / stabilizer); everything else (18 / 12 / 6
// months — battery and others) uses the campaign that names no duration.
export const WARRANTY_VOICE_24 = 3785;
export const WARRANTY_VOICE_OTHER = 3784;

/** Picks the voice campaign for a product's warranty length. */
export const warrantyVoiceId = (durationMonths: number) =>
  durationMonths === 24 ? WARRANTY_VOICE_24 : WARRANTY_VOICE_OTHER;

/** The warranty-expiry SMS, as approved by the client. */
export const warrantyExpirySms = (name: string, models: string) =>
  `প্রিয় ${name}, আপনার ${models} পণ্যের ওয়ারেন্টির মেয়াদ শেষ হয়েছে। যেকোনো প্রয়োজনে আমাদের সার্ভিস সাপোর্ট পাবেন আগের মতোই। সহায়তার জন্য কল করুন: 09649355555, 09639666064\nধন্যবাদ - এস ই ইলেকট্রনিক্স`;

/**
 * Sends one SMS + one voice call to every customer whose product warranty
 * ended yesterday (Bangladesh calendar day). Run once a day: each run covers
 * exactly one day, so nobody is notified twice and no column is needed.
 * Blocked customers are skipped (their end date moves when unblocked).
 * The voice campaign depends on the warranty length (24 months vs the rest).
 */
export async function notifyWarrantyExpired(now = new Date()) {
  const todayStart = new Date(Math.floor((now.getTime() + BD_OFFSET_MS) / DAY_MS) * DAY_MS - BD_OFFSET_MS);
  const yesterdayStart = new Date(todayStart.getTime() - DAY_MS);

  const expired = await db.query.products.findMany({
    where: and(
      gte(products.warrantyEndDate, yesterdayStart),
      lt(products.warrantyEndDate, todayStart),
      // Safety: older rows stored the creation/edit time as warrantyEndDate. An end
      // date earlier than start + duration can only be that, never a real expiry
      // (unblocking only moves it later), so those rows are never messaged.
      sql`${products.warrantyEndDate} >= ${products.warrantyStartDate} + make_interval(months => ${products.warrantyDurationMonths}) - interval '1 day'`,
    ),
    columns: { model: true, warrantyDurationMonths: true },
    with: { invoice: { columns: {}, with: { customer: { columns: { customerId: true, name: true, phone: true, isWarrantyStopped: true } } } } },
  });

  // One message per customer even if several products ended the same day. If any
  // of them is a 24-month product, the 24-month voice is used for that customer.
  const byCustomer = new Map<string, { name: string; phone: string; models: string[]; has24: boolean }>();
  for (const p of expired) {
    const c = p.invoice?.customer;
    if (!c || c.isWarrantyStopped) continue;
    const entry = byCustomer.get(c.customerId) ?? { name: c.name, phone: c.phone, models: [], has24: false };
    entry.models.push(p.model);
    if (p.warrantyDurationMonths === 24) entry.has24 = true;
    byCustomer.set(c.customerId, entry);
  }

  for (const [customerId, c] of byCustomer) {
    const sms = warrantyExpirySms(c.name, c.models.join(", "));
    const broadcastId = c.has24 ? WARRANTY_VOICE_24 : WARRANTY_VOICE_OTHER;
    await notifyCustomerBySmsAndCall(c.phone, sms, [], `Warranty Expired ${customerId}`, broadcastId);
  }

  return { success: true, from: yesterdayStart.toISOString(), to: todayStart.toISOString(), notified: byCustomer.size };
}

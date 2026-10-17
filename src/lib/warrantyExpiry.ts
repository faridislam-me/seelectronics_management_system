import { contactDetails } from "@/constants";
import { db } from "@/db/drizzle";
import { products } from "@/db/schema";
import { and, gte, lt, sql } from "drizzle-orm";
import { notifyCustomerBySmsAndCall } from "./customerBlock";

const DAY_MS = 24 * 60 * 60 * 1000;
const BD_OFFSET_MS = 6 * 60 * 60 * 1000;

/**
 * Sends one SMS + one voice call to every customer whose product warranty
 * ended yesterday (Bangladesh calendar day). Run once a day: each run covers
 * exactly one day, so nobody is notified twice and no column is needed.
 * Blocked customers are skipped (their end date moves when unblocked).
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
    columns: { model: true },
    with: { invoice: { columns: {}, with: { customer: { columns: { customerId: true, name: true, phone: true, isWarrantyStopped: true } } } } },
  });

  // One message per customer even if several products ended the same day.
  const byCustomer = new Map<string, { name: string; phone: string; models: string[] }>();
  for (const p of expired) {
    const c = p.invoice?.customer;
    if (!c || c.isWarrantyStopped) continue;
    const entry = byCustomer.get(c.customerId) ?? { name: c.name, phone: c.phone, models: [] };
    entry.models.push(p.model);
    byCustomer.set(c.customerId, entry);
  }

  for (const [customerId, c] of byCustomer) {
    const sms = `SE Electronics: প্রিয় ${c.name}, আপনার ${c.models.join(", ")} পণ্যের ওয়ারেন্টির মেয়াদ শেষ হয়েছে। সার্ভিস বা নতুন প্যাকেজের জন্য যোগাযোগ করুন: ${contactDetails.customerCare}`;
    await notifyCustomerBySmsAndCall(c.phone, sms, ["warranty_expired"], `Warranty Expired ${customerId}`);
  }

  return { success: true, from: yesterdayStart.toISOString(), to: todayStart.toISOString(), notified: byCustomer.size };
}

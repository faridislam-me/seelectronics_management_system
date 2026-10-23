"use server";

import { db } from "@/db/drizzle";
import {
  contactMessages,
  customerNotifications,
  customers,
  feedbacks,
  invoices,
  noticeRecipients,
  products,
  referralBonuses,
  referralPaymentRequests,
  services,
  staffComplaints,
} from "@/db/schema";
import { verifySession } from "@/lib";
import { desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Last 10 digits of a phone, so +880 / 0 / spacing variants of the same number match. */
const normPhone = (p: string | null | undefined) => (p || "").replace(/\D/g, "").slice(-10);

export type DuplicateCustomer = {
  customerId: string;
  name: string;
  phone: string;
  address: string;
  invoiceNumber: string;
  createdAt: Date;
  vipCardNumber: string | null;
  referralBalance: number;
  sellerId: string | null;
  invoiceCount: number;
  totalBill: number;
  totalDue: number;
  productCount: number;
};

export type DuplicateGroup = {
  phone: string; // normalized (last 10 digits)
  customers: DuplicateCustomer[];
};

/**
 * Finds customers that are most likely the same person entered more than once:
 * several customer accounts whose phone number (last 10 digits) matches. Admin
 * reviews each group and merges them into one account with the merge tool.
 */
export const getDuplicateCustomerGroups = async (): Promise<
  { success: true; data: DuplicateGroup[] } | { success: false; message: string }
> => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const [custs, invAgg, prodAgg] = await Promise.all([
      db
        .select({
          customerId: customers.customerId,
          name: customers.name,
          phone: customers.phone,
          address: customers.address,
          invoiceNumber: customers.invoiceNumber,
          createdAt: customers.createdAt,
          vipCardNumber: customers.vipCardNumber,
          referralBalance: customers.referralBalance,
          sellerId: customers.sellerId,
        })
        .from(customers),
      db
        .select({
          customerId: invoices.customerId,
          cnt: sql<number>`count(*)::int`,
          bill: sql<number>`coalesce(sum(${invoices.total}), 0)::float`,
          due: sql<number>`coalesce(sum(${invoices.dueAmount}), 0)::float`,
        })
        .from(invoices)
        .groupBy(invoices.customerId),
      db
        .select({
          customerId: invoices.customerId,
          pc: sql<number>`count(*)::int`,
        })
        .from(products)
        .innerJoin(invoices, eq(products.invoiceId, invoices.id))
        .groupBy(invoices.customerId),
    ]);

    const invMap = new Map(invAgg.map((r) => [r.customerId, r]));
    const prodMap = new Map(prodAgg.map((r) => [r.customerId, r.pc]));

    const groups = new Map<string, DuplicateCustomer[]>();
    for (const c of custs) {
      const np = normPhone(c.phone);
      if (np.length < 10) continue; // ignore malformed phones
      const agg = invMap.get(c.customerId);
      const row: DuplicateCustomer = {
        ...c,
        referralBalance: Number(c.referralBalance ?? 0),
        invoiceCount: agg?.cnt ?? 0,
        totalBill: agg?.bill ?? 0,
        totalDue: agg?.due ?? 0,
        productCount: prodMap.get(c.customerId) ?? 0,
      };
      const list = groups.get(np) ?? [];
      list.push(row);
      groups.set(np, list);
    }

    const data: DuplicateGroup[] = [];
    for (const [phone, list] of groups) {
      if (list.length < 2) continue;
      // Oldest account first — a sensible default "primary".
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      data.push({ phone, customers: list });
    }
    // Biggest / messiest groups first.
    data.sort((a, b) => b.customers.length - a.customers.length);

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "ডুপ্লিকেট কাস্টমার লোড করা যায়নি" };
  }
};

/**
 * Free-text search over customers (name / customer id / phone / address) for the
 * manual merge tool. Unlike the auto duplicate groups above, this lets an admin
 * pull together accounts that do NOT share a phone number — e.g. one person who
 * bought under their own number and again under a relative's number — and merge
 * them into a single account. Returns the same aggregate shape as a duplicate row.
 */
export const searchCustomersForMerge = async (
  query: string,
): Promise<{ success: true; data: DuplicateCustomer[] } | { success: false; message: string }> => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const q = (query || "").trim();
    if (q.length < 2) return { success: true, data: [] };
    const pattern = `%${q}%`;

    const custs = await db
      .select({
        customerId: customers.customerId,
        name: customers.name,
        phone: customers.phone,
        address: customers.address,
        invoiceNumber: customers.invoiceNumber,
        createdAt: customers.createdAt,
        vipCardNumber: customers.vipCardNumber,
        referralBalance: customers.referralBalance,
        sellerId: customers.sellerId,
      })
      .from(customers)
      .where(
        or(
          ilike(customers.name, pattern),
          ilike(customers.customerId, pattern),
          ilike(customers.phone, pattern),
          ilike(customers.address, pattern),
        ),
      )
      .orderBy(desc(customers.createdAt))
      .limit(25);

    if (custs.length === 0) return { success: true, data: [] };

    const ids = custs.map((c) => c.customerId);
    const [invAgg, prodAgg] = await Promise.all([
      db
        .select({
          customerId: invoices.customerId,
          cnt: sql<number>`count(*)::int`,
          bill: sql<number>`coalesce(sum(${invoices.total}), 0)::float`,
          due: sql<number>`coalesce(sum(${invoices.dueAmount}), 0)::float`,
        })
        .from(invoices)
        .where(inArray(invoices.customerId, ids))
        .groupBy(invoices.customerId),
      db
        .select({
          customerId: invoices.customerId,
          pc: sql<number>`count(*)::int`,
        })
        .from(products)
        .innerJoin(invoices, eq(products.invoiceId, invoices.id))
        .where(inArray(invoices.customerId, ids))
        .groupBy(invoices.customerId),
    ]);

    const invMap = new Map(invAgg.map((r) => [r.customerId, r]));
    const prodMap = new Map(prodAgg.map((r) => [r.customerId, r.pc]));

    const data: DuplicateCustomer[] = custs.map((c) => {
      const agg = invMap.get(c.customerId);
      return {
        ...c,
        referralBalance: Number(c.referralBalance ?? 0),
        invoiceCount: agg?.cnt ?? 0,
        totalBill: agg?.bill ?? 0,
        totalDue: agg?.due ?? 0,
        productCount: prodMap.get(c.customerId) ?? 0,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "সার্চ করা যায়নি" };
  }
};

/**
 * Merges several duplicate customer accounts into one primary account:
 * every invoice, service, notification, referral record etc. is moved onto the
 * primary customerId, referral balances are added up, a VIP card is carried over
 * if the primary has none, and the duplicate rows are deleted. All purchases then
 * live under the one account. On Neon (production) this runs as an atomic batch.
 */
const runMerge = async (
  primaryCustomerId: string,
  mergeCustomerIds: string[],
  opts: { requireSamePhone: boolean },
): Promise<{ success: boolean; message: string }> => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const primaryId = (primaryCustomerId || "").trim();
    const mergeIds = Array.from(new Set((mergeCustomerIds || []).map((s) => (s || "").trim()).filter(Boolean))).filter(
      (id) => id !== primaryId,
    );
    if (!primaryId) return { success: false, message: "প্রাইমারি অ্যাকাউন্ট নির্বাচন করুন" };
    if (mergeIds.length === 0) return { success: false, message: "মার্জ করার জন্য অন্তত একটি অ্যাকাউন্ট দরকার" };

    const involved = await db
      .select({
        customerId: customers.customerId,
        phone: customers.phone,
        vipCardNumber: customers.vipCardNumber,
        vipStatus: customers.vipStatus,
        vipExpiryDate: customers.vipExpiryDate,
        referralBalance: customers.referralBalance,
      })
      .from(customers)
      .where(inArray(customers.customerId, [primaryId, ...mergeIds]));

    const primary = involved.find((c) => c.customerId === primaryId);
    if (!primary) return { success: false, message: "প্রাইমারি অ্যাকাউন্ট পাওয়া যায়নি" };
    const toMerge = involved.filter((c) => mergeIds.includes(c.customerId));
    if (toMerge.length !== mergeIds.length) return { success: false, message: "কিছু অ্যাকাউন্ট পাওয়া যায়নি" };

    // Safety for the auto duplicate-group tool: only merge accounts that share the
    // same phone number as the primary. The manual tool skips this on purpose so an
    // admin can join a person's own and a relative's accounts (different numbers).
    if (opts.requireSamePhone) {
      const primaryNp = normPhone(primary.phone);
      const mismatch = toMerge.find((c) => normPhone(c.phone) !== primaryNp);
      if (mismatch) {
        return {
          success: false,
          message: "শুধু একই ফোন নাম্বারের অ্যাকাউন্টগুলো মার্জ করা যাবে",
        };
      }
    }

    // Build the ordered write plan: move every child row onto the primary, then
    // delete the now-empty duplicate accounts. Delete is LAST so cascades never
    // wipe reassigned data even if this runs without a transaction (dev pg).
    const ops: any[] = [
      db.update(invoices).set({ customerId: primaryId }).where(inArray(invoices.customerId, mergeIds)),
      db.update(services).set({ customerId: primaryId }).where(inArray(services.customerId, mergeIds)),
      db.update(staffComplaints).set({ customerId: primaryId }).where(inArray(staffComplaints.customerId, mergeIds)),
      db.update(feedbacks).set({ customerId: primaryId }).where(inArray(feedbacks.customerId, mergeIds)),
      db.update(contactMessages).set({ customerId: primaryId }).where(inArray(contactMessages.customerId, mergeIds)),
      db
        .update(customerNotifications)
        .set({ customerId: primaryId })
        .where(inArray(customerNotifications.customerId, mergeIds)),
      db.update(noticeRecipients).set({ customerId: primaryId }).where(inArray(noticeRecipients.customerId, mergeIds)),
      db
        .update(referralPaymentRequests)
        .set({ customerId: primaryId })
        .where(inArray(referralPaymentRequests.customerId, mergeIds)),
      db
        .update(referralBonuses)
        .set({ referrerCustomerId: primaryId })
        .where(inArray(referralBonuses.referrerCustomerId, mergeIds)),
      db
        .update(referralBonuses)
        .set({ referredCustomerId: primaryId })
        .where(inArray(referralBonuses.referredCustomerId, mergeIds)),
    ];

    // Add the duplicates' referral balance to the primary (money must not vanish).
    const mergedBalance = toMerge.reduce((sum, c) => sum + Number(c.referralBalance ?? 0), 0);
    if (mergedBalance > 0) {
      ops.push(
        db
          .update(customers)
          .set({ referralBalance: sql`${customers.referralBalance} + ${mergedBalance}` })
          .where(eq(customers.customerId, primaryId)),
      );
    }

    // Carry over a VIP card if the primary has none but a duplicate does.
    if (!primary.vipCardNumber) {
      const donor = toMerge.find((c) => c.vipCardNumber);
      if (donor) {
        // Clear the donor first so the unique VIP-card value is free for the primary.
        ops.push(db.update(customers).set({ vipCardNumber: null }).where(eq(customers.customerId, donor.customerId)));
        ops.push(
          db
            .update(customers)
            .set({ vipCardNumber: donor.vipCardNumber, vipStatus: donor.vipStatus, vipExpiryDate: donor.vipExpiryDate })
            .where(eq(customers.customerId, primaryId)),
        );
      }
    }

    // Finally remove the duplicate accounts (their invoices etc. already moved).
    ops.push(db.delete(customers).where(inArray(customers.customerId, mergeIds)));

    const anyDb = db as any;
    if (typeof anyDb.batch === "function") {
      // Neon (production): one atomic batch — all-or-nothing.
      await anyDb.batch(ops);
    } else {
      // Local pg dev: run sequentially (delete stays last).
      for (const op of ops) await op;
    }

    revalidatePath("/staff/customers");
    revalidatePath("/staff/customers/merge");
    revalidatePath("/customers");
    revalidatePath("/customers/merge");
    return {
      success: true,
      message: `${mergeIds.length}টি অ্যাকাউন্ট একটি অ্যাকাউন্টে মার্জ হয়েছে`,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "মার্জ করা যায়নি, আবার চেষ্টা করুন" };
  }
};

/** Merge same-phone duplicate accounts (used by the auto duplicate-group tool). */
export const mergeCustomerGroup = async (primaryCustomerId: string, mergeCustomerIds: string[]) =>
  runMerge(primaryCustomerId, mergeCustomerIds, { requireSamePhone: true });

/**
 * Merge any admin-selected accounts into one, even with different phone numbers
 * (used by the manual search-and-merge tool for a buyer + their relatives' accounts).
 */
export const mergeCustomersManual = async (primaryCustomerId: string, mergeCustomerIds: string[]) =>
  runMerge(primaryCustomerId, mergeCustomerIds, { requireSamePhone: false });

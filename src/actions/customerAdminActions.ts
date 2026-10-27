"use server";

import { db } from "@/db/drizzle";
import { computeManualDiscount, ManualDiscount, parseManualDiscount, stripManualDiscount, withManualDiscount } from "@/lib/invoiceDiscount";
import { customers, invoices, products, referralBonuses } from "@/db/schema";
import { verifySession } from "@/lib";
import { SearchParams } from "@/types";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Warranty end = start + duration months (the column used to default to the creation time). */
const warrantyEndOf = (start: Date, months: number) => {
  const d = new Date(start);
  d.setMonth(d.getMonth() + months);
  return d;
};

/** Product categories a customer can be filtered by on the reminders page. */
const PRODUCT_CATEGORIES = ["ips", "battery", "stabilizer"] as const;
type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const normalizeCategory = (category?: string): ProductCategory | undefined =>
  PRODUCT_CATEGORIES.includes(category as ProductCategory)
    ? (category as ProductCategory)
    : undefined;

/**
 * Builds the WHERE condition for the admin customers listing: a text search
 * across the usual columns, optionally narrowed to customers who own at least
 * one product of a given category (ips/battery/stabilizer). A customer with
 * several product types matches every category they own.
 */
const buildCustomersWhere = (query?: string, category?: string) => {
  const q = `%${query || ""}%`;
  const textFilter = query
    ? or(
        ilike(customers.customerId, q),
        ilike(customers.name, q),
        ilike(customers.phone, q),
        ilike(customers.address, q),
        ilike(customers.invoiceNumber, q),
        // any invoice number on the account (not just the first one), and the
        // customer IDs that were merged into this account (kept on their invoices)
        inArray(
          customers.customerId,
          db
            .selectDistinct({ customerId: invoices.customerId })
            .from(invoices)
            .where(or(ilike(invoices.invoiceNumber, q), ilike(invoices.originalCustomerId, q))),
        ),
      )
    : undefined;

  const cat = normalizeCategory(category);
  const categoryFilter = cat
    ? inArray(
        customers.customerId,
        db
          .selectDistinct({ customerId: invoices.customerId })
          .from(invoices)
          .innerJoin(products, eq(products.invoiceId, invoices.id))
          .where(eq(products.type, cat)),
      )
    : undefined;

  if (textFilter && categoryFilter) return and(textFilter, categoryFilter);
  return textFilter ?? categoryFilter ?? undefined;
};

/**
 * Fetches metadata (pagination info) for customers listing in admin dashboard
 */
export const getCustomersMetadata = async ({
  query,
  page = "1",
  limit = "20",
  category,
}: SearchParams) => {
  const session = await verifySession(false, "admin");
  if (!session) {
    return {
      currentPage: Number(page),
      totalRecords: 0,
      totalPages: 0,
      currentLimit: Number(limit),
    };
  }

  const filters = buildCustomersWhere(query, category);

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(customers)
    .where(filters);
  const totalRecords = Number(result[0].count);
  const totalPages = limit ? Math.ceil(totalRecords / Number(limit)) : 1;

  return {
    currentPage: Number(page),
    totalRecords: totalRecords,
    totalPages: totalPages,
    currentLimit: Number(limit),
  };
};

export const getCustomerIds = async ({
  query,
  category,
}: Pick<SearchParams, "query" | "category">) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const data = await db.query.customers.findMany({
      where: buildCustomersWhere(query, category),
      columns: { customerId: true },
    });

    return { success: true, data: data.map((customer) => customer.customerId) };
  } catch (error) {
    console.error("Error fetching customer IDs:", error);
    return { success: false, message: "Could not fetch customer IDs" };
  }
};

/**
 * Fetches customers list for admin dashboard with search and pagination
 */
export const getCustomers = async ({
  query,
  page = "1",
  limit = "20",
  category,
}: SearchParams) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const offset = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    const customersData = await db.query.customers.findMany({
      where: buildCustomersWhere(query, category),
      limit: limit ? Number(limit) : undefined,
      offset: offset,
      orderBy: (customers, { desc }) => [desc(customers.createdAt)],
      with: {
        invoice: true,
        seller: { columns: { sellerId: true, shopName: true } },
      },
    });

    // Aggregate every purchase per customer (count + total bill + total due)
    // so the list reflects all invoices under one account, not just the first.
    const ids = customersData.map((c) => c.customerId);
    let withAggregate = customersData as Array<(typeof customersData)[number] & { aggregate?: { invoiceCount: number; totalBill: number; totalDue: number } }>;
    if (ids.length) {
      const agg = await db
        .select({
          customerId: invoices.customerId,
          invoiceCount: sql<number>`count(*)::int`,
          totalBill: sql<number>`coalesce(sum(${invoices.total}), 0)::float`,
          totalDue: sql<number>`coalesce(sum(${invoices.dueAmount}), 0)::float`,
        })
        .from(invoices)
        .where(inArray(invoices.customerId, ids))
        .groupBy(invoices.customerId);
      const map = new Map(agg.map((a) => [a.customerId, a]));

      // When the search text is an invoice number or a (possibly old, merged)
      // customer ID, find THAT purchase so the row can show it directly instead
      // of making the admin dig through every invoice on the account.
      const matched = new Map<string, any>();
      const q = (query || "").trim();
      if (q) {
        const like = `%${q}%`;
        const hits = await db.query.invoices.findMany({
          where: and(inArray(invoices.customerId, ids), or(ilike(invoices.invoiceNumber, like), ilike(invoices.originalCustomerId, like))),
          orderBy: (inv, { desc }) => [desc(inv.date)],
          with: { seller: { columns: { sellerId: true, shopName: true } } },
        });
        for (const inv of hits) if (!matched.has(inv.customerId)) matched.set(inv.customerId, inv);
      }

      withAggregate = customersData.map((c) => {
        const a = map.get(c.customerId);
        const m = matched.get(c.customerId);
        return {
          ...c,
          aggregate: {
            invoiceCount: Number(a?.invoiceCount ?? (c.invoice ? 1 : 0)),
            totalBill: Number(a?.totalBill ?? c.invoice?.total ?? 0),
            totalDue: Number(a?.totalDue ?? c.invoice?.dueAmount ?? 0),
          },
          matchedInvoice: m ?? undefined,
        };
      });
    }

    return { success: true, data: withAggregate };
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { success: false, message: "Could not fetch customers" };
  }
};

/**
 * Fetches a single customer's full profile for admin view
 */
export const getCustomerById = async (customerId: string) => {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false, message: "Unauthorized" };

    const customerData = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      with: {
        invoice: {
          with: {
            products: true,
          },
        },
        services: true,
        feedbacks: true,
        referredByRecord: {
          with: {
            referrer: true,
          },
        },
      },
    });

    if (!customerData) return { success: false, message: "Customer not found" };

    // Every purchase the customer has made (newest first). `invoice` above stays
    // the primary one for backward compatibility; `invoices` is the full list.
    const { getCustomerInvoices } = await import("@/lib/customerPurchases");
    const allInvoices = await getCustomerInvoices(customerId);

    return { success: true, data: { ...customerData, invoices: allInvoices } };
  } catch (error) {
    console.error("Error fetching customer by id:", error);
    return { success: false, message: "Something went wrong" };
  }
};

/**
 * Finds existing customers by name / phone / customer ID so a new purchase can
 * be attached to an existing account instead of creating a duplicate. Admins
 * search everyone; sellers only their own customers. Returns a light shape with
 * each customer's purchase count and outstanding due.
 */
export const searchCustomersForPurchase = async (query: string) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "seller")) {
      return { success: false, message: "Unauthorized" };
    }
    const q = (query || "").trim();
    if (q.length < 2) return { success: true, data: [] };

    const like = `%${q}%`;
    const textFilter = or(
      ilike(customers.customerId, like),
      ilike(customers.name, like),
      ilike(customers.phone, like),
      // IDs printed on older invoices (merged accounts)
      inArray(
        customers.customerId,
        db.selectDistinct({ customerId: invoices.customerId }).from(invoices).where(ilike(invoices.originalCustomerId, like)),
      ),
    );
    // A seller may only ever reach their OWN customers — a customer whose
    // account is attributed to them, or who has any invoice sold by them.
    // Within that scope they can match by name, phone or (old) customer ID,
    // but another seller's or an admin-only customer never shows up, even by
    // exact phone / ID — so sellers cannot see or poach each other's buyers.
    const sellerScope = or(
      eq(customers.sellerId, session.userId as string),
      inArray(
        customers.customerId,
        db.selectDistinct({ customerId: invoices.customerId }).from(invoices).where(eq(invoices.sellerId, session.userId as string)),
      ),
    );
    const where =
      session.role === "seller" ? and(sellerScope, textFilter) : textFilter;

    const matches = await db.query.customers.findMany({
      where,
      limit: 8,
      orderBy: (c, { desc }) => [desc(c.createdAt)],
      columns: {
        customerId: true,
        name: true,
        phone: true,
        address: true,
        invoiceNumber: true,
        isWarrantyStopped: true,
        warrantyStopReason: true,
      },
    });

    const ids = matches.map((m) => m.customerId);
    const aggMap = new Map<string, { invoiceCount: number; totalDue: number }>();
    if (ids.length) {
      const agg = await db
        .select({
          customerId: invoices.customerId,
          invoiceCount: sql<number>`count(*)::int`,
          totalDue: sql<number>`coalesce(sum(${invoices.dueAmount}), 0)::float`,
        })
        .from(invoices)
        .where(inArray(invoices.customerId, ids))
        .groupBy(invoices.customerId);
      for (const a of agg) aggMap.set(a.customerId, { invoiceCount: Number(a.invoiceCount), totalDue: Number(a.totalDue) });
    }

    return {
      success: true,
      data: matches.map((m) => ({
        ...m,
        invoiceCount: aggMap.get(m.customerId)?.invoiceCount ?? 0,
        totalDue: aggMap.get(m.customerId)?.totalDue ?? 0,
      })),
    };
  } catch (error) {
    console.error("Error searching customers:", error);
    return { success: false, message: "Could not search customers" };
  }
};

/**
 * Adds a NEW invoice (one purchase) to an EXISTING customer account. The
 * customer's own name/phone/address are used (the form locks them), so repeat
 * buyers keep a single account with a separate invoice per purchase. Referral
 * discounts are a one-time new-customer benefit and are not re-applied here.
 */
export const addPurchaseToCustomer = async (customerId: string, data: any, sendLink = false) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "seller")) {
      return { success: false, message: "Unauthorized" };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      columns: { customerId: true, name: true, phone: true, address: true, sellerId: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    // Who sold this purchase. A seller always sells as themselves (even to a
    // customer who first bought directly from SE or from another shop); an admin
    // can pick the seller in the form. Attribution lives on the invoice, so the
    // purchases under one account never mix between sellers.
    const sellerId: string | null = session.role === "seller" ? (session.userId as string) : data.sellerId || null;

    const base = invoiceBase(data);
    const manual = session.role === "admin" ? readManualDiscount(data, base) : ({ ok: true, discount: null } as const);
    if (!manual.ok) return { success: false, message: manual.message };

    let finalTotal = base;
    if (manual.discount) finalTotal = Math.max(0, finalTotal - manual.discount.amount);
    const finalDue = Math.min(Math.max(0, Number(data.invoice.dueAmount) || 0), finalTotal);

    const { generateInvoiceNumber } = await import("@/utils");
    const invoiceNumber = generateInvoiceNumber();

    const [invoiceRecord] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId: customer.customerId,
        originalCustomerId: customer.customerId,
        sellerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        date: new Date(data.invoice.date),
        paymentType: data.invoice.paymentType,
        subtotal: base,
        total: finalTotal,
        dueAmount: finalDue,
        dueType: data.invoice.dueType || "due",
        notes: withManualDiscount(data.invoice.notes, manual.discount),
      })
      .returning();

    if (data.products && data.products.length > 0) {
      await db.insert(products).values(
        data.products.map((p: any) => ({
          invoiceId: invoiceRecord.id,
          type: p.type,
          model: p.model,
          serialNumber: String(p.serialNumber ?? "").trim() || null,
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.unitPrice) || 0,
          warrantyStartDate: new Date(p.warrantyStartDate),
          warrantyDurationMonths: Number(p.warrantyDurationMonths),
          warrantyEndDate: warrantyEndOf(new Date(p.warrantyStartDate), Number(p.warrantyDurationMonths)),
        })),
      );
    }

    if (sendLink) {
      const { sendInvoiceDownloadLink } = await import("./invoiceActions");
      await sendInvoiceDownloadLink(
        { name: customer.name, phoneNumber: customer.phone },
        {
          invoiceNumber,
          date: data.invoice.date,
          totalPrice: finalTotal,
          invoiceType: "customer-invoice",
          customerId: customer.customerId,
        },
      );
    }

    // A customer with no seller yet becomes this seller's customer (first seller
    // wins; later sellers are still credited through their own invoices).
    if (sellerId && !customer.sellerId) {
      await db.update(customers).set({ sellerId }).where(eq(customers.customerId, customer.customerId));
    }

    // Admin recorded a sale under a seller → let the seller know.
    if (session.role === "admin" && sellerId) {
      try {
        const { notifySeller } = await import("./notificationActions");
        await notifySeller({
          sellerId,
          type: "customer_added",
          message: `SE Electronics: আপনার অধীনে কাস্টমার ${customer.name} (${customer.customerId}) এর নতুন বিক্রি (ইনভয়েস ${invoiceNumber}) যুক্ত হয়েছে।`,
          link: "/seller/customers",
        });
      } catch (e) {
        console.error("Failed to notify seller of new purchase:", e);
      }
    }

    revalidatePath("/customers");
    revalidatePath(`/staff/customers/${customerId}`);
    revalidatePath("/seller/customers");
    revalidatePath("/seller/profile");

    return { success: true, message: "নতুন ইনভয়েস যোগ হয়েছে", invoiceNumber };
  } catch (error) {
    console.error("Error adding purchase:", error);
    return { success: false, message: "Failed to add purchase" };
  }
};

/**
 * Creates a new customer record with associated invoice and products
 */

/**
 * Server-side invoice totals: subtotal from the product lines (never the client
 * total), plus the optional manual admin discount (% or flat) validated here.
 * Combination: total = subtotal − referralDiscount (4% of subtotal) − manualDiscount,
 * never below 0. The manual discount is always computed on the subtotal.
 */
function invoiceBase(data: any): number {
  const items = Array.isArray(data?.products) ? data.products : [];
  if (items.length) {
    return items.reduce((sum: number, p: any) => sum + (Number(p.unitPrice) || 0) * (Number(p.quantity) || 0), 0);
  }
  return Number(data?.invoice?.subtotal) || 0;
}

function readManualDiscount(data: any, base: number): { ok: true; discount: ManualDiscount | null } | { ok: false; message: string } {
  const md = data?.invoice?.manualDiscount;
  if (!md || md.value === undefined || md.value === null || md.value === "" || Number(md.value) === 0) return { ok: true, discount: null };
  const type = md.type === "flat" ? "flat" : md.type === "percent" ? "percent" : null;
  const value = Number(md.value);
  if (!type || !Number.isFinite(value) || value < 0) return { ok: false, message: "Invalid discount" };
  if (type === "percent" && value > 100) return { ok: false, message: "Discount percent must be between 0 and 100" };
  if (type === "flat" && value > base) return { ok: false, message: "Flat discount cannot exceed the subtotal" };
  const amount = computeManualDiscount(base, type, value);
  return { ok: true, discount: amount > 0 ? { type, value, amount } : null };
}

export const createCustomer = async (data: any, sendLink = false) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "seller")) {
      return { success: false, message: "Unauthorized" };
    }
    // A seller can only create customers linked to their own account
    if (session.role === "seller") data = { ...data, sellerId: session.userId };

    const { generateRandomId, generateInvoiceNumber } = await import("@/utils");

    const customerId = generateRandomId();
    const invoiceNumber = generateInvoiceNumber();

    // Track referral info to notify after transaction
    let referrerInfo: {
      customerId: string;
      phone: string;
      bonusEarned: number;
    } | null = null;

    const base = invoiceBase(data);
    // Only admins may add a manual discount
    const manual = session.role === "admin" ? readManualDiscount(data, base) : ({ ok: true, discount: null } as const);
    if (!manual.ok) return { success: false, message: manual.message };

    let discountGiven = 0;
    let bonusEarned = 0;
    let finalTotal = base;
    let finalDue = Number(data.invoice.dueAmount) || 0;
    let referrer: any = null;

    if (data.referralVipCard) {
      referrer = await db.query.customers.findFirst({
        where: and(
          eq(customers.vipCardNumber, data.referralVipCard),
          eq(customers.vipStatus, "approved"),
        ),
      });

      if (referrer) {
        discountGiven = finalTotal * 0.04;
        bonusEarned = finalTotal * 0.02;
        finalTotal = finalTotal - discountGiven;
        finalDue = Math.max(0, finalDue);

        referrerInfo = {
          customerId: referrer.customerId,
          phone: referrer.phone,
          bonusEarned,
        };
      }
    }

    // Manual admin discount on top of any referral discount (never below 0)
    if (manual.discount) finalTotal = Math.max(0, finalTotal - manual.discount.amount);
    finalDue = Math.min(Math.max(0, finalDue), finalTotal);

    // Start a transaction
    // 1. Create customer
    await db.insert(customers).values({
      customerId,
      invoiceNumber,
      name: data.name,
      phone: data.phone,
      address: data.address,
      referredByVipCard: data.referralVipCard || null,
      sellerId: data.sellerId || null,
    });

    // 2. Create invoice
    const [invoiceRecord] = await db
      .insert(invoices)
      .values({
        invoiceNumber,
        customerId,
        originalCustomerId: customerId,
        sellerId: data.sellerId || null,
        customerName: data.name,
        customerPhone: data.phone,
        customerAddress: data.address,
        date: new Date(data.invoice.date),
        paymentType: data.invoice.paymentType,
        subtotal: base,
        total: finalTotal,
        dueAmount: finalDue,
        dueType: data.invoice.dueType || 'due',
        notes: withManualDiscount(data.invoice.notes, manual.discount),
      })
      .returning();

    // 3. Create products
    if (data.products && data.products.length > 0) {
      await db.insert(products).values(
        data.products.map((p: any) => ({
          invoiceId: invoiceRecord.id,
          type: p.type,
          model: p.model,
          serialNumber: String(p.serialNumber ?? "").trim() || null,
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.unitPrice) || 0,
          warrantyStartDate: new Date(p.warrantyStartDate),
          warrantyDurationMonths: Number(p.warrantyDurationMonths),
          warrantyEndDate: warrantyEndOf(new Date(p.warrantyStartDate), Number(p.warrantyDurationMonths)),
        })),
      );
    }

    if (sendLink) {
      const { sendInvoiceDownloadLink } = await import("./invoiceActions");
      await sendInvoiceDownloadLink(
        { name: data.name, phoneNumber: data.phone },
        {
          invoiceNumber,
          date: data.invoice.date,
          totalPrice: finalTotal,
          invoiceType: "customer-invoice",
          customerId: customerId,
        },
      );
    }

    // 4. Handle referral database updates if valid referrer exists
    if (referrer) {
      // Log the referral bonus
      await db.insert(referralBonuses).values({
        referrerCustomerId: referrer.customerId,
        referrerVipCard: data.referralVipCard,
        referredCustomerId: customerId,
        referredCustomerName: data.name,
        purchaseAmount: base,
        discountGiven,
        bonusEarned,
      });

      // Credit the referrer's balance
      await db
        .update(customers)
        .set({
          referralBalance: sql`COALESCE(${customers.referralBalance}, 0) + ${bonusEarned}`,
        })
        .where(eq(customers.customerId, referrer.customerId));
    }

    revalidatePath("/customers");
    revalidatePath("/customer/referral");
    revalidatePath("/referral-payments");
    revalidatePath("/seller/customers");
    revalidatePath("/seller/profile");
    const result = {
      success: true,
      message: "Customer created successfully",
      referrerInfo,
    };

    // Notify referrer after transaction succeeds
    if (result.success && result.referrerInfo) {
      const info = result.referrerInfo;
      try {
        const { notifyCustomer } = await import("./notificationActions");
        await notifyCustomer({
          customerId: info.customerId,
          phoneNumber: info.phone,
          type: "referral_bonus",
          message: `আপনার রেফারেলে ${data.name} ক্রয় করেছেন। আপনি ৳${Math.floor(info.bonusEarned).toLocaleString()} রেফারেল বোনাস পেয়েছেন!`,
          link: "/customer/referral",
        });
      } catch (e) {
        console.error("Failed to notify referrer:", e);
      }
    }

    // Admin added a customer under a seller → let the seller know (in-app + push).
    if (session.role === "admin" && data.sellerId) {
      try {
        const { notifySeller } = await import("./notificationActions");
        await notifySeller({
          sellerId: data.sellerId,
          type: "customer_added",
          message: `SE Electronics: আপনার অধীনে নতুন কাস্টমার ${data.name} (${customerId}) যুক্ত হয়েছে।`,
          link: "/seller/customers",
        });
      } catch (e) {
        console.error("Failed to notify seller of new customer:", e);
      }
    }

    try {
      const { sendVoiceCall, getMramBroadcastIds } = await import("@/lib/mram");
      const broadcastIds = getMramBroadcastIds();
      if (broadcastIds && broadcastIds.customer_add) {
        // Do not block the request
        sendVoiceCall(data.phone, broadcastIds.customer_add, `New Customer Welcome ${customerId}`).catch(e => console.error(e));
      }
    } catch (e) {
      console.error("Failed to send MRAM voice call:", e);
    }

    return result;
  } catch (error) {
    console.error("Error creating customer:", error);
    return { success: false, message: "Failed to create customer record" };
  }
};

/**
 * Updates an existing customer record and its associated invoice/products
 */
export const updateCustomer = async (
  customerId: string,
  data: any,
  sendLink = false,
) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "seller")) {
      return { success: false, message: "Unauthorized" };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      with: { invoice: true },
    });

    if (!customer) return { success: false, message: "Customer not found" };
    // A seller may only edit customers in their list and cannot re-assign them
    if (session.role === "seller") {
      const { sellerCustomerFilter } = await import("@/lib/sellerScope");
      const mine = await db.query.customers.findFirst({
        where: and(eq(customers.customerId, customerId), sellerCustomerFilter(session.userId as string)),
        columns: { customerId: true },
      });
      if (!mine) return { success: false, message: "Unauthorized" };
      data = { ...data, sellerId: customer.sellerId };
    }

    const base = invoiceBase(data);
    // Admins set the manual discount; a seller edit keeps whatever the admin set before.
    let manual = readManualDiscount(data, base);
    if (session.role !== "admin") {
      const prev = parseManualDiscount(customer.invoice?.notes);
      manual = {
        ok: true,
        discount: prev ? { ...prev, amount: computeManualDiscount(base, prev.type, prev.value) } : null,
      };
    }
    if (!manual.ok) return { success: false, message: manual.message };

    let discountGiven = 0;
    let bonusEarned = 0;
    let finalTotal = base;
    let finalDue = Number(data.invoice.dueAmount) || 0;

    if (customer.referredByVipCard) {
      const referrer = await db.query.customers.findFirst({
        where: and(
          eq(customers.vipCardNumber, customer.referredByVipCard),
          eq(customers.vipStatus, "approved"),
        ),
      });

      if (referrer) {
        discountGiven = finalTotal * 0.04;
        bonusEarned = finalTotal * 0.02;
        finalTotal = finalTotal - discountGiven;
        finalDue = Math.max(0, finalDue);

        // Update referrer balance and the referral bonus record
        const existingBonus = await db.query.referralBonuses.findFirst({
          where: and(
            eq(referralBonuses.referrerCustomerId, referrer.customerId),
            eq(referralBonuses.referredCustomerId, customerId),
          ),
        });

        if (existingBonus) {
          const diffBonus = bonusEarned - existingBonus.bonusEarned;
          await db
            .update(customers)
            .set({
              referralBalance: sql`COALESCE(${customers.referralBalance}, 0) + ${diffBonus}`,
            })
            .where(eq(customers.customerId, referrer.customerId));

          await db
            .update(referralBonuses)
            .set({
              referredCustomerName: data.name,
              purchaseAmount: base,
              discountGiven,
              bonusEarned,
            })
            .where(eq(referralBonuses.id, existingBonus.id));
        } else {
          await db.insert(referralBonuses).values({
            referrerCustomerId: referrer.customerId,
            referrerVipCard: customer.referredByVipCard,
            referredCustomerId: customerId,
            referredCustomerName: data.name,
            purchaseAmount: base,
            discountGiven,
            bonusEarned,
          });

          await db
            .update(customers)
            .set({
              referralBalance: sql`COALESCE(${customers.referralBalance}, 0) + ${bonusEarned}`,
            })
            .where(eq(customers.customerId, referrer.customerId));
        }
      }
    }

    // Manual admin discount on top of any referral discount (never below 0)
    if (manual.discount) finalTotal = Math.max(0, finalTotal - manual.discount.amount);
    finalDue = Math.min(Math.max(0, finalDue), finalTotal);

    // 1. Update customer
    await db
      .update(customers)
      .set({
        name: data.name,
        phone: data.phone,
        address: data.address,
        ...(data.sellerId !== undefined && { sellerId: data.sellerId || null }),
      })
      .where(eq(customers.customerId, customerId));

    // 2. Update the primary invoice only. A customer can now own several
    //    invoices (one per purchase); editing the customer must not overwrite
    //    the others, so we scope by the primary invoice number.
    // Keep the primary invoice's seller aligned with the customer's seller, so
    // what admin sees and what shows in the seller's own account stay in sync.
    const primarySellerId = data.sellerId !== undefined ? (data.sellerId || null) : (customer.sellerId ?? null);
    await db
      .update(invoices)
      .set({
        customerName: data.name,
        customerPhone: data.phone,
        customerAddress: data.address,
        date: new Date(data.invoice.date),
        paymentType: data.invoice.paymentType,
        subtotal: base,
        total: finalTotal,
        dueAmount: finalDue,
        dueType: data.invoice.dueType || 'due',
        notes: withManualDiscount(data.invoice.notes, manual.discount),
        sellerId: primarySellerId,
      })
      .where(eq(invoices.invoiceNumber, customer.invoiceNumber));

    // 3. Update products (delete and recreate for simplicity)
    if (customer.invoice) {
      // Products are recreated; keep any extra days an unblock added to the end date
      // for the same product (type + model + start date).
      const old = await db.query.products.findMany({
        where: eq(products.invoiceId, customer.invoice.id),
        columns: { type: true, model: true, warrantyStartDate: true, warrantyEndDate: true },
      });
      const keyOf = (type: string, model: string, start: Date) => `${type}|${model}|${new Date(start).toISOString().slice(0, 10)}`;
      const oldEnd = new Map(old.map((o) => [keyOf(o.type, o.model, o.warrantyStartDate), o.warrantyEndDate]));
      const endFor = (p: any) => {
        const computed = warrantyEndOf(new Date(p.warrantyStartDate), Number(p.warrantyDurationMonths));
        const prev = oldEnd.get(keyOf(p.type, p.model, new Date(p.warrantyStartDate)));
        return prev && prev > computed ? prev : computed;
      };

      await db
        .delete(products)
        .where(eq(products.invoiceId, customer.invoice.id));

      if (data.products && data.products.length > 0) {
        await db.insert(products).values(
          data.products.map((p: any) => ({
            invoiceId: customer.invoice!.id,
            type: p.type,
            model: p.model,
            serialNumber: String(p.serialNumber ?? "").trim() || null,
            quantity: Number(p.quantity) || 1,
            unitPrice: Number(p.unitPrice) || 0,
            warrantyStartDate: new Date(p.warrantyStartDate),
            warrantyDurationMonths: Number(p.warrantyDurationMonths),
            warrantyEndDate: endFor(p),
          })),
        );
      }
    }

    if (sendLink) {
      const { sendInvoiceDownloadLink } = await import("./invoiceActions");
      await sendInvoiceDownloadLink(
        { name: data.name, phoneNumber: data.phone },
        {
          invoiceNumber: customer.invoiceNumber,
          date: data.invoice.date,
          totalPrice: finalTotal,
          invoiceType: "customer-invoice",
          customerId: customerId,
        },
      );
    }

    revalidatePath("/customers");
    revalidatePath(`/staff/customers/${customerId}`);
    revalidatePath("/seller/customers");
    revalidatePath("/seller/profile");
    return { success: true, message: "Customer updated successfully" };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { success: false, message: "Failed to update customer record" };
  }
};

/**
 * Loads one invoice (by id) with its products, for the per-invoice editor.
 * A customer can own several invoices; this lets the admin edit any of them,
 * not only the primary one that `updateCustomer` touches.
 */
export const getInvoiceForEdit = async (invoiceId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      with: { products: true },
    });
    if (!invoice) return { success: false, message: "Invoice not found" };
    return {
      success: true,
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        sellerId: invoice.sellerId ?? "",
        date: invoice.date,
        paymentType: invoice.paymentType,
        subtotal: invoice.subtotal,
        total: invoice.total,
        dueAmount: invoice.dueAmount,
        dueType: invoice.dueType,
        // Human part of the notes only (the manual-discount marker is kept internally).
        notes: stripManualDiscount(invoice.notes),
        products: invoice.products ?? [],
      },
    };
  } catch (error) {
    console.error("getInvoiceForEdit error:", error);
    return { success: false, message: "Could not load the invoice" };
  }
};

/**
 * Updates ONE specific invoice (its products, prices, date, payment, due and
 * notes). Any manual discount already on the invoice is preserved and
 * re-applied against the new subtotal. Does not touch the customer record or
 * any other invoice, so editing one purchase never disturbs the others.
 */
export const updateInvoiceById = async (
  invoiceId: string,
  data: {
    date: string | Date;
    paymentType: string;
    dueAmount: number;
    dueType?: "due" | "installment";
    notes?: string;
    /** Seller/dealer this purchase is attributed to ("" = direct SE Electronics). */
    sellerId?: string | null;
    products: Array<{
      type: string;
      model: string;
      serialNumber?: string | null;
      quantity: number;
      unitPrice: number;
      warrantyStartDate: string | Date;
      warrantyDurationMonths: number;
    }>;
  },
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      columns: { id: true, invoiceNumber: true, notes: true, customerId: true },
      with: { products: { columns: { type: true, model: true, warrantyStartDate: true, warrantyEndDate: true } } },
    });
    if (!invoice) return { success: false, message: "Invoice not found" };

    // Seller attribution: a blank value means "direct SE Electronics" (null).
    const sellerId = (data.sellerId || "").trim() || null;

    const items = Array.isArray(data.products) ? data.products : [];
    if (items.length === 0) return { success: false, message: "At least one product is required" };
    for (const p of items) {
      if (!p.model?.trim() || Number(p.quantity) <= 0 || Number(p.unitPrice) < 0) {
        return { success: false, message: "Every product needs a model, a quantity and a price" };
      }
    }

    const subtotal = items.reduce((sum, p) => sum + (Number(p.unitPrice) || 0) * (Number(p.quantity) || 0), 0);

    // Preserve whatever manual discount was on the invoice, recomputed against the new subtotal.
    const prev = parseManualDiscount(invoice.notes);
    let discount: ManualDiscount | null = null;
    if (prev) {
      const amount = computeManualDiscount(subtotal, prev.type, prev.value);
      discount = amount > 0 ? { type: prev.type, value: prev.value, amount } : null;
    }
    const total = Math.max(0, subtotal - (discount?.amount ?? 0));
    const due = Math.min(Math.max(0, Number(data.dueAmount) || 0), total);

    // Keep any extra days an "unblock" added to a product's warranty (match by type+model+start).
    const keyOf = (type: string, model: string, start: Date) => `${type}|${model}|${new Date(start).toISOString().slice(0, 10)}`;
    const oldEnd = new Map((invoice.products ?? []).map((o) => [keyOf(o.type, o.model, o.warrantyStartDate), o.warrantyEndDate]));
    const endFor = (p: { type: string; model: string; warrantyStartDate: string | Date; warrantyDurationMonths: number }) => {
      const computed = warrantyEndOf(new Date(p.warrantyStartDate), Number(p.warrantyDurationMonths));
      const prevEnd = oldEnd.get(keyOf(p.type, p.model, new Date(p.warrantyStartDate)));
      return prevEnd && prevEnd > computed ? prevEnd : computed;
    };

    await db
      .update(invoices)
      .set({
        date: new Date(data.date),
        paymentType: data.paymentType as any,
        subtotal,
        total,
        dueAmount: due,
        dueType: (data.dueType as any) || "due",
        notes: withManualDiscount(data.notes ?? "", discount),
        sellerId,
      })
      .where(eq(invoices.id, invoiceId));

    // Keep the customer's primary seller in sync so the admin row badge and the
    // seller's own account agree: if this invoice now has a seller and the
    // customer had none, adopt it as the customer's seller.
    if (sellerId && invoice.customerId) {
      const owner = await db.query.customers.findFirst({ where: eq(customers.customerId, invoice.customerId), columns: { sellerId: true } });
      if (owner && !owner.sellerId) {
        await db.update(customers).set({ sellerId }).where(eq(customers.customerId, invoice.customerId));
      }
    }

    await db.delete(products).where(eq(products.invoiceId, invoiceId));
    await db.insert(products).values(
      items.map((p) => ({
        invoiceId,
        type: p.type as any,
        model: p.model,
        serialNumber: String(p.serialNumber ?? "").trim() || null,
        quantity: Number(p.quantity) || 1,
        unitPrice: Number(p.unitPrice) || 0,
        warrantyStartDate: new Date(p.warrantyStartDate),
        warrantyDurationMonths: Number(p.warrantyDurationMonths),
        warrantyEndDate: endFor(p),
      })),
    );

    revalidatePath("/customers");
    revalidatePath("/invoices");
    revalidatePath("/customer/products");
    revalidatePath("/customer/services", "layout");
    revalidatePath("/seller/customers", "layout");
    revalidatePath("/seller/profile");
    return { success: true, message: "Invoice updated" };
  } catch (error) {
    console.error("updateInvoiceById error:", error);
    return { success: false, message: "Failed to update the invoice" };
  }
};

/**
 * Deletes ONE invoice (and its products) from a customer, leaving the other
 * invoices and the customer record intact. If it was the customer's primary
 * invoice pointer, the pointer is moved to the newest remaining invoice.
 */
export const deleteInvoiceById = async (invoiceId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, invoiceId),
      columns: { id: true, invoiceNumber: true, customerId: true },
    });
    if (!invoice) return { success: false, message: "Invoice not found" };

    await db.delete(products).where(eq(products.invoiceId, invoiceId));
    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    // If this was the customer's primary invoice pointer, repoint it.
    if (invoice.customerId) {
      const owner = await db.query.customers.findFirst({
        where: eq(customers.customerId, invoice.customerId),
        columns: { invoiceNumber: true },
      });
      if (owner && owner.invoiceNumber === invoice.invoiceNumber) {
        const next = await db.query.invoices.findFirst({
          where: eq(invoices.customerId, invoice.customerId),
          orderBy: (inv, { desc }) => [desc(inv.date)],
          columns: { invoiceNumber: true },
        });
        await db
          .update(customers)
          .set({ invoiceNumber: next?.invoiceNumber ?? "" })
          .where(eq(customers.customerId, invoice.customerId));
      }
    }

    revalidatePath("/customers");
    revalidatePath("/invoices");
    revalidatePath("/customer/products");
    revalidatePath("/customer/services", "layout");
    revalidatePath("/seller/customers", "layout");
    revalidatePath("/seller/profile");
    return { success: true, message: "Invoice deleted" };
  } catch (error) {
    console.error("deleteInvoiceById error:", error);
    return { success: false, message: "Failed to delete the invoice" };
  }
};

/**
 * Deletes a customer and all associated data
 */
export const deleteCustomer = async (id: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    await db.delete(customers).where(eq(customers.id, id));

    revalidatePath("/customers");
    return { success: true, message: "Customer deleted successfully" };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { success: false, message: "Failed to delete customer" };
  }
};

/**
 * Toggles a customer's dashboard (disables/enables).
 * When disabling: sets isWarrantyStopped = true, warrantyStoppedAt = now()
 * When enabling: adds the disabled duration to all products' warrantyEndDate, resets fields.
 */
export const toggleCustomerDashboard = async (customerId: string, reason?: "due" | "misuse") => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      with: {
        invoice: {
          with: {
            products: true,
          }
        }
      }
    });

    if (!customer) return { success: false, message: "Customer not found" };

    // Block/unblock must cover every purchase, not just the primary invoice.
    const { getCustomerProducts } = await import("@/lib/customerPurchases");
    const allProducts = await getCustomerProducts(customerId);

    const { toggleCustomerBlockCore, blockReasonOf } = await import("@/lib/customerBlock");
    await toggleCustomerBlockCore({ ...customer, allProducts }, blockReasonOf(reason));

    revalidatePath("/customers");
    revalidatePath(`/staff/customers/${customerId}`);
    return { success: true, message: `Dashboard ${customer.isWarrantyStopped ? 'enabled' : 'disabled'} successfully` };
  } catch (error) {
    console.error("Error toggling customer dashboard:", error);
    return { success: false, message: "Failed to toggle customer dashboard" };
  }
};

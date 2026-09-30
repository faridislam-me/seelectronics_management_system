"use server";

import { db } from "@/db/drizzle";
import { computeManualDiscount, ManualDiscount, parseManualDiscount, withManualDiscount } from "@/lib/invoiceDiscount";
import { customers, invoices, products, referralBonuses } from "@/db/schema";
import { verifySession } from "@/lib";
import { SearchParams } from "@/types";
import { and, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Fetches metadata (pagination info) for customers listing in admin dashboard
 */
export const getCustomersMetadata = async ({
  query,
  page = "1",
  limit = "20",
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

  const q = `%${query}%`;
  const filters = query
    ? or(
        ilike(customers.customerId, q),
        ilike(customers.name, q),
        ilike(customers.phone, q),
        ilike(customers.address, q),
        ilike(customers.invoiceNumber, q),
      )
    : undefined;

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

export const getCustomerIds = async ({ query }: Pick<SearchParams, "query">) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const q = `%${query || ""}%`;
    const data = await db.query.customers.findMany({
      where: query
        ? or(
            ilike(customers.customerId, q),
            ilike(customers.name, q),
            ilike(customers.phone, q),
            ilike(customers.address, q),
            ilike(customers.invoiceNumber, q),
          )
        : undefined,
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
}: SearchParams) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const q = `%${query}%`;
    const offset = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    const customersData = await db.query.customers.findMany({
      where: query
        ? or(
            ilike(customers.customerId, q),
            ilike(customers.name, q),
            ilike(customers.phone, q),
            ilike(customers.address, q),
            ilike(customers.invoiceNumber, q),
          )
        : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset,
      orderBy: (customers, { desc }) => [desc(customers.createdAt)],
      with: {
        invoice: true,
      },
    });

    return { success: true, data: customersData };
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

    return { success: true, data: customerData };
  } catch (error) {
    console.error("Error fetching customer by id:", error);
    return { success: false, message: "Something went wrong" };
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
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.unitPrice) || 0,
          warrantyStartDate: new Date(p.warrantyStartDate),
          warrantyDurationMonths: Number(p.warrantyDurationMonths),
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
    // A seller may only edit their own customers and cannot re-assign them
    if (session.role === "seller") {
      if (customer.sellerId !== session.userId) return { success: false, message: "Unauthorized" };
      data = { ...data, sellerId: session.userId };
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

    // 2. Update invoice
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
      })
      .where(eq(invoices.customerId, customerId));

    // 3. Update products (delete and recreate for simplicity)
    if (customer.invoice) {
      await db
        .delete(products)
        .where(eq(products.invoiceId, customer.invoice.id));

      if (data.products && data.products.length > 0) {
        await db.insert(products).values(
          data.products.map((p: any) => ({
            invoiceId: customer.invoice!.id,
            type: p.type,
            model: p.model,
            quantity: Number(p.quantity) || 1,
            unitPrice: Number(p.unitPrice) || 0,
            warrantyStartDate: new Date(p.warrantyStartDate),
            warrantyDurationMonths: Number(p.warrantyDurationMonths),
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

    const { toggleCustomerBlockCore, blockReasonOf } = await import("@/lib/customerBlock");
    await toggleCustomerBlockCore(customer, blockReasonOf(reason));

    revalidatePath("/customers");
    revalidatePath(`/staff/customers/${customerId}`);
    return { success: true, message: `Dashboard ${customer.isWarrantyStopped ? 'enabled' : 'disabled'} successfully` };
  } catch (error) {
    console.error("Error toggling customer dashboard:", error);
    return { success: false, message: "Failed to toggle customer dashboard" };
  }
};

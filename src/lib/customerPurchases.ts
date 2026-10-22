import { db } from "@/db/drizzle";
import { invoices, products } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

/**
 * A customer owns ONE account (customerId) but can have MANY invoices — one per
 * purchase. These helpers load and aggregate every invoice/product a customer
 * has, so warranty, due and totals are computed across all of their purchases
 * instead of only the first ("primary") invoice stored on the customer row.
 */

export type WarrantyProduct = {
  warrantyStartDate: Date | string;
  warrantyDurationMonths: number;
};

/** All invoices for a customer, newest first, each with its products. */
export async function getCustomerInvoices(customerId: string) {
  return db.query.invoices.findMany({
    where: eq(invoices.customerId, customerId),
    orderBy: [desc(invoices.date)],
    with: { products: true },
  });
}

/** Every product a customer ever bought, flattened across all their invoices. */
export async function getCustomerProducts(customerId: string) {
  return db
    .select({
      id: products.id,
      type: products.type,
      model: products.model,
      serialNumber: products.serialNumber,
      quantity: products.quantity,
      unitPrice: products.unitPrice,
      warrantyStartDate: products.warrantyStartDate,
      warrantyDurationMonths: products.warrantyDurationMonths,
      warrantyEndDate: products.warrantyEndDate,
    })
    .from(products)
    .innerJoin(invoices, eq(products.invoiceId, invoices.id))
    .where(eq(invoices.customerId, customerId));
}

/** Warranty end date for a single product. */
export function productWarrantyEnd(p: WarrantyProduct): Date {
  const d = new Date(p.warrantyStartDate);
  d.setMonth(d.getMonth() + p.warrantyDurationMonths);
  return d;
}

/** Latest warranty end date across a set of products (null if none). */
export function latestWarrantyEnd(items: WarrantyProduct[]): Date | null {
  if (!items.length) return null;
  return items
    .map(productWarrantyEnd)
    .reduce((a, b) => (b > a ? b : a));
}

/** True when at least one product is still inside its warranty window. */
export function hasActiveWarranty(items: WarrantyProduct[], now = new Date()): boolean {
  return items.some((p) => productWarrantyEnd(p) >= now);
}

/** Sum of a numeric field across a customer's invoices. */
export function sumInvoices<T extends Record<string, any>>(
  list: T[],
  field: keyof T,
): number {
  return list.reduce((t, inv) => t + (Number(inv[field]) || 0), 0);
}

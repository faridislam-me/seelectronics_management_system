import { db } from "@/db/drizzle";
import { invoices, products, services } from "@/db/schema";
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

/**
 * One unit a customer owns, with the invoice it came on. After duplicate
 * accounts are merged, invoiceNumber / originalCustomerId are what still
 * identify the individual purchase.
 */
export type OwnedProduct = {
  id: string;
  type: string;
  model: string;
  serialNumber: string | null;
  quantity: number;
  unitPrice: number;
  warrantyStartDate: Date;
  warrantyDurationMonths: number;
  warrantyEnd: Date;
  warrantyActive: boolean;
  invoiceId: string;
  invoiceNumber: string;
  originalCustomerId: string | null;
  invoiceDate: Date;
  invoiceTotal: number;
  invoiceDue: number;
  paymentType: string;
};

/** A service / installation request, as shown under the product it was for. */
export type ProductService = {
  serviceId: string;
  type: "install" | "repair";
  status: string;
  createdAt: Date;
  staffName: string | null;
  productType: string;
  productModel: string;
};

export type OwnedProductWithServices = OwnedProduct & {
  services: ProductService[];
  installCount: number;
  repairCount: number;
};

/** Every product a customer owns, newest invoice first, each with its invoice context. */
export async function getCustomerOwnedProducts(customerId: string): Promise<OwnedProduct[]> {
  const invs = await getCustomerInvoices(customerId);
  const now = new Date();
  return invs.flatMap((inv) =>
    (inv.products ?? []).map((p) => {
      const warrantyEnd = productWarrantyEnd(p);
      return {
        id: p.id,
        type: p.type,
        model: p.model,
        serialNumber: p.serialNumber,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        warrantyStartDate: new Date(p.warrantyStartDate),
        warrantyDurationMonths: p.warrantyDurationMonths,
        warrantyEnd,
        warrantyActive: p.warrantyDurationMonths > 0 && warrantyEnd >= now,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        originalCustomerId: inv.originalCustomerId,
        invoiceDate: new Date(inv.date),
        invoiceTotal: inv.total,
        invoiceDue: inv.dueAmount,
        paymentType: inv.paymentType,
      };
    }),
  );
}

/** All service / installation requests of a customer, newest first. */
export async function getCustomerServiceRequests(customerId: string): Promise<ProductService[]> {
  const rows = await db.query.services.findMany({
    where: eq(services.customerId, customerId),
    orderBy: [desc(services.createdAt)],
    columns: { serviceId: true, type: true, status: true, createdAt: true, staffName: true, productType: true, productModel: true },
  });
  return rows.map((s) => ({
    serviceId: s.serviceId,
    type: s.type === "install" ? "install" : "repair",
    status: s.status,
    createdAt: new Date(s.createdAt),
    staffName: s.staffName ?? null,
    productType: s.productType,
    productModel: s.productModel,
  }));
}

const normModel = (s: string | null | undefined) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * Services are not stored against a product row — only the product's type and
 * model text are kept on the request. Match each request to the owned unit of
 * the same type whose model text matches (exact, else contains), preferring the
 * unit bought most recently before the request. Requests that match nothing
 * are returned separately so they are never hidden.
 */
export function attachServicesToProducts(
  owned: OwnedProduct[],
  requests: ProductService[],
): { products: OwnedProductWithServices[]; unmatched: ProductService[] } {
  const byId = new Map<string, OwnedProductWithServices>(
    owned.map((p) => [p.id, { ...p, services: [], installCount: 0, repairCount: 0 }]),
  );
  const unmatched: ProductService[] = [];

  for (const req of requests) {
    const want = normModel(req.productModel);
    const sameType = owned.filter((p) => p.type === req.productType);
    let candidates = want ? sameType.filter((p) => normModel(p.model) === want) : [];
    if (!candidates.length && want) {
      candidates = sameType.filter((p) => {
        const m = normModel(p.model);
        return m.length >= 4 && (m.includes(want) || want.includes(m));
      });
    }
    if (!candidates.length) {
      unmatched.push(req);
      continue;
    }
    // The unit most recently bought before the request; else the oldest match.
    const before = candidates.filter((p) => p.invoiceDate <= req.createdAt);
    const pick = (before.length ? before : candidates).sort(
      (a, b) => (before.length ? b.invoiceDate.getTime() - a.invoiceDate.getTime() : a.invoiceDate.getTime() - b.invoiceDate.getTime()),
    )[0];
    const target = byId.get(pick.id)!;
    target.services.push(req);
    if (req.type === "install") target.installCount++;
    else target.repairCount++;
  }

  return { products: owned.map((p) => byId.get(p.id)!), unmatched };
}

/** Sum of a numeric field across a customer's invoices. */
export function sumInvoices<T extends Record<string, any>>(
  list: T[],
  field: keyof T,
): number {
  return list.reduce((t, inv) => t + (Number(inv[field]) || 0), 0);
}

import { db } from "@/db/drizzle";
import { customers, invoices } from "@/db/schema";
import { eq, inArray, or } from "drizzle-orm";

/**
 * Customers a seller may see / act on: linked to the seller directly, or having
 * at least one purchase (invoice) sold through the seller. Attribution lives on
 * invoices.sellerId so one customer account can hold purchases from several
 * sellers (and from SE directly) without them mixing.
 */
export const sellerCustomerFilter = (sellerId: string) =>
  or(
    eq(customers.sellerId, sellerId),
    inArray(customers.customerId, db.selectDistinct({ customerId: invoices.customerId }).from(invoices).where(eq(invoices.sellerId, sellerId))),
  );

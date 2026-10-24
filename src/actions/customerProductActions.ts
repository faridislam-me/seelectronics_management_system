"use server";

import { db } from "@/db/drizzle";
import { customers } from "@/db/schema";
import { verifySession } from "@/lib";
import {
  attachServicesToProducts,
  getCustomerOwnedProducts,
  getCustomerServiceRequests,
  type OwnedProductWithServices,
  type ProductService,
} from "@/lib/customerPurchases";
import { eq } from "drizzle-orm";

export type MyProductsData = {
  products: OwnedProductWithServices[];
  unmatchedServices: ProductService[];
  isWarrantyStopped: boolean;
  warrantyStopReason: string | null;
};

const loadMyProducts = async (): Promise<MyProductsData | null> => {
  const session = await verifySession(false, "customer");
  if (!session || !session.isAuth) return null;
  const customerId = session.userId as string;

  const [owned, requests, customer] = await Promise.all([
    getCustomerOwnedProducts(customerId),
    getCustomerServiceRequests(customerId),
    db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      columns: { isWarrantyStopped: true, warrantyStopReason: true },
    }),
  ]);
  const { products, unmatched } = attachServicesToProducts(owned, requests);
  return {
    products,
    unmatchedServices: unmatched,
    isWarrantyStopped: !!customer?.isWarrantyStopped,
    warrantyStopReason: (customer as any)?.warrantyStopReason ?? null,
  };
};

/** Every product the logged-in customer owns (all invoices), with its service / install history. */
export const getMyProducts = async () => loadMyProducts();

/** One owned product by its product row id, with its service / install history. */
export const getMyProduct = async (productId: string) => {
  const data = await loadMyProducts();
  if (!data) return null;
  const product = data.products.find((p) => p.id === productId);
  if (!product) return null;
  return { product, isWarrantyStopped: data.isWarrantyStopped, warrantyStopReason: data.warrantyStopReason };
};

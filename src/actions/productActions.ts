'use server'

import { db } from "@/db/drizzle"
import { invoices, products } from "@/db/schema"
import { verifySession } from "@/lib"
import { desc, eq } from "drizzle-orm"

export const getProducts = async (invoiceId: string) => {
    try {
        const productsData = await db.query.products.findMany({
            where: eq(products.invoiceId, invoiceId)
        })
        return {
            success: true,
            data: productsData
        }
    } catch (error) {
        console.error(error)
        return { success: false, message: 'Could not fetch products' }
    }
}

/**
 * Every product a customer owns, across ALL of their invoices (not just the
 * primary one), each tagged with its invoice number and date. Lets the admin
 * pick the exact unit — any IPS / battery / stabilizer from any purchase — when
 * adding a service or install for a merged customer with many products.
 */
export const getProductsForCustomer = async (customerId: string) => {
    try {
        const session = await verifySession(false, "admin")
        if (!session) return { success: false, message: "Unauthorized" }
        const invs = await db.query.invoices.findMany({
            where: eq(invoices.customerId, customerId),
            orderBy: [desc(invoices.date)],
            columns: { id: true, invoiceNumber: true, date: true },
            with: { products: true },
        })
        const data = invs.flatMap((inv) =>
            (inv.products ?? []).map((p) => ({
                ...p,
                invoiceNumber: inv.invoiceNumber,
                invoiceDate: inv.date,
            })),
        )
        return { success: true, data }
    } catch (error) {
        console.error(error)
        return { success: false, message: "Could not fetch products" }
    }
}


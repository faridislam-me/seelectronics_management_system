'use server'

import { db } from "@/db/drizzle";
import { customers, services, subscriptions, applications, customerNotifications } from "@/db/schema";
import { createSession, deleteSession, verifySession } from "@/lib";
import { eq, and, count, or, ilike, isNull } from "drizzle-orm";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

/**
 * Fetches VIP customers for admin management
 */
export const getVipCustomers = async ({ query = '', status = '' }: { query?: string, status?: string }) => {
    try {
        const session = await verifySession(false, 'admin');
        if (!session) return { success: false, message: "Unauthorized access" };

        const q = `%${query}%`;
        const filters = and(
            status ? eq(customers.vipStatus, status as any) : undefined,
            query ? or(
                ilike(customers.name, q),
                ilike(customers.phone, q),
                ilike(customers.customerId, q),
                ilike(customers.vipCardNumber, q)
            ) : undefined
        );

        const data = await db.query.customers.findMany({
            where: filters,
            orderBy: (customers, { desc }) => [desc(customers.updatedAt)]
        });

        // Auto-fix existing approved VIP customers missing vipExpiryDate or expired
        for (const customer of data) {
            if (customer.vipStatus === 'approved') {
                if (!customer.vipExpiryDate) {
                    const baseDate = customer.updatedAt || customer.createdAt || new Date();
                    const expiryDate = new Date(baseDate);
                    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

                    const finalExpiry = expiryDate < new Date() ? (() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        return d;
                    })() : expiryDate;

                    await db.update(customers)
                        .set({ vipExpiryDate: finalExpiry })
                        .where(eq(customers.customerId, customer.customerId));
                    customer.vipExpiryDate = finalExpiry;
                } else if (new Date(customer.vipExpiryDate) < new Date()) {
                    await db.update(customers)
                        .set({ vipStatus: 'expired' })
                        .where(eq(customers.customerId, customer.customerId));
                    customer.vipStatus = 'expired';
                }
            }
        }

        return { success: true, data };
    } catch (error) {
        console.error("Error fetching VIP customers:", error);
        return { success: false, message: "Could not fetch VIP customers" };
    }
}

/**
 * Updates a customer's VIP status and generates a card number if approved
 */
export const updateCustomerVipStatus = async (customerId: string, status: string) => {
    try {
        const session = await verifySession(false, 'admin');
        if (!session) return { success: false, message: "Unauthorized" };

        const updates: any = { vipStatus: status };
        if (status === 'approved') {
            const customer = await db.query.customers.findFirst({
                where: eq(customers.customerId, customerId)
            });
            if (customer && !customer.vipCardNumber) {
                const { generateVipCardNumber } = await import("@/utils");
                updates.vipCardNumber = generateVipCardNumber();
            }
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);
            updates.vipExpiryDate = expiryDate;
        } else {
            updates.vipExpiryDate = null;
        }

        await db.update(customers)
            .set(updates)
            .where(eq(customers.customerId, customerId));

        revalidatePath('/vips');
        revalidatePath('/customer/profile');
        revalidatePath('/customer/vip-card');
        
        return { success: true, message: `Status updated successfully to ${status}` };
    } catch (error) {
        console.error("Error updating VIP status:", error);
        return { success: false, message: "Failed to update status" };
    }
}

/**
 * Fetches notifications for the logged-in customer
 */
export async function getCustomerNotifications() {
    try {
        const session = await verifySession(false, 'customer');
        if (!session || !session.isAuth) return { success: false, message: "Unauthorized" };

        const notifications = await db.query.customerNotifications.findMany({
            where: eq(customerNotifications.customerId, session.userId as string),
            orderBy: (customerNotifications, { desc }) => [desc(customerNotifications.createdAt)]
        });

        return { success: true, data: notifications };
    } catch (error) {
        console.error("Error fetching customer notifications:", error);
        return { success: false, message: "Failed to fetch notifications" };
    }
}

/**
 * Marks a specific notification as read for a customer
 */
export async function markCustomerNotificationAsRead(id: string) {
    try {
        const session = await verifySession(false, 'customer');
        if (!session || !session.isAuth) return { success: false, message: "Unauthorized" };

        await db.update(customerNotifications)
            .set({ isRead: true })
            .where(and(
                eq(customerNotifications.id, id),
                eq(customerNotifications.customerId, session.userId as string)
            ));

        revalidatePath('/customer/notifications');
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, message: "Failed to mark as read" };
    }
}

export async function verifyCustomerSession(): Promise<{
    isAuth: boolean;
    userId?: string;
    username?: string;
    role?: string;
    customer?: any;
}> {
    const session = await verifySession(false, 'customer');
    if (!session || !session.isAuth) {
        return { isAuth: false };
    }

    const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, session.userId as string)
    });

    if (!customer) {
        return { isAuth: false };
    }

    if (customer.vipStatus === 'approved') {
        if (!customer.vipExpiryDate) {
            const baseDate = customer.updatedAt || customer.createdAt || new Date();
            const expiryDate = new Date(baseDate);
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            const finalExpiry = expiryDate < new Date() ? (() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                return d;
            })() : expiryDate;

            await db.update(customers)
                .set({ vipExpiryDate: finalExpiry })
                .where(eq(customers.customerId, customer.customerId));
            customer.vipExpiryDate = finalExpiry;
        } else if (new Date(customer.vipExpiryDate) < new Date()) {
            await db.update(customers)
                .set({ vipStatus: 'expired' })
                .where(eq(customers.customerId, customer.customerId));
            customer.vipStatus = 'expired';
        }
    }

    return { 
        isAuth: true, 
        userId: session.userId as string, 
        username: session.username as string, 
        role: session.role as string,
        customer 
    };
}

/**
 * Backfills missing VIP expiry dates for existing approved VIP customers
 */
export const backfillExistingVipExpiryDates = async () => {
    try {
        const session = await verifySession(false, 'admin');
        if (!session) return { success: false, message: "Unauthorized" };

        const vipCustomers = await db.query.customers.findMany({
            where: and(
                eq(customers.vipStatus, 'approved'),
                isNull(customers.vipExpiryDate)
            )
        });

        let updatedCount = 0;
        for (const customer of vipCustomers) {
            const baseDate = customer.updatedAt || customer.createdAt || new Date();
            const expiryDate = new Date(baseDate);
            expiryDate.setFullYear(expiryDate.getFullYear() + 1);

            const finalExpiry = expiryDate < new Date() ? (() => {
                const d = new Date();
                d.setFullYear(d.getFullYear() + 1);
                return d;
            })() : expiryDate;

            await db.update(customers)
                .set({ vipExpiryDate: finalExpiry })
                .where(eq(customers.customerId, customer.customerId));
            updatedCount++;
        }

        revalidatePath('/vips');
        revalidatePath('/customers');
        return { success: true, message: `Successfully updated ${updatedCount} existing VIP customer(s)` };
    } catch (error) {
        console.error("Error backfilling VIP expiry dates:", error);
        return { success: false, message: "Failed to update existing VIP customers" };
    }
}

export async function applyForVipCard() {
    const session = await verifySession(true, 'customer');
    
    if (!session) {
        return { success: false, message: "Unauthorized access" };
    }

    const customerId = session.userId as string;

    const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, customerId)
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    // Allow re-applying if rejected or expired
    if (customer.vipStatus === 'approved' || customer.vipStatus === 'pending' || customer.vipStatus === 'processing') {
        return { success: false, message: "Application already exists or member is already VIP" };
    }

    // Update customer status
    await db.update(customers)
        .set({ vipStatus: 'pending' })
        .where(eq(customers.customerId, customerId));

    // Check for existing application record to update or create new one
    const existingApp = await db.query.applications.findFirst({
        where: and(
            eq(applications.applicantId, customerId),
            eq(applications.type, 'vip_card_application')
        )
    });

    if (existingApp) {
        await db.update(applications)
            .set({ status: 'pending', updatedAt: new Date() })
            .where(eq(applications.id, existingApp.id));
    } else {
        const { createApplication } = await import("./applicationActions");
        await createApplication({
            applicantId: customerId,
            type: 'vip_card_application',
            status: 'pending'
        });
    }

    revalidatePath('/customer/vip-card');
    revalidatePath('/customer/profile');
    
    return { success: true, message: "Application submitted successfully" };
}

export async function getCustomerProfileStats(customerId: string) {
    try {
        const [customerDataResult, serviceCount] = await Promise.all([
            db.select({ phone: customers.phone, invoiceNumber: customers.invoiceNumber })
                .from(customers)
                .where(eq(customers.customerId, customerId))
                .limit(1),
            db.select({ count: count() })
                .from(services)
                .where(eq(services.customerId, customerId))
        ]);

        const customerData = customerDataResult[0];
        if (!customerData) return { success: false, message: "Customer not found" };

        const subscriptionCountPromise = db.select({ count: count() })
            .from(subscriptions)
            .where(and(
                eq(subscriptions.phone, customerData.phone),
                eq(subscriptions.isActive, true)
            ));

        const { invoices, products } = await import("@/db/schema");
        const invoiceDataPromise = customerData.invoiceNumber
            ? db.select({ id: invoices.id, due: invoices.dueAmount, dueType: invoices.dueType })
                .from(invoices)
                .where(eq(invoices.invoiceNumber, customerData.invoiceNumber))
                .limit(1)
            : Promise.resolve([]);

        const [subscriptionCount, invoiceDataResult] = await Promise.all([
            subscriptionCountPromise,
            invoiceDataPromise
        ]);

        let dueAmount = 0;
        let dueType: "due" | "installment" | undefined = undefined;
        let isWarrantyExpired = false;
        let warrantyExpiryDate: Date | null = null;

        const invoiceData = invoiceDataResult[0];
        if (invoiceData) {
            if (invoiceData.due) dueAmount = invoiceData.due;
            if (invoiceData.dueType) dueType = invoiceData.dueType as "due" | "installment";

            const dbProducts = await db.select({
                warrantyStartDate: products.warrantyStartDate,
                warrantyDurationMonths: products.warrantyDurationMonths
            }).from(products)
            .where(eq(products.invoiceId, invoiceData.id));

            if (dbProducts.length > 0) {
                let hasActive = false;
                const now = new Date();
                for (const p of dbProducts) {
                    const expiry = new Date(p.warrantyStartDate);
                    expiry.setMonth(expiry.getMonth() + p.warrantyDurationMonths);
                    
                    if (warrantyExpiryDate === null || expiry > warrantyExpiryDate) {
                        warrantyExpiryDate = expiry;
                    }

                    if (expiry >= now) {
                        hasActive = true;
                    }
                }
                isWarrantyExpired = !hasActive;
            } else {
                isWarrantyExpired = true;
            }
        }

        return {
            success: true,
            data: {
                totalServices: serviceCount[0].count,
                activeSubscriptions: subscriptionCount[0].count,
                dueAmount,
                dueType,
                isWarrantyExpired,
                warrantyExpiryDate
            }
        };
    } catch (error) {
        console.error("Error fetching customer stats:", error);
        return { success: false, message: "Failed to fetch stats" };
    }
}

export async function customerLogout() {
    await deleteSession();
    redirect('/customer/login');
}

export async function customerLogin(prevState: any, formData: FormData) {
    try {
        const customerId = formData.get('customerId') as string;

        if (!customerId) {
            return { success: false, message: "Customer ID is required" };
        }

        const customer = await db.query.customers.findFirst({
            where: or(
                eq(customers.customerId, customerId),
                eq(customers.invoiceNumber, customerId)
            )
        });

        if (!customer) {
            return { success: false, message: "Invalid Customer ID or Invoice Number" };
        }

        await createSession({ 
            username: customer.name, 
            userId: customer.customerId, 
            role: 'customer' 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return { success: false, message: "Authentication failed. Please try again." };
    }
    
    redirect("/customer/profile");
}

export async function getCustomerDashboardStatus() {
    try {
        const session = await verifySession(false, 'customer');
        if (!session || !session.isAuth) return { success: false };

        const customer = await db.query.customers.findFirst({
            where: eq(customers.customerId, session.userId as string)
        });

        if (!customer) return { success: false };

        return { success: true, isWarrantyStopped: customer.isWarrantyStopped, warrantyStopReason: customer.isWarrantyStopped ? (customer.warrantyStopReason === 'misuse' ? 'misuse' : 'due') : null };
    } catch (error) {
        return { success: false };
    }
}

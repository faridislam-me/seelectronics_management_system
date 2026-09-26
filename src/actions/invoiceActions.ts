"use server";

import { MediaDownloadMessages } from "@/constants/messages";
import { db } from "@/db/drizzle";
import { customers, invoices } from "@/db/schema";
import { SMSError, sendSMS, verifySession } from "@/lib";
import { SearchParams } from "@/types";
import { formatDate, generateUrl, renderText } from "@/utils";
import { randomBytes } from "crypto";
import { eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { saveAuthToken } from "./authActions";

export const sendInvoiceDownloadLink = async (
  userData: {
    name: string;
    phoneNumber: string;
  },
  invoiceData: {
    invoiceNumber: string;
    customerId?: string;
    date: Date;
    totalPrice: number;
    invoiceType:
      | "customer-invoice"
      | "staff-payment:repair"
      | "staff-payment:install";
  },
) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const { name, phoneNumber } = userData;
    const { invoiceNumber, customerId, date, totalPrice, invoiceType } =
      invoiceData;
    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(
      Date.now() +
        parseInt(process.env.DOWNLOAD_LINK_EXPIRY_DAY!) * 24 * 60 * 60 * 1000,
    );
    const payload = {
      id: invoiceNumber,
      type: invoiceType === "customer-invoice" ? "invoice" : "payment",
    };

    await saveAuthToken({ token, expiresAt, payload });

    const fullMessage = renderText(
      invoiceType === "staff-payment:repair"
        ? MediaDownloadMessages.REPAIR_PAYMENT_INVOICE
        : invoiceType === "staff-payment:install"
          ? MediaDownloadMessages.INSTALL_PAYMENT_INVOICE
          : MediaDownloadMessages.CUSTOMER_REGISTRATION,
      {
        name,
        customer_id: customerId,
        invoice_number: invoiceNumber,
        date: formatDate(date),
        total_price: `${totalPrice.toLocaleString()} Tk`,
        download_link: generateUrl("invoice-download", { token }),
        dashboard_link: generateUrl("customer-login", {}),
      },
    );

    

    if (customerId) {
      const { notifyCustomer } = await import("./notificationActions");
      await notifyCustomer({
        customerId,
        phoneNumber,
        type: invoiceType,
        message: fullMessage,
        
        link: "/customer/profile",
      });
    } else {
      await sendSMS(phoneNumber, fullMessage);
    }

    return { success: true, message: "Download link sent" };
  } catch (error) {
    console.error(error);
    let message = "Something went wrong";
    if (error instanceof SMSError) {
      message = error.message;
    }
    return { success: false, message };
  }
};

export const getInvoicesMetadata = async ({
  query,
  page = "1",
  limit = "20",
}: SearchParams) => {
  const q = `%${query}%`;
  const filters = query
    ? or(
        ilike(invoices.invoiceNumber, q),
        ilike(invoices.customerId, q),
        ilike(invoices.customerName, q),
        ilike(invoices.customerPhone, q),
        ilike(invoices.customerAddress, q),
      )
    : undefined;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
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

export const getInvoices = async ({
  query,
  page = "1",
  limit = "20",
}: SearchParams) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const q = `%${query}%`;
    const offset = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    const invoicesDate = await db.query.invoices.findMany({
      where: query
        ? or(
            ilike(invoices.invoiceNumber, q),
            ilike(invoices.customerId, q),
            ilike(invoices.customerName, q),
            ilike(invoices.customerPhone, q),
            ilike(invoices.customerAddress, q),
          )
        : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset,
      orderBy: (invoices, { desc }) => [desc(invoices.date)],
    });

    return { success: true, data: invoicesDate };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch invoices" };
  }
};

export const getInvoiceByNumber = async (invoiceNumber: string) => {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false, message: "Unauthorized" };

    // Accept either an invoice number or a customer ID (e.g. SES58PHU8D)
    const q = (invoiceNumber || "").trim();
    const withProducts = { products: { columns: { createdAt: false, updatedAt: false } } } as const;
    let invoice = await db.query.invoices.findFirst({
      where: eq(invoices.invoiceNumber, q),
      with: withProducts,
    });
    if (!invoice && q) {
      invoice = await db.query.invoices.findFirst({
        where: eq(invoices.customerId, q.toUpperCase()),
        with: withProducts,
      });
    }
    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    // Prevent customers from viewing others' invoices
    if (session.role === "customer" && invoice.customerId !== session.userId) {
      return { success: false, message: "Unauthorized access to invoice" };
    }

    return { success: true, data: invoice };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const deleteInvoice = async (invoiceNumber: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    await db
      .delete(customers)
      .where(eq(customers.invoiceNumber, invoiceNumber));
    revalidatePath("/customers");
    revalidatePath("/invoices");
    return { success: true, message: "Invoice deleted successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

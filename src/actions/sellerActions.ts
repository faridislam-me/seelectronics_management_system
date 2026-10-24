"use server";

import { sellerAgreementText } from "@/constants";
import { SellerMessages, ServiceMessages } from "@/constants/messages";
import { db } from "@/db/drizzle";
import {
  applications,
  customers,
  invoices,
  products,
  sellerNotifications,
  sellerPurchases,
  sellers,
  services,
  serviceStatusHistory,
} from "@/db/schema";
import {
  SMSError,
  createSession,
  decrypt,
  deleteSession,
  sendSMS,
  verifySession,
} from "@/lib";
import { deleteObject, getObjectUrl, putObject } from "@/lib/s3";
import type { OwnedProductWithServices } from "@/lib/customerPurchases";
import { sellerCustomerFilter } from "@/lib/sellerScope";
import { compressImage } from "@/lib/sharp";
import { SearchParams } from "@/types";
import {
  generateInvoiceNumber,
  generateRandomId,
  generateUrl,
  renderText,
} from "@/utils";
import {
  LoginCredentialsSchema,
  SellerDataSchema,
  SellerPurchaseDataSchema,
  UpdateSellerDataSchema,
} from "@/validationSchemas";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ZodError, flattenError } from "zod";
import { deleteAuthToken, saveAuthToken, verifyAuthToken } from "./authActions";

const SELLER_TOKEN_TYPE = "seller-registration";

const isFile = (f: unknown): f is File => f instanceof File && f.size > 0;

const uploadImage = async (
  key: string,
  file: File,
  category: "portrait" | "nid" | "product",
) => {
  const buffer = await compressImage(
    Buffer.from(await file.arrayBuffer()),
    category,
  );
  await putObject({ Key: key, Body: buffer, ContentType: "image/webp" });
};

const revalidateSellerPaths = () => {
  revalidatePath("/sellers", "layout");
  revalidatePath("/applications", "layout");
  revalidatePath("/seller/profile");
  revalidatePath("/seller/purchases");
  revalidatePath("/seller/customers");
};

/** Tells the seller (in-app + push + SMS) about a purchase recorded or updated by admin. */
const notifySellerOfPurchase = async (
  sellerId: string,
  kind: "added" | "updated",
  p: { productModel: string; quantity: number; totalAmount: number; paidAmount: number },
) => {
  try {
    const seller = await db.query.sellers.findFirst({ where: eq(sellers.sellerId, sellerId), columns: { phone: true } });
    const due = Math.max(0, p.totalAmount - p.paidAmount);
    const head = kind === "added" ? "নতুন ক্রয় যুক্ত হয়েছে" : "আপনার ক্রয়ের তথ্য আপডেট হয়েছে";
    const message = `SE Electronics: ${head} — ${p.productModel} x${p.quantity}, মোট ৳${p.totalAmount.toLocaleString()}, পরিশোধ ৳${p.paidAmount.toLocaleString()}, বাকি ৳${due.toLocaleString()}। বিস্তারিত পোর্টালে দেখুন।`;
    const { notifySeller } = await import("./notificationActions");
    await notifySeller({ sellerId, phoneNumber: seller?.phone, type: kind === "added" ? "purchase_added" : "purchase_updated", message, link: "/seller/purchases" });
  } catch (e) {
    console.error("seller purchase notification failed:", e);
  }
};

// ============================================
// SELLER: NOTIFICATIONS
// ============================================

export async function getSellerNotifications() {
  try {
    const session = await verifySellerSession();
    if (!session.isAuth) return { success: false, message: "Unauthorized" };
    const data = await db.query.sellerNotifications.findMany({
      where: eq(sellerNotifications.sellerId, session.userId),
      orderBy: (n, { desc }) => [desc(n.createdAt)],
      limit: 200,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching seller notifications:", error);
    return { success: false, message: "Failed to fetch notifications" };
  }
}

export async function getSellerUnreadNotificationCount() {
  try {
    const session = await verifySellerSession();
    if (!session.isAuth) return 0;
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(sellerNotifications)
      .where(and(eq(sellerNotifications.sellerId, session.userId), eq(sellerNotifications.isRead, false)));
    return Number(row?.count || 0);
  } catch {
    return 0;
  }
}

export async function markSellerNotificationAsRead(id: string) {
  try {
    const session = await verifySellerSession();
    if (!session.isAuth) return { success: false, message: "Unauthorized" };
    await db
      .update(sellerNotifications)
      .set({ isRead: true })
      .where(and(eq(sellerNotifications.id, id), eq(sellerNotifications.sellerId, session.userId)));
    revalidatePath("/seller/notifications");
    return { success: true };
  } catch (error) {
    console.error("Error marking seller notification as read:", error);
    return { success: false, message: "Failed to mark as read" };
  }
}

// ============================================
// ADMIN: INVITE / LIST / VIEW
// ============================================

export const sendSellerRegistrationLink = async (phoneNumber: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    if (!phoneNumber) {
      return { success: false, message: "Phone number is required" };
    }

    const token = crypto.randomBytes(16).toString("hex");
    const expiryDays = parseInt(process.env.REGISTRATION_LINK_EXPIRY_DAY!);
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    await saveAuthToken({
      token,
      expiresAt,
      payload: { type: SELLER_TOKEN_TYPE },
    });

    await sendSMS(
      phoneNumber,
      renderText(SellerMessages.REG_INVITE, {
        registration_link: generateUrl("seller-registration", { token }),
        registration_link_expiry: (expiryDays * 24).toString(),
      }),
    );

    return { success: true, message: "Seller registration link sent" };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: error instanceof SMSError ? error.message : "Something went wrong",
    };
  }
};

/** Validates a seller registration token (public). */
export const verifySellerRegistrationToken = async (token: string) => {
  const res = await verifyAuthToken(token);
  if (!res.isValid) return { isValid: false };
  if (res.payload?.type !== SELLER_TOKEN_TYPE) return { isValid: false };
  return { isValid: true };
};

const sellerSearchFilter = (query?: string) => {
  if (!query) return undefined;
  const q = `%${query}%`;
  return or(
    ilike(sellers.sellerId, q),
    ilike(sellers.shopName, q),
    ilike(sellers.ownerName, q),
    ilike(sellers.phone, q),
    ilike(sellers.shopDistrict, q),
    ilike(sellers.tradeLicenseNumber, q),
  );
};

export const getSellers = async ({
  query,
  page = "1",
  limit = "20",
  verifiedOnly = true,
}: SearchParams & { verifiedOnly?: boolean }) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const offset = page && limit ? (Number(page) - 1) * Number(limit) : 0;

    const sellersData = await db.query.sellers.findMany({
      where: and(
        verifiedOnly ? eq(sellers.isVerified, true) : undefined,
        sellerSearchFilter(query),
      ),
      limit: limit ? Number(limit) : undefined,
      offset,
      orderBy: (sellers, { desc }) => [desc(sellers.createdAt)],
    });

    const sellerIds = sellersData.map((s) => s.sellerId);
    const [customerCounts, purchaseSums] = sellerIds.length
      ? await Promise.all([
          db
            .select({
              sellerId: customers.sellerId,
              count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(customers)
            .where(inArray(customers.sellerId, sellerIds))
            .groupBy(customers.sellerId),
          db
            .select({
              sellerId: sellerPurchases.sellerId,
              units: sql<number>`COALESCE(SUM(${sellerPurchases.quantity}), 0)`.mapWith(Number),
              due: sql<number>`COALESCE(SUM(${sellerPurchases.totalAmount} - ${sellerPurchases.paidAmount}), 0)`.mapWith(Number),
            })
            .from(sellerPurchases)
            .where(inArray(sellerPurchases.sellerId, sellerIds))
            .groupBy(sellerPurchases.sellerId),
        ])
      : [[], []];

    const customerMap = new Map(customerCounts.map((c) => [c.sellerId, c.count]));
    const purchaseMap = new Map(purchaseSums.map((p) => [p.sellerId, p]));

    const finalData = await Promise.all(
      sellersData.map(async (seller) => ({
        ...seller,
        ownerPhotoUrl: await getObjectUrl(seller.ownerPhotoKey),
        shopFrontPhotoUrl: await getObjectUrl(seller.shopFrontPhotoKey),
        customersCount: customerMap.get(seller.sellerId) || 0,
        purchasedUnits: purchaseMap.get(seller.sellerId)?.units || 0,
        dueAmount: purchaseMap.get(seller.sellerId)?.due || 0,
      })),
    );

    return { success: true, data: finalData };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch sellers" };
  }
};

export const getSellersMetadata = async ({
  query,
  page = "1",
  limit = "20",
  verifiedOnly = true,
}: SearchParams & { verifiedOnly?: boolean }) => {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(sellers)
    .where(
      and(
        verifiedOnly ? eq(sellers.isVerified, true) : undefined,
        sellerSearchFilter(query),
      ),
    );
  const totalRecords = Number(result[0].count);
  return {
    currentPage: Number(page),
    totalRecords,
    totalPages: limit ? Math.ceil(totalRecords / Number(limit)) : 1,
    currentLimit: Number(limit),
  };
};

/** Lightweight list for dropdowns (admin only). */
export const getSellerOptions = async () => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized", data: [] };
    const data = await db
      .select({ sellerId: sellers.sellerId, shopName: sellers.shopName, ownerName: sellers.ownerName })
      .from(sellers)
      .where(eq(sellers.isVerified, true))
      .orderBy(sellers.shopName);
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch sellers", data: [] };
  }
};

export const getSellerById = async (sellerId: string) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && !(session.role === "seller" && session.userId === sellerId))) {
      return { success: false, message: "Unauthorized" };
    }

    const sellerData = await db.query.sellers.findFirst({
      where: eq(sellers.sellerId, sellerId),
      with: {
        purchases: { orderBy: (p, { desc }) => [desc(p.date)] },
        customers: {
          columns: { customerId: true, name: true, phone: true, address: true, createdAt: true, invoiceNumber: true },
          orderBy: (c, { desc }) => [desc(c.createdAt)],
        },
      },
    });
    if (!sellerData) return { success: false, message: "Seller not found" };

    const [ownerPhotoUrl, shopFrontPhotoUrl] = await Promise.all([
      getObjectUrl(sellerData.ownerPhotoKey),
      getObjectUrl(sellerData.shopFrontPhotoKey),
    ]);

    const { password: _password, ...safe } = sellerData;
    return { success: true, data: { ...safe, ownerPhotoUrl, shopFrontPhotoUrl } };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const getSellerMediaUrls = async (keys: string[]) => {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "seller")) {
      return { success: false, message: "Unauthorized" };
    }
    const data = await Promise.all(keys.filter(Boolean).map((key) => getObjectUrl(key)));
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not fetch media" };
  }
};

// ============================================
// CREATE / UPDATE / DELETE
// ============================================

export const createSeller = async (_prevState: any, formData: FormData) => {
  try {
    const parsed = SellerDataSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      console.error("Seller validation failed:", parsed.error.flatten());
      return { success: false, message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।" };
    }

    const {
      ownerPhoto, tradeLicensePhoto, shopFrontPhoto, shopInsidePhoto, nidFrontPhoto, nidBackPhoto,
      agreed, token, sendConfirmationSMS, ...rest
    } = parsed.data;

    const originSource = token ? "public_form" : "dashboard";
    if (originSource === "dashboard") {
      const session = await verifySession(false, "admin");
      if (!session) return { success: false, message: "Unauthorized" };
    }

    if (!isFile(ownerPhoto)) return { success: false, message: "মালিকের ছবি আবশ্যক" };
    if (!isFile(tradeLicensePhoto)) return { success: false, message: "ট্রেড লাইসেন্সের ছবি আবশ্যক" };
    if (!isFile(shopFrontPhoto)) return { success: false, message: "দোকানের সামনের ছবি আবশ্যক" };
    if (!isFile(nidFrontPhoto)) return { success: false, message: "এনআইডি সামনের ছবি আবশ্যক" };
    if (!isFile(nidBackPhoto)) return { success: false, message: "এনআইডি পিছনের ছবি আবশ্যক" };

    if (token) {
      if (!agreed) return { success: false, message: "Please agree to our terms and conditions" };
      const tokenInfo = await verifySellerRegistrationToken(token);
      if (!tokenInfo.isValid) return { success: false, message: "Invalid or expired token" };
    }

    const sellerId = generateRandomId();
    const base = `media/seller/${sellerId}`;
    const keys = {
      ownerPhotoKey: `${base}/owner_${uuidv4()}.webp`,
      tradeLicensePhotoKey: `${base}/trade-license_${uuidv4()}.webp`,
      shopFrontPhotoKey: `${base}/shop-front_${uuidv4()}.webp`,
      shopInsidePhotoKey: isFile(shopInsidePhoto) ? `${base}/shop-inside_${uuidv4()}.webp` : null,
      nidFrontPhotoKey: `${base}/nid-front_${uuidv4()}.webp`,
      nidBackPhotoKey: `${base}/nid-back_${uuidv4()}.webp`,
    };

    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    if (originSource === "public_form") {
      const headersList = await headers();
      ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
      userAgent = headersList.get("user-agent") || "unknown";
    }

    await db.insert(sellers).values({
      ...rest,
      sellerId,
      ...keys,
      shopPoliceStation: rest.shopPoliceStation || null,
      shopPostOffice: rest.shopPostOffice || null,
      businessYears: rest.businessYears ?? 0,
      isVerified: originSource !== "public_form",
      createdFrom: originSource,
      ipAddress,
      userAgent,
    });

    let applicationId: string | undefined;
    if (originSource === "public_form") {
      const { createApplication } = await import("./applicationActions");
      const res = await createApplication({ applicantId: sellerId, type: "seller_application" });
      if (res.success) applicationId = res.data;
      if (token) await deleteAuthToken(token);
    }

    await Promise.all([
      uploadImage(keys.ownerPhotoKey, ownerPhoto, "portrait"),
      uploadImage(keys.tradeLicensePhotoKey, tradeLicensePhoto, "nid"),
      uploadImage(keys.shopFrontPhotoKey, shopFrontPhoto, "product"),
      keys.shopInsidePhotoKey ? uploadImage(keys.shopInsidePhotoKey, shopInsidePhoto as File, "product") : Promise.resolve(),
      uploadImage(keys.nidFrontPhotoKey, nidFrontPhoto, "nid"),
      uploadImage(keys.nidBackPhotoKey, nidBackPhoto, "nid"),
    ]);

    if (originSource === "public_form" && applicationId) {
      await sendSMS(
        rest.phone,
        renderText(SellerMessages.SUBMISSION, {
          applicant_name: rest.ownerName,
          tracking_link: generateUrl("application-tracking", { trackingId: applicationId }),
        }),
      );
    } else if (sendConfirmationSMS) {
      await sendSMS(
        rest.phone,
        renderText(SellerMessages.APPROVAL, { applicant_name: rest.ownerName, seller_id: sellerId }),
      );
    }

    revalidateSellerPaths();
    return { success: true, message: originSource === "public_form" ? "Application submitted" : "Seller added successfully", data: { name: rest.ownerName, sellerId } };
  } catch (error) {
    console.error("Create seller error:", error);
    return { success: false, message: error instanceof SMSError ? error.message : "Something went wrong" };
  }
};

export const updateSeller = async (sellerId: string, formData: FormData) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const { ownerPhoto, tradeLicensePhoto, shopFrontPhoto, shopInsidePhoto, nidFrontPhoto, nidBackPhoto, ...rest } =
      UpdateSellerDataSchema.parse(Object.fromEntries(formData));

    const base = `media/seller/${sellerId}`;
    const payload: Partial<typeof sellers.$inferInsert> = {
      ...rest,
      shopPoliceStation: rest.shopPoliceStation || null,
      shopPostOffice: rest.shopPostOffice || null,
    };
    const uploads: Promise<void>[] = [];
    const pairs: [keyof typeof payload, unknown, string, "portrait" | "nid" | "product"][] = [
      ["ownerPhotoKey", ownerPhoto, "owner", "portrait"],
      ["tradeLicensePhotoKey", tradeLicensePhoto, "trade-license", "nid"],
      ["shopFrontPhotoKey", shopFrontPhoto, "shop-front", "product"],
      ["shopInsidePhotoKey", shopInsidePhoto, "shop-inside", "product"],
      ["nidFrontPhotoKey", nidFrontPhoto, "nid-front", "nid"],
      ["nidBackPhotoKey", nidBackPhoto, "nid-back", "nid"],
    ];
    for (const [field, file, name, category] of pairs) {
      if (isFile(file)) {
        const key = `${base}/${name}_${uuidv4()}.webp`;
        (payload as any)[field] = key;
        uploads.push(uploadImage(key, file, category));
      }
    }

    await db.update(sellers).set(payload).where(eq(sellers.sellerId, sellerId));
    await Promise.all(uploads);

    revalidateSellerPaths();
    return { success: true, message: "Updated successfully" };
  } catch (error) {
    console.error("Update seller error:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const toggleSellerStatus = async (sellerId: string, status: boolean) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const seller = await db.query.sellers.findFirst({ where: eq(sellers.sellerId, sellerId) });
    if (!seller) return { success: false, message: "Seller not found" };

    await db.update(sellers).set({ isActiveSeller: status }).where(eq(sellers.sellerId, sellerId));
    await sendSMS(
      seller.phone,
      renderText(status ? SellerMessages.ACCOUNT_ACTIVATED : SellerMessages.ACCOUNT_BLOCKED, { seller_name: seller.ownerName }),
    );

    revalidateSellerPaths();
    return { success: true, message: status ? "Seller activated" : "Seller blocked" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const deleteSeller = async (sellerId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };

    const deleted = await db.delete(sellers).where(eq(sellers.sellerId, sellerId)).returning({
      ownerPhotoKey: sellers.ownerPhotoKey,
      tradeLicensePhotoKey: sellers.tradeLicensePhotoKey,
      shopFrontPhotoKey: sellers.shopFrontPhotoKey,
      shopInsidePhotoKey: sellers.shopInsidePhotoKey,
      nidFrontPhotoKey: sellers.nidFrontPhotoKey,
      nidBackPhotoKey: sellers.nidBackPhotoKey,
    });
    if (!deleted[0]) return { success: false, message: "Seller not found" };
    await db.delete(applications).where(eq(applications.applicantId, sellerId));
    await Promise.all(
      Object.values(deleted[0]).filter((k): k is string => Boolean(k)).map((Key) => deleteObject({ Key }).catch((e) => console.error(e))),
    );

    revalidateSellerPaths();
    revalidatePath("/customers");
    return { success: true, message: "Seller deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export async function setSellerCredentials(sellerId: string, username: string, password: string) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    if (!username || !password) return { success: false, message: "Username and password required" };

    const matches = await db.query.sellers.findMany({
      where: or(eq(sellers.sellerId, sellerId), eq(sellers.username, username)),
      columns: { sellerId: true, username: true, ownerName: true, phone: true },
    });
    const seller = matches.find((s) => s.sellerId === sellerId);
    if (!seller) return { success: false, message: "Seller not found" };
    if (matches.some((s) => s.username === username && s.sellerId !== sellerId)) {
      return { success: false, message: "Username already taken" };
    }

    await db
      .update(sellers)
      .set({ username, password: await bcrypt.hash(password, 10), profileCompleted: true })
      .where(eq(sellers.sellerId, sellerId));

    await sendSMS(
      seller.phone,
      renderText(SellerMessages.CREDENTIALS, {
        seller_name: seller.ownerName,
        seller_id: sellerId,
        username,
        password,
        login_url: generateUrl("seller-login", {}),
      }),
    );

    revalidateSellerPaths();
    return { success: true, message: "Login credentials set and SMS sent" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to set credentials" };
  }
}

// ============================================
// PURCHASES (what the seller bought from the company)
// ============================================

export const createSellerPurchase = async (sellerId: string, formData: FormData) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const data = SellerPurchaseDataSchema.parse(Object.fromEntries(formData));
    const totalAmount = data.quantity * data.unitPrice;
    const paidAmount = data.paidAmount ?? 0;
    await db.insert(sellerPurchases).values({
      purchaseId: generateRandomId(),
      invoiceNumber: generateInvoiceNumber(),
      sellerId,
      ...data,
      note: data.note || null,
      paidAmount,
      totalAmount,
    });
    revalidateSellerPaths();
    await notifySellerOfPurchase(sellerId, "added", { productModel: data.productModel, quantity: data.quantity, totalAmount, paidAmount });
    return { success: true, message: "Purchase added" };
  } catch (error) {
    console.error(error);
    return { success: false, message: error instanceof ZodError ? "Please fill all required fields" : "Something went wrong" };
  }
};

export const updateSellerPurchase = async (purchaseId: string, formData: FormData) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const data = SellerPurchaseDataSchema.parse(Object.fromEntries(formData));
    const totalAmount = data.quantity * data.unitPrice;
    const paidAmount = data.paidAmount ?? 0;
    const [updated] = await db
      .update(sellerPurchases)
      .set({ ...data, note: data.note || null, paidAmount, totalAmount })
      .where(eq(sellerPurchases.purchaseId, purchaseId))
      .returning({ sellerId: sellerPurchases.sellerId });
    revalidateSellerPaths();
    if (updated) await notifySellerOfPurchase(updated.sellerId, "updated", { productModel: data.productModel, quantity: data.quantity, totalAmount, paidAmount });
    return { success: true, message: "Purchase updated" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

export const deleteSellerPurchase = async (purchaseId: string) => {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    await db.delete(sellerPurchases).where(eq(sellerPurchases.purchaseId, purchaseId));
    revalidateSellerPaths();
    return { success: true, message: "Purchase deleted" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
};

// ============================================
// SELLER AUTHENTICATION
// ============================================

export async function sellerLogin(_prevState: any, credentials: FormData) {
  try {
    const { username, password } = LoginCredentialsSchema.parse(Object.fromEntries(credentials));
    const [seller] = await db.select().from(sellers).where(eq(sellers.username, username)).limit(1);

    if (!seller || !seller.password) return { success: false, message: "Invalid username or password" };
    if (!seller.isVerified) return { success: false, message: "আপনার আবেদনটি এখনো অনুমোদিত হয়নি।" };
    if (!seller.isActiveSeller) {
      return { success: false, isBlocked: true, name: seller.ownerName, id: seller.sellerId, message: "আপনার অ্যাকাউন্টটি ব্লক করা হয়েছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।" };
    }
    if (!(await bcrypt.compare(password, seller.password))) return { success: false, message: "Invalid username or password" };

    await createSession({ username: seller.username || "", userId: seller.sellerId, role: "seller" });
  } catch (error) {
    if (error instanceof ZodError) {
      console.error(flattenError(error).fieldErrors);
      return { success: false, message: "অনুগ্রহ করে সকল প্রয়োজনীয় তথ্য গুলো পূরণ করুন।" };
    }
    console.error(error);
    return { success: false, message: "Something went wrong" };
  }
  redirect("/seller/profile", RedirectType.replace);
}

export async function sellerLogout() {
  await deleteSession();
  redirect("/seller/login", RedirectType.replace);
}

export async function verifySellerSession() {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  if (!session?.userId || session.role !== "seller") return { isAuth: false as const };

  const [seller] = await db
    .select({ id: sellers.id, sellerId: sellers.sellerId, shopName: sellers.shopName, ownerName: sellers.ownerName, isActiveSeller: sellers.isActiveSeller })
    .from(sellers)
    .where(eq(sellers.sellerId, session.userId as string))
    .limit(1);
  if (!seller) return { isAuth: false as const };
  // Blocked while logged in: tell the caller so it can show the "Account Blocked"
  // notice instead of bouncing to /seller/login (which the middleware would send
  // straight back to the portal, causing a redirect loop / blank screen).
  if (!seller.isActiveSeller) {
    return { isAuth: false as const, isBlocked: true as const, sellerId: seller.sellerId, name: seller.ownerName, shopName: seller.shopName };
  }

  return { isAuth: true as const, userId: session.userId as string, username: session.username as string, role: "seller" as const, seller };
}

// ============================================
// SELLER PORTAL DATA
// ============================================

/**
 * The seller who sold a customer the unit matching the given type/model (by the
 * invoice attribution), or null when the unit was sold by SE directly / unknown.
 */
export async function sellerForCustomerUnit(customerId: string, productType: string, productModel: string) {
  const norm = (v: string | null | undefined) => (v || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const rows = await db
    .select({ sellerId: invoices.sellerId, phone: sellers.phone, type: products.type, model: products.model, date: invoices.date })
    .from(products)
    .innerJoin(invoices, eq(products.invoiceId, invoices.id))
    .innerJoin(sellers, eq(sellers.sellerId, invoices.sellerId))
    .where(eq(invoices.customerId, customerId))
    .orderBy(desc(invoices.date));
  const want = norm(productModel);
  const hit = rows.find((r) => r.type === productType && norm(r.model) === want) ?? rows.find((r) => r.type === productType);
  return hit && hit.sellerId ? { sellerId: hit.sellerId, phone: hit.phone } : null;
}

/** One unit sold through the seller, with the customer it belongs to and its service history. */
export type SellerSoldProduct = OwnedProductWithServices & {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  isWarrantyStopped: boolean;
  warrantyStopReason: string | null;
};

export async function getSellerPortalData(sellerId: string) {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && !(session.role === "seller" && session.userId === sellerId))) {
      return { success: false, message: "Unauthorized" };
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.sellerId, sellerId),
      with: { purchases: { orderBy: (p, { desc }) => [desc(p.date)] } },
    });
    if (!seller) return { success: false, message: "Seller not found" };

    const sellerCustomers = await db.query.customers.findMany({
      where: sellerCustomerFilter(sellerId),
      columns: { customerId: true, name: true, phone: true, address: true, invoiceNumber: true, isWarrantyStopped: true, warrantyStopReason: true, createdAt: true, referredByVipCard: true, sellerId: true },
      with: {
        services: { columns: { serviceId: true, status: true, type: true, productType: true, productModel: true, staffName: true, staffPhone: true, reportedIssue: true, createdAt: true }, orderBy: (s, { desc }) => [desc(s.createdAt)], with: { statusHistory: { columns: { status: true, createdAt: true }, orderBy: (h, { asc }) => [asc(h.createdAt)] } } },
      },
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });

    // Only the purchases sold through THIS seller. A customer account can also
    // hold purchases from SE Electronics directly or from another shop; those
    // are never shown here, so sellers' records never mix.
    const customerIds = sellerCustomers.map((c) => c.customerId);
    const invoicesByCustomer = new Map<string, any[]>();
    const allInvoices = customerIds.length
      ? await db.query.invoices.findMany({
          where: and(inArray(invoices.customerId, customerIds), eq(invoices.sellerId, sellerId)),
          columns: { id: true, invoiceNumber: true, customerId: true, originalCustomerId: true, total: true, subtotal: true, dueAmount: true, dueType: true, notes: true, paymentType: true, date: true },
          orderBy: (inv, { desc }) => [desc(inv.date)],
          with: { products: true },
        })
      : [];
    for (const inv of allInvoices) {
      const arr = invoicesByCustomer.get(inv.customerId) ?? [];
      arr.push(inv);
      invoicesByCustomer.set(inv.customerId, arr);
    }
    // Does the customer also have purchases NOT from this seller?
    const otherInvoiceCustomers = new Set(
      customerIds.length
        ? (
            await db
              .selectDistinct({ customerId: invoices.customerId })
              .from(invoices)
              .where(and(inArray(invoices.customerId, customerIds), or(isNull(invoices.sellerId), sql`${invoices.sellerId} <> ${sellerId}`)))
          ).map((r) => r.customerId)
        : [],
    );

    const now = new Date();
    const { attachServicesToProducts } = await import("@/lib/customerPurchases");
    const soldProducts: SellerSoldProduct[] = [];
    const customersWithInvoices = sellerCustomers
      .map((c) => {
        const invs = invoicesByCustomer.get(c.customerId) ?? [];
        const owned = invs.flatMap((inv) =>
          (inv.products ?? []).map((p: any) => {
            const warrantyEnd = new Date(p.warrantyStartDate);
            warrantyEnd.setMonth(warrantyEnd.getMonth() + p.warrantyDurationMonths);
            return {
              id: p.id as string,
              type: p.type as string,
              model: p.model as string,
              serialNumber: (p.serialNumber ?? null) as string | null,
              quantity: p.quantity as number,
              unitPrice: p.unitPrice as number,
              warrantyStartDate: new Date(p.warrantyStartDate),
              warrantyDurationMonths: p.warrantyDurationMonths as number,
              warrantyEnd,
              warrantyActive: p.warrantyDurationMonths > 0 && warrantyEnd >= now,
              invoiceId: inv.id as string,
              invoiceNumber: inv.invoiceNumber as string,
              originalCustomerId: (inv.originalCustomerId ?? null) as string | null,
              invoiceDate: new Date(inv.date),
              invoiceTotal: inv.total as number,
              invoiceDue: inv.dueAmount as number,
              paymentType: inv.paymentType as string,
            };
          }),
        );
        const requests = c.services.map((s) => ({
          serviceId: s.serviceId,
          type: (s.type === "install" ? "install" : "repair") as "install" | "repair",
          status: s.status,
          createdAt: new Date(s.createdAt),
          staffName: s.staffName ?? null,
          productType: s.productType,
          productModel: s.productModel,
        }));
        const { products: withServices, unmatched } = attachServicesToProducts(owned, requests);
        for (const p of withServices) {
          soldProducts.push({
            ...p,
            customerId: c.customerId,
            customerName: c.name,
            customerPhone: c.phone,
            customerAddress: c.address,
            isWarrantyStopped: !!c.isWarrantyStopped,
            warrantyStopReason: c.warrantyStopReason ?? null,
          });
        }
        // Services on the seller's units, plus (when the seller sold everything
        // the customer owns) requests that matched no unit — never another shop's jobs.
        const keep = new Set(withServices.flatMap((p) => p.services.map((s) => s.serviceId)));
        if (!otherInvoiceCustomers.has(c.customerId)) for (const u of unmatched) keep.add(u.serviceId);
        const services = c.services.filter((s) => keep.has(s.serviceId));
        const primary = invs[0] ?? null;
        return { ...c, invoice: primary, invoices: invs, services };
      })
      // A customer linked to the seller but with no purchase from them yet still
      // shows (so the seller can record the sale); everyone else must have one.
      .filter((c) => c.invoices.length > 0 || c.sellerId === sellerId);
    soldProducts.sort((a, b) => b.invoiceDate.getTime() - a.invoiceDate.getTime());

    const activeStatuses = ["pending", "in_progress", "appointment_retry", "staff_departed", "staff_arrived", "service_center", "service_center_received"];
    const allServices = customersWithInvoices
      .flatMap((c) => c.services.map((s) => ({ ...s, customerName: c.name, customerPhone: c.phone, customerId: c.customerId })))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const inWarranty = customersWithInvoices.filter((c) => !c.isWarrantyStopped && c.invoices.some((inv) => inv.products?.some((p: any) => {
      const end = new Date(p.warrantyStartDate);
      end.setMonth(end.getMonth() + p.warrantyDurationMonths);
      return end > now;
    }))).length;

    const stats = {
      purchasedUnits: seller.purchases.reduce((t, p) => t + p.quantity, 0),
      purchasedAmount: seller.purchases.reduce((t, p) => t + p.totalAmount, 0),
      paidAmount: seller.purchases.reduce((t, p) => t + p.paidAmount, 0),
      customers: customersWithInvoices.length,
      soldUnits: soldProducts.reduce((t, p) => t + p.quantity, 0),
      inService: allServices.filter((s) => activeStatuses.includes(s.status)).length,
      completedServices: allServices.filter((s) => s.status === "completed").length,
      inWarranty,
    };

    const { password: _password, ...safe } = seller;
    const [ownerPhotoUrl, shopFrontPhotoUrl] = await Promise.all([getObjectUrl(seller.ownerPhotoKey), getObjectUrl(seller.shopFrontPhotoKey)]);

    return {
      success: true,
      data: { seller: { ...safe, customers: customersWithInvoices, ownerPhotoUrl, shopFrontPhotoUrl }, products: soldProducts, services: allServices, stats, due: stats.purchasedAmount - stats.paidAmount },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not load seller data" };
  }
}


// ============================================
// SELLER → SERVICE REQUEST (goes straight to admin service list)
// ============================================

/**
 * A seller requests a repair service for one of their own customers.
 * Creates a pending service (no staff assigned) that shows up in the
 * admin Service List; admin then assigns a technician.
 */
export const sellerRequestService = async (input: {
  customerId: string;
  /** Product row id (preferred) — the exact unit the request is for. */
  productId?: string;
  productType: string;
  productModel: string;
  reportedIssue?: string;
  /** "install" = installation request, default repair */
  type?: "install" | "repair";
}) => {
  const kind: "install" | "repair" = input.type === "install" ? "install" : "repair";
  const kindBn = kind === "install" ? "ইন্সটল" : "সার্ভিস";
  try {
    const session = await verifySession(false, "seller");
    if (!session) return { success: false, message: "Unauthorized" };

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.sellerId, session.userId as string),
      columns: { sellerId: true, shopName: true, ownerName: true, phone: true, isActiveSeller: true },
    });
    if (!seller || !seller.isActiveSeller) return { success: false, message: "Seller account is not active" };

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.customerId, input.customerId), sellerCustomerFilter(seller.sellerId)),
      columns: { customerId: true, name: true, phone: true, address: true },
    });
    if (!customer) return { success: false, message: "এই কাস্টমার আপনার তালিকায় নেই" };

    // Resolve the unit: by product id (must be on one of this seller's invoices),
    // else by the type/model text, else the seller's latest sale to the customer.
    const sellerUnits = await db
      .select({ id: products.id, type: products.type, model: products.model, date: invoices.date })
      .from(products)
      .innerJoin(invoices, eq(products.invoiceId, invoices.id))
      .where(and(eq(invoices.customerId, customer.customerId), eq(invoices.sellerId, seller.sellerId)))
      .orderBy(desc(invoices.date));
    const unit = input.productId ? sellerUnits.find((u) => u.id === input.productId) : undefined;
    if (input.productId && !unit) return { success: false, message: "এই পণ্যটি আপনার বিক্রির তালিকায় নেই" };
    const productType = (unit?.type || input.productType || sellerUnits[0]?.type || "ips") as typeof services.$inferInsert.productType;
    const productModel = unit?.model || input.productModel || sellerUnits[0]?.model || "";
    if (!productModel) return { success: false, message: "পণ্যের মডেল পাওয়া যায়নি" };

    // Avoid duplicate open requests for the same customer + product
    const openStatuses = ["pending", "in_progress", "appointment_retry", "staff_departed", "staff_arrived", "service_center", "service_center_received"] as const;
    const existing = await db.query.services.findFirst({
      where: and(
        eq(services.customerId, customer.customerId),
        eq(services.productModel, productModel),
        eq(services.type, kind),
        inArray(services.status, [...openStatuses]),
      ),
      columns: { serviceId: true },
    });
    if (existing) return { success: false, message: `এই পণ্যের একটি ${kindBn} (${existing.serviceId}) ইতিমধ্যে চলমান আছে` };

    const serviceId = generateRandomId();
    const issue = (input.reportedIssue || "").trim();
    const reportedIssue = `${issue ? issue + "\n" : ""}[সেলার রিকোয়েস্ট (${kindBn}): ${seller.shopName} (${seller.sellerId}), মালিক ${seller.ownerName}, ${seller.phone}]`;

    await db.insert(services).values({
      serviceId,
      customerId: customer.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      type: kind,
      productType,
      productModel,
      reportedIssue,
      status: "pending",
      createdFrom: "dashboard",
      isActive: true,
    });
    await db.insert(serviceStatusHistory).values({ serviceId, status: "pending" });

    // Tell the customer, exactly like a service/install added from the admin
    // dashboard: "request accepted" SMS with the tracking link (+ in-app + push).
    try {
      const tracking_link = generateUrl("service-tracking", { trackingId: serviceId });
      const vars = { customer_name: customer.name, service_id: serviceId, tracking_link };
      const { notifyCustomer } = await import("./notificationActions");
      await notifyCustomer({
        customerId: customer.customerId,
        phoneNumber: customer.phone,
        type: "service_confirmation",
        message: renderText(kind === "install" ? ServiceMessages.INSTALL_CONFIRMATION : ServiceMessages.CONFIRMATION, vars),
        shortMessage: renderText(
          kind === "install"
            ? "প্রিয় গ্রাহক {customer_name}, আপনার আই পি এস হোম ইন্সটল এর অনুরোধটি গ্রহণ করা হয়েছে (ID: {service_id})। বিস্তারিত দেখুন: {tracking_link}"
            : "প্রিয় গ্রাহক {customer_name}, আপনার সার্ভিস অনুরোধটি (ID: {service_id}) গ্রহণ করা হয়েছে। বিস্তারিত দেখুন: {tracking_link}",
          vars,
        ),
        link: `/customer/services/${serviceId}`,
      });
    } catch (e) {
      console.error("customer confirmation SMS failed:", e);
    }

    // Tell the admin
    try {
      const { notifyAdmin } = await import("./notificationActions");
      await notifyAdmin({
        type: "seller_service_request",
        message: `সেলার ${seller.shopName} (${seller.sellerId}) কাস্টমার ${customer.name} (${customer.customerId}) এর জন্য ${kindBn} রিকোয়েস্ট করেছে। Service ID: ${serviceId}`,
        link: kind === "install" ? `/installations?query=${serviceId}` : `/services/repairs?query=${serviceId}`,
      });
    } catch (e) {
      console.error("notifyAdmin failed:", e);
    }
    if (process.env.ADMIN_PHONE_NUMBER) {
      sendSMS(
        process.env.ADMIN_PHONE_NUMBER,
        `সেলার ${seller.shopName} কাস্টমার ${customer.name} (${customer.phone}) এর ${productType.toUpperCase()} ${productModel} এর জন্য ${kindBn} রিকোয়েস্ট করেছে। Service ID: ${serviceId}`,
      ).catch((e) => console.error("admin SMS failed:", e));
    }

    revalidatePath("/services/repairs");
    revalidatePath("/installations");
    revalidatePath("/seller/customers");
    revalidatePath("/seller/products", "layout");
    revalidatePath("/seller/services");
    revalidatePath("/seller/installs");
    revalidatePath("/seller/profile");
    return { success: true, message: `${kindBn} রিকোয়েস্ট পাঠানো হয়েছে (ID: ${serviceId})`, data: { serviceId } };
  } catch (error) {
    console.error("sellerRequestService error:", error);
    return { success: false, message: "রিকোয়েস্ট পাঠানো যায়নি" };
  }
};

// ============================================
// SELLER → BLOCK / UNBLOCK OWN CUSTOMER
// ============================================

/**
 * Seller-scoped version of the admin "disable dashboard" toggle
 * (customers.isWarrantyStopped). Only works on the seller's own customers.
 * Re-enabling extends each product's warranty end by the blocked duration,
 * same as the admin action; blocking triggers the same voice call.
 */
export const sellerToggleCustomerBlock = async (customerId: string, reason?: "due" | "misuse") => {
  try {
    const session = await verifySession(false, "seller");
    if (!session) return { success: false, message: "Unauthorized" };

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.customerId, customerId), sellerCustomerFilter(session.userId as string)),
      with: { invoice: { with: { products: true } } },
    });
    if (!customer) return { success: false, message: "এই কাস্টমার আপনার তালিকায় নেই" };

    // Block/unblock must cover every purchase, not just the primary invoice.
    const { getCustomerProducts } = await import("@/lib/customerPurchases");
    const allProducts = await getCustomerProducts(customerId);

    const { toggleCustomerBlockCore, blockReasonOf } = await import("@/lib/customerBlock");
    await toggleCustomerBlockCore({ ...customer, allProducts }, blockReasonOf(reason));

    revalidatePath("/seller/customers");
    revalidatePath("/seller/products", "layout");
    revalidatePath("/customers");
    return { success: true, message: customer.isWarrantyStopped ? "কাস্টমার আনব্লক করা হয়েছে" : "কাস্টমার ব্লক করা হয়েছে", blocked: !customer.isWarrantyStopped };
  } catch (error) {
    console.error("sellerToggleCustomerBlock error:", error);
    return { success: false, message: "Something went wrong" };
  }
};


/**
 * Invoice data for one of a seller's purchases from SE Electronics, shaped like a normal invoice
 * so the standard invoice PDF template can render it. Admin, or the seller who owns the purchase.
 */
export async function getSellerPurchaseInvoice(invoiceNumber: string) {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && session.role !== "seller")) {
      return { success: false as const, message: "Unauthorized" };
    }
    const purchase = await db.query.sellerPurchases.findFirst({
      where: eq(sellerPurchases.invoiceNumber, (invoiceNumber || "").trim()),
      with: { seller: { columns: { sellerId: true, shopName: true, phone: true, shopStreetAddress: true, shopDistrict: true } } },
    });
    if (!purchase || !purchase.seller) return { success: false as const, message: "Invoice not found" };
    if (session.role === "seller" && purchase.sellerId !== session.userId) {
      return { success: false as const, message: "Unauthorized" };
    }
    const due = Math.max(purchase.totalAmount - purchase.paidAmount, 0);
    return {
      success: true as const,
      data: {
        id: purchase.id,
        invoiceNumber: purchase.invoiceNumber,
        customerName: purchase.seller.shopName,
        customerAddress: `${purchase.seller.shopStreetAddress}, ${purchase.seller.shopDistrict}`,
        customerId: purchase.seller.sellerId,
        customerPhone: purchase.seller.phone,
        date: purchase.date,
        createdAt: purchase.createdAt,
        updatedAt: purchase.updatedAt,
        paymentType: "cash" as const,
        subtotal: purchase.totalAmount,
        total: purchase.totalAmount,
        dueAmount: due,
        dueType: "due" as const,
        notes: purchase.note,
        products: [
          {
            id: purchase.id,
            invoiceId: purchase.id,
            type: purchase.productType,
            model: purchase.productModel,
            quantity: purchase.quantity,
            unitPrice: purchase.unitPrice,
            warrantyStartDate: purchase.date,
            warrantyDurationMonths: 0,
          },
        ],
      },
    };
  } catch (error) {
    console.error(error);
    return { success: false as const, message: "Something went wrong" };
  }
}

// ============================================
// SELLER → EDIT OWN CUSTOMER'S CONTACT DETAILS
// ============================================

/**
 * A seller can correct a customer's name / phone / address. Only the contact
 * fields change (on the account and on every invoice snapshot) — invoices,
 * products and prices are never touched from the seller portal.
 */
export const sellerUpdateCustomerContact = async (customerId: string, input: { name: string; phone: string; address: string }) => {
  try {
    const session = await verifySession(false, "seller");
    if (!session) return { success: false, message: "Unauthorized" };
    const name = (input.name || "").trim();
    const phone = (input.phone || "").trim();
    const address = (input.address || "").trim();
    if (name.length < 2) return { success: false, message: "নাম লিখুন" };
    if (!/^01\d{9}$/.test(phone)) return { success: false, message: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" };
    if (address.length < 3) return { success: false, message: "ঠিকানা লিখুন" };

    const customer = await db.query.customers.findFirst({
      where: and(eq(customers.customerId, customerId), sellerCustomerFilter(session.userId as string)),
      columns: { customerId: true },
    });
    if (!customer) return { success: false, message: "এই কাস্টমার আপনার তালিকায় নেই" };

    await db.update(customers).set({ name, phone, address }).where(eq(customers.customerId, customerId));
    await db.update(invoices).set({ customerName: name, customerPhone: phone, customerAddress: address }).where(eq(invoices.customerId, customerId));

    revalidatePath("/seller/customers");
    revalidatePath("/seller/products", "layout");
    revalidatePath("/customers");
    return { success: true, message: "কাস্টমারের তথ্য আপডেট হয়েছে" };
  } catch (error) {
    console.error("sellerUpdateCustomerContact error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

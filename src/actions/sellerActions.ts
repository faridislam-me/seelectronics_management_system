"use server";

import { sellerAgreementText } from "@/constants";
import { SellerMessages } from "@/constants/messages";
import { db } from "@/db/drizzle";
import {
  applications,
  customers,
  sellerPurchases,
  sellers,
  services,
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
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
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
      agreed, token, sendConfirmationSMS, bankInfo, ...rest
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
      bankInfo: bankInfo || null,
      walletNumber: rest.walletNumber || null,
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

    const { ownerPhoto, tradeLicensePhoto, shopFrontPhoto, shopInsidePhoto, nidFrontPhoto, nidBackPhoto, bankInfo, ...rest } =
      UpdateSellerDataSchema.parse(Object.fromEntries(formData));

    const base = `media/seller/${sellerId}`;
    const payload: Partial<typeof sellers.$inferInsert> = {
      ...rest,
      bankInfo: rest.paymentPreference === "bank" ? bankInfo || null : null,
      walletNumber: rest.paymentPreference === "bank" ? null : rest.walletNumber || null,
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
    await db.insert(sellerPurchases).values({
      purchaseId: generateRandomId(),
      invoiceNumber: generateInvoiceNumber(),
      sellerId,
      ...data,
      note: data.note || null,
      paidAmount: data.paidAmount ?? 0,
      totalAmount: data.quantity * data.unitPrice,
    });
    revalidateSellerPaths();
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
    await db
      .update(sellerPurchases)
      .set({ ...data, note: data.note || null, paidAmount: data.paidAmount ?? 0, totalAmount: data.quantity * data.unitPrice })
      .where(eq(sellerPurchases.purchaseId, purchaseId));
    revalidateSellerPaths();
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
  if (!seller || !seller.isActiveSeller) return { isAuth: false as const };

  return { isAuth: true as const, userId: session.userId as string, username: session.username as string, role: "seller" as const, seller };
}

// ============================================
// SELLER PORTAL DATA
// ============================================

export async function getSellerPortalData(sellerId: string) {
  try {
    const session = await verifySession(false);
    if (!session || (session.role !== "admin" && !(session.role === "seller" && session.userId === sellerId))) {
      return { success: false, message: "Unauthorized" };
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.sellerId, sellerId),
      with: {
        purchases: { orderBy: (p, { desc }) => [desc(p.date)] },
        customers: {
          columns: { customerId: true, name: true, phone: true, address: true, invoiceNumber: true, isWarrantyStopped: true, createdAt: true },
          with: {
            invoice: { columns: { total: true, dueAmount: true, date: true }, with: { products: { columns: { type: true, model: true, quantity: true, warrantyStartDate: true, warrantyDurationMonths: true } } } },
            services: { columns: { serviceId: true, status: true, type: true, productType: true, productModel: true, staffName: true, createdAt: true }, orderBy: (s, { desc }) => [desc(s.createdAt)] },
          },
          orderBy: (c, { desc }) => [desc(c.createdAt)],
        },
      },
    });
    if (!seller) return { success: false, message: "Seller not found" };

    const activeStatuses = ["pending", "in_progress", "appointment_retry", "staff_departed", "staff_arrived", "service_center", "service_center_received"];
    const allServices = seller.customers
      .flatMap((c) => c.services.map((s) => ({ ...s, customerName: c.name, customerPhone: c.phone, customerId: c.customerId })))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const now = new Date();
    const inWarranty = seller.customers.filter((c) =>
      !c.isWarrantyStopped &&
      c.invoice?.products?.some((p) => {
        const end = new Date(p.warrantyStartDate);
        end.setMonth(end.getMonth() + p.warrantyDurationMonths);
        return end > now;
      }),
    ).length;

    const stats = {
      purchasedUnits: seller.purchases.reduce((t, p) => t + p.quantity, 0),
      purchasedAmount: seller.purchases.reduce((t, p) => t + p.totalAmount, 0),
      paidAmount: seller.purchases.reduce((t, p) => t + p.paidAmount, 0),
      customers: seller.customers.length,
      inService: allServices.filter((s) => activeStatuses.includes(s.status)).length,
      completedServices: allServices.filter((s) => s.status === "completed").length,
      inWarranty,
    };

    const { password: _password, ...safe } = seller;
    const [ownerPhotoUrl, shopFrontPhotoUrl] = await Promise.all([getObjectUrl(seller.ownerPhotoKey), getObjectUrl(seller.shopFrontPhotoKey)]);

    return {
      success: true,
      data: { seller: { ...safe, ownerPhotoUrl, shopFrontPhotoUrl }, services: allServices, stats, due: stats.purchasedAmount - stats.paidAmount },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not load seller data" };
  }
}

"use server";

import { db } from "@/db/drizzle";
import { customers, driveAddMoneyRequests, driveBalanceKycRequests } from "@/db/schema";
import { verifyCustomerSession } from "@/actions/customerActions";
import { verifySession } from "@/lib";
import { getObjectUrl, putObject } from "@/lib/s3";
import { compressImage } from "@/lib/sharp";
import { generateRandomId } from "@/utils";
import { and, desc, eq, gte, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/** Human label for a KYC document key, derived from its filename. */
const DOC_LABELS: Record<string, string> = {
  "photo.webp": "ছবি",
  "nid-front.webp": "NID সামনে",
  "nid-back.webp": "NID পিছনে",
};
const docLabel = (key: string) => {
  const name = key.split("/").pop() || key;
  return DOC_LABELS[name] || "ডকুমেন্ট";
};

const UNAUTHORIZED = { success: false as const, message: "Unauthorized" };

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

const kycCode = () => "DKYC" + generateRandomId(5).replace(/^SE/, "");
const addMoneyCode = () => "ADM" + generateRandomId(5).replace(/^SE/, "");
const ADD_MONEY_METHODS = ["bkash", "nagad", "rocket"] as const;

/**
 * Customer: own drive wallet state — balance, KYC gate status and the latest
 * KYC request (so the UI can show pending / approved / rejected + reason).
 */
export const getMyDriveInfo = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: { driveBalance: true, driveKycStatus: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    const latest = await db.query.driveBalanceKycRequests.findFirst({
      where: eq(driveBalanceKycRequests.customerId, session.customer.customerId),
      orderBy: [desc(driveBalanceKycRequests.createdAt)],
    });

    return {
      success: true,
      data: {
        driveBalance: Number(customer.driveBalance ?? 0),
        kycStatus: customer.driveKycStatus ?? "pending",
        kyc: latest ?? null,
      },
    };
  } catch (error) {
    console.error("getMyDriveInfo error:", error);
    return { success: false, message: "ড্রাইভ তথ্য আনা যায়নি" };
  }
};

/**
 * Customer: submit (or re-submit after rejection) a drive KYC request, with
 * identity document photos (profile photo + NID front/back). Receives a
 * FormData so the image files stream through; each is compressed to webp and
 * stored in R2, and the keys are saved on the request for admin review.
 */
export const submitDriveKyc = async (formData: FormData) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const fullName = (formData.get("fullName") as string)?.trim();
    const nid = (formData.get("nid") as string)?.trim();
    const address = (formData.get("address") as string)?.trim();
    const note = (formData.get("note") as string)?.trim();
    if (!fullName || !nid || !address) {
      return { success: false, message: "নাম, এনআইডি ও ঠিকানা আবশ্যক" };
    }

    const photo = formData.get("photo") as File | null;
    const nidFront = formData.get("nidFront") as File | null;
    const nidBack = formData.get("nidBack") as File | null;
    if (!photo?.size || !nidFront?.size || !nidBack?.size) {
      return { success: false, message: "ছবি, NID সামনে ও পিছনে আবশ্যক" };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: { customerId: true, name: true, phone: true, driveKycStatus: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    // Block duplicate submissions while one is under review or already approved.
    const open = await db.query.driveBalanceKycRequests.findFirst({
      where: and(
        eq(driveBalanceKycRequests.customerId, customer.customerId),
        eq(driveBalanceKycRequests.status, "pending"),
      ),
      columns: { id: true },
    });
    if (open) return { success: false, message: "আপনার একটি KYC রিভিউ এর অপেক্ষায় আছে" };
    if (customer.driveKycStatus === "approved") {
      return { success: false, message: "আপনার KYC ইতোমধ্যে অনুমোদিত" };
    }

    let code = kycCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.driveBalanceKycRequests.findFirst({
        where: eq(driveBalanceKycRequests.requestCode, code),
        columns: { id: true },
      });
      if (!exists) break;
      code = kycCode();
    }

    // Compress + upload the identity documents to R2, then save their keys.
    const prefix = `drive-kyc/${code}`;
    const photoKey = `${prefix}/photo.webp`;
    const nidFrontKey = `${prefix}/nid-front.webp`;
    const nidBackKey = `${prefix}/nid-back.webp`;
    const [photoBuf, nidFBuf, nidBBuf] = await Promise.all([
      compressImage(Buffer.from(await photo.arrayBuffer()), "portrait"),
      compressImage(Buffer.from(await nidFront.arrayBuffer()), "nid"),
      compressImage(Buffer.from(await nidBack.arrayBuffer()), "nid"),
    ]);
    await Promise.all([
      putObject({ Key: photoKey, Body: photoBuf, ContentType: "image/webp" }),
      putObject({ Key: nidFrontKey, Body: nidFBuf, ContentType: "image/webp" }),
      putObject({ Key: nidBackKey, Body: nidBBuf, ContentType: "image/webp" }),
    ]);

    await db.insert(driveBalanceKycRequests).values({
      requestCode: code,
      customerId: customer.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      fullName,
      nid,
      address,
      note: note || null,
      documents: [photoKey, nidFrontKey, nidBackKey],
      status: "pending",
    });

    // Reflect the pending gate on the customer record.
    await db
      .update(customers)
      .set({ driveKycStatus: "pending" })
      .where(eq(customers.customerId, customer.customerId));

    try {
      const { notifyAdmin } = await import("./notificationActions");
      await notifyAdmin({
        type: "system",
        message: `New drive balance KYC from ${customer.name} (${customer.phone})`,
        link: "/drive-kyc",
      });
    } catch (e) {
      console.error("notifyAdmin (drive kyc) failed:", e);
    }

    revalidatePath("/customer/referral/recharge/drive");
    return { success: true, message: "KYC জমা হয়েছে, রিভিউ এর অপেক্ষায়", requestCode: code };
  } catch (error) {
    console.error("submitDriveKyc error:", error);
    return { success: false, message: "KYC জমা দেওয়া যায়নি" };
  }
};

/** Admin: list drive KYC requests (optional search + status filter). */
export const getDriveKycRequests = async ({
  query = "",
  status,
}: {
  query?: string;
  status?: string;
} = {}) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const q = `%${query}%`;
    const where = and(
      query
        ? or(
            ilike(driveBalanceKycRequests.requestCode, q),
            ilike(driveBalanceKycRequests.customerName, q),
            ilike(driveBalanceKycRequests.customerPhone, q),
            ilike(driveBalanceKycRequests.nid, q),
          )
        : undefined,
      status ? eq(driveBalanceKycRequests.status, status as any) : undefined,
    );

    const rows = await db
      .select()
      .from(driveBalanceKycRequests)
      .where(where)
      .orderBy(desc(driveBalanceKycRequests.createdAt));

    // Sign each request's document keys so admins can preview them inline.
    const data = await Promise.all(
      rows.map(async (r) => {
        const keys = Array.isArray(r.documents) ? r.documents : [];
        const documentFiles = (
          await Promise.all(
            keys.map(async (key) => {
              try {
                return { label: docLabel(key), url: await getObjectUrl(key) };
              } catch {
                return null;
              }
            }),
          )
        ).filter((d): d is { label: string; url: string } => !!d);
        return { ...r, documentFiles };
      }),
    );

    return { success: true, data };
  } catch (error) {
    console.error("getDriveKycRequests error:", error);
    return { success: false, message: "KYC তালিকা আনা যায়নি" };
  }
};

/**
 * Admin: approve (and load an amount into driveBalance) or reject a KYC.
 * On approval the amount is ADDED to the customer's drive wallet atomically.
 */
export const reviewDriveKyc = async (
  code: string,
  action: "approve" | "reject",
  payload?: { amount?: number; adminNotes?: string; rejectReason?: string },
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const req = await db.query.driveBalanceKycRequests.findFirst({
      where: eq(driveBalanceKycRequests.requestCode, code),
    });
    if (!req) return { success: false, message: "অনুরোধ পাওয়া যায়নি" };
    if (req.status !== "pending") {
      return { success: false, message: "ইতোমধ্যে প্রক্রিয়াজাত" };
    }

    if (action === "reject") {
      await db
        .update(driveBalanceKycRequests)
        .set({
          status: "rejected",
          rejectReason: payload?.rejectReason,
          adminNotes: payload?.adminNotes,
          processedAt: new Date(),
        })
        .where(eq(driveBalanceKycRequests.id, req.id));
      await db
        .update(customers)
        .set({ driveKycStatus: "rejected" })
        .where(eq(customers.customerId, req.customerId));

      revalidatePath("/drive-kyc");
      revalidatePath("/customer/referral/recharge/drive");
      return { success: true, message: "KYC প্রত্যাখ্যাত হয়েছে" };
    }

    const amount = Math.max(0, Number(payload?.amount ?? 0));

    await db
      .update(driveBalanceKycRequests)
      .set({
        status: "approved",
        approvedAmount: amount,
        adminNotes: payload?.adminNotes,
        processedAt: new Date(),
      })
      .where(eq(driveBalanceKycRequests.id, req.id));

    await db
      .update(customers)
      .set({
        driveKycStatus: "approved",
        driveBalance: sql`${customers.driveBalance} + ${amount}`,
      })
      .where(eq(customers.customerId, req.customerId));

    try {
      const { notifyCustomer } = await import("./notificationActions");
      const customer = await db.query.customers.findFirst({
        where: eq(customers.customerId, req.customerId),
        columns: { customerId: true, phone: true },
      });
      if (customer) {
        await notifyCustomer({
          customerId: customer.customerId,
          phoneNumber: customer.phone,
          type: "system",
          message: `আপনার ড্রাইভ KYC অনুমোদিত হয়েছে। ড্রাইভ ব্যালেন্স যোগ হয়েছে ৳${amount.toLocaleString()}।`,
          link: "/customer/referral/recharge/drive",
        });
      }
    } catch (e) {
      console.error("notifyCustomer (drive kyc) failed:", e);
    }

    revalidatePath("/drive-kyc");
    revalidatePath("/customer/referral/recharge/drive");
    return { success: true, message: `KYC অনুমোদিত, ড্রাইভ ব্যালেন্স +৳${amount.toLocaleString()}` };
  } catch (error) {
    console.error("reviewDriveKyc error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

/**
 * Admin: manually adjust a customer's drive balance (top-up or correction).
 * A negative amount deducts but never takes the wallet below zero.
 */
export const adjustDriveBalance = async (
  customerId: string,
  amount: number,
  note?: string,
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    if (!customerId || !amount) return { success: false, message: "পরিমাণ আবশ্যক" };

    if (amount < 0) {
      // Guarded deduct: only succeeds if the balance stays >= 0.
      const need = Math.abs(amount);
      const res = await db
        .update(customers)
        .set({ driveBalance: sql`${customers.driveBalance} - ${need}` })
        .where(and(eq(customers.customerId, customerId), gte(customers.driveBalance, need)))
        .returning({ driveBalance: customers.driveBalance });
      if (res.length === 0) return { success: false, message: "ব্যালেন্স অপর্যাপ্ত" };
      revalidatePath("/drive-kyc");
      return { success: true, message: "ব্যালেন্স সমন্বয় হয়েছে", driveBalance: Number(res[0].driveBalance), note };
    }

    const res = await db
      .update(customers)
      .set({ driveBalance: sql`${customers.driveBalance} + ${amount}` })
      .where(eq(customers.customerId, customerId))
      .returning({ driveBalance: customers.driveBalance });
    if (res.length === 0) return { success: false, message: "গ্রাহক পাওয়া যায়নি" };

    revalidatePath("/drive-kyc");
    return { success: true, message: "ড্রাইভ ব্যালেন্স যোগ হয়েছে", driveBalance: Number(res[0].driveBalance), note };
  } catch (error) {
    console.error("adjustDriveBalance error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

/* ──────────────────────────────── Add Money ────────────────────────────────
 * Customers top up their (KYC-approved) drive balance by sending money to one
 * of the company's bKash/Nagad/Rocket numbers and submitting the amount +
 * transaction details. An admin verifies the payment and, on approval, the
 * amount is ADDED to driveBalance — same credit path as reviewDriveKyc.
 */

/** Customer: submit a drive add-money request after sending the money. */
export const submitAddMoneyRequest = async (formData: FormData) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const amount = Number(formData.get("amount"));
    const method = ((formData.get("method") as string) || "").trim();
    const senderNumber = ((formData.get("senderNumber") as string) || "").trim();
    const transactionId = ((formData.get("transactionId") as string) || "").trim();
    const note = ((formData.get("note") as string) || "").trim();

    if (!amount || amount < 10) return { success: false, message: "সঠিক পরিমাণ দিন (ন্যূনতম ৳১০)" };
    if (!ADD_MONEY_METHODS.includes(method as any)) return { success: false, message: "পেমেন্ট মাধ্যম নির্বাচন করুন" };
    if (!senderNumber) return { success: false, message: "যে নম্বর থেকে পাঠিয়েছেন তা দিন" };
    if (!transactionId) return { success: false, message: "ট্রানজেকশন আইডি দিন" };

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, session.customer.customerId),
      columns: { customerId: true, name: true, phone: true, driveKycStatus: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };
    if (customer.driveKycStatus !== "approved") {
      return { success: false, message: "অ্যাড মানি করতে আগে ড্রাইভ KYC অনুমোদিত হতে হবে" };
    }

    // One pending request at a time, so admins review them one by one.
    const open = await db.query.driveAddMoneyRequests.findFirst({
      where: and(
        eq(driveAddMoneyRequests.customerId, customer.customerId),
        eq(driveAddMoneyRequests.status, "pending"),
      ),
      columns: { id: true },
    });
    if (open) return { success: false, message: "আপনার একটি অ্যাড মানি অনুরোধ যাচাই এর অপেক্ষায় আছে" };

    let code = addMoneyCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.driveAddMoneyRequests.findFirst({
        where: eq(driveAddMoneyRequests.requestCode, code),
        columns: { id: true },
      });
      if (!exists) break;
      code = addMoneyCode();
    }

    await db.insert(driveAddMoneyRequests).values({
      requestCode: code,
      customerId: customer.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      amount,
      method: method as (typeof ADD_MONEY_METHODS)[number],
      senderNumber,
      transactionId,
      note: note || null,
      status: "pending",
    });

    try {
      const { notifyAdmin } = await import("./notificationActions");
      await notifyAdmin({
        type: "system",
        message: `New add-money ৳${amount.toLocaleString()} (${method}) from ${customer.name} (${customer.phone})`,
        link: "/drive-add-money",
      });
    } catch (e) {
      console.error("notifyAdmin (add money) failed:", e);
    }

    revalidatePath("/customer/referral/recharge/drive");
    return { success: true, message: "অ্যাড মানি অনুরোধ জমা হয়েছে, যাচাই এর অপেক্ষায়", requestCode: code };
  } catch (error) {
    console.error("submitAddMoneyRequest error:", error);
    return { success: false, message: "জমা দেওয়া যায়নি" };
  }
};

/** Customer: own add-money request history (latest first). */
export const getMyAddMoneyRequests = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const rows = await db
      .select()
      .from(driveAddMoneyRequests)
      .where(eq(driveAddMoneyRequests.customerId, session.customer.customerId))
      .orderBy(desc(driveAddMoneyRequests.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getMyAddMoneyRequests error:", error);
    return { success: false, message: "তথ্য আনা যায়নি" };
  }
};

/** Admin: list add-money requests (optional search + status filter). */
export const getAddMoneyRequests = async ({
  query = "",
  status,
}: {
  query?: string;
  status?: string;
} = {}) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const q = `%${query}%`;
    const where = and(
      query
        ? or(
            ilike(driveAddMoneyRequests.requestCode, q),
            ilike(driveAddMoneyRequests.customerName, q),
            ilike(driveAddMoneyRequests.customerPhone, q),
            ilike(driveAddMoneyRequests.transactionId, q),
            ilike(driveAddMoneyRequests.senderNumber, q),
          )
        : undefined,
      status ? eq(driveAddMoneyRequests.status, status as any) : undefined,
    );

    const rows = await db
      .select()
      .from(driveAddMoneyRequests)
      .where(where)
      .orderBy(desc(driveAddMoneyRequests.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getAddMoneyRequests error:", error);
    return { success: false, message: "তালিকা আনা যায়নি" };
  }
};

/**
 * Admin: approve (credit the amount into driveBalance) or reject an add-money
 * request. On approval the amount is ADDED to the customer's drive wallet.
 */
export const reviewAddMoneyRequest = async (
  code: string,
  action: "approve" | "reject",
  payload?: { adminNotes?: string; rejectReason?: string },
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const req = await db.query.driveAddMoneyRequests.findFirst({
      where: eq(driveAddMoneyRequests.requestCode, code),
    });
    if (!req) return { success: false, message: "অনুরোধ পাওয়া যায়নি" };
    if (req.status !== "pending") return { success: false, message: "ইতোমধ্যে প্রক্রিয়াজাত" };

    if (action === "reject") {
      await db
        .update(driveAddMoneyRequests)
        .set({
          status: "rejected",
          rejectReason: payload?.rejectReason,
          adminNotes: payload?.adminNotes,
          processedAt: new Date(),
        })
        .where(eq(driveAddMoneyRequests.id, req.id));

      revalidatePath("/drive-add-money");
      revalidatePath("/customer/referral/recharge/drive");
      return { success: true, message: "অ্যাড মানি প্রত্যাখ্যাত হয়েছে" };
    }

    const amount = Math.max(0, Number(req.amount));

    await db
      .update(driveAddMoneyRequests)
      .set({ status: "approved", adminNotes: payload?.adminNotes, processedAt: new Date() })
      .where(eq(driveAddMoneyRequests.id, req.id));

    await db
      .update(customers)
      .set({ driveBalance: sql`${customers.driveBalance} + ${amount}` })
      .where(eq(customers.customerId, req.customerId));

    try {
      const { notifyCustomer } = await import("./notificationActions");
      await notifyCustomer({
        customerId: req.customerId,
        phoneNumber: req.customerPhone,
        type: "system",
        message: `আপনার অ্যাড মানি অনুমোদিত হয়েছে। ড্রাইভ ব্যালেন্সে যোগ হয়েছে ৳${amount.toLocaleString()}।`,
        link: "/customer/referral/recharge/drive",
      });
    } catch (e) {
      console.error("notifyCustomer (add money) failed:", e);
    }

    revalidatePath("/drive-add-money");
    revalidatePath("/customer/referral/recharge/drive");
    return { success: true, message: `অনুমোদিত, ড্রাইভ ব্যালেন্স +৳${amount.toLocaleString()}` };
  } catch (error) {
    console.error("reviewAddMoneyRequest error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

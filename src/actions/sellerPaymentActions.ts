"use server";

import { db } from "@/db/drizzle";
import {
  sellerPaymentRequests,
  sellerPurchases,
  sellers,
  serviceCharges,
  services,
} from "@/db/schema";
import { sendSMS, verifySession } from "@/lib";
import { generateRandomId } from "@/utils";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type SellerPayTargetType = "purchase" | "service_charge";

const METHODS = ["cash", "bkash", "nagad", "rocket", "bank"] as const;
const money = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;
const normMethod = (m: string) =>
  (METHODS as readonly string[]).includes(m) ? m : "cash";

function revalidate() {
  for (const p of [
    "/seller-payments",
    "/seller/payments",
    "/seller/purchases",
    "/seller/services",
    "/seller/installs",
    "/seller/profile",
    "/sellers",
  ])
    revalidatePath(p, "layout");
}

/** The remaining due + a human label for one payable target owned by a seller. */
async function loadTarget(
  sellerId: string,
  targetType: SellerPayTargetType,
  targetRef: string,
) {
  if (targetType === "purchase") {
    const p = await db.query.sellerPurchases.findFirst({
      where: and(
        eq(sellerPurchases.purchaseId, targetRef),
        eq(sellerPurchases.sellerId, sellerId),
      ),
    });
    if (!p) return null;
    return {
      remaining: Math.max(0, p.totalAmount - p.paidAmount),
      label: `${p.productType.toUpperCase()} ${p.productModel} (ইনভয়েস ${p.invoiceNumber})`,
      waived: false,
    };
  }
  const c = await db.query.serviceCharges.findFirst({
    where: and(
      eq(serviceCharges.serviceId, targetRef),
      eq(serviceCharges.sellerId, sellerId),
    ),
  });
  if (!c) return null;
  return {
    remaining: Math.max(0, c.amount - c.paidAmount),
    label: `সার্ভিস চার্জ #${c.serviceId}`,
    waived: c.status === "waived",
  };
}

/**
 * Seller submits a payment to clear one of their own dues (a stock purchase or a
 * service charge). The request is stored as "requested" and the admin is told by
 * in-app notification + SMS; it only reduces the due once the admin approves it.
 */
export async function requestSellerPayment(input: {
  targetType: SellerPayTargetType;
  targetRef: string;
  amount: number;
  paymentMethod: string;
  senderNumber?: string;
  transactionId?: string;
  note?: string;
}) {
  try {
    const session = await verifySession(false, "seller");
    if (!session) return { success: false, message: "Unauthorized" };
    const sellerId = session.userId as string;

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return { success: false, message: "সঠিক পরিমাণ দিন" };
    const method = normMethod(input.paymentMethod);

    const target = await loadTarget(sellerId, input.targetType, input.targetRef);
    if (!target) return { success: false, message: "বকেয়াটি খুঁজে পাওয়া যায়নি" };
    if (target.waived) return { success: false, message: "এই চার্জ মওকুফ করা হয়েছে" };
    if (target.remaining <= 0)
      return { success: false, message: "এই বকেয়া ইতিমধ্যে পরিশোধিত" };
    if (amount > target.remaining + 0.01)
      return { success: false, message: `সর্বোচ্চ ${money(target.remaining)} বাকি আছে` };

    // One pending request per due, so the same amount is not approved twice.
    const pending = await db.query.sellerPaymentRequests.findFirst({
      where: and(
        eq(sellerPaymentRequests.targetType, input.targetType),
        eq(sellerPaymentRequests.targetRef, input.targetRef),
        eq(sellerPaymentRequests.status, "requested"),
      ),
    });
    if (pending)
      return {
        success: false,
        message: "এই বকেয়ার জন্য একটি রিকোয়েস্ট ইতিমধ্যে পেন্ডিং আছে",
      };

    const requestId = `SPR-${generateRandomId().slice(0, 8).toUpperCase()}`;
    await db.insert(sellerPaymentRequests).values({
      requestId,
      sellerId,
      targetType: input.targetType,
      targetRef: input.targetRef,
      amount,
      paymentMethod: method as any,
      senderNumber: input.senderNumber?.trim() || null,
      transactionId: input.transactionId?.trim() || null,
      note: input.note?.trim() || null,
      status: "requested",
    });

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.sellerId, sellerId),
      columns: { shopName: true, ownerName: true },
    });
    const who = seller?.shopName || seller?.ownerName || sellerId;
    try {
      const { notifyAdmin } = await import("./notificationActions");
      await notifyAdmin({
        type: "seller_payment",
        message: `${who} একটি পেমেন্ট জমা দিয়েছে ${money(amount)} (${method.toUpperCase()}) — ${target.label}। অনুমোদন প্রয়োজন।`,
        link: "/seller-payments",
      });
    } catch (e) {
      console.error("notifyAdmin failed:", e);
    }
    if (process.env.ADMIN_PHONE_NUMBER) {
      sendSMS(
        process.env.ADMIN_PHONE_NUMBER,
        `SE Electronics: ${who} পেমেন্ট জমা দিয়েছে ${money(amount)} ${method.toUpperCase()} (${target.label})। Txn: ${input.transactionId?.trim() || "-"}। অ্যাডমিন প্যানেলে অনুমোদন করুন।`,
      ).catch((e) => console.error("admin SMS failed:", e));
    }

    revalidate();
    return {
      success: true,
      message: "পেমেন্ট জমা হয়েছে। এডমিন যাচাই করে অনুমোদন দিলে বকেয়া থেকে বাদ যাবে।",
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "পেমেন্ট জমা দেওয়া যায়নি" };
  }
}

type RequestRow = typeof sellerPaymentRequests.$inferSelect;

/** Attach a human label + the target's current remaining due to each request. */
async function attachTargetInfo(rows: RequestRow[]) {
  const purchaseIds = rows.filter((r) => r.targetType === "purchase").map((r) => r.targetRef);
  const serviceIds = rows.filter((r) => r.targetType === "service_charge").map((r) => r.targetRef);

  const purchases = purchaseIds.length
    ? await db.query.sellerPurchases.findMany({ where: (p, { inArray }) => inArray(p.purchaseId, purchaseIds) })
    : [];
  const charges = serviceIds.length
    ? await db.query.serviceCharges.findMany({
        where: (c, { inArray }) => inArray(c.serviceId, serviceIds),
        with: { service: { columns: { customerName: true, productType: true, productModel: true } } },
      })
    : [];
  const pById = new Map(purchases.map((p) => [p.purchaseId, p]));
  const cById = new Map(charges.map((c) => [c.serviceId, c]));

  return rows.map((r) => {
    if (r.targetType === "purchase") {
      const p = pById.get(r.targetRef);
      return {
        ...r,
        targetLabel: p ? `${p.productType.toUpperCase()} ${p.productModel}` : r.targetRef,
        targetRef2: p?.invoiceNumber ?? null,
        targetRemaining: p ? Math.max(0, p.totalAmount - p.paidAmount) : null,
      };
    }
    const c = cById.get(r.targetRef);
    return {
      ...r,
      targetLabel: c?.service ? `${c.service.productType.toUpperCase()} ${c.service.productModel}` : `সার্ভিস #${r.targetRef}`,
      targetRef2: `#${r.targetRef}`,
      targetRemaining: c ? Math.max(0, c.amount - c.paidAmount) : null,
    };
  });
}

export type SellerPaymentRequestView = Awaited<ReturnType<typeof attachTargetInfo>>[number];

/** The logged-in seller's own payment requests (newest first). */
export async function getMySellerPaymentRequests() {
  try {
    const session = await verifySession(false, "seller");
    if (!session) return { success: false as const, message: "Unauthorized" };
    const rows = await db.query.sellerPaymentRequests.findMany({
      where: eq(sellerPaymentRequests.sellerId, session.userId as string),
      orderBy: [desc(sellerPaymentRequests.createdAt)],
    });
    return { success: true as const, data: await attachTargetInfo(rows) };
  } catch (error) {
    console.error(error);
    return { success: false as const, message: "লোড করা যায়নি" };
  }
}

/** All seller payment requests for the admin, with seller info (newest first). */
export async function getSellerPaymentRequests() {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false as const, message: "Unauthorized" };
    const rows = await db.query.sellerPaymentRequests.findMany({
      with: { seller: { columns: { sellerId: true, shopName: true, ownerName: true, phone: true } } },
      orderBy: [desc(sellerPaymentRequests.createdAt)],
    });
    const withInfo = await attachTargetInfo(rows as RequestRow[]);
    // Re-attach the seller relation (attachTargetInfo spreads the plain row).
    const sellerById = new Map(rows.map((r: any) => [r.id, r.seller]));
    return {
      success: true as const,
      data: withInfo.map((r) => ({ ...r, seller: sellerById.get(r.id) ?? null })),
    };
  } catch (error) {
    console.error(error);
    return { success: false as const, message: "লোড করা যায়নি" };
  }
}

/** Applies an approved/manual payment to the matching due. */
async function applyToDue(
  targetType: SellerPayTargetType,
  targetRef: string,
  amount: number,
  method: string,
): Promise<{ ok: boolean; message: string }> {
  if (targetType === "service_charge") {
    // Reuse the admin collect logic (updates paidAmount/status, notifies customer + seller).
    const { collectServiceCharge } = await import("./serviceChargeActions");
    const res = await collectServiceCharge(targetRef, { amount, method });
    return { ok: !!res.success, message: res.message };
  }
  const p = await db.query.sellerPurchases.findFirst({
    where: eq(sellerPurchases.purchaseId, targetRef),
  });
  if (!p) return { ok: false, message: "ক্রয় খুঁজে পাওয়া যায়নি" };
  const remaining = Math.max(0, p.totalAmount - p.paidAmount);
  if (amount > remaining + 0.01)
    return { ok: false, message: `সর্বোচ্চ ${money(remaining)} বাকি আছে` };
  const paidAmount = Math.min(p.totalAmount, p.paidAmount + amount);
  await db
    .update(sellerPurchases)
    .set({ paidAmount })
    .where(eq(sellerPurchases.purchaseId, targetRef));
  const left = Math.max(0, p.totalAmount - paidAmount);
  return {
    ok: true,
    message: left <= 0.01 ? "পূর্ণ পরিশোধিত" : `${money(amount)} গ্রহণ, বাকি ${money(left)}`,
  };
}

/** Tells the seller their request was approved or rejected. */
async function notifySellerDecision(req: RequestRow, approved: boolean, adminNote?: string) {
  try {
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.sellerId, req.sellerId),
      columns: { phone: true },
    });
    const { notifySeller } = await import("./notificationActions");
    const msg = approved
      ? `SE Electronics: আপনার জমা দেওয়া পেমেন্ট ${money(req.amount)} অনুমোদিত হয়েছে এবং বকেয়া থেকে বাদ দেওয়া হয়েছে। ধন্যবাদ।`
      : `SE Electronics: আপনার জমা দেওয়া পেমেন্ট ${money(req.amount)} বাতিল করা হয়েছে।${adminNote ? ` কারণ: ${adminNote}` : ""} অনুগ্রহ করে যোগাযোগ করুন।`;
    await notifySeller({
      sellerId: req.sellerId,
      phoneNumber: seller?.phone,
      type: approved ? "payment_approved" : "payment_rejected",
      message: msg,
      link: "/seller/payments",
    });
  } catch (e) {
    console.error("notifySellerDecision failed:", e);
  }
}

/** Admin approves (applies the amount to the due) or rejects a seller payment request. */
export async function decideSellerPaymentRequest(
  id: string,
  input: { action: "approve" | "reject"; adminNote?: string },
) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const req = await db.query.sellerPaymentRequests.findFirst({
      where: eq(sellerPaymentRequests.id, id),
    });
    if (!req) return { success: false, message: "রিকোয়েস্ট পাওয়া যায়নি" };
    if (req.status !== "requested")
      return { success: false, message: "এটি ইতিমধ্যে প্রসেস হয়েছে" };

    if (input.action === "reject") {
      await db
        .update(sellerPaymentRequests)
        .set({
          status: "rejected",
          adminNote: input.adminNote?.trim() || null,
          processedBy: String(session.userId),
          processedAt: new Date(),
        })
        .where(eq(sellerPaymentRequests.id, id));
      await notifySellerDecision(req, false, input.adminNote);
      revalidate();
      return { success: true, message: "রিকোয়েস্ট বাতিল করা হয়েছে" };
    }

    const applied = await applyToDue(req.targetType, req.targetRef, req.amount, req.paymentMethod);
    if (!applied.ok) return { success: false, message: applied.message };
    await db
      .update(sellerPaymentRequests)
      .set({
        status: "approved",
        processedBy: String(session.userId),
        processedAt: new Date(),
        adminNote: input.adminNote?.trim() || null,
      })
      .where(eq(sellerPaymentRequests.id, id));
    await notifySellerDecision(req, true);
    revalidate();
    return { success: true, message: `অনুমোদিত — ${applied.message}` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "প্রসেস করা যায়নি" };
  }
}

/** Sellers who currently owe something (purchase or service), for the admin picker. */
export async function getSellersWithDues() {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false as const, message: "Unauthorized" };

    const [allSellers, purchases, charges] = await Promise.all([
      db.query.sellers.findMany({ columns: { sellerId: true, shopName: true, ownerName: true } }),
      db.query.sellerPurchases.findMany({ columns: { sellerId: true, totalAmount: true, paidAmount: true } }),
      db.query.serviceCharges.findMany({ columns: { sellerId: true, amount: true, paidAmount: true, status: true } }),
    ]);

    const dueBySeller = new Map<string, number>();
    for (const p of purchases) {
      const d = Math.max(0, p.totalAmount - p.paidAmount);
      if (d > 0.01) dueBySeller.set(p.sellerId, (dueBySeller.get(p.sellerId) ?? 0) + d);
    }
    for (const c of charges) {
      if (!c.sellerId || c.status !== "due") continue;
      const d = Math.max(0, c.amount - c.paidAmount);
      if (d > 0.01) dueBySeller.set(c.sellerId, (dueBySeller.get(c.sellerId) ?? 0) + d);
    }

    const nameById = new Map(allSellers.map((s) => [s.sellerId, s.shopName || s.ownerName || s.sellerId]));
    const data = [...dueBySeller.entries()]
      .map(([sellerId, totalDue]) => ({ sellerId, name: nameById.get(sellerId) ?? sellerId, totalDue }))
      .sort((a, b) => b.totalDue - a.totalDue);
    return { success: true as const, data };
  } catch (error) {
    console.error(error);
    return { success: false as const, message: "লোড করা যায়নি" };
  }
}

/** A seller's still-outstanding dues, for the admin manual-payment picker. */
export async function getSellerOutstandingDues(sellerId: string) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false as const, message: "Unauthorized" };

    const purchases = await db.query.sellerPurchases.findMany({
      where: eq(sellerPurchases.sellerId, sellerId),
    });
    const charges = await db.query.serviceCharges.findMany({
      where: eq(serviceCharges.sellerId, sellerId),
      with: { service: { columns: { productType: true, productModel: true, customerName: true } } },
    });

    const purchaseDues = purchases
      .map((p) => ({
        targetRef: p.purchaseId,
        label: `${p.productType.toUpperCase()} ${p.productModel} (ইনভয়েস ${p.invoiceNumber})`,
        remaining: Math.max(0, p.totalAmount - p.paidAmount),
      }))
      .filter((d) => d.remaining > 0.01);
    const serviceDues = charges
      .filter((c) => c.status === "due")
      .map((c) => ({
        targetRef: c.serviceId,
        label: `সার্ভিস #${c.serviceId}${c.service ? ` · ${c.service.productType.toUpperCase()} ${c.service.productModel}` : ""}`,
        remaining: Math.max(0, c.amount - c.paidAmount),
      }))
      .filter((d) => d.remaining > 0.01);

    return { success: true as const, data: { purchaseDues, serviceDues } };
  } catch (error) {
    console.error(error);
    return { success: false as const, message: "লোড করা যায়নি" };
  }
}

/**
 * Admin records a payment against a seller's due directly (e.g. cash taken in
 * person), without a seller request. Applies the amount and logs an already
 * approved request row so it shows in the receive history.
 */
export async function recordSellerDuePayment(input: {
  sellerId: string;
  targetType: SellerPayTargetType;
  targetRef: string;
  amount: number;
  paymentMethod: string;
  note?: string;
}) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0)
      return { success: false, message: "সঠিক পরিমাণ দিন" };
    const method = normMethod(input.paymentMethod);

    const target = await loadTarget(input.sellerId, input.targetType, input.targetRef);
    if (!target) return { success: false, message: "বকেয়াটি খুঁজে পাওয়া যায়নি" };
    if (target.waived) return { success: false, message: "এই চার্জ মওকুফ করা হয়েছে" };
    if (amount > target.remaining + 0.01)
      return { success: false, message: `সর্বোচ্চ ${money(target.remaining)} বাকি আছে` };

    const applied = await applyToDue(input.targetType, input.targetRef, amount, method);
    if (!applied.ok) return { success: false, message: applied.message };

    const requestId = `SPR-${generateRandomId().slice(0, 8).toUpperCase()}`;
    await db.insert(sellerPaymentRequests).values({
      requestId,
      sellerId: input.sellerId,
      targetType: input.targetType,
      targetRef: input.targetRef,
      amount,
      paymentMethod: method as any,
      note: input.note?.trim() || null,
      status: "approved",
      adminNote: "ম্যানুয়ালি এডমিন কর্তৃক গৃহীত",
      processedBy: String(session.userId),
      processedAt: new Date(),
    });

    revalidate();
    return { success: true, message: `গৃহীত — ${applied.message}` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "পেমেন্ট রেকর্ড করা যায়নি" };
  }
}

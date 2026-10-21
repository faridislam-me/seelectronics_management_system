"use server";

import { SELLER_CERTIFICATE_TYPES, SellerCertificatePayload, isSellerCertificateType } from "@/constants/sellerCertificates";
import { db } from "@/db/drizzle";
import { authTokens, sellers } from "@/db/schema";
import { verifySession } from "@/lib/session";
import { generateUrl } from "@/utils";
import crypto from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { saveAuthToken } from "./authActions";
import { verifySellerSession } from "./sellerActions";

export type SellerCertificateItem = SellerCertificatePayload & { token: string };

const listFor = async (sellerId: string): Promise<SellerCertificateItem[]> => {
  const rows = await db
    .select({ token: authTokens.token, payload: authTokens.payload })
    .from(authTokens)
    .where(and(sql`${authTokens.payload}->>'type' = 'seller-certificate'`, sql`${authTokens.payload}->>'sellerId' = ${sellerId}`))
    .orderBy(desc(authTokens.createdAt));
  return rows.map((r) => ({ ...(r.payload as SellerCertificatePayload), token: r.token }));
};

/** Admin: award a certificate to a seller; the seller gets an in-app notification, push and SMS. */
export async function issueSellerCertificate(input: { sellerId: string; certType: string; period?: string; note?: string }) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    if (!isSellerCertificateType(input.certType)) return { success: false, message: "Select a certificate type" };

    const seller = await db.query.sellers.findFirst({ where: eq(sellers.sellerId, input.sellerId) });
    if (!seller) return { success: false, message: "Seller not found" };

    const issuedAt = new Date();
    const ymd = issuedAt.toISOString().slice(0, 10).replace(/-/g, "");
    const payload: SellerCertificatePayload = {
      type: "seller-certificate",
      certType: input.certType,
      certNo: `SEC-${ymd}-${crypto.randomInt(1000, 9999)}`,
      sellerId: seller.sellerId,
      shopName: seller.shopName,
      ownerName: seller.ownerName,
      phone: seller.phone,
      address: seller.shopStreetAddress,
      district: seller.shopDistrict,
      period: input.period?.trim() || undefined,
      note: input.note?.trim() || undefined,
      issuedAt: issuedAt.toISOString(),
    };
    const token = crypto.randomBytes(16).toString("hex");
    // Certificates stay in the seller account, so the token gets a long life.
    await saveAuthToken({ token, expiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000), payload });

    const kind = SELLER_CERTIFICATE_TYPES[input.certType];
    const message = `প্রিয় ${seller.ownerName}, এস ই ইলেকট্রনিকস আপনার প্রতিষ্ঠান "${seller.shopName}"-কে "${kind.title}" প্রদান করেছে। অভিনন্দন! সার্টিফিকেট দেখতে ও PDF ডাউনলোড করতে:\n${generateUrl("seller-certificate", {})}`;
    const { notifySeller } = await import("./notificationActions");
    await notifySeller({ sellerId: seller.sellerId, phoneNumber: seller.phone, type: "certificate", message, link: "/seller/certificates" });

    revalidatePath("/seller/certificates");
    return { success: true, message: "Certificate issued and seller notified" };
  } catch (error) {
    console.error("issueSellerCertificate:", error);
    return { success: false, message: "Something went wrong" };
  }
}

/** Admin: certificates already given to a seller. */
export async function getSellerCertificatesAdmin(sellerId: string) {
  const session = await verifySession(false, "admin");
  if (!session) return { success: false as const, data: [] as SellerCertificateItem[] };
  return { success: true as const, data: await listFor(sellerId) };
}

/** Admin: take back a certificate issued by mistake. */
export async function revokeSellerCertificate(token: string) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    await db.delete(authTokens).where(and(eq(authTokens.token, token), sql`${authTokens.payload}->>'type' = 'seller-certificate'`));
    revalidatePath("/seller/certificates");
    return { success: true, message: "Certificate removed" };
  } catch (error) {
    console.error("revokeSellerCertificate:", error);
    return { success: false, message: "Something went wrong" };
  }
}

/** Logged-in seller: own certificates, newest first. */
export async function getMySellerCertificates() {
  const session = await verifySellerSession();
  if (!session.isAuth) return [];
  return listFor(session.userId as string);
}

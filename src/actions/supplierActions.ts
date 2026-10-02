"use server";

import { db } from "@/db/drizzle";
import { suppliers, supplierTransactions } from "@/db/schema";
import { createSession, decrypt, deleteSession, sendSMS, verifySession } from "@/lib";
import { sendVoiceCall } from "@/lib/mram";
import { getObjectUrl, putObject } from "@/lib/s3";
import { generateRandomId, supplierBaseUrl } from "@/utils";
import bcrypt from "bcrypt";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { RedirectType, redirect } from "next/navigation";
import { z, ZodError } from "zod";

// ============================================
// Helpers
// ============================================

const requireAdmin = async () => verifySession(false, "admin");

const revalidateSupplierPaths = (supplierId?: string) => {
  revalidatePath("/suppliers");
  if (supplierId) revalidatePath(`/suppliers/${supplierId}`);
  revalidatePath("/supplier/profile");
};

/** Totals for one supplier computed in SQL from the ledger. */
const totalsFor = async (supplierId: string) => {
  const [row] = await db
    .select({
      purchased: sql<number>`coalesce(sum(case when ${supplierTransactions.type} = 'purchase' then ${supplierTransactions.amount} else 0 end), 0)`.mapWith(Number),
      paid: sql<number>`coalesce(sum(case when ${supplierTransactions.type} = 'payment' then ${supplierTransactions.amount} else 0 end), 0)`.mapWith(Number),
      entries: sql<number>`count(*)`.mapWith(Number),
    })
    .from(supplierTransactions)
    .where(eq(supplierTransactions.supplierId, supplierId));
  const purchased = row?.purchased ?? 0;
  const paid = row?.paid ?? 0;
  return { purchased, paid, due: purchased - paid, entries: row?.entries ?? 0 };
};

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;

const normalizePhone = (p: string) => p.replace(/\s|-/g, "").trim();

const SupplierSchema = z.object({
  name: z.string().trim().min(2, "নাম দিন"),
  shopName: z.string().trim().min(1, "দোকানের নাম দিন"),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => /^(\+?880|0)1\d{9}$/.test(v), "সঠিক মোবাইল নম্বর দিন"),
  address: z.string().trim().optional().transform((v) => v || null),
  origin: z.string().trim().optional().transform((v) => v || null),
  note: z.string().trim().optional().transform((v) => v || null),
});

const TransactionSchema = z.object({
  supplierId: z.string().trim().min(1),
  type: z.enum(["purchase", "payment"]),
  amount: z.coerce.number().positive("টাকার পরিমাণ দিন").max(1_000_000_000),
  description: z.string().trim().max(1000).optional().transform((v) => v || null),
  date: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : new Date()))
    .refine((d) => !isNaN(d.getTime()), "সঠিক তারিখ দিন"),
  productType: z.enum(["ips", "battery", "stabilizer", "others"]).optional().or(z.literal("")).transform((v) => v || null),
  photoKey: z.string().startsWith("supplier-photos/").max(300).optional().or(z.literal("")).transform((v) => v || null),
});

/** Signed URL for a stored photo; never throws (a missing photo must not break the ledger). */
const photoUrlFor = async (key: string | null | undefined) => {
  if (!key) return null;
  try {
    return await getObjectUrl(key);
  } catch {
    return null;
  }
};

/** Admin: uploads one (already compressed) goods photo and returns its storage key. */
export const uploadSupplierPhoto = async (formData: FormData) => {
  try {
    if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) return { success: false as const, message: "ছবি নির্বাচন করুন" };
    if (!file.type.startsWith("image/")) return { success: false as const, message: "শুধু ছবি আপলোড করা যাবে" };
    if (file.size > 6 * 1024 * 1024) return { success: false as const, message: "ছবি ৬ MB এর বেশি হতে পারবে না" };
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const key = `supplier-photos/${Date.now()}-${generateRandomId(6)}.${ext}`;
    await putObject({ Key: key, Body: Buffer.from(await file.arrayBuffer()), ContentType: file.type });
    return { success: true as const, key };
  } catch (error) {
    console.error("uploadSupplierPhoto failed:", error);
    return { success: false as const, message: "ছবি আপলোড করা যায়নি" };
  }
};

const firstIssue = (e: ZodError) => e.issues[0]?.message || "তথ্য সঠিক নয়";

// ============================================
// ADMIN: suppliers
// ============================================

export const getSuppliers = async (query?: string) => {
  try {
    if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
    const q = (query || "").trim();
    const where = q
      ? or(
          ilike(suppliers.name, `%${q}%`),
          ilike(suppliers.shopName, `%${q}%`),
          ilike(suppliers.phone, `%${q}%`),
          ilike(suppliers.supplierId, `%${q}%`),
          ilike(suppliers.origin, `%${q}%`),
        )
      : undefined;

    const rows = await db
      .select({
        supplierId: suppliers.supplierId,
        name: suppliers.name,
        shopName: suppliers.shopName,
        phone: suppliers.phone,
        origin: suppliers.origin,
        isActive: suppliers.isActive,
        createdAt: suppliers.createdAt,
        purchased: sql<number>`coalesce(sum(case when ${supplierTransactions.type} = 'purchase' then ${supplierTransactions.amount} else 0 end), 0)`.mapWith(Number),
        paid: sql<number>`coalesce(sum(case when ${supplierTransactions.type} = 'payment' then ${supplierTransactions.amount} else 0 end), 0)`.mapWith(Number),
      })
      .from(suppliers)
      .leftJoin(supplierTransactions, eq(supplierTransactions.supplierId, suppliers.supplierId))
      .where(where)
      .groupBy(suppliers.id)
      .orderBy(desc(suppliers.createdAt));

    return { success: true as const, data: rows.map((r) => ({ ...r, due: r.purchased - r.paid })) };
  } catch (error) {
    console.error("getSuppliers failed:", error);
    return { success: false as const, message: "Could not load suppliers" };
  }
};

/** Creates a supplier. Username defaults to the phone number. Returns the credentials once. */
export const createSupplier = async (input: Record<string, unknown>) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    const data = SupplierSchema.parse(input);
    const password = String(input.password || "").trim();
    if (password.length < 6) return { success: false, message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন" };
    const username = String(input.username || "").trim() || data.phone;

    const clash = await db
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(or(eq(suppliers.phone, data.phone), eq(suppliers.username, username)))
      .limit(1);
    if (clash.length) return { success: false, message: "এই মোবাইল নম্বর/ইউজারনেম দিয়ে আগেই সাপ্লায়ার আছে" };

    const supplierId = "SESUP" + generateRandomId(6).slice(2);
    await db.insert(suppliers).values({
      supplierId,
      ...data,
      username,
      password: await bcrypt.hash(password, 10),
    });
    revalidateSupplierPaths();
    return { success: true, message: "Supplier created", data: { supplierId, username, password } };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, message: firstIssue(error) };
    console.error("createSupplier failed:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const updateSupplier = async (supplierId: string, input: Record<string, unknown>) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    const data = SupplierSchema.parse(input);
    const clash = await db
      .select({ supplierId: suppliers.supplierId })
      .from(suppliers)
      .where(eq(suppliers.phone, data.phone))
      .limit(1);
    if (clash.length && clash[0].supplierId !== supplierId) {
      return { success: false, message: "এই মোবাইল নম্বরে অন্য সাপ্লায়ার আছে" };
    }
    const update: Partial<typeof suppliers.$inferInsert> = { ...data };
    const password = String(input.password || "").trim();
    if (password) {
      if (password.length < 6) return { success: false, message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন" };
      update.password = await bcrypt.hash(password, 10);
    }
    await db.update(suppliers).set(update).where(eq(suppliers.supplierId, supplierId));
    revalidateSupplierPaths(supplierId);
    return { success: true, message: "Supplier updated" };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, message: firstIssue(error) };
    console.error("updateSupplier failed:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const setSupplierActive = async (supplierId: string, isActive: boolean) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    await db.update(suppliers).set({ isActive }).where(eq(suppliers.supplierId, supplierId));
    revalidateSupplierPaths(supplierId);
    return { success: true, message: isActive ? "Supplier activated" : "Supplier deactivated" };
  } catch (error) {
    console.error("setSupplierActive failed:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const deleteSupplier = async (supplierId: string) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    await db.delete(suppliers).where(eq(suppliers.supplierId, supplierId));
    revalidateSupplierPaths();
    return { success: true, message: "Supplier deleted" };
  } catch (error) {
    console.error("deleteSupplier failed:", error);
    return { success: false, message: "Something went wrong" };
  }
};

/** Supplier + ledger (oldest first, with running balance) + totals. */
export const getSupplierDetail = async (supplierId: string) => {
  try {
    if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
    return await loadSupplierLedger(supplierId);
  } catch (error) {
    console.error("getSupplierDetail failed:", error);
    return { success: false as const, message: "Could not load supplier" };
  }
};

const loadSupplierLedger = async (supplierId: string) => {
  const [supplier] = await db
    .select({
      supplierId: suppliers.supplierId,
      name: suppliers.name,
      shopName: suppliers.shopName,
      phone: suppliers.phone,
      address: suppliers.address,
      origin: suppliers.origin,
      username: suppliers.username,
      isActive: suppliers.isActive,
      note: suppliers.note,
      createdAt: suppliers.createdAt,
    })
    .from(suppliers)
    .where(eq(suppliers.supplierId, supplierId))
    .limit(1);
  if (!supplier) return { success: false as const, message: "Supplier not found" };

  const rows = await db
    .select()
    .from(supplierTransactions)
    .where(eq(supplierTransactions.supplierId, supplierId))
    .orderBy(asc(supplierTransactions.date), asc(supplierTransactions.createdAt));

  const photoUrls = await Promise.all(rows.map((r) => photoUrlFor(r.photoKey)));
  let balance = 0;
  const ledger = rows.map((r, i) => {
    balance += r.type === "purchase" ? r.amount : -r.amount;
    return { ...r, balance, photoUrl: photoUrls[i] };
  });
  const totals = await totalsFor(supplierId);
  return { success: true as const, data: { supplier, ledger, totals } };
};

// ============================================
// ADMIN: ledger entries
// ============================================

export const addSupplierTransaction = async (input: Record<string, unknown>) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    const data = TransactionSchema.parse(input);
    const [supplier] = await db
      .select({ supplierId: suppliers.supplierId })
      .from(suppliers)
      .where(eq(suppliers.supplierId, data.supplierId))
      .limit(1);
    if (!supplier) return { success: false, message: "Supplier not found" };

    const transactionId = generateRandomId(10);
    const isPurchase = data.type === "purchase";
    await db.insert(supplierTransactions).values({
      transactionId,
      ...data,
      productType: isPurchase ? data.productType : null,
      photoKey: isPurchase ? data.photoKey : null,
    });
    const totals = await totalsFor(data.supplierId);
    revalidateSupplierPaths(data.supplierId);

    // Payments notify the supplier by SMS with a receipt link (admin can untick it).
    let smsNote = "";
    if (data.type === "payment" && input.sendSms !== false && input.sendSms !== "false") {
      try {
        const [s] = await db.select({ phone: suppliers.phone }).from(suppliers).where(eq(suppliers.supplierId, data.supplierId)).limit(1);
        if (s?.phone) {
          const link = `${supplierBaseUrl()}/supplier-receipt/${transactionId}`;
          await sendSMS(s.phone, `SE Electronics: ${taka(data.amount)} পরিশোধ করা হয়েছে। বাকি পাওনা ${taka(totals.due)}। রসিদ: ${link}`);
          smsNote = " · SMS পাঠানো হয়েছে";
        }
      } catch (err) {
        console.error("supplier payment SMS failed:", err);
        smsNote = " · SMS পাঠানো যায়নি";
      }
    }
    return { success: true, message: (data.type === "purchase" ? "মাল গ্রহণ যোগ হয়েছে" : "পেমেন্ট যোগ হয়েছে") + smsNote, data: { transactionId, totals } };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, message: firstIssue(error) };
    console.error("addSupplierTransaction failed:", error);
    return { success: false, message: "Something went wrong" };
  }
};

export const deleteSupplierTransaction = async (transactionId: string) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    const [row] = await db
      .delete(supplierTransactions)
      .where(eq(supplierTransactions.transactionId, transactionId))
      .returning({ supplierId: supplierTransactions.supplierId });
    if (!row) return { success: false, message: "Entry not found" };
    revalidateSupplierPaths(row.supplierId);
    return { success: true, message: "Entry deleted" };
  } catch (error) {
    console.error("deleteSupplierTransaction failed:", error);
    return { success: false, message: "Something went wrong" };
  }
};

// ============================================
// ADMIN: manual SMS / voice (nothing is sent automatically)
// ============================================

/** Pre-filled message texts for the admin to review/edit before sending. */
export const getSupplierMessageTemplates = async (supplierId: string, transactionId?: string) => {
  try {
    if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
    const [supplier] = await db
      .select({ name: suppliers.name, shopName: suppliers.shopName })
      .from(suppliers)
      .where(eq(suppliers.supplierId, supplierId))
      .limit(1);
    if (!supplier) return { success: false as const, message: "Supplier not found" };
    const t = await totalsFor(supplierId);
    const [latest] = await db
      .select({ transactionId: supplierTransactions.transactionId })
      .from(supplierTransactions)
      .where(eq(supplierTransactions.supplierId, supplierId))
      .orderBy(desc(supplierTransactions.date), desc(supplierTransactions.createdAt))
      .limit(1);
    const statementLink = latest ? `${supplierBaseUrl()}/supplier-receipt/${latest.transactionId}` : `${supplierBaseUrl()}/supplier/login`;
    const summary = `প্রিয় ${supplier.name} (${supplier.shopName}), এস ই ইলেকট্রনিক্স থেকে আপনার মোট পাওনা ${taka(t.due)}। এ পর্যন্ত পরিশোধ ${taka(t.paid)}। হিসাব দেখুন: ${statementLink}`;

    let entry: string | null = null;
    if (transactionId) {
      const [tx] = await db
        .select({ type: supplierTransactions.type, amount: supplierTransactions.amount })
        .from(supplierTransactions)
        .where(and(eq(supplierTransactions.transactionId, transactionId), eq(supplierTransactions.supplierId, supplierId)))
        .limit(1);
      if (tx) {
        entry =
          tx.type === "purchase"
            ? `প্রিয় ${supplier.name}, ${taka(tx.amount)} এর মাল গ্রহণ করা হয়েছে। মোট পাওনা ${taka(t.due)}। রসিদ: ${supplierBaseUrl()}/supplier-receipt/${transactionId}`
            : `প্রিয় ${supplier.name}, ${taka(tx.amount)} পরিশোধ করা হয়েছে। বাকি ${taka(t.due)}। রসিদ: ${supplierBaseUrl()}/supplier-receipt/${transactionId}`;
      }
    }
    const voiceBroadcastId = Number(process.env.MRAM_VOICE_SUPPLIER_BROADCAST_ID || 0) || null;
    return { success: true as const, data: { summary, entry, voiceBroadcastId } };
  } catch (error) {
    console.error("getSupplierMessageTemplates failed:", error);
    return { success: false as const, message: "Something went wrong" };
  }
};

export const sendSupplierSms = async (supplierId: string, message: string) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    const text = (message || "").trim();
    if (!text) return { success: false, message: "মেসেজ লিখুন" };
    if (text.length > 600) return { success: false, message: "মেসেজ অনেক বড়" };
    const [supplier] = await db.select({ phone: suppliers.phone }).from(suppliers).where(eq(suppliers.supplierId, supplierId)).limit(1);
    if (!supplier) return { success: false, message: "Supplier not found" };
    await sendSMS(supplier.phone, text);
    return { success: true, message: "SMS পাঠানো হয়েছে" };
  } catch (error) {
    console.error("sendSupplierSms failed:", error);
    return { success: false, message: "SMS পাঠানো যায়নি" };
  }
};

/**
 * Voice calls are pre-recorded MRAM broadcasts (no text-to-speech), so the admin
 * picks a broadcast ID (default: MRAM_VOICE_SUPPLIER_BROADCAST_ID). Amounts go by SMS.
 */
export const sendSupplierVoiceCall = async (supplierId: string, broadcastId: number) => {
  try {
    if (!(await requireAdmin())) return { success: false, message: "Unauthorized" };
    const id = Number(broadcastId);
    if (!Number.isInteger(id) || id <= 0) return { success: false, message: "সঠিক Voice Broadcast ID দিন" };
    const [supplier] = await db.select({ phone: suppliers.phone }).from(suppliers).where(eq(suppliers.supplierId, supplierId)).limit(1);
    if (!supplier) return { success: false, message: "Supplier not found" };
    const res = await sendVoiceCall(supplier.phone, id, "Supplier Due Reminder");
    return res.success ? { success: true, message: "Voice call পাঠানো হয়েছে" } : { success: false, message: (res as any).error || "Voice call পাঠানো যায়নি" };
  } catch (error) {
    console.error("sendSupplierVoiceCall failed:", error);
    return { success: false, message: "Voice call পাঠানো যায়নি" };
  }
};

// ============================================
// SUPPLIER PORTAL (read-only, own data only)
// ============================================

export async function supplierLogin(_prevState: any, formData: FormData) {
  try {
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");
    if (!username || !password) return { success: false, message: "অনুগ্রহ করে ইউজারনেম ও পাসওয়ার্ড দিন।" };

    const [supplier] = await db.select().from(suppliers).where(eq(suppliers.username, username)).limit(1);
    if (!supplier || !(await bcrypt.compare(password, supplier.password))) {
      return { success: false, message: "Invalid username or password" };
    }
    if (!supplier.isActive) {
      return { success: false, message: "আপনার অ্যাকাউন্টটি বন্ধ করা আছে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।" };
    }
    await createSession({ username: supplier.username, userId: supplier.supplierId, role: "supplier" });
  } catch (error) {
    console.error("supplierLogin failed:", error);
    return { success: false, message: "Something went wrong" };
  }
  redirect("/supplier/profile", RedirectType.replace);
}

export async function supplierLogout() {
  await deleteSession();
  redirect("/supplier/login", RedirectType.replace);
}

/** Ledger for the logged-in supplier only (id comes from the session, never the client). */
export const getMySupplierLedger = async () => {
  try {
    const session = await decrypt((await cookies()).get("session")?.value);
    if (!session?.userId || session.role !== "supplier") return { success: false as const, message: "Unauthorized" };
    const res = await loadSupplierLedger(session.userId as string);
    if (!res.success) return res;
    if (!res.data.supplier.isActive) return { success: false as const, message: "Inactive" };
    // Never expose the username/login details beyond what the portal needs.
    return res;
  } catch (error) {
    console.error("getMySupplierLedger failed:", error);
    return { success: false as const, message: "Could not load data" };
  }
};

// ============================================
// Receipts (admin, or the supplier who owns the entry)
// ============================================

/**
 * One ledger entry with the supplier and the account totals right after that
 * entry. Allowed for an admin, or for the logged-in supplier who owns it.
 */
export const getSupplierReceipt = async (transactionId: string) => {
  try {
    // The receipt link (random 10-char id) works without a login so a supplier
    // can open it straight from the SMS; an admin/supplier session only changes the Back link.
    const session = await decrypt((await cookies()).get("session")?.value);
    const role = session?.role as string | undefined;

    const [tx] = await db.select().from(supplierTransactions).where(eq(supplierTransactions.transactionId, transactionId)).limit(1);
    if (!tx) return { success: false as const, message: "Not found" };

    const res = await loadSupplierLedger(tx.supplierId);
    if (!res.success) return res;
    if (role !== "admin" && !res.data.supplier.isActive) return { success: false as const, message: "Inactive" };

    // Totals up to and including this entry (ledger is oldest first).
    let purchased = 0;
    let paid = 0;
    for (const e of res.data.ledger) {
      if (e.type === "purchase") purchased += e.amount;
      else paid += e.amount;
      if (e.transactionId === transactionId) break;
    }
    const { username: _u, ...supplier } = res.data.supplier;
    const viewer = role === "admin" ? "admin" : role === "supplier" && session?.userId === tx.supplierId ? "supplier" : "public";
    return {
      success: true as const,
      data: {
        supplier,
        transaction: { ...tx, photoUrl: await photoUrlFor(tx.photoKey) },
        totals: { purchased, paid, due: purchased - paid },
        ledger: res.data.ledger,
        overall: res.data.totals,
        viewer: viewer as "admin" | "supplier" | "public",
      },
    };
  } catch (error) {
    console.error("getSupplierReceipt failed:", error);
    return { success: false as const, message: "Could not load receipt" };
  }
};

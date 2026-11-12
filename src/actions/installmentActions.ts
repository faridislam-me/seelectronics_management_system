"use server";

import { db } from "@/db/drizzle";
import {
  customers,
  installmentApplications,
  installmentPlans,
  installmentSchedule,
} from "@/db/schema";
import { verifyCustomerSession } from "@/actions/customerActions";
import { verifySession } from "@/lib";
import { putObject, getObjectUrl } from "@/lib/s3";
import { compressImage } from "@/lib/sharp";
import { generateRandomId } from "@/utils";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UNAUTHORIZED = { success: false as const, message: "Unauthorized" };

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Add `n` whole months to a date, clamping the day so e.g. Jan 31 + 1 → Feb 28/29. */
const addMonths = (date: Date, n: number) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
};

const planCode = () => "KST" + generateRandomId(6).replace(/^SE/, "");

const CreateSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  productType: z
    .preprocess((v) => (v === "" ? undefined : v), z.enum(["ips", "battery", "stabilizer", "others", "fridge", "ac", "tv", "oven", "washing_machine", "mobile", "ips_package", "blender"]).optional()),
  productModel: z.string().min(1, "Product model is required"),
  serialNumber: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  productBrand: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  vaWatt: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  volt: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  displayType: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  cashPrice: z.coerce.number().positive("Cash price must be greater than 0"),
  extraCharge: z.coerce.number().min(0).default(0),
  downPayment: z.coerce.number().min(0).default(0),
  months: z.coerce.number().int().positive().max(120),
  startDate: z.string().min(1, "Start date is required"),
  guarantorName: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  guarantorPhone: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  guarantorAddress: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  notes: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

export type CreateInstallmentInput = z.input<typeof CreateSchema>;

export const createInstallmentPlan = async (input: CreateInstallmentInput) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const parsed = CreateSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: parsed.error.issues[0]?.message || "Invalid input" };
    }
    const d = parsed.data;

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, d.customerId),
      columns: { customerId: true, name: true, phone: true, address: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    const totalPayable = round2(d.cashPrice + d.extraCharge);
    const financedAmount = round2(totalPayable - d.downPayment);
    if (financedAmount <= 0) {
      return { success: false, message: "Down payment cannot cover the full amount — nothing left to finance." };
    }
    const monthlyAmount = round2(financedAmount / d.months);

    const start = new Date(d.startDate);
    if (isNaN(start.getTime())) return { success: false, message: "Invalid start date" };
    const endDate = addMonths(start, d.months);

    // Unique plan code (retry a few times on the rare collision)
    let code = planCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.installmentPlans.findFirst({
        where: eq(installmentPlans.planCode, code),
        columns: { id: true },
      });
      if (!exists) break;
      code = planCode();
    }

    const [plan] = await db
      .insert(installmentPlans)
      .values({
        planCode: code,
        customerId: customer.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        productType: d.productType,
        productModel: d.productModel,
        serialNumber: d.serialNumber,
        productBrand: d.productBrand,
        vaWatt: d.vaWatt,
        volt: d.volt,
        displayType: d.displayType,
        cashPrice: d.cashPrice,
        extraCharge: d.extraCharge,
        totalPayable,
        downPayment: d.downPayment,
        financedAmount,
        months: d.months,
        monthlyAmount,
        startDate: start,
        endDate,
        guarantorName: d.guarantorName,
        guarantorPhone: d.guarantorPhone,
        guarantorAddress: d.guarantorAddress,
        notes: d.notes,
      })
      .returning({ id: installmentPlans.id, planCode: installmentPlans.planCode });

    // Build the monthly schedule. Each installment is monthlyAmount, with the
    // final one absorbing any rounding remainder so the rows sum to financedAmount.
    const rows = [];
    let allocated = 0;
    for (let i = 1; i <= d.months; i++) {
      const isLast = i === d.months;
      const amount = isLast ? round2(financedAmount - allocated) : monthlyAmount;
      allocated = round2(allocated + amount);
      rows.push({
        planId: plan.id,
        installmentNo: i,
        dueDate: addMonths(start, i),
        amount,
      });
    }
    await db.insert(installmentSchedule).values(rows);

    revalidatePath("/installments");
    return { success: true, planCode: plan.planCode, message: "কিস্তি প্ল্যান তৈরি হয়েছে" };
  } catch (error) {
    console.error("createInstallmentPlan error:", error);
    return { success: false, message: "কিস্তি প্ল্যান তৈরি করা যায়নি" };
  }
};

export const getInstallmentPlans = async ({
  query = "",
  status,
  page = "1",
  limit = "20",
}: {
  query?: string;
  status?: string;
  page?: string;
  limit?: string;
}) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const q = `%${query}%`;
    const offset = (Number(page) - 1) * Number(limit);

    const where = and(
      query
        ? or(
            ilike(installmentPlans.planCode, q),
            ilike(installmentPlans.customerName, q),
            ilike(installmentPlans.customerPhone, q),
            ilike(installmentPlans.productModel, q),
          )
        : undefined,
      status ? eq(installmentPlans.status, status as any) : undefined,
    );

    const plans = await db
      .select()
      .from(installmentPlans)
      .where(where)
      .orderBy(desc(installmentPlans.createdAt))
      .limit(Number(limit))
      .offset(offset);

    // Per-plan progress (paid count + paid amount) in one grouped query.
    const ids = plans.map((p) => p.id);
    const progress =
      ids.length > 0
        ? await db
            .select({
              planId: installmentSchedule.planId,
              paidCount: sql<number>`count(*) filter (where ${installmentSchedule.status} = 'paid')`.mapWith(Number),
              paidAmount: sql<number>`coalesce(sum(${installmentSchedule.paidAmount}) filter (where ${installmentSchedule.status} = 'paid'), 0)`.mapWith(Number),
            })
            .from(installmentSchedule)
            .where(inArray(installmentSchedule.planId, ids))
            .groupBy(installmentSchedule.planId)
        : [];
    const byPlan = new Map(progress.map((r) => [r.planId, r]));

    const data = plans.map((p) => {
      const pr = byPlan.get(p.id);
      const paidCount = pr?.paidCount || 0;
      const paidAmount = pr?.paidAmount || 0;
      return {
        ...p,
        paidCount,
        paidAmount,
        remainingAmount: round2(p.financedAmount - paidAmount),
        remainingCount: p.months - paidCount,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("getInstallmentPlans error:", error);
    return { success: false, message: "কিস্তি তালিকা আনা যায়নি" };
  }
};

export const getInstallmentPlanByCode = async (code: string) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const plan = await db.query.installmentPlans.findFirst({
      where: eq(installmentPlans.planCode, code),
    });
    if (!plan) return { success: false, message: "প্ল্যান পাওয়া যায়নি" };

    const schedule = await db
      .select()
      .from(installmentSchedule)
      .where(eq(installmentSchedule.planId, plan.id))
      .orderBy(installmentSchedule.installmentNo);

    const paidAmount = round2(
      schedule.filter((s) => s.status === "paid").reduce((sum, s) => sum + s.paidAmount, 0),
    );
    const paidCount = schedule.filter((s) => s.status === "paid").length;

    return {
      success: true,
      data: {
        plan,
        schedule,
        paidAmount,
        paidCount,
        remainingAmount: round2(plan.financedAmount - paidAmount),
        remainingCount: plan.months - paidCount,
      },
    };
  } catch (error) {
    console.error("getInstallmentPlanByCode error:", error);
    return { success: false, message: "প্ল্যান আনা যায়নি" };
  }
};

const MarkPaidSchema = z.object({
  scheduleId: z.string().uuid(),
  paidAmount: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().positive().optional()),
  paymentMethod: z.preprocess((v) => (v === "" ? undefined : v), z.enum(["cash", "bkash", "nagad", "rocket", "bank"]).optional()),
  transactionId: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  paymentNumber: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
});

export const markInstallmentPaid = async (input: z.input<typeof MarkPaidSchema>) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    const parsed = MarkPaidSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "Invalid input" };
    const { scheduleId, paidAmount, paymentMethod, transactionId, paymentNumber } = parsed.data;

    const row = await db.query.installmentSchedule.findFirst({
      where: eq(installmentSchedule.id, scheduleId),
    });
    if (!row) return { success: false, message: "কিস্তি পাওয়া যায়নি" };
    if (row.status === "paid") return { success: false, message: "এই কিস্তি আগেই পরিশোধিত" };

    await db
      .update(installmentSchedule)
      .set({
        status: "paid",
        paidAmount: paidAmount ?? row.amount,
        paidAt: new Date(),
        paymentMethod: paymentMethod,
        transactionId,
        paymentNumber,
      })
      .where(eq(installmentSchedule.id, scheduleId));

    // Complete the plan once every installment is paid.
    const remaining = await db
      .select({ c: sql<number>`count(*)`.mapWith(Number) })
      .from(installmentSchedule)
      .where(and(eq(installmentSchedule.planId, row.planId), sql`${installmentSchedule.status} <> 'paid'`));
    if ((remaining[0]?.c || 0) === 0) {
      await db
        .update(installmentPlans)
        .set({ status: "completed" })
        .where(and(eq(installmentPlans.id, row.planId), eq(installmentPlans.status, "active")));
    }

    revalidatePath("/installments");
    return { success: true, message: "কিস্তি পরিশোধিত হিসেবে চিহ্নিত হয়েছে" };
  } catch (error) {
    console.error("markInstallmentPaid error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

export const updateInstallmentPlanStatus = async (
  code: string,
  status: "active" | "completed" | "defaulted" | "banned" | "cancelled",
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    const plan = await db.query.installmentPlans.findFirst({
      where: eq(installmentPlans.planCode, code),
      columns: { id: true },
    });
    if (!plan) return { success: false, message: "প্ল্যান পাওয়া যায়নি" };

    await db.update(installmentPlans).set({ status }).where(eq(installmentPlans.id, plan.id));
    revalidatePath("/installments");
    return { success: true, message: "স্ট্যাটাস আপডেট হয়েছে" };
  } catch (error) {
    console.error("updateInstallmentPlanStatus error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

/**
 * Admin: edit a plan's product + sticker spec fields (model, serial, brand,
 * VA/Watt, Volt, Display). Lets existing plans get the spec data that newer
 * create/approve flows capture. Empty values clear the optional fields;
 * productModel (required) is only overwritten when a non-empty value is given.
 */
export const updateInstallmentPlanProduct = async (
  code: string,
  fields: {
    productModel?: string;
    serialNumber?: string;
    productBrand?: string;
    vaWatt?: string;
    volt?: string;
    displayType?: string;
  },
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    const plan = await db.query.installmentPlans.findFirst({
      where: eq(installmentPlans.planCode, code),
      columns: { id: true },
    });
    if (!plan) return { success: false, message: "প্ল্যান পাওয়া যায়নি" };

    const clean = (v?: string) => (v && v.trim() !== "" ? v.trim() : null);
    const set: Record<string, string | null> = {
      serialNumber: clean(fields.serialNumber),
      productBrand: clean(fields.productBrand),
      vaWatt: clean(fields.vaWatt),
      volt: clean(fields.volt),
      displayType: clean(fields.displayType),
    };
    if (fields.productModel && fields.productModel.trim()) {
      set.productModel = fields.productModel.trim();
    }

    await db.update(installmentPlans).set(set).where(eq(installmentPlans.id, plan.id));
    revalidatePath("/installments");
    revalidatePath(`/installments/${code}`);
    return { success: true, message: "পণ্যের তথ্য আপডেট হয়েছে" };
  } catch (error) {
    console.error("updateInstallmentPlanProduct error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

// ============================================================
// Customer-facing (read-only, scoped to the logged-in customer)
// ============================================================

const planProgress = (
  financedAmount: number,
  months: number,
  rows: { status: string; paidAmount: number }[],
) => {
  const paid = rows.filter((r) => r.status === "paid");
  const paidAmount = round2(paid.reduce((s, r) => s + r.paidAmount, 0));
  return {
    paidCount: paid.length,
    paidAmount,
    remainingAmount: round2(financedAmount - paidAmount),
    remainingCount: months - paid.length,
  };
};

export const getMyInstallmentPlans = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const plans = await db
      .select()
      .from(installmentPlans)
      .where(eq(installmentPlans.customerId, session.customer.customerId))
      .orderBy(desc(installmentPlans.createdAt));

    const ids = plans.map((p) => p.id);
    const rows =
      ids.length > 0
        ? await db
            .select({
              planId: installmentSchedule.planId,
              status: installmentSchedule.status,
              paidAmount: installmentSchedule.paidAmount,
            })
            .from(installmentSchedule)
            .where(inArray(installmentSchedule.planId, ids))
        : [];
    const byPlan = new Map<string, { status: string; paidAmount: number }[]>();
    for (const r of rows) {
      const arr = byPlan.get(r.planId) || [];
      arr.push({ status: r.status, paidAmount: r.paidAmount });
      byPlan.set(r.planId, arr);
    }

    const data = plans.map((p) => ({
      ...p,
      ...planProgress(p.financedAmount, p.months, byPlan.get(p.id) || []),
    }));

    return { success: true, data };
  } catch (error) {
    console.error("getMyInstallmentPlans error:", error);
    return { success: false, message: "কিস্তি তথ্য আনা যায়নি" };
  }
};

export const getMyInstallmentDashboard = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;
    const cid = session.customer.customerId;

    const [plans, apps] = await Promise.all([
      db.select().from(installmentPlans).where(eq(installmentPlans.customerId, cid)).orderBy(desc(installmentPlans.createdAt)),
      db.select().from(installmentApplications).where(eq(installmentApplications.customerId, cid)).orderBy(desc(installmentApplications.createdAt)),
    ]);

    const ids = plans.map((p) => p.id);
    const scheduleRows = ids.length > 0
      ? await db.select({ planId: installmentSchedule.planId, status: installmentSchedule.status, paidAmount: installmentSchedule.paidAmount }).from(installmentSchedule).where(inArray(installmentSchedule.planId, ids))
      : [];

    const byPlan = new Map<string, { status: string; paidAmount: number }[]>();
    for (const r of scheduleRows) {
      const arr = byPlan.get(r.planId) || [];
      arr.push({ status: r.status, paidAmount: r.paidAmount });
      byPlan.set(r.planId, arr);
    }

    const plansData = plans.map((p) => ({ ...p, ...planProgress(p.financedAmount, p.months, byPlan.get(p.id) || []) }));

    const overdueCount = scheduleRows.filter((r) => r.status === "overdue").length;
    const totalPaid = round2(scheduleRows.filter((r) => r.status === "paid").reduce((s, r) => s + r.paidAmount, 0));
    const totalRemaining = round2(plans.reduce((s, p) => s + p.financedAmount, 0) - totalPaid);

    // Profile photo = the customer's ORIGINAL (first) application photo. `apps` is
    // ordered newest-first, so scan from the end to find the oldest one with a photo.
    // A new application must never overwrite the established profile photo.
    let photoUrl: string | null = null;
    const appWithPhoto = [...apps].reverse().find((a) => a.photoKey);
    if (appWithPhoto?.photoKey) {
      try { photoUrl = await getObjectUrl(appWithPhoto.photoKey); } catch {}
    }

    const customer = session.customer;
    return {
      success: true,
      data: {
        customer: { name: customer.name, phone: customer.phone, address: customer.address, customerId: customer.customerId },
        photoUrl,
        plans: plansData,
        applications: apps,
        overdueCount,
        totalPaid,
        totalRemaining,
      },
    };
  } catch (error) {
    console.error("getMyInstallmentDashboard error:", error);
    return { success: false, message: "ড্যাশবোর্ড তথ্য আনা যায়নি" };
  }
};

export const getMyInstallmentPlanByCode = async (code: string) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const plan = await db.query.installmentPlans.findFirst({
      where: eq(installmentPlans.planCode, code),
    });
    // Never leak another customer's plan.
    if (!plan || plan.customerId !== session.customer.customerId) {
      return { success: false, message: "প্ল্যান পাওয়া যায়নি" };
    }

    const schedule = await db
      .select()
      .from(installmentSchedule)
      .where(eq(installmentSchedule.planId, plan.id))
      .orderBy(installmentSchedule.installmentNo);

    // Next unpaid due (for the "Pay Now" call-to-action); skip already paid/claimed
    const nextDue = schedule.find((s) => s.status !== "paid" && s.status !== "claimed") || null;

    // Optional product photo (admin-set); shown on the product profile page.
    let productImageUrl: string | null = null;
    if (plan.productImageKey) {
      try { productImageUrl = await getObjectUrl(plan.productImageKey); } catch {}
    }

    return {
      success: true,
      data: {
        plan,
        schedule,
        nextDue,
        productImageUrl,
        ...planProgress(plan.financedAmount, plan.months, schedule),
      },
    };
  } catch (error) {
    console.error("getMyInstallmentPlanByCode error:", error);
    return { success: false, message: "প্ল্যান আনা যায়নি" };
  }
};

// ============================================================
// Installment Applications (customer self-apply → admin review)
// ============================================================

const appCode = () => "KSTA" + generateRandomId(5).replace(/^SE/, "");

/** Customer submits an installment application with KYC docs (FormData). */
export const submitInstallmentApplication = async (formData: FormData) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const customerId = session.customer.customerId;
    const productModel = formData.get("productModel") as string;
    const productType = (formData.get("productType") as string) || undefined;
    const productTypeOther = (formData.get("productTypeOther") as string) || undefined;
    const productBrand = (formData.get("productBrand") as string) || undefined;
    const productSpec = (formData.get("productSpec") as string) || undefined;
    const notes = (formData.get("notes") as string) || undefined;
    const guarantorName = (formData.get("guarantorName") as string) || undefined;
    const guarantorPhone = (formData.get("guarantorPhone") as string) || undefined;
    const guarantorAddress = (formData.get("guarantorAddress") as string) || undefined;

    // New personal info fields
    const fatherName = (formData.get("fatherName") as string) || undefined;
    const motherName = (formData.get("motherName") as string) || undefined;
    const currentAddress = (formData.get("currentAddress") as string) || undefined;
    const permanentAddress = (formData.get("permanentAddress") as string) || undefined;
    const isRenting = formData.get("isRenting") === "true";
    const landlordName = isRenting ? ((formData.get("landlordName") as string) || undefined) : undefined;
    const landlordPhone = isRenting ? ((formData.get("landlordPhone") as string) || undefined) : undefined;

    // Desired plan fields
    const desiredMonthsRaw = formData.get("desiredMonths") as string;
    const desiredMonths = desiredMonthsRaw ? parseInt(desiredMonthsRaw, 10) || undefined : undefined;
    const desiredDownPaymentRaw = formData.get("desiredDownPayment") as string;
    const desiredDownPayment = desiredDownPaymentRaw ? parseFloat(desiredDownPaymentRaw) || undefined : undefined;

    // Terms
    const termsAccepted = formData.get("termsAccepted") === "true";

    if (!productModel?.trim()) {
      return { success: false, message: "পণ্যের মডেল আবশ্যক" };
    }
    if (!termsAccepted) {
      return { success: false, message: "শর্তাবলীতে সম্মতি আবশ্যক" };
    }

    // File extractions
    const photo = formData.get("photo") as File | null;
    const nidFront = formData.get("nidFront") as File | null;
    const nidBack = formData.get("nidBack") as File | null;
    const signature = formData.get("signature") as File | null;
    const bankCheck = formData.get("bankCheck") as File | null;
    const guarantorPhoto = formData.get("guarantorPhoto") as File | null;
    const guarantorSignature = formData.get("guarantorSignature") as File | null;
    const guarantorNidFront = formData.get("guarantorNidFront") as File | null;
    const guarantorNidBack = formData.get("guarantorNidBack") as File | null;

    if (!photo || !nidFront || !nidBack) {
      return { success: false, message: "ছবি, NID সামনে ও পিছনে আবশ্যক" };
    }

    const customer = await db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      columns: { customerId: true, name: true, phone: true, address: true },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    // Generate unique code
    let code = appCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.installmentApplications.findFirst({
        where: eq(installmentApplications.applicationCode, code),
        columns: { id: true },
      });
      if (!exists) break;
      code = appCode();
    }

    // R2 keys
    const prefix = `installment-apps/${code}`;
    const photoKey = `${prefix}/photo.webp`;
    const nidFrontKey = `${prefix}/nid-front.webp`;
    const nidBackKey = `${prefix}/nid-back.webp`;
    const signatureKey = signature ? `${prefix}/signature.png` : undefined;
    const bankCheckKey = bankCheck ? `${prefix}/bank-check.webp` : undefined;
    const gPhotoKey = guarantorPhoto ? `${prefix}/guarantor-photo.webp` : undefined;
    const gSignatureKey = guarantorSignature ? `${prefix}/guarantor-signature.png` : undefined;
    const gNidFrontKey = guarantorNidFront ? `${prefix}/guarantor-nid-front.webp` : undefined;
    const gNidBackKey = guarantorNidBack ? `${prefix}/guarantor-nid-back.webp` : undefined;

    // Insert DB row first
    await db.insert(installmentApplications).values({
      applicationCode: code,
      customerId: customer.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      productType: productType as any,
      productTypeOther,
      productBrand,
      productSpec,
      productModel: productModel.trim(),
      photoKey,
      nidFrontPhotoKey: nidFrontKey,
      nidBackPhotoKey: nidBackKey,
      signatureKey,
      bankCheckPhotoKey: bankCheckKey,
      guarantorName,
      guarantorPhone,
      guarantorAddress,
      guarantorPhotoKey: gPhotoKey,
      guarantorSignatureKey: gSignatureKey,
      guarantorNidFrontPhotoKey: gNidFrontKey,
      guarantorNidBackPhotoKey: gNidBackKey,
      notes,
      fatherName,
      motherName,
      currentAddress,
      permanentAddress,
      isRenting,
      landlordName,
      landlordPhone,
      desiredMonths,
      desiredDownPayment,
      termsAccepted,
    });

    // Compress & upload images in parallel
    const uploads: Promise<any>[] = [];
    const [photoBuf, nidFBuf, nidBBuf] = await Promise.all([
      compressImage(Buffer.from(await photo.arrayBuffer()), "portrait"),
      compressImage(Buffer.from(await nidFront.arrayBuffer()), "nid"),
      compressImage(Buffer.from(await nidBack.arrayBuffer()), "nid"),
    ]);
    uploads.push(
      putObject({ Key: photoKey, Body: photoBuf, ContentType: "image/webp" }),
      putObject({ Key: nidFrontKey, Body: nidFBuf, ContentType: "image/webp" }),
      putObject({ Key: nidBackKey, Body: nidBBuf, ContentType: "image/webp" }),
    );
    if (signature && signatureKey) {
      const sigBuf = Buffer.from(await signature.arrayBuffer());
      uploads.push(putObject({ Key: signatureKey, Body: sigBuf, ContentType: "image/png" }));
    }
    if (bankCheck && bankCheckKey) {
      const buf = await compressImage(Buffer.from(await bankCheck.arrayBuffer()), "nid");
      uploads.push(putObject({ Key: bankCheckKey, Body: buf, ContentType: "image/webp" }));
    }
    if (guarantorPhoto && gPhotoKey) {
      const buf = await compressImage(Buffer.from(await guarantorPhoto.arrayBuffer()), "portrait");
      uploads.push(putObject({ Key: gPhotoKey, Body: buf, ContentType: "image/webp" }));
    }
    if (guarantorSignature && gSignatureKey) {
      const buf = Buffer.from(await guarantorSignature.arrayBuffer());
      uploads.push(putObject({ Key: gSignatureKey, Body: buf, ContentType: "image/png" }));
    }
    if (guarantorNidFront && gNidFrontKey) {
      const buf = await compressImage(Buffer.from(await guarantorNidFront.arrayBuffer()), "nid");
      uploads.push(putObject({ Key: gNidFrontKey, Body: buf, ContentType: "image/webp" }));
    }
    if (guarantorNidBack && gNidBackKey) {
      const buf = await compressImage(Buffer.from(await guarantorNidBack.arrayBuffer()), "nid");
      uploads.push(putObject({ Key: gNidBackKey, Body: buf, ContentType: "image/webp" }));
    }
    await Promise.all(uploads);
    import("@/lib/adminVoiceNotify").then(m => m.notifyAdminVoice("installment_application")).catch(() => {});

    revalidatePath("/customer/installments");
    return { success: true, applicationCode: code, message: "আবেদন জমা হয়েছে" };
  } catch (error) {
    console.error("submitInstallmentApplication error:", error);
    return { success: false, message: "আবেদন জমা দেওয়া যায়নি" };
  }
};

/** Customer: list own installment applications */
export const getMyInstallmentApplications = async () => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const rows = await db
      .select()
      .from(installmentApplications)
      .where(eq(installmentApplications.customerId, session.customer.customerId))
      .orderBy(desc(installmentApplications.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getMyInstallmentApplications error:", error);
    return { success: false, message: "আবেদন তালিকা আনা যায়নি" };
  }
};

/** Admin: list all installment applications */
export const getInstallmentApplications = async ({
  query = "",
  status,
}: {
  query?: string;
  status?: string;
}) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const q = `%${query}%`;
    const where = and(
      query
        ? or(
            ilike(installmentApplications.applicationCode, q),
            ilike(installmentApplications.customerName, q),
            ilike(installmentApplications.customerPhone, q),
            ilike(installmentApplications.productModel, q),
          )
        : undefined,
      status ? eq(installmentApplications.status, status as any) : undefined,
    );

    const rows = await db
      .select()
      .from(installmentApplications)
      .where(where)
      .orderBy(desc(installmentApplications.createdAt));

    return { success: true, data: rows };
  } catch (error) {
    console.error("getInstallmentApplications error:", error);
    return { success: false, message: "আবেদন তালিকা আনা যায়নি" };
  }
};

/** Admin: get one installment application by code, with signed image URLs */
export const getInstallmentApplicationByCode = async (code: string) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const app = await db.query.installmentApplications.findFirst({
      where: eq(installmentApplications.applicationCode, code),
    });
    if (!app) return { success: false, message: "আবেদন পাওয়া যায়নি" };

    // Generate signed URLs for all uploaded images
    const urls: Record<string, string | null> = {
      photo: null,
      nidFront: null,
      nidBack: null,
      signature: null,
      bankCheck: null,
      guarantorPhoto: null,
      guarantorSignature: null,
      guarantorNidFront: null,
      guarantorNidBack: null,
    };
    if (app.photoKey) urls.photo = await getObjectUrl(app.photoKey);
    if (app.nidFrontPhotoKey) urls.nidFront = await getObjectUrl(app.nidFrontPhotoKey);
    if (app.nidBackPhotoKey) urls.nidBack = await getObjectUrl(app.nidBackPhotoKey);
    if (app.signatureKey) urls.signature = await getObjectUrl(app.signatureKey);
    if (app.bankCheckPhotoKey) urls.bankCheck = await getObjectUrl(app.bankCheckPhotoKey);
    if (app.guarantorPhotoKey) urls.guarantorPhoto = await getObjectUrl(app.guarantorPhotoKey);
    if (app.guarantorSignatureKey) urls.guarantorSignature = await getObjectUrl(app.guarantorSignatureKey);
    if (app.guarantorNidFrontPhotoKey) urls.guarantorNidFront = await getObjectUrl(app.guarantorNidFrontPhotoKey);
    if (app.guarantorNidBackPhotoKey) urls.guarantorNidBack = await getObjectUrl(app.guarantorNidBackPhotoKey);

    return { success: true, data: { ...app, urls } };
  } catch (error) {
    console.error("getInstallmentApplicationByCode error:", error);
    return { success: false, message: "আবেদন আনা যায়নি" };
  }
};

/** Admin: approve → creates installment plan, or reject */
export const reviewInstallmentApplication = async (
  code: string,
  action: "approve" | "reject" | "cancel" | "reapply",
  payload?: {
    cashPrice?: number;
    extraCharge?: number;
    downPayment?: number;
    months?: number;
    startDate?: string;
    serialNumber?: string;
    vaWatt?: string;
    volt?: string;
    displayType?: string;
    rejectReason?: string;
    adminNotes?: string;
  },
) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;

    const app = await db.query.installmentApplications.findFirst({
      where: eq(installmentApplications.applicationCode, code),
    });
    if (!app) return { success: false, message: "আবেদন পাওয়া যায়নি" };
    if (app.status === "approved") return { success: false, message: "আবেদন ইতোমধ্যে অনুমোদিত" };
    if (app.status === "rejected") return { success: false, message: "আবেদন ইতোমধ্যে প্রত্যাখ্যাত" };
    if (app.status === "cancelled") return { success: false, message: "আবেদন ইতোমধ্যে বাতিল করা হয়েছে" };

    if (action === "cancel") {
      await db
        .update(installmentApplications)
        .set({
          status: "cancelled",
          adminNotes: payload?.adminNotes || undefined,
        })
        .where(eq(installmentApplications.id, app.id));
      revalidatePath("/installments");
      return { success: true, message: "আবেদন বাতিল করা হয়েছে" };
    }

    if (action === "reapply") {
      await db
        .update(installmentApplications)
        .set({
          status: "reapply",
          adminNotes: payload?.adminNotes || undefined,
        })
        .where(eq(installmentApplications.id, app.id));
      revalidatePath("/installments");
      return { success: true, message: "পুনরায় আবেদনের সুযোগ দেওয়া হয়েছে" };
    }

    if (action === "reject") {
      await db
        .update(installmentApplications)
        .set({
          status: "rejected",
          rejectReason: payload?.rejectReason || undefined,
          adminNotes: payload?.adminNotes || undefined,
        })
        .where(eq(installmentApplications.id, app.id));
      revalidatePath("/installments");
      return { success: true, message: "আবেদন প্রত্যাখ্যাত হয়েছে" };
    }

    // Approve → validate pricing fields then create plan
    if (!payload?.cashPrice || !payload?.months || !payload?.startDate) {
      return { success: false, message: "ক্যাশ দাম, মেয়াদ ও শুরুর তারিখ আবশ্যক" };
    }

    const cashPrice = payload.cashPrice;
    const extraCharge = payload.extraCharge || 0;
    const downPayment = payload.downPayment || 0;
    const months = payload.months;
    const totalPayable = round2(cashPrice + extraCharge);
    const financedAmount = round2(totalPayable - downPayment);
    if (financedAmount <= 0) {
      return { success: false, message: "ডাউন পেমেন্ট পুরো দাম কভার করে ফেলেছে" };
    }
    const monthlyAmount = round2(financedAmount / months);
    const start = new Date(payload.startDate);
    if (isNaN(start.getTime())) return { success: false, message: "Invalid start date" };
    const endDate = addMonths(start, months);

    // Unique plan code
    let pCode = planCode();
    for (let i = 0; i < 5; i++) {
      const exists = await db.query.installmentPlans.findFirst({
        where: eq(installmentPlans.planCode, pCode),
        columns: { id: true },
      });
      if (!exists) break;
      pCode = planCode();
    }

    const [plan] = await db
      .insert(installmentPlans)
      .values({
        planCode: pCode,
        customerId: app.customerId,
        customerName: app.customerName,
        customerPhone: app.customerPhone,
        customerAddress: app.customerAddress,
        productType: app.productType,
        productModel: app.productModel,
        serialNumber: payload.serialNumber,
        productBrand: app.productBrand,
        vaWatt: payload.vaWatt,
        volt: payload.volt,
        displayType: payload.displayType,
        cashPrice,
        extraCharge,
        totalPayable,
        downPayment,
        financedAmount,
        months,
        monthlyAmount,
        startDate: start,
        endDate,
        guarantorName: app.guarantorName,
        guarantorPhone: app.guarantorPhone,
        guarantorAddress: app.guarantorAddress,
      })
      .returning({ id: installmentPlans.id, planCode: installmentPlans.planCode });

    // Build schedule
    const rows = [];
    let allocated = 0;
    for (let i = 1; i <= months; i++) {
      const isLast = i === months;
      const amount = isLast ? round2(financedAmount - allocated) : monthlyAmount;
      allocated = round2(allocated + amount);
      rows.push({
        planId: plan.id,
        installmentNo: i,
        dueDate: addMonths(start, i),
        amount,
      });
    }
    await db.insert(installmentSchedule).values(rows);

    // Mark application approved
    await db
      .update(installmentApplications)
      .set({
        status: "approved",
        planId: plan.id,
        adminNotes: payload.adminNotes || undefined,
      })
      .where(eq(installmentApplications.id, app.id));

    revalidatePath("/installments");
    return { success: true, planCode: plan.planCode, message: "আবেদন অনুমোদিত ও কিস্তি প্ল্যান তৈরি হয়েছে" };
  } catch (error) {
    console.error("reviewInstallmentApplication error:", error);
    return { success: false, message: "আবেদন পর্যালোচনা করা যায়নি" };
  }
};

const TRACKING_STEPS = [
  "pending",
  "processing",
  "nid_verify",
  "address_verify",
  "guarantor_verify",
  "bank_check_verify",
  "documents_verified",
  "approved",
  "ready_for_delivery",
] as const;

/** Admin: update the tracking step of an application */
export const updateApplicationTrackingStep = async (code: string, step: string) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    if (!TRACKING_STEPS.includes(step as any)) return { success: false, message: "Invalid tracking step" };

    const app = await db.query.installmentApplications.findFirst({
      where: eq(installmentApplications.applicationCode, code),
      columns: { id: true, status: true },
    });
    if (!app) return { success: false, message: "আবেদন পাওয়া যায়নি" };

    const updates: any = { trackingStep: step };
    if (step === "processing" && app.status === "pending") updates.status = "under_review";
    if (step === "approved") updates.status = "approved";

    await db.update(installmentApplications).set(updates).where(eq(installmentApplications.id, app.id));
    revalidatePath("/installments");
    return { success: true, message: "ট্র্যাকিং আপডেট হয়েছে" };
  } catch (error) {
    console.error("updateApplicationTrackingStep error:", error);
    return { success: false, message: "আপডেট করা যায়নি" };
  }
};

/** Customer: get own application with tracking info */
export const getMyApplicationByCode = async (code: string) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const app = await db.query.installmentApplications.findFirst({
      where: eq(installmentApplications.applicationCode, code),
    });
    if (!app || app.customerId !== session.customer.customerId) {
      return { success: false, message: "আবেদন পাওয়া যায়নি" };
    }

    let photoUrl: string | null = null;
    if (app.photoKey) {
      try { photoUrl = await getObjectUrl(app.photoKey); } catch {}
    }

    return { success: true, data: { ...app, photoUrl } };
  } catch (error) {
    console.error("getMyApplicationByCode error:", error);
    return { success: false, message: "আবেদন আনা যায়নি" };
  }
};

/** Customer claims they paid an installment (admin verifies later). */
export const claimInstallmentPayment = async (input: {
  planCode: string;
  scheduleId: string;
  paymentMethod: "bkash" | "nagad" | "rocket";
  transactionId: string;
  paymentNumber: string;
}) => {
  try {
    const session = await verifyCustomerSession();
    if (!session.isAuth || !session.customer) return UNAUTHORIZED;

    const plan = await db.query.installmentPlans.findFirst({
      where: eq(installmentPlans.planCode, input.planCode),
    });
    if (!plan || plan.customerId !== session.customer.customerId)
      return { success: false, message: "প্ল্যান পাওয়া যায়নি" };

    const row = await db.query.installmentSchedule.findFirst({
      where: and(
        eq(installmentSchedule.id, input.scheduleId),
        eq(installmentSchedule.planId, plan.id),
      ),
    });
    if (!row) return { success: false, message: "কিস্তি পাওয়া যায়নি" };
    if (row.status === "paid") return { success: false, message: "এই কিস্তি ইতোমধ্যে পরিশোধিত" };
    if (row.status === "claimed") return { success: false, message: "এই কিস্তির পেমেন্ট ইতোমধ্যে জমা দেওয়া হয়েছে, যাচাইয়ের অপেক্ষায়" };

    await db
      .update(installmentSchedule)
      .set({
        status: "claimed",
        paymentMethod: input.paymentMethod,
        transactionId: input.transactionId.trim(),
        paymentNumber: input.paymentNumber.trim(),
      })
      .where(eq(installmentSchedule.id, input.scheduleId));

    revalidatePath("/installments");
    revalidatePath(`/customer/installments/${input.planCode}`);
    return { success: true, message: "পেমেন্ট তথ্য সফলভাবে জমা হয়েছে। যাচাই করে নিশ্চিত করা হবে।" };
  } catch (error) {
    console.error("claimInstallmentPayment error:", error);
    return { success: false, message: "পেমেন্ট তথ্য জমা দেওয়া যায়নি" };
  }
};

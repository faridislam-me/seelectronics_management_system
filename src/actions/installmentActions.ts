"use server";

import { db } from "@/db/drizzle";
import {
  customers,
  installmentPlans,
  installmentSchedule,
} from "@/db/schema";
import { verifySession } from "@/lib";
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
    .preprocess((v) => (v === "" ? undefined : v), z.enum(["ips", "battery", "stabilizer", "others"]).optional()),
  productModel: z.string().min(1, "Product model is required"),
  serialNumber: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
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
});

export const markInstallmentPaid = async (input: z.input<typeof MarkPaidSchema>) => {
  try {
    if (!(await requireAdmin())) return UNAUTHORIZED;
    const parsed = MarkPaidSchema.safeParse(input);
    if (!parsed.success) return { success: false, message: "Invalid input" };
    const { scheduleId, paidAmount, paymentMethod, transactionId } = parsed.data;

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

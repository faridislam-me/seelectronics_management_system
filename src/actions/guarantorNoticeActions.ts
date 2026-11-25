"use server";

import { notifyCustomer } from "@/actions/notificationActions";
import { db } from "@/db/drizzle";
import {
  customers,
  guarantorNotices,
  installmentPlans,
  installmentSchedule,
} from "@/db/schema";
import { verifySession } from "@/lib";
import {
  GUARANTOR_NOTICE_LEVELS,
  GUARANTOR_NOTICE_LEVEL_META,
  computeGuarantorDues,
  guarantorDeadline,
  guarantorNoticePath,
  guarantorNoticeSms,
} from "@/lib/guarantorNotice";
import { sendSMS } from "@/lib/sms";
import { getBaseUrl } from "@/utils";
import { randomBytes } from "crypto";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UNAUTHORIZED = { success: false as const, message: "Unauthorized" };

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

/** e.g. GN-2611-7F3A9C — year/month + 6 random hex chars. */
const newNoticeNo = (now: Date) => {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  return `GN-${yy}${mm}-${randomBytes(3).toString("hex").toUpperCase()}`;
};

/** History of notices sent to a plan's guarantor, newest first (admin only). */
export const getGuarantorNotices = async (planCode: string) => {
  try {
    if (!(await requireAdmin())) return { ...UNAUTHORIZED, data: [] };
    const rows = await db
      .select()
      .from(guarantorNotices)
      .where(eq(guarantorNotices.planCode, planCode))
      .orderBy(desc(guarantorNotices.createdAt));
    return { success: true as const, data: rows };
  } catch (error) {
    // Also reached when the guarantor_notices table has not been created yet —
    // the plan page must keep working, so this degrades to an empty history.
    console.error("getGuarantorNotices error:", error);
    return { success: false as const, message: "নোটিশের তালিকা আনা যায়নি", data: [] };
  }
};

const SendSchema = z.object({
  planCode: z.string().min(1),
  level: z.enum(GUARANTOR_NOTICE_LEVELS),
  body: z.string().trim().min(20, "নোটিশের লেখা খুব ছোট").max(6000, "নোটিশের লেখা খুব বড়"),
  deadlineDays: z.coerce.number().int().min(0).max(90).optional(),
});

/**
 * Admin sends a notice to an installment plan's guarantor. The notice row is
 * saved first; the SMS (with a link to the public notice document) and the
 * in-app notification (when the guarantor's phone belongs to a customer
 * account) are best-effort and never undo the saved notice.
 */
export const sendGuarantorNotice = async (input: z.input<typeof SendSchema>) => {
  try {
    const admin = await requireAdmin();
    if (!admin) return UNAUTHORIZED;

    const parsed = SendSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false as const, message: parsed.error.issues[0]?.message || "ভুল তথ্য" };
    }
    const { planCode, level, body, deadlineDays } = parsed.data;

    const plan = await db.query.installmentPlans.findFirst({
      where: eq(installmentPlans.planCode, planCode),
    });
    if (!plan) return { success: false as const, message: "প্ল্যান পাওয়া যায়নি" };

    const guarantorPhone = (plan.guarantorPhone || "").trim();
    if (!guarantorPhone) {
      return { success: false as const, message: "এই প্ল্যানে জামিনদারের মোবাইল নম্বর নেই" };
    }

    const schedule = await db
      .select()
      .from(installmentSchedule)
      .where(eq(installmentSchedule.planId, plan.id));

    const now = new Date();
    const dues = computeGuarantorDues(schedule, now);
    const token = randomBytes(12).toString("hex");

    const [notice] = await db
      .insert(guarantorNotices)
      .values({
        token,
        noticeNo: newNoticeNo(now),
        planId: plan.id,
        planCode: plan.planCode,
        level,
        guarantorName: plan.guarantorName,
        guarantorPhone,
        guarantorAddress: plan.guarantorAddress,
        customerName: plan.customerName,
        customerPhone: plan.customerPhone,
        productModel: plan.productModel,
        body,
        dueAmount: dues.dueAmount,
        dueCount: dues.dueCount,
        remainingAmount: dues.remainingAmount,
        deadlineDate: deadlineDays != null ? guarantorDeadline(deadlineDays, now) : null,
        createdBy: admin.userId,
      })
      .returning();

    const path = guarantorNoticePath(token);
    const url = `${getBaseUrl().replace(/\/$/, "")}${path}`;
    const smsText = guarantorNoticeSms({
      level,
      customerName: plan.customerName,
      planCode: plan.planCode,
      dueAmount: dues.dueAmount,
      url,
    });

    // 1) SMS to the guarantor's mobile — a gateway failure keeps the saved notice.
    let smsSent = false;
    let smsError: string | null = null;
    try {
      await sendSMS(guarantorPhone, smsText);
      smsSent = true;
    } catch (error) {
      smsError = error instanceof Error ? error.message : String(error);
      console.error(`Guarantor notice SMS failed (${notice.noticeNo}):`, error);
    }

    // 2) In-app notification when the guarantor's phone belongs to a customer
    //    account (compared on the last 10 digits so +88 / 88 / 0 prefixes match).
    let guarantorCustomerId: string | null = null;
    try {
      const last10 = guarantorPhone.replace(/\D/g, "").slice(-10);
      if (last10.length === 10) {
        const account = await db.query.customers.findFirst({
          where: sql`right(regexp_replace(${customers.phone}, '[^0-9]', '', 'g'), 10) = ${last10}`,
          columns: { customerId: true, phone: true },
        });
        if (account) {
          const res = await notifyCustomer({
            customerId: account.customerId,
            phoneNumber: account.phone,
            type: "guarantor_notice",
            message: `${GUARANTOR_NOTICE_LEVEL_META[level].title}: আপনি ${plan.customerName}-এর কিস্তির (${plan.planCode}) জামিনদার। বকেয়া ৳${dues.dueAmount}। নোটিশটি দেখতে ও ডাউনলোড করতে এখানে ট্যাপ করুন।`,
            link: path,
            // The SMS above already went to this number.
            sendSms: false,
          });
          if (res.success) guarantorCustomerId = account.customerId;
        }
      }
    } catch (error) {
      console.error(`Guarantor notice in-app notification failed (${notice.noticeNo}):`, error);
    }

    try {
      await db
        .update(guarantorNotices)
        .set({ smsSent, smsError, guarantorCustomerId })
        .where(eq(guarantorNotices.id, notice.id));
    } catch (error) {
      console.error(`Guarantor notice delivery-status update failed (${notice.noticeNo}):`, error);
    }

    revalidatePath(`/installments/${plan.planCode}`);

    return {
      success: true as const,
      message: smsSent
        ? `নোটিশ পাঠানো হয়েছে${guarantorCustomerId ? " (SMS + অ্যাকাউন্ট)" : " (SMS)"}`
        : "নোটিশ সংরক্ষিত হয়েছে, কিন্তু SMS পাঠানো যায়নি — লিংকটি কপি করে পাঠান",
      data: { token, noticeNo: notice.noticeNo, smsSent, inApp: !!guarantorCustomerId, url },
    };
  } catch (error) {
    console.error("sendGuarantorNotice error:", error);
    return { success: false as const, message: "নোটিশ পাঠানো যায়নি" };
  }
};

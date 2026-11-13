import { db } from "@/db/drizzle";
import { installmentPlans, installmentSchedule } from "@/db/schema";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { sendSMS } from "@/lib/sms";
import { sendVoiceCall } from "@/lib/mram";

// MRAM voice-call broadcast campaigns for an upcoming কিস্তি (installment) due.
// Client-supplied broadcast ids (2026-11-13): 3315 plays "কিস্তি ৩ দিন বাকি",
// 3316 plays "কিস্তি আগামীকাল"। With these set the daily cron places the recorded
// voice call alongside the reminder SMS. Set a value back to 0 to mute that call.
export const INSTALLMENT_VOICE_3DAY = 3315;
export const INSTALLMENT_VOICE_1DAY = 3316;

/** The upcoming-কিস্তি reminder SMS, Bangla, with amount / number / date / model / plan code. */
export const installmentDueSms = (p: {
  installmentNo: number;
  productModel: string;
  amount: number;
  date: string;
  planCode: string;
}) =>
  `SE Electronics: আপনার কিস্তি #${p.installmentNo} (${p.productModel}) এর ৳${p.amount} পরিশোধের শেষ তারিখ ${p.date}. অনুগ্রহ করে সময়মতো পরিশোধ করুন। কিস্তি: ${p.planCode}`;

/**
 * Sends one reminder SMS (and, once ids are set, one voice call) for every
 * still-pending installment of an ACTIVE plan whose due date is exactly 3 or 1
 * whole days from today. `remindedAt` guards against double-sends: a row is
 * reminded at most once per calendar day, so the 3-day and the 1-day reminder
 * each go out once even though this runs daily.
 *
 * Each send is wrapped so one bad number never aborts the batch. Returns how
 * many rows were processed and how many SMS / voice calls actually went out.
 */
export async function notifyInstallmentDue(now = new Date()) {
  // Whole-day gap between the due date and today. Both are cast to ::date so the
  // time-of-day is irrelevant; only 3 and 1 pass the filter.
  const daysUntilDue = sql<number>`(${installmentSchedule.dueDate}::date - ${now}::date)`;

  const rows = await db
    .select({
      scheduleId: installmentSchedule.id,
      installmentNo: installmentSchedule.installmentNo,
      dueDate: installmentSchedule.dueDate,
      amount: installmentSchedule.amount,
      daysUntil: daysUntilDue,
      customerPhone: installmentPlans.customerPhone,
      productModel: installmentPlans.productModel,
      planCode: installmentPlans.planCode,
    })
    .from(installmentSchedule)
    .innerJoin(
      installmentPlans,
      eq(installmentSchedule.planId, installmentPlans.id),
    )
    .where(
      and(
        eq(installmentSchedule.status, "pending"),
        eq(installmentPlans.status, "active"),
        sql`(${installmentSchedule.dueDate}::date - ${now}::date) IN (1, 3)`,
        or(
          isNull(installmentSchedule.remindedAt),
          sql`${installmentSchedule.remindedAt}::date < ${now}::date`,
        ),
      ),
    );

  let sms = 0;
  let voice = 0;

  for (const row of rows) {
    const date = new Date(row.dueDate).toLocaleDateString("en-GB", {
      timeZone: "Asia/Dhaka",
    });
    const message = installmentDueSms({
      installmentNo: row.installmentNo,
      productModel: row.productModel,
      amount: row.amount,
      date,
      planCode: row.planCode,
    });

    try {
      await sendSMS(row.customerPhone, message);
      sms++;
    } catch (error) {
      console.error(
        `Installment reminder SMS failed (schedule ${row.scheduleId}):`,
        error,
      );
    }

    // Voice stays dormant until the matching const is given a real broadcast id.
    const broadcastId =
      Number(row.daysUntil) === 3 ? INSTALLMENT_VOICE_3DAY : INSTALLMENT_VOICE_1DAY;
    if (broadcastId > 0) {
      try {
        await sendVoiceCall(
          row.customerPhone,
          broadcastId,
          "Installment Reminder",
        );
        voice++;
      } catch (error) {
        console.error(
          `Installment reminder voice failed (schedule ${row.scheduleId}):`,
          error,
        );
      }
    }

    try {
      await db
        .update(installmentSchedule)
        .set({ remindedAt: now })
        .where(eq(installmentSchedule.id, row.scheduleId));
    } catch (error) {
      console.error(
        `Installment reminder remindedAt update failed (schedule ${row.scheduleId}):`,
        error,
      );
    }
  }

  return { processed: rows.length, sms, voice };
}

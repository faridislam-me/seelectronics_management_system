import {
  installmentDueSms,
  notifyInstallmentDue,
} from "@/lib/installmentReminder";
import { verifySession } from "@/lib";
import { sendSMS } from "@/lib/sms";
import { NextResponse } from "next/server";

/**
 * Daily Vercel cron (see vercel.json): reminds every customer whose কিস্তি
 * (installment) falls due in 3 days or 1 day. Vercel sends
 * "Authorization: Bearer CRON_SECRET" when CRON_SECRET is set; without it only
 * the Vercel cron user agent is accepted, so a stray visit cannot fire reminders.
 *
 * `?test=<phone>` (logged-in admin only) sends ONE sample reminder SMS to that
 * phone right away, bypassing the 3-day / 1-day window, so the flow can be
 * verified on demand without waiting for a real due date.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const testPhone = url.searchParams.get("test");
  if (testPhone) {
    const session = await verifySession(false, "admin");
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    try {
      const sms = installmentDueSms({
        installmentNo: 3,
        productModel: "SEPI1050 VA DSP SINE WAVE IPS",
        amount: 2500,
        date: new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Dhaka" }),
        planCode: "KST-TEST01",
      });
      await sendSMS(testPhone, sms);
      return NextResponse.json({ success: true, test: true, phone: testPhone });
    } catch (error) {
      console.error("Installment due test error:", error);
      return NextResponse.json(
        { success: false, message: "Internal Server Error" },
        { status: 500 },
      );
    }
  }

  const secret = process.env.CRON_SECRET;
  const allowed = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : (request.headers.get("user-agent") || "").includes("vercel-cron");
  if (!allowed) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  try {
    const counts = await notifyInstallmentDue();
    return NextResponse.json({ success: true, ...counts });
  } catch (error) {
    console.error("Installment due cron error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}

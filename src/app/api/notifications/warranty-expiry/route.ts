import { notifyWarrantyExpired, warrantyExpirySms, warrantyVoiceId } from "@/lib/warrantyExpiry";
import { verifySession } from "@/lib";
import { NextResponse } from "next/server";

/**
 * Daily Vercel cron (see vercel.json): SMS + voice call to customers whose
 * warranty ended yesterday. Vercel sends "Authorization: Bearer CRON_SECRET"
 * when CRON_SECRET is set; without it only the Vercel cron user agent is
 * accepted, so a stray visit cannot re-send the messages.
 *
 * `?test=<phone>` (logged-in admin only) sends ONE warranty-expiry SMS + voice
 * to that phone right away, bypassing the "expired yesterday" window, so the
 * flow can be verified on demand without waiting for a real expiry.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const testPhone = url.searchParams.get("test");
  if (testPhone) {
    const session = await verifySession(false, "admin");
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    try {
      // ?months=24 tests the 24-month (IPS/stabilizer) voice; anything else tests
      // the other-products voice. Defaults to 24.
      const months = Number(url.searchParams.get("months")) || 24;
      const broadcastId = warrantyVoiceId(months);
      const { notifyCustomerBySmsAndCall } = await import("@/lib/customerBlock");
      const sms = warrantyExpirySms("গ্রাহক", "SEPI1050 VA DSP SINE WAVE IPS");
      await notifyCustomerBySmsAndCall(testPhone, sms, [], "Warranty Expiry TEST", broadcastId);
      return NextResponse.json({ success: true, test: true, phone: testPhone, months, broadcastId });
    } catch (error) {
      console.error("Warranty expiry test error:", error);
      return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
  }

  const secret = process.env.CRON_SECRET;
  const allowed = secret
    ? request.headers.get("authorization") === `Bearer ${secret}`
    : (request.headers.get("user-agent") || "").includes("vercel-cron");
  if (!allowed) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await notifyWarrantyExpired());
  } catch (error) {
    console.error("Warranty expiry cron error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

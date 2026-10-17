import { notifyWarrantyExpired } from "@/lib/warrantyExpiry";
import { NextResponse } from "next/server";

/**
 * Daily Vercel cron (see vercel.json): SMS + voice call to customers whose
 * warranty ended yesterday. Vercel sends "Authorization: Bearer CRON_SECRET"
 * when CRON_SECRET is set; without it only the Vercel cron user agent is
 * accepted, so a stray visit cannot re-send the messages.
 */
export async function GET(request: Request) {
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

import { reconcileRecharges } from "@/lib/rechargeReconcile";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Recharge reconciliation + auto-refund cron.
 *
 * Re-checks recharges still marked "completed" against SuccessTopup's
 * authoritative /api/status endpoint and returns the money (to staff or
 * customer) for any the provider reports as failed/cancelled — then SMS +
 * notifies the payer. See src/lib/rechargeReconcile.ts for the full logic.
 *
 * Scheduled every 15 min in vercel.json. When CRON_SECRET is set, Vercel sends
 * it as `Authorization: Bearer <secret>`; we enforce it so the endpoint can't be
 * triggered anonymously. If CRON_SECRET is unset the endpoint is open (matches
 * the existing notification cron routes), but setting it is recommended.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await reconcileRecharges();
    return NextResponse.json(result);
  } catch (error) {
    console.error("recharge reconcile cron error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}

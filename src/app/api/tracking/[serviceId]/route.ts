import { getLiveTracking } from "@/actions/trackingActions";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Polled by the customer's tracking page every few seconds. */
export async function GET(_req: Request, { params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const res = await getLiveTracking(serviceId);
  if (!res.success) return NextResponse.json({ success: false }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return NextResponse.json(res, { headers: { "Cache-Control": "no-store" } });
}

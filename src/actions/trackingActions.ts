"use server";

import { db } from "@/db/drizzle";
import { serviceStatusHistory, services } from "@/db/schema";
import { verifySession } from "@/lib";
import { getObjectUrl } from "@/lib/s3";
import { desc, eq } from "drizzle-orm";

/**
 * "আমি রওনা দিয়েছি" only adds a status-history row (services.status is updated
 * with the final report), so "on the way" is read from the latest history row,
 * the same way the tracking page decides its current step.
 */
const latestStatus = async (serviceId: string, fallback: string | null) => {
  const [row] = await db
    .select({ status: serviceStatusHistory.status })
    .from(serviceStatusHistory)
    .where(eq(serviceStatusHistory.serviceId, serviceId))
    .orderBy(desc(serviceStatusHistory.createdAt))
    .limit(1);
  return row?.status ?? fallback;
};

const validCoord = (lat: unknown, lng: unknown) =>
  typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

/**
 * Technician's phone posts its position while the job is "staff_departed".
 * Returns stop:true once the status moved on so the sharer can switch itself off.
 */
export async function updateStaffLocation(serviceId: string, lat: number, lng: number) {
  try {
    const session = await verifySession(false);
    if (!session || session.role !== "staff") return { success: false as const, stop: true, message: "Unauthorized" };
    if (!validCoord(lat, lng)) return { success: false as const, stop: false, message: "Invalid location" };

    const [row] = await db
      .select({ staffId: services.staffId, status: services.status })
      .from(services)
      .where(eq(services.serviceId, serviceId))
      .limit(1);
    if (!row || row.staffId !== session.userId) return { success: false as const, stop: true, message: "Not your service" };
    if ((await latestStatus(serviceId, row.status)) !== "staff_departed") return { success: true as const, stop: true };

    await db
      .update(services)
      .set({ staffLat: lat, staffLng: lng, staffLocationAt: new Date() })
      .where(eq(services.serviceId, serviceId));
    return { success: true as const, stop: false };
  } catch (error) {
    console.error("updateStaffLocation failed:", error);
    return { success: false as const, stop: false, message: "Could not update location" };
  }
}

/**
 * Public read (the tracking link from the customer's SMS has no login). Only
 * returns positions while the technician is on the way; after arrival the
 * coordinates are not exposed any more.
 */
export async function getLiveTracking(serviceId: string) {
  try {
    const row = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
      columns: {
        status: true,
        type: true,
        staffLat: true,
        staffLng: true,
        staffLocationAt: true,
        customerLat: true,
        customerLng: true,
      },
      with: { appointedStaff: { columns: { name: true, phone: true, photoKey: true, role: true } } },
    });
    if (!row) return { success: false as const };

    const currentStatus = await latestStatus(serviceId, row.status);
    const active = currentStatus === "staff_departed";
    let photoUrl: string | null = null;
    if (row.appointedStaff?.photoKey) {
      try {
        photoUrl = await getObjectUrl(row.appointedStaff.photoKey);
      } catch {
        photoUrl = null;
      }
    }
    return {
      success: true as const,
      data: {
        active,
        status: currentStatus,
        type: row.type,
        staff: row.appointedStaff ? { name: row.appointedStaff.name, phone: row.appointedStaff.phone, role: row.appointedStaff.role, photoUrl } : null,
        staffPos: active && row.staffLat != null && row.staffLng != null ? { lat: row.staffLat, lng: row.staffLng, at: row.staffLocationAt?.toISOString() ?? null } : null,
        customerPos: active && row.customerLat != null && row.customerLng != null ? { lat: row.customerLat, lng: row.customerLng } : null,
      },
    };
  } catch (error) {
    console.error("getLiveTracking failed:", error);
    return { success: false as const };
  }
}

/**
 * Customer gives their location from the tracking page (link from the SMS, no login) so the
 * technician's route can end at them. Only while the job is open, and only if no pin exists yet.
 */
export async function saveCustomerLocation(serviceId: string, lat: number, lng: number) {
  try {
    if (!validCoord(lat, lng)) return { success: false as const, message: "লোকেশন সঠিক নয়" };
    const [row] = await db
      .select({ status: services.status, customerLat: services.customerLat })
      .from(services)
      .where(eq(services.serviceId, serviceId))
      .limit(1);
    if (!row) return { success: false as const, message: "সার্ভিস পাওয়া যায়নি" };
    if (row.status === "completed" || row.status === "canceled") return { success: false as const, message: "এই সার্ভিস শেষ হয়ে গেছে" };
    if (row.customerLat != null) return { success: true as const };
    await db.update(services).set({ customerLat: lat, customerLng: lng }).where(eq(services.serviceId, serviceId));
    return { success: true as const };
  } catch (error) {
    console.error("saveCustomerLocation failed:", error);
    return { success: false as const, message: "লোকেশন সেভ করা যায়নি" };
  }
}

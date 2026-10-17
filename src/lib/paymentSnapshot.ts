import "server-only";
import { db } from "@/db/drizzle";
import { services } from "@/db/schema";
import { eq } from "drizzle-orm";

/** Customer name / phone / address of a job, stored on a payment so it survives the service being deleted. */
export async function serviceCustomerSnapshot(serviceId?: string | null) {
  if (!serviceId) return {};
  const s = await db.query.services.findFirst({
    where: eq(services.serviceId, serviceId),
    columns: { customerName: true, customerPhone: true, customerAddress: true, customerAddressPoliceStation: true, customerAddressDistrict: true },
  });
  if (!s) return {};
  return {
    customerName: s.customerName || null,
    customerPhone: s.customerPhone || null,
    customerAddress: [s.customerAddress, s.customerAddressPoliceStation, s.customerAddressDistrict].filter(Boolean).join(", ") || null,
  };
}

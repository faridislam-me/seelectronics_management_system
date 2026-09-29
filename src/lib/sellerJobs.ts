import "server-only";
import { inWarranty, payKind } from "@/components/features/sellers/sellerShared";
import type { SellerJob } from "@/components/features/sellers/SellerJobsClient";
import type { SellerPortalData } from "./sellerPortal";

/** Flattens the seller's customers' services into list rows with payment / warranty info. */
export function sellerJobs(data: SellerPortalData) {
  const jobs: SellerJob[] = [];
  for (const c of data.seller.customers as any[]) {
    const pay = payKind(c.invoice);
    const warranty = inWarranty(c.isWarrantyStopped, c.invoice?.products);
    for (const s of c.services) {
      jobs.push({
        serviceId: s.serviceId, status: s.status, type: s.type, productType: s.productType, productModel: s.productModel,
        staffName: s.staffName, staffPhone: s.staffPhone ?? null, reportedIssue: s.reportedIssue ?? null, createdAt: s.createdAt,
        customerName: c.name, customerPhone: c.phone, customerId: c.customerId, pay, warranty,
        history: (s.statusHistory ?? []).map((h: any) => ({ status: h.status, createdAt: h.createdAt })),
      });
    }
  }
  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const repairs = jobs.filter((j) => j.type !== "install");
  const installs = jobs.filter((j) => j.type === "install");
  return { repairs, installs, counts: { sales: data.seller.customers.length, services: repairs.length, installs: installs.length } };
}

"use server";

import { SERVICE_CHARGE_METHODS, SERVICE_CHARGE_REASONS, type ServiceChargeReason, serviceChargeReasonLabel } from "@/constants/serviceCharges";
import { db } from "@/db/drizzle";
import { customers, sellers, serviceCharges, services } from "@/db/schema";
import { verifySession } from "@/lib";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { notifyCustomer, notifySeller } from "./notificationActions";

const money = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

/** Everything a dashboard needs about one service's charge (null when none). */
export async function getServiceCharge(serviceId: string) {
  try {
    const session = await verifySession(false);
    if (!session) return { success: false as const, message: "Unauthorized" };
    const charge = await db.query.serviceCharges.findFirst({
      where: eq(serviceCharges.serviceId, serviceId),
      with: { seller: { columns: { sellerId: true, shopName: true, phone: true } } },
    });
    if (charge && session.role === "customer" && charge.customerId !== session.userId) return { success: false as const, message: "Unauthorized" };
    if (charge && session.role === "seller" && charge.sellerId !== session.userId) return { success: false as const, message: "Unauthorized" };
    return { success: true as const, data: charge ?? null };
  } catch (error) {
    console.error(error);
    return { success: false as const, message: "Could not load the service charge" };
  }
}

/** Which seller is accountable for a service: the seller on the invoice of the serviced unit, else the customer's seller. */
async function sellerForService(service: { customerId: string | null; productType: string; productModel: string }) {
  if (!service.customerId) return null;
  const { sellerForCustomerUnit } = await import("./sellerActions");
  const byUnit = await sellerForCustomerUnit(service.customerId, service.productType, service.productModel);
  if (byUnit?.sellerId) return byUnit.sellerId;
  const owner = await db.query.customers.findFirst({ where: eq(customers.customerId, service.customerId), columns: { sellerId: true } });
  return owner?.sellerId ?? null;
}

const revalidate = () => {
  for (const p of ["/services", "/installs", "/seller/customers", "/seller/services", "/seller/installs", "/seller/profile", "/customer/services", "/customer/products", "/customer/profile"]) revalidatePath(p, "layout");
};

/**
 * Admin records (or edits) the charge for a service job. The customer and the
 * accountable seller are both told how much is owed and why.
 */
export async function setServiceCharge(serviceId: string, input: { amount: number; reason: ServiceChargeReason; note?: string }) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, message: "Enter a charge amount greater than 0" };
    if (!(input.reason in SERVICE_CHARGE_REASONS)) return { success: false, message: "Pick a reason for the charge" };

    const service = await db.query.services.findFirst({
      where: eq(services.serviceId, serviceId),
      columns: { serviceId: true, customerId: true, customerName: true, customerPhone: true, productType: true, productModel: true, type: true },
    });
    if (!service) return { success: false, message: "Service not found" };

    const existing = await db.query.serviceCharges.findFirst({ where: eq(serviceCharges.serviceId, serviceId) });
    const sellerId = existing?.sellerId ?? (await sellerForService(service));
    const note = input.note?.trim() || null;

    let paidAmount = existing?.paidAmount ?? 0;
    const status = existing?.status === "waived" ? "due" : paidAmount >= amount ? "paid" : "due";
    if (existing) {
      await db.update(serviceCharges).set({ amount, reason: input.reason, note, status, sellerId }).where(eq(serviceCharges.serviceId, serviceId));
    } else {
      paidAmount = 0;
      await db.insert(serviceCharges).values({ serviceId, customerId: service.customerId, sellerId, amount, reason: input.reason, note, status: "due", createdBy: String(session.userId) });
    }

    const due = Math.max(0, amount - paidAmount);
    const why = serviceChargeReasonLabel(input.reason);
    const unit = `${service.productType.toUpperCase()} ${service.productModel}`;
    if (!existing && due > 0) {
      if (service.customerId) {
        await notifyCustomer({
          customerId: service.customerId,
          phoneNumber: service.customerPhone,
          type: "service_charge",
          message: `SE Electronics: আপনার ${unit} এর সার্ভিস (#${serviceId}) এর জন্য সার্ভিস চার্জ ${money(amount)} (${why})। অনুগ্রহ করে পরিশোধ করুন।`,
          link: `/customer/services/${serviceId}`,
        });
      }
      if (sellerId) {
        const seller = await db.query.sellers.findFirst({ where: eq(sellers.sellerId, sellerId), columns: { phone: true } });
        await notifySeller({
          sellerId,
          phoneNumber: seller?.phone,
          type: "service_charge",
          message: `SE Electronics: আপনার কাস্টমার ${service.customerName} এর ${unit} সার্ভিস (#${serviceId}) এ সার্ভিস চার্জ ${money(amount)} ধরা হয়েছে (${why})। বাকি ${money(due)}।`,
          link: "/seller/services",
        });
      }
    }
    revalidate();
    return { success: true, message: existing ? "Service charge updated" : "Service charge added" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not save the service charge" };
  }
}

/** Admin collects (part of) a charge. Status flips to paid once the full amount is in. */
export async function collectServiceCharge(serviceId: string, input: { amount: number; method: string }) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) return { success: false, message: "Enter an amount greater than 0" };
    const method = (SERVICE_CHARGE_METHODS as readonly string[]).includes(input.method) ? input.method : "cash";

    const charge = await db.query.serviceCharges.findFirst({ where: eq(serviceCharges.serviceId, serviceId), with: { service: { columns: { customerName: true, customerPhone: true, productType: true, productModel: true } } } });
    if (!charge) return { success: false, message: "No service charge on this job" };
    if (charge.status === "waived") return { success: false, message: "This charge was waived" };
    const remaining = Math.max(0, charge.amount - charge.paidAmount);
    if (amount > remaining + 0.01) return { success: false, message: `Only ${money(remaining)} is still due` };

    const paidAmount = charge.paidAmount + amount;
    const paid = paidAmount >= charge.amount - 0.01;
    await db.update(serviceCharges).set({ paidAmount, status: paid ? "paid" : "due", paymentMethod: method, paidAt: new Date() }).where(eq(serviceCharges.serviceId, serviceId));

    const left = Math.max(0, charge.amount - paidAmount);
    const unit = `${charge.service?.productType?.toUpperCase() ?? ""} ${charge.service?.productModel ?? ""}`.trim();
    if (charge.customerId) {
      await notifyCustomer({
        customerId: charge.customerId,
        phoneNumber: charge.service?.customerPhone ?? "",
        type: "service_charge_paid",
        message: `SE Electronics: সার্ভিস #${serviceId} এর চার্জ ${money(amount)} গ্রহণ করা হয়েছে (${method.toUpperCase()})। ${paid ? "সম্পূর্ণ পরিশোধিত, ধন্যবাদ।" : `বাকি ${money(left)}।`}`,
        link: `/customer/services/${serviceId}`,
      });
    }
    if (charge.sellerId) {
      await notifySeller({
        sellerId: charge.sellerId,
        type: "service_charge_paid",
        message: `${charge.service?.customerName ?? "কাস্টমার"} এর ${unit} সার্ভিস (#${serviceId}) চার্জ ${money(amount)} জমা হয়েছে। ${paid ? "সম্পূর্ণ পরিশোধিত।" : `বাকি ${money(left)}।`}`,
        link: "/seller/services",
      });
    }
    revalidate();
    return { success: true, message: paid ? "Charge fully paid" : `Received ${money(amount)}, ${money(left)} still due` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not record the payment" };
  }
}

/** Admin waives whatever is still owed (keeps the record for history). */
export async function waiveServiceCharge(serviceId: string) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    const charge = await db.query.serviceCharges.findFirst({ where: eq(serviceCharges.serviceId, serviceId) });
    if (!charge) return { success: false, message: "No service charge on this job" };
    await db.update(serviceCharges).set({ status: "waived" }).where(eq(serviceCharges.serviceId, serviceId));
    if (charge.sellerId) {
      await notifySeller({ sellerId: charge.sellerId, type: "service_charge_waived", message: `সার্ভিস #${serviceId} এর বাকি চার্জ মওকুফ করা হয়েছে।`, link: "/seller/services" });
    }
    revalidate();
    return { success: true, message: "Charge waived" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not waive the charge" };
  }
}

/** Admin removes a charge that was added by mistake. */
export async function removeServiceCharge(serviceId: string) {
  try {
    const session = await verifySession(false, "admin");
    if (!session) return { success: false, message: "Unauthorized" };
    await db.delete(serviceCharges).where(eq(serviceCharges.serviceId, serviceId));
    revalidate();
    return { success: true, message: "Charge removed" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Could not remove the charge" };
  }
}

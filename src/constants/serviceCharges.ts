/** Why a service job is chargeable. Stored as the `reason` of a service charge. */
export const SERVICE_CHARGE_REASONS = {
  out_of_warranty: { label: "ওয়ারেন্টি শেষ", english: "Out of warranty" },
  out_of_city: { label: "শহরের বাইরে ভিজিট", english: "Visit outside the city" },
  parts: { label: "পার্টস / যন্ত্রাংশ", english: "Parts replaced" },
  other: { label: "অন্যান্য", english: "Other" },
} as const;

export type ServiceChargeReason = keyof typeof SERVICE_CHARGE_REASONS;

export const SERVICE_CHARGE_METHODS = ["cash", "bkash", "nagad", "rocket", "bank"] as const;

export type ServiceChargeStatus = "due" | "paid" | "waived";

/** Shape every portal needs to show a charge (amount, how much is still owed, why). */
export type ServiceChargeInfo = {
  amount: number;
  paidAmount: number;
  status: ServiceChargeStatus;
  reason: string;
  note: string | null;
  paidAt: Date | null;
  paymentMethod: string | null;
  sellerId: string | null;
};

export const serviceChargeDue = (c: { amount: number; paidAmount: number; status: string } | null | undefined) =>
  c && c.status === "due" ? Math.max(0, c.amount - c.paidAmount) : 0;

export const serviceChargeReasonLabel = (reason: string) =>
  SERVICE_CHARGE_REASONS[reason as ServiceChargeReason]?.label ?? reason;

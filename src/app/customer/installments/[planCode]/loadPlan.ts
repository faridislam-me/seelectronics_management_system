import { getMyInstallmentPlanByCode } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { notFound, redirect } from "next/navigation";

/**
 * Shared loader for the customer plan pages (detail + payment): requires a
 * customer session and returns the caller's own plan data, or 404s.
 */
export async function loadMyInstallmentPlan(planCode: string) {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyInstallmentPlanByCode(planCode);
  if (!res.success || !("data" in res) || !res.data) notFound();
  return res.data;
}

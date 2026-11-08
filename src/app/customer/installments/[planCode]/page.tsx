import { getMyInstallmentPlanByCode } from "@/actions/installmentActions";
import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import CustomerInstallmentDetail from "@/components/features/installments/CustomerInstallmentDetail";
import { notFound, redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CustomerInstallmentDetailPage({
  params,
}: {
  params: Promise<{ planCode: string }>;
}) {
  const { planCode } = await params;
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const res = await getMyInstallmentPlanByCode(planCode);
  if (!res.success || !("data" in res) || !res.data) notFound();

  return (
    <CustomerLayout>
      <CustomerInstallmentDetail data={res.data} />
    </CustomerLayout>
  );
}

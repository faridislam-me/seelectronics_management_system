import { CustomerLayout } from "@/components/layout";
import CustomerInstallmentPayment from "@/components/features/installments/CustomerInstallmentPayment";
import InstallmentLockedNotice from "@/components/features/installments/InstallmentLockedNotice";
import { loadMyInstallmentPlan } from "../loadPlan";

export const dynamic = "force-dynamic";

export default async function CustomerInstallmentPaymentPage({
  params,
}: {
  params: Promise<{ planCode: string }>;
}) {
  const { planCode } = await params;
  const data = await loadMyInstallmentPlan(planCode);

  return (
    <CustomerLayout>
      {data.locked ? (
        <InstallmentLockedNotice backHref="/customer/installments" planCode={data.plan.planCode} />
      ) : (
        <CustomerInstallmentPayment data={data} />
      )}
    </CustomerLayout>
  );
}

import { verifyCustomerSession } from "@/actions/customerActions";
import { getMyInstallmentLockStatus } from "@/actions/installmentActions";
import InstallmentLockedNotice from "@/components/features/installments/InstallmentLockedNotice";
import { CustomerLayout } from "@/components/layout";
import InstallmentApplyForm from "@/components/features/installments/InstallmentApplyForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InstallmentApplyPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  const { locked } = await getMyInstallmentLockStatus();

  return (
    <CustomerLayout>
      {locked ? <InstallmentLockedNotice backHref="/customer/installments" /> : <InstallmentApplyForm />}
    </CustomerLayout>
  );
}

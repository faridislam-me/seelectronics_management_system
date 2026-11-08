import { verifyCustomerSession } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import InstallmentApplyForm from "@/components/features/installments/InstallmentApplyForm";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InstallmentApplyPage() {
  const session = await verifyCustomerSession();
  if (!session.isAuth || !session.customer) redirect("/customer/login");

  return (
    <CustomerLayout>
      <InstallmentApplyForm />
    </CustomerLayout>
  );
}

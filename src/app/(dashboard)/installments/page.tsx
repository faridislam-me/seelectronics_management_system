import { getInstallmentPlans } from "@/actions/installmentActions";
import InstallmentsClient, {
  type InstallmentPlanRow,
} from "@/components/features/installments/InstallmentsClient";

export const dynamic = "force-dynamic";

export default async function InstallmentsPage() {
  const res = await getInstallmentPlans({ limit: "50" });
  const plans = (res.success && Array.isArray(res.data) ? res.data : []) as InstallmentPlanRow[];
  return <InstallmentsClient initialPlans={plans} />;
}

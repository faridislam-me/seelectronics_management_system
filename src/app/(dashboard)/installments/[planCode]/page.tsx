import { getInstallmentPlanByCode } from "@/actions/installmentActions";
import InstallmentPlanDetail from "@/components/features/installments/InstallmentPlanDetail";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InstallmentPlanPage({
  params,
}: {
  params: Promise<{ planCode: string }>;
}) {
  const { planCode } = await params;
  const res = await getInstallmentPlanByCode(planCode);
  if (!res.success || !("data" in res) || !res.data) {
    if ("message" in res && res.message === "Unauthorized") {
      return (
        <div className="p-8 text-center text-gray-500">
          <p>Unauthorized</p>
          <Link href="/installments" className="text-blue-600 underline">← কিস্তি তালিকা</Link>
        </div>
      );
    }
    notFound();
  }

  return <InstallmentPlanDetail data={res.data} />;
}

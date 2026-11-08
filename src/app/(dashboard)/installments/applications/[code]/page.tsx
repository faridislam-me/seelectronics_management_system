import { getInstallmentApplicationByCode } from "@/actions/installmentActions";
import InstallmentApplicationReview from "@/components/features/installments/InstallmentApplicationReview";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InstallmentApplicationDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const res = await getInstallmentApplicationByCode(code);
  if (!res.success || !res.data) notFound();

  return <InstallmentApplicationReview data={res.data} />;
}

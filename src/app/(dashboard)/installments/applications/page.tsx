import { getInstallmentApplications } from "@/actions/installmentActions";
import InstallmentApplicationsList from "@/components/features/installments/InstallmentApplicationsList";

export const dynamic = "force-dynamic";

export default async function InstallmentApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; status?: string }>;
}) {
  const params = await searchParams;
  const res = await getInstallmentApplications({
    query: params?.query,
    status: params?.status,
  });
  const apps = res.success && Array.isArray(res.data) ? res.data : [];

  return <InstallmentApplicationsList apps={apps} />;
}

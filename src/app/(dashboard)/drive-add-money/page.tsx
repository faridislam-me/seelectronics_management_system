import { getAddMoneyRequests } from "@/actions/driveBalanceActions";
import AddMoneyAdminClient from "@/components/features/drive/AddMoneyAdminClient";

export const dynamic = "force-dynamic";

export default async function DriveAddMoneyPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; status?: string }>;
}) {
  const params = await searchParams;
  const res = await getAddMoneyRequests({
    query: params?.query,
    status: params?.status,
  });
  const data = res.success && Array.isArray(res.data) ? res.data : [];

  return <AddMoneyAdminClient requests={data} />;
}

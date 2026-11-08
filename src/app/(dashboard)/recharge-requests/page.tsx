import { getRechargeRequests } from "@/actions/rechargeActions";
import RechargeRequestsClient from "@/components/features/recharge/RechargeRequestsClient";

export const dynamic = "force-dynamic";

export default async function RechargeRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; status?: string }>;
}) {
  const params = await searchParams;
  const res = await getRechargeRequests({
    query: params?.query,
    status: params?.status,
  });
  const data = res.success && Array.isArray(res.data) ? res.data : [];

  return <RechargeRequestsClient requests={data} />;
}

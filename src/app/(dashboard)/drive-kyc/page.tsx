import { getDriveKycRequests } from "@/actions/driveBalanceActions";
import DriveKycClient from "@/components/features/drive/DriveKycClient";

export const dynamic = "force-dynamic";

export default async function DriveKycPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; status?: string }>;
}) {
  const params = await searchParams;
  const res = await getDriveKycRequests({
    query: params?.query,
    status: params?.status,
  });
  const data = res.success && Array.isArray(res.data) ? res.data : [];

  return <DriveKycClient requests={data} />;
}

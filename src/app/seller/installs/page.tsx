import { SellerLayout } from "@/components/layout";
import SellerJobsClient from "@/components/features/sellers/SellerJobsClient";
import { sellerJobs } from "@/lib/sellerJobs";
import { loadSellerPortal } from "@/lib/sellerPortal";

export default async function SellerInstallsPage() {
  const data = await loadSellerPortal();
  const { installs, counts } = sellerJobs(data);
  return (
    <SellerLayout badge={data.stats.inService}>
      <SellerJobsClient kind="install" jobs={installs} counts={counts} />
    </SellerLayout>
  );
}

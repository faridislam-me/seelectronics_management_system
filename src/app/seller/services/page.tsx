import { SellerLayout } from "@/components/layout";
import SellerJobsClient from "@/components/features/sellers/SellerJobsClient";
import { sellerJobs } from "@/lib/sellerJobs";
import { loadSellerPortal } from "@/lib/sellerPortal";

export default async function SellerServicesPage() {
  const data = await loadSellerPortal();
  const { repairs, counts } = sellerJobs(data);
  return (
    <SellerLayout>
      <SellerJobsClient kind="repair" jobs={repairs} counts={counts} />
    </SellerLayout>
  );
}

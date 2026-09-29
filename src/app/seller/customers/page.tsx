import { SellerLayout } from "@/components/layout";
import SellerCustomersClient from "@/components/features/sellers/SellerCustomersClient";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { sellerJobs } from "@/lib/sellerJobs";

export default async function SellerCustomersPage() {
  const data = await loadSellerPortal();
  const { seller, stats } = data;
  const { counts } = sellerJobs(data);
  return (
    <SellerLayout badge={stats.inService}>
      <SellerCustomersClient customers={seller.customers as any} inWarranty={stats.inWarranty} counts={counts} />
    </SellerLayout>
  );
}

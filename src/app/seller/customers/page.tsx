import { SellerLayout } from "@/components/layout";
import SellerSalesClient from "@/components/features/sellers/SellerSalesClient";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { sellerJobs } from "@/lib/sellerJobs";

export default async function SellerSalesPage() {
  const data = await loadSellerPortal();
  const { counts } = sellerJobs(data);
  return (
    <SellerLayout>
      <SellerSalesClient products={data.products} counts={counts} />
    </SellerLayout>
  );
}

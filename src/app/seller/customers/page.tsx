import { SellerLayout } from "@/components/layout";
import SellerCustomersClient from "@/components/features/sellers/SellerCustomersClient";
import { loadSellerPortal } from "@/lib/sellerPortal";

export default async function SellerCustomersPage() {
  const { seller, stats } = await loadSellerPortal();
  return (
    <SellerLayout badge={stats.inService}>
      <SellerCustomersClient customers={seller.customers as any} inWarranty={stats.inWarranty} />
    </SellerLayout>
  );
}

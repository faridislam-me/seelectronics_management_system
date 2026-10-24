import { SellerLayout } from "@/components/layout";
import SellerProductDetailClient from "@/components/features/sellers/SellerProductDetailClient";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { notFound } from "next/navigation";

export default async function SellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { products } = await loadSellerPortal();
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  const siblings = products.filter((p) => p.customerId === product.customerId && p.id !== product.id);
  return (
    <SellerLayout>
      <SellerProductDetailClient product={product} siblings={siblings} />
    </SellerLayout>
  );
}

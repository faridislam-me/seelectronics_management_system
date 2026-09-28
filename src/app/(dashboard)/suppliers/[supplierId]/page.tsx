import { getSupplierDetail } from "@/actions/supplierActions";
import SupplierDetailClient from "@/components/features/suppliers/SupplierDetailClient";
import { notFound } from "next/navigation";

export default async function SupplierDetailPage({ params }: { params: Promise<{ supplierId: string }> }) {
  const { supplierId } = await params;
  const res = await getSupplierDetail(supplierId);
  if (!res.success) {
    if (res.message === "Supplier not found") notFound();
    return <div className="text-center py-4 text-red-600">{res.message}</div>;
  }
  return <SupplierDetailClient supplier={res.data.supplier} ledger={res.data.ledger as any} totals={res.data.totals} />;
}

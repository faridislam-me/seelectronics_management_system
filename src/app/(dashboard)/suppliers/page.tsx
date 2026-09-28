import { getSuppliers } from "@/actions/supplierActions";
import SuppliersClient from "@/components/features/suppliers/SuppliersClient";

export default async function SuppliersPage({ searchParams }: { searchParams?: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp?.q || "";
  const res = await getSuppliers(q);
  if (!res.success) {
    return <div className="text-center py-4 text-red-600">{res.message}</div>;
  }
  return <SuppliersClient rows={res.data} query={q} />;
}

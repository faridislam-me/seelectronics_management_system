import { getSellers, getSellersMetadata } from "@/actions";
import { SellerListClient, SellerToolbarActionButtons, Toolbar } from "@/components";
import { SearchParams, SellersType } from "@/types";

export default async function Sellers({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const sp = await searchParams;
  const [pagination, response] = await Promise.all([getSellersMetadata({ ...sp }), getSellers({ ...sp })]);

  if (!response.success) {
    return <div className="text-center py-4 text-red-600"><p>{response.message}</p></div>;
  }
  const sellers = response.data! as unknown as SellersType[];

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      <Toolbar title="Sellers / Dealers" actions={<SellerToolbarActionButtons />} pagination={pagination} />
      {sellers.length > 0 ? <SellerListClient sellers={sellers} /> : (
        <div className="text-center py-8 text-gray-600"><p>No verified seller yet. Send an application link or add a seller.</p></div>
      )}
    </div>
  );
}

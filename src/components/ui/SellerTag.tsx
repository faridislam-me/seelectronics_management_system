import { Store } from "lucide-react";

/** Small "sold by" tag for admin lists: shop name and seller ID. Renders nothing for direct (non-seller) customers. */
export default function SellerTag({ seller }: { seller?: { sellerId: string; shopName: string } | null }) {
  if (!seller) return null;
  return (
    <span
      title={`Seller: ${seller.shopName} (${seller.sellerId})`}
      className="inline-flex items-center gap-1 self-start rounded-md border border-[#bcd4fb] bg-[#eaf2ff] px-1.5 py-0.5 text-[11px] font-bold text-[#1f5fc9]"
    >
      <Store size={11} />
      {seller.shopName} · {seller.sellerId}
    </span>
  );
}

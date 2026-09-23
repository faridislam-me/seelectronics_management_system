import { SellerLayout } from "@/components/layout";
import { BlueCard, BlueChip, BlueStatGrid } from "@/components/ui";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Banknote, CheckCircle2 } from "lucide-react";

export default async function SellerPurchasesPage() {
  const { seller, stats, due } = await loadSellerPortal();
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-3.5 p-3.5">
        <div className="flex flex-col"><span className="text-lg font-extrabold text-[#16213a]">Purchases from SE Electronics</span><span className="text-xs font-semibold text-[#6b7690]">{seller.purchases.length} orders · {stats.purchasedUnits} units</span></div>
        <div className="grid grid-cols-2 gap-3">
          <BlueStatGrid cards={[{ value: `৳${Math.round(stats.paidAmount).toLocaleString()}`, label: "পরিশোধিত", icon: CheckCircle2, tone: "green", href: "#" }]} />
          <BlueStatGrid cards={[{ value: `৳${Math.round(due).toLocaleString()}`, label: "বকেয়া", icon: Banknote, tone: "amber", href: "#" }]} />
        </div>
        <BlueCard className="flex flex-col gap-2.5">
          {seller.purchases.length === 0 && <div className="text-center text-sm text-gray-400 py-6">No purchase yet</div>}
          {seller.purchases.map((p) => {
            const dueAmt = p.totalAmount - p.paidAmount;
            return (
              <div key={p.purchaseId} className="flex flex-col gap-1.5 p-3 rounded-[14px] bg-[#f5f7fb]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-extrabold text-[#16213a]">{p.productType.toUpperCase()} {p.productModel} × {p.quantity}</span>
                  {dueAmt <= 0 ? <BlueChip tone="green">PAID</BlueChip> : p.paidAmount > 0 ? <BlueChip tone="amber">PARTIAL</BlueChip> : <BlueChip tone="red">DUE</BlueChip>}
                </div>
                <span className="text-xs font-semibold text-[#6b7690]">Invoice {p.invoiceNumber} · {formatDate(p.date)}</span>
                <div className="grid grid-cols-3 gap-2 text-xs mt-1">
                  <div className="flex flex-col"><span className="text-[#6b7690] font-bold">Unit</span><span className="font-extrabold text-[#16213a]">৳{p.unitPrice.toLocaleString()}</span></div>
                  <div className="flex flex-col"><span className="text-[#6b7690] font-bold">Total</span><span className="font-extrabold text-[#16213a]">৳{p.totalAmount.toLocaleString()}</span></div>
                  <div className="flex flex-col"><span className="text-[#6b7690] font-bold">Due</span><span className="font-extrabold text-[#b8620b]">৳{Math.max(dueAmt, 0).toLocaleString()}</span></div>
                </div>
                {p.note && <span className="text-xs text-[#6b7690]">{p.note}</span>}
              </div>
            );
          })}
        </BlueCard>
      </div>
    </SellerLayout>
  );
}

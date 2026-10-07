import { SellerLayout } from "@/components/layout";
import { BlueChip, BlueStatGrid } from "@/components/ui";
import { DataTable, EmptyRow, Td, Th } from "@/components/ui/DataTable";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Banknote, CheckCircle2, Download } from "lucide-react";

export default async function SellerPurchasesPage() {
  const { seller, stats, due } = await loadSellerPortal();
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-2.5 p-2">
        <div className="flex flex-col"><span className="text-lg font-extrabold text-[#16213a]">Purchases from SE Electronics</span><span className="text-xs font-semibold text-[#6b7690]">{seller.purchases.length} orders · {stats.purchasedUnits} units</span></div>
        <BlueStatGrid compact cols={2} cards={[
          { value: `৳${Math.round(stats.paidAmount).toLocaleString()}`, label: "পরিশোধিত", icon: CheckCircle2, tone: "green", href: "#" },
          { value: `৳${Math.round(due).toLocaleString()}`, label: "বকেয়া", icon: Banknote, tone: "amber", href: "#" },
        ]} />
        <DataTable>
          <thead>
            <tr>
              <Th>তারিখ</Th><Th>ইনভয়েস</Th><Th>পণ্য</Th><Th right>পরিমাণ</Th><Th right>ইউনিট দাম</Th><Th right>মোট</Th><Th right>পরিশোধ</Th><Th right>বাকি</Th><Th>স্ট্যাটাস</Th><Th>PDF</Th>
            </tr>
          </thead>
          <tbody>
            {seller.purchases.length === 0 && <EmptyRow cols={10} text="এখনো কোনো ক্রয় নেই" />}
            {seller.purchases.map((p, i) => {
              const dueAmt = Math.max(p.totalAmount - p.paidAmount, 0);
              return (
                <tr key={p.purchaseId} className={i % 2 ? "bg-[#f4f7fc]" : "bg-white"}>
                  <Td>{formatDate(p.date)}</Td>
                  <Td strong>{p.invoiceNumber}</Td>
                  <Td nowrap={false} className="min-w-[150px]">{p.productType.toUpperCase()} {p.productModel}{p.note ? <span className="block text-[11px] text-[#6b7690]">{p.note}</span> : null}</Td>
                  <Td right>{p.quantity}</Td>
                  <Td right>৳{p.unitPrice.toLocaleString()}</Td>
                  <Td right strong>৳{p.totalAmount.toLocaleString()}</Td>
                  <Td right className="text-[#178a42]">৳{p.paidAmount.toLocaleString()}</Td>
                  <Td right strong className={dueAmt > 0 ? "text-[#b8620b]" : "text-[#178a42]"}>৳{dueAmt.toLocaleString()}</Td>
                  <Td>{dueAmt <= 0 ? <BlueChip tone="green">PAID</BlueChip> : p.paidAmount > 0 ? <BlueChip tone="amber">PARTIAL</BlueChip> : <BlueChip tone="red">DUE</BlueChip>}</Td>
                  <Td><a href={`/pdf/download?type=seller-invoice&id=${p.invoiceNumber}`} target="_blank" className="inline-flex items-center gap-1 font-bold text-[#1f5fc9]"><Download size={13} />PDF</a></Td>
                </tr>
              );
            })}
          </tbody>
        </DataTable>
      </div>
    </SellerLayout>
  );
}

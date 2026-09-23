import { SellerLayout } from "@/components/layout";
import { BlueCard, BlueChip } from "@/components/ui";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";

export default async function SellerCustomersPage() {
  const { seller, stats } = await loadSellerPortal();
  const now = new Date();
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-3.5 p-3.5">
        <div className="flex flex-col"><span className="text-lg font-extrabold text-[#16213a]">My customers</span><span className="text-xs font-semibold text-[#6b7690]">{seller.customers.length} customers · {stats.inWarranty} in warranty</span></div>
        <BlueCard className="flex flex-col gap-2.5">
          {seller.customers.length === 0 && <div className="text-center text-sm text-gray-400 py-6">No customer linked yet</div>}
          {seller.customers.map((c) => {
            const products = c.invoice?.products ?? [];
            const inWarranty = !c.isWarrantyStopped && products.some((p) => { const e = new Date(p.warrantyStartDate); e.setMonth(e.getMonth() + p.warrantyDurationMonths); return e > now; });
            const active = c.services.some((s) => !["completed", "canceled"].includes(s.status));
            return (
              <details key={c.customerId} className="p-3 rounded-[14px] bg-[#f5f7fb]">
                <summary className="list-none cursor-pointer flex items-center gap-3">
                  <span className="size-10 rounded-full bg-[#fff3d6] text-[#b8620b] flex items-center justify-center text-sm font-extrabold shrink-0">{c.name.slice(0, 2).toUpperCase()}</span>
                  <span className="flex flex-col flex-1 min-w-0">
                    <span className="text-[13px] font-extrabold text-[#16213a] truncate">{c.name}</span>
                    <span className="text-xs font-semibold text-[#6b7690] truncate">{products.map((p) => `${p.type.toUpperCase()} ${p.model}`).join(", ") || "—"} · {c.phone}</span>
                  </span>
                  {active ? <BlueChip tone="blue">IN SERVICE</BlueChip> : inWarranty ? <BlueChip tone="green">WARRANTY</BlueChip> : <BlueChip tone="red">EXPIRED</BlueChip>}
                </summary>
                <div className="mt-3 pt-3 border-t border-[#e6e9f0] flex flex-col gap-1 text-xs">
                  <span className="text-[#6b7690]">ID <b className="text-[#16213a]">{c.customerId}</b> · Invoice <b className="text-[#16213a]">{c.invoiceNumber}</b> · {formatDate(c.createdAt)}</span>
                  <span className="text-[#6b7690]">Address: <b className="text-[#16213a]">{c.address}</b></span>
                  {c.invoice && <span className="text-[#6b7690]">Total ৳{c.invoice.total.toLocaleString()} · Due ৳{c.invoice.dueAmount.toLocaleString()}</span>}
                  {products.map((p, i) => { const e = new Date(p.warrantyStartDate); e.setMonth(e.getMonth() + p.warrantyDurationMonths); return <span key={i} className="text-[#6b7690]">{p.type.toUpperCase()} {p.model} × {p.quantity} · warranty until <b className="text-[#16213a]">{formatDate(e)}</b></span>; })}
                  <span className="font-bold text-[#16213a] mt-1">Services ({c.services.length})</span>
                  {c.services.length === 0 && <span className="text-[#6b7690]">No service yet</span>}
                  {c.services.map((s) => (
                    <div key={s.serviceId} className="flex items-center justify-between gap-2 py-1">
                      <span className="text-[#6b7690]">{s.serviceId} · {formatDate(s.createdAt)}{s.staffName ? ` · ${s.staffName}` : ""}</span>
                      <BlueChip tone={s.status === "completed" ? "green" : s.status === "canceled" ? "red" : "blue"}>{s.status.replace(/_/g, " ").toUpperCase()}</BlueChip>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </BlueCard>
      </div>
    </SellerLayout>
  );
}

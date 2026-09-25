import { SellerLayout } from "@/components/layout";
import { BlueCard, BlueChip } from "@/components/ui";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Home, Wrench } from "lucide-react";
import Link from "next/link";

export default async function SellerServicesPage() {
  const { services, stats } = await loadSellerPortal();
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-2.5 p-2">
        <div className="flex flex-col"><span className="text-lg font-extrabold text-[#16213a]">Customer services</span><span className="text-xs font-semibold text-[#6b7690]">{services.length} total · {stats.inService} active</span></div>
        <BlueCard className="flex flex-col gap-2.5">
          {services.length === 0 && <div className="text-center text-sm text-gray-400 py-6">No service yet</div>}
          {services.map((s) => (
            <Link key={s.serviceId} href={`/service-track?trackingId=${s.serviceId}`} className="flex items-center gap-3 p-3 rounded-md bg-[#f5f7fb]">
              <span className={`size-11 rounded-md flex items-center justify-center shrink-0 ${s.status === "completed" ? "bg-[#e3f5ea] text-[#1a7f45]" : "bg-[#e6f3ff] text-[#1f6fd0]"}`}>{s.type === "install" ? <Home size={20} /> : <Wrench size={20} />}</span>
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] font-extrabold text-[#16213a] truncate">{s.customerName} · {s.productType.toUpperCase()} {s.productModel}</span>
                <span className="text-xs font-semibold text-[#6b7690] truncate">{s.serviceId} · {formatDate(s.createdAt)}{s.staffName ? ` · ${s.staffName}` : ""}</span>
              </span>
              <BlueChip tone={s.status === "completed" ? "green" : s.status === "canceled" ? "red" : "blue"}>{s.status.replace(/_/g, " ").toUpperCase()}</BlueChip>
            </Link>
          ))}
        </BlueCard>
      </div>
    </SellerLayout>
  );
}

import { SellerLayout } from "@/components/layout";
import { BlueBalanceCard, BlueCard, BlueChip, BlueContactCard, BlueFooterBand, BlueHero, BlueStatGrid } from "@/components/ui";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Banknote, CheckCircle2, FileText, MapPin, Package, Phone, ShieldCheck, Store, User, Users, Wrench } from "lucide-react";
import Link from "next/link";

export default async function SellerProfilePage() {
  const { seller, stats, due, services } = await loadSellerPortal();
  const recent = services.slice(0, 3);

  return (
    <SellerLayout badge={stats.inService}>
      <BlueHero
        avatar={seller.ownerPhotoUrl}
        name={seller.shopName}
        idLabel="Seller ID"
        id={seller.sellerId}
        chips={[
          { label: "SELLER", color: "navy", icon: Store },
          { label: "VERIFIED", color: "green", icon: ShieldCheck },
          due > 0 ? { label: "DUE", color: "amber", dot: true } : { label: "CLEAR", color: "blue", dot: true },
        ]}
      />
      <div className="flex flex-col gap-3.5 px-3.5 -mt-4 relative">
        <BlueBalanceCard label="DUE BALANCE" value={`৳ ${due.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} icon={Banknote} button="Purchases" buttonIcon={FileText} buttonHref="/seller/purchases" chevronHref="/seller/purchases" />
        <BlueStatGrid cards={[
          { value: stats.purchasedUnits, label: "ক্রয়কৃত ইউনিট", icon: Package, tone: "blue", href: "/seller/purchases" },
          { value: stats.inService, label: "চলমান সার্ভিস", icon: Wrench, tone: "green", href: "/seller/services" },
          { value: stats.customers, label: "কাস্টমার", icon: Users, tone: "purple", href: "/seller/customers" },
          { value: stats.inWarranty, label: "ওয়ারেন্টিতে", icon: ShieldCheck, tone: "teal", href: "/seller/customers" },
          { value: `৳${Math.round(stats.purchasedAmount).toLocaleString()}`, label: "মোট ক্রয়", icon: Banknote, tone: "amber", href: "/seller/purchases" },
          { value: `৳${Math.round(stats.paidAmount).toLocaleString()}`, label: "পরিশোধিত", icon: CheckCircle2, tone: "red", href: "/seller/purchases" },
        ]} />
        <BlueContactCard title="Shop Details" editHref="/seller/details" rows={[
          { label: "Owner", value: seller.ownerName, icon: User },
          { label: "Phone", value: seller.phone, icon: Phone },
          { label: "Address", value: `${seller.shopStreetAddress}, ${seller.shopDistrict}`, icon: MapPin },
          { label: "Trade License", value: seller.tradeLicenseNumber, icon: FileText },
        ]} />
        <BlueCard className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-[#16213a]">Recent customer services</span>
            <Link href="/seller/services" className="text-xs font-extrabold text-[#1f6fd0]">See all</Link>
          </div>
          {recent.length === 0 && <div className="text-center text-sm text-gray-400 py-4">No service yet</div>}
          {recent.map((s) => (
            <Link key={s.serviceId} href={`/service-track?trackingId=${s.serviceId}`} className="flex items-center gap-3 p-3 rounded-[10px] bg-[#f5f7fb]">
              <span className="size-11 rounded-[10px] bg-[#e6f3ff] text-[#1f6fd0] flex items-center justify-center shrink-0"><Wrench size={20} /></span>
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-[13px] font-extrabold text-[#16213a] truncate">{s.customerName} · {s.productType.toUpperCase()} {s.productModel}</span>
                <span className="text-xs font-semibold text-[#6b7690] truncate">{s.serviceId} · {formatDate(s.createdAt)}{s.staffName ? ` · ${s.staffName}` : ""}</span>
              </span>
              <BlueChip tone={s.status === "completed" ? "green" : s.status === "canceled" ? "red" : "blue"}>{s.status.replace(/_/g, " ").toUpperCase()}</BlueChip>
            </Link>
          ))}
        </BlueCard>
      </div>
      <BlueFooterBand />
    </SellerLayout>
  );
}

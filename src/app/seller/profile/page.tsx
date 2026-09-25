import { SellerLayout } from "@/components/layout";
import { BlueBalanceCard, BlueCard, BlueChip, BlueContactCard, BlueFooterBand, BlueStatGrid } from "@/components/ui";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Banknote, CheckCircle2, FileText, MapPin, Package, Phone, ShieldCheck, Store, User, Users, Wrench } from "lucide-react";
import Link from "next/link";

export default async function SellerProfilePage() {
  const { seller, stats, due, services } = await loadSellerPortal();
  const recent = services.slice(0, 3);

  return (
    <SellerLayout badge={stats.inService}>
      {/* Compact welcome strip */}
      <div className="relative overflow-hidden bg-[#eef3fb] px-3 pt-2 pb-0">
        <span className="absolute -top-10 left-0 right-0 h-12 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] rounded-b-[60%_100%]" />
        <div className="relative flex items-center gap-2.5">
          {seller.ownerPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={seller.ownerPhotoUrl} alt="" className="size-9 rounded-full object-cover border-2 border-white shadow-[0_0_0_1.5px_#1f7cf0] shrink-0 bg-[#1f7cf0]" />
          ) : (
            <span className="size-9 rounded-full bg-[#1f7cf0] border-2 border-white shadow-[0_0_0_1.5px_#1f7cf0] flex items-center justify-center text-white text-xs font-extrabold shrink-0">{seller.shopName.slice(0, 2).toUpperCase()}</span>
          )}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[clamp(14px,4vw,17px)] font-extrabold text-[#16213a] leading-tight truncate">{seller.shopName}</span>
            <span className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10.5px] font-semibold text-[#6b7690] leading-none">ID {seller.sellerId}</span>
              <span className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded bg-[#0b3d91] text-white text-[9px] font-extrabold"><Store size={10} />SELLER</span>
              <span className="inline-flex items-center gap-1 px-1.5 h-[18px] rounded bg-[#1a9c4b] text-white text-[9px] font-extrabold"><ShieldCheck size={10} />VERIFIED</span>
              {due > 0 && <span className="inline-flex items-center px-1.5 h-[18px] rounded bg-[#e0a11b] text-white text-[9px] font-extrabold">DUE</span>}
            </span>
          </div>
          <span className="font-script text-[clamp(12px,3.2vw,15px)] leading-[0.9] text-right text-[#0b3d91] rotate-[-8deg] shrink-0 hidden min-[360px]:block">Together for a<br />Better Tomorrow</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-2.5 pt-2 relative">
        <BlueBalanceCard compact label="DUE BALANCE" value={`৳ ${due.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} icon={Banknote} button="Purchases" buttonIcon={FileText} buttonHref="/seller/purchases" chevronHref="/seller/purchases" />
        <BlueStatGrid compact cards={[
          { value: stats.purchasedUnits, label: "ক্রয়কৃত ইউনিট", icon: Package, tone: "blue", href: "/seller/purchases" },
          { value: stats.inService, label: "চলমান সার্ভিস", icon: Wrench, tone: "green", href: "/seller/services" },
          { value: stats.customers, label: "কাস্টমার", icon: Users, tone: "purple", href: "/seller/customers" },
          { value: stats.inWarranty, label: "ওয়ারেন্টিতে", icon: ShieldCheck, tone: "teal", href: "/seller/customers" },
          { value: `৳${Math.round(stats.purchasedAmount).toLocaleString()}`, label: "মোট ক্রয়", icon: Banknote, tone: "amber", href: "/seller/purchases" },
          { value: `৳${Math.round(stats.paidAmount).toLocaleString()}`, label: "পরিশোধিত", icon: CheckCircle2, tone: "red", href: "/seller/purchases" },
        ]} />
        <BlueContactCard compact title="Shop Details" editHref="/seller/details" rows={[
          { label: "Owner", value: seller.ownerName, icon: User },
          { label: "Phone", value: seller.phone, icon: Phone },
          { label: "Address", value: `${seller.shopStreetAddress}, ${seller.shopDistrict}`, icon: MapPin },
          { label: "Trade License", value: seller.tradeLicenseNumber, icon: FileText },
        ]} />
        <BlueCard className="flex flex-col gap-2 !rounded-md !p-3">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-[#16213a]">Recent customer services</span>
            <Link href="/seller/services" className="text-xs font-extrabold text-[#1f6fd0]">See all</Link>
          </div>
          {recent.length === 0 && <div className="text-center text-sm text-gray-400 py-4">No service yet</div>}
          {recent.map((s) => (
            <Link key={s.serviceId} href={`/service-track?trackingId=${s.serviceId}`} className="flex items-center gap-2.5 p-2 rounded-md bg-[#f5f7fb]">
              <span className="size-9 rounded-md bg-[#e6f3ff] text-[#1f6fd0] flex items-center justify-center shrink-0"><Wrench size={20} /></span>
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

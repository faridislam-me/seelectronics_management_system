import { SellerLayout } from "@/components/layout";
import { BlueBalanceCard, BlueCard, BlueChip, BlueContactCard, BlueFooterBand, BlueHero, BlueStatGrid } from "@/components/ui";
import { getMySellerCertificates } from "@/actions/sellerCertificateActions";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Award, Banknote, CheckCircle2, ChevronRight, FileText, MapPin, Package, Phone, ShieldCheck, Store, User, Users, Wrench } from "lucide-react";
import Link from "next/link";

export default async function SellerProfilePage() {
  const { seller, stats, due, services } = await loadSellerPortal();
  const recent = services.slice(0, 3);
  const certificates = await getMySellerCertificates();

  return (
    <SellerLayout>
      <BlueHero
        variant="profile"
        compact
        avatar={seller.ownerPhotoUrl}
        verified
        initials={seller.shopName}
        name={seller.shopName}
        idLabel="ID"
        id={seller.sellerId}
        chips={[
          { label: "SELLER", color: "glass", icon: Store },
          { label: "VERIFIED", color: "green", icon: ShieldCheck },
          ...(due > 0 ? [{ label: "DUE", color: "amber" as const }] : []),
        ]}
      />
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
        <Link href="/seller/certificates" className="flex items-center gap-2.5 rounded-md bg-white border border-[#dfe6f2] p-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <span className="size-10 rounded-md bg-[#fff6e3] text-[#c98a0c] flex items-center justify-center shrink-0"><Award size={22} /></span>
          <span className="flex flex-col flex-1 min-w-0 leading-tight">
            <span className="text-[14.5px] font-extrabold text-[#16213a]">আমার সার্টিফিকেট</span>
            <span className="text-xs font-semibold text-[#6b7690] truncate">{certificates.length > 0 ? `${certificates.length} টি সার্টিফিকেট · দেখুন ও PDF ডাউনলোড করুন` : "সম্মাননা, বেশি বিক্রি ও কাস্টমার সার্ভিস সার্টিফিকেট"}</span>
          </span>
          {certificates.length > 0 && <span className="min-w-6 h-6 px-1.5 rounded-full bg-[#e0a11b] text-white text-xs font-extrabold flex items-center justify-center">{certificates.length}</span>}
          <ChevronRight size={18} className="text-[#9aa6bd]" />
        </Link>
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

import { SellerLayout } from "@/components/layout";
import { BlueCard, BlueChip } from "@/components/ui";
import { contactDetails, sellerBusinessTypes } from "@/constants";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";
import { Briefcase, CalendarDays, FileBadge, IdCard, LucideIcon, MapPin, Phone, ShieldCheck, Store, User } from "lucide-react";

const Row = ({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: LucideIcon }) => (
  <div className="flex items-center gap-3.5 py-3 border-t border-[#eef1f6] first-of-type:border-0">
    <span className="size-11 rounded-lg bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><Icon size={20} /></span>
    <span className="flex flex-col flex-1 min-w-0">
      <span className="text-xs font-semibold text-[#6b7690]">{label}</span>
      <span className="text-[15px] font-extrabold text-[#16213a] break-words">{value}</span>
    </span>
  </div>
);

export default async function SellerDetailsPage() {
  const { seller, stats } = await loadSellerPortal();
  const businessType = sellerBusinessTypes.find((b) => b.value === seller.businessType)?.label ?? seller.businessType;
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-3.5 p-3.5">
        <BlueCard className="relative overflow-hidden flex flex-col items-center gap-2 text-center pt-0 px-0">
          {seller.shopFrontPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={seller.shopFrontPhotoUrl} alt="Shop front" className="w-full h-36 object-cover" />
          ) : (
            <div className="w-full h-24 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)]" />
          )}
          <div className="-mt-12 relative">
            {seller.ownerPhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.ownerPhotoUrl} alt="" className="size-24 rounded-full object-cover border-[4px] border-white shadow-[0_0_0_3px_#1f7cf0] bg-white" />
            ) : (
              <span className="size-24 rounded-full bg-[#1f7cf0] border-[4px] border-white shadow-[0_0_0_3px_#1f7cf0] flex items-center justify-center text-2xl font-extrabold text-white">{seller.shopName.slice(0, 2).toUpperCase()}</span>
            )}
            <span className="absolute bottom-0 right-0 size-8 rounded-full bg-[#1a9c4b] border-[3px] border-white text-white flex items-center justify-center"><ShieldCheck size={15} strokeWidth={3} /></span>
          </div>
          <span className="text-lg font-extrabold text-[#16213a] px-4">{seller.shopName}</span>
          <span className="text-xs font-bold text-[#6b7690]">Seller ID {seller.sellerId}</span>
          <div className="flex gap-1.5 pb-4"><BlueChip tone="blue">{businessType.toUpperCase()}</BlueChip><BlueChip tone="green">VERIFIED</BlueChip></div>
        </BlueCard>
        <BlueCard>
          <span className="text-[15px] font-extrabold text-[#16213a] mb-1 block">দোকান ও মালিকের তথ্য</span>
          <Row label="মালিক" value={seller.ownerName} icon={User} />
          <Row label="মোবাইল" value={seller.phone} icon={Phone} />
          <Row label="ব্যবসার ধরন" value={businessType} icon={Briefcase} />
          <Row label="ট্রেড লাইসেন্স" value={seller.tradeLicenseNumber} icon={FileBadge} />
          <Row label="NID নাম্বার" value={seller.nidNumber} icon={IdCard} />
          <Row label="ঠিকানা" value={`${seller.shopStreetAddress}, ${seller.shopPoliceStation ? seller.shopPoliceStation + ", " : ""}${seller.shopDistrict}`} icon={MapPin} />
          <Row label="সেলার হিসেবে যুক্ত" value={formatDate(seller.createdAt)} icon={CalendarDays} />
        </BlueCard>
        <div className="flex items-center gap-2 justify-center text-center text-xs font-semibold text-[#6b7690]"><Store size={14} />তথ্য পরিবর্তন করতে অফিসে যোগাযোগ করুন: {contactDetails.customerCare}</div>
      </div>
    </SellerLayout>
  );
}

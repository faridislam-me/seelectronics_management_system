import { SellerLayout } from "@/components/layout";
import { BlueCard } from "@/components/ui";
import { contactDetails, sellerBusinessTypes } from "@/constants";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { formatDate } from "@/utils";

const pay: Record<string, string> = { bank: "ব্যাংক", bkash: "বিকাশ", nagad: "নগদ", rocket: "রকেট", cash: "ক্যাশ" };
const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-[#eef1f6] last:border-0"><span className="text-xs font-bold text-[#6b7690]">{label}</span><span className="text-sm font-bold text-[#16213a] text-right break-words">{value}</span></div>
);

export default async function SellerDetailsPage() {
  const { seller, stats } = await loadSellerPortal();
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-3.5 p-3.5">
        <BlueCard className="flex flex-col items-center gap-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seller.ownerPhotoUrl || undefined} alt="" className="size-28 rounded-full object-cover" />
          <span className="text-lg font-extrabold text-[#16213a]">{seller.shopName}</span>
          <span className="text-xs font-bold text-[#6b7690]">ID {seller.sellerId} · Since {formatDate(seller.createdAt)}</span>
        </BlueCard>
        <BlueCard>
          <Row label="মালিক" value={seller.ownerName} />
          <Row label="মোবাইল" value={seller.phone} />
          <Row label="ব্যবসার ধরন" value={sellerBusinessTypes.find((b) => b.value === seller.businessType)?.label ?? seller.businessType} />
          <Row label="ট্রেড লাইসেন্স" value={seller.tradeLicenseNumber} />
          <Row label="ঠিকানা" value={`${seller.shopStreetAddress}, ${seller.shopPoliceStation || ""} ${seller.shopDistrict}`} />
        </BlueCard>
        <BlueCard>
          <Row label="পেমেন্ট মাধ্যম" value={pay[seller.paymentPreference]} />
          {seller.paymentPreference === "bank" ? (
            <>
              <Row label="ব্যাংক" value={`${seller.bankInfo?.bankName ?? ""} · ${seller.bankInfo?.branchName ?? ""}`} />
              <Row label="একাউন্ট" value={`${seller.bankInfo?.accountHolderName ?? ""} · ${seller.bankInfo?.accountNumber ?? ""}`} />
            </>
          ) : <Row label="ওয়ালেট নাম্বার" value={seller.walletNumber ?? "—"} />}
        </BlueCard>
        <BlueCard>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seller.shopFrontPhotoUrl || undefined} alt="Shop front" className="w-full h-40 object-cover rounded-xl" />
        </BlueCard>
        <span className="text-center text-xs text-[#6b7690]">তথ্য পরিবর্তন করতে অফিসে যোগাযোগ করুন: {contactDetails.customerCare}</span>
      </div>
    </SellerLayout>
  );
}

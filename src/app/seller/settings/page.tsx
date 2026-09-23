import { sellerLogout } from "@/actions";
import { SellerLayout } from "@/components/layout";
import { BlueCard } from "@/components/ui";
import { contactDetails } from "@/constants";
import { loadSellerPortal } from "@/lib/sellerPortal";
import { LogOut, MessageCircle, PhoneCall, User } from "lucide-react";
import Link from "next/link";

export default async function SellerSettingsPage() {
  const { seller, stats } = await loadSellerPortal();
  const item = "flex items-center gap-3 p-3.5 rounded-[14px] bg-[#f5f7fb] text-[15px] font-bold text-[#16213a]";
  return (
    <SellerLayout badge={stats.inService}>
      <div className="flex flex-col gap-3.5 p-3.5">
        <BlueCard className="flex flex-col gap-2.5">
          <span className="text-[15px] font-extrabold text-[#16213a]">Account</span>
          <Link href="/seller/details" className={item}><User size={20} className="text-[#1f7cf0]" />Shop profile <span className="ml-auto text-xs text-[#6b7690]">@{seller.username}</span></Link>
          <a href={`tel:${contactDetails.customerCare}`} className={item}><PhoneCall size={20} className="text-[#1f7cf0]" />Call office</a>
          <a href={`https://wa.me/${contactDetails.whatsApp.replace("+", "")}`} target="_blank" rel="noopener noreferrer" className={item}><MessageCircle size={20} className="text-[#1a9c4b]" />WhatsApp support</a>
        </BlueCard>
        <form action={sellerLogout}>
          <button className="w-full h-[54px] rounded-[16px] bg-[#ffe9ec] text-[#c81f38] text-base font-bold flex items-center justify-center gap-2"><LogOut size={18} />Logout</button>
        </form>
      </div>
    </SellerLayout>
  );
}

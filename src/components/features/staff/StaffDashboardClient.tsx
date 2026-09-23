"use client";
import {
  Activity,
  AlertCircle,
  Award,
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  Contact,
  FileDown,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  ShieldAlert,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
  Wrench,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { toast } from "react-toastify";

import { StaffLayout } from "@/components/layout";
import Banner from "@/components/ui/Banner";
import {
  BlueBalanceCard,
  BlueContactCard,
  BlueFooterBand,
  BlueHero,
  BlueStatGrid,
} from "@/components/ui/BlueDashboard";

interface StaffDashboardClientProps {
  staffData: any;
  stats: any;
  experienceYears: number;
  adminPhone: string;
  activeComplaints: any[];
  activeNotices: any[];
  certificateToken?: string | null;
  banners?: { img: string | any }[];
}

export default function StaffDashboardClient({
  staffData,
  stats,
  experienceYears,
  activeComplaints,
  activeNotices,
  certificateToken,
  banners,
}: StaffDashboardClientProps) {
  const unreadNotices = activeNotices.filter((n) => !n.isRead);
  const pendingServices = stats?.pendingServices ?? staffData.pendingServices ?? 0;
  const showMarquee = activeComplaints.length > 0 || unreadNotices.length > 0 || pendingServices > 0;
  const roleLabel = staffData.role === "electrician" ? "ELECTRICIAN" : "TECHNICIAN";
  const balance = Number(stats?.availableBalance || 0);
  const rating = Number(stats?.averageRating ?? staffData.rating ?? 0);

  const quickActions = [
    { label: "Services", icon: Wrench, href: "/staff/services", color: "text-emerald-500", bg: "bg-emerald-50" },
    { label: "Payment", icon: Wallet, href: "/staff/payment", color: "text-rose-500", bg: "bg-rose-50" },
    { label: "History", icon: Activity, href: "/staff/tracking", color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Feedbacks", icon: Star, href: "/staff/feedbacks", color: "text-orange-500", bg: "bg-orange-50" },
    { label: "WhatsApp", icon: MessageSquare, href: "https://wa.me/8801310673600", color: "text-green-500", bg: "bg-green-50" },
    { label: "Support", icon: PhoneCall, href: "/staff/support", color: "text-brand", bg: "bg-brand/5" },
    { label: "Complains", icon: ShieldAlert, href: "/staff/complaints", color: "text-red-500", bg: "bg-red-50" },
    { label: "Emergency", icon: AlertCircle, href: "/staff/jorori-seba", color: "text-red-500", bg: "bg-red-50" },
    {
      label: "Certificate", icon: Award, href: certificateToken ? `/staff/certificate?token=${certificateToken}` : "#", color: "text-amber-500", bg: "bg-amber-50",
      onClick: (e: React.MouseEvent) => { if (!certificateToken) { e.preventDefault(); toast.error("আপনার জন্য কোনো সার্টিফিকেট ইস্যু করা হয়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।"); } },
    },
    { label: "Loan", icon: Banknote, href: "/staff/loan", color: "text-teal-500", bg: "bg-teal-50" },
    { label: "ID Card", icon: Contact, href: "/staff/id-card", color: "text-fuchsia-500", bg: "bg-fuchsia-50" },
    { label: "Customers", icon: Users, href: "/staff/customers", color: "text-indigo-500", bg: "bg-indigo-50" },
  ];

  return (
    <StaffLayout balance={balance}>
      <div className="flex flex-col gap-3.5 text-[#16213a] pb-24 bg-[#eef3fb] -mt-px">
        <BlueHero
          avatar={staffData.photoUrl}
          name={staffData.name}
          idLabel="Staff ID"
          id={staffData.staffId}
          chips={[
            { label: roleLabel, color: "navy", icon: User },
            { label: staffData.isVerified ? "VERIFIED" : "PENDING", color: staffData.isVerified ? "green" : "amber", icon: ShieldCheck },
            { label: staffData.isActiveStaff ? "ACTIVE" : "BLOCKED", color: staffData.isActiveStaff ? "blue" : "red", dot: true },
          ]}
        />

        {showMarquee && (
          <Marquee speed={50} gradient={false} pauseOnHover className="py-1 px-2">
            {activeComplaints.map((c) => (
              <Link key={c.complaintId} href={`/staff/complaints/${c.complaintId}`} className="flex items-center mx-6 group font-black">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter mr-2">অভিযোগ</span>
                <span className="text-red-700 text-sm tracking-wide group-hover:underline">সতর্কতা: আপনার বিরুদ্ধে একটি অভিযোগ জমা হয়েছে (আইডি: {c.complaintId})। বিস্তারিত দেখতে এখানে ক্লিক করুন।</span>
              </Link>
            ))}
            {unreadNotices.map((n) => (
              <Link key={n.id} href="/staff/notifications" className="flex items-center mx-6 group font-black">
                <span className={`${n.notice.priority === "urgent" ? "bg-amber-600" : "bg-blue-600"} text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter mr-2`}>নোটিশ</span>
                <span className="text-slate-900 text-sm tracking-wide group-hover:underline">{n.notice.title}: {n.notice.content.substring(0, 50)}... বিস্তারিত দেখুন।</span>
              </Link>
            ))}
            {pendingServices > 0 && (
              <Link href="/staff/services" className="flex items-center mx-6 group font-black">
                <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter mr-2">সার্ভিস</span>
                <span className="text-slate-900 text-sm tracking-wide group-hover:underline">আপনার জন্য {pendingServices}টি সার্ভিস পেন্ডিং আছে। দ্রুত কাজ শুরু করুন।</span>
              </Link>
            )}
          </Marquee>
        )}

        <div className={`flex flex-col gap-3.5 px-3.5 relative ${showMarquee ? "" : "-mt-4"}`}>
          <BlueBalanceCard
            label="AVAILABLE BALANCE"
            value={`৳ ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={Wallet}
            button="Download ID"
            buttonIcon={FileDown}
            buttonHref="/staff/id-card"
            chevronHref="/staff/payment"
          />

          <BlueStatGrid cards={[
            { value: staffData.completedServices || 0, label: "সফল সার্ভিস", icon: CheckCircle2, tone: "green", href: "/staff/services" },
            { value: pendingServices, label: "পেন্ডিং সার্ভিস", icon: Clock3, tone: "blue", href: "/staff/tasks" },
            { value: experienceYears, label: "বছরের দক্ষতা", icon: Award, tone: "purple", href: "/staff/details" },
            { value: staffData.canceledServices || 0, label: "রিজেক্টেড সার্ভিস", icon: XCircle, tone: "amber", href: "/staff/tracking" },
            { value: staffData.serviceCenterServices || 0, label: "সার্ভিস সেন্টার", icon: Building2, tone: "red", href: "/staff/tracking" },
            { value: rating.toFixed(1), label: "রেটিং", icon: Star, tone: "teal", href: "/staff/feedbacks" },
          ]} />

          <BlueContactCard editHref="/staff/profile/edit" rows={[
            { label: "Name", value: staffData.name, icon: User, href: "/staff/details" },
            { label: "Father's Name", value: staffData.fatherName, icon: Users, href: "/staff/details" },
            { label: "Phone", value: staffData.phone, icon: Phone, href: "/staff/details" },
            { label: "Address", value: `${staffData.currentStreetAddress}, ${staffData.currentDistrict}`, icon: MapPin, href: "/staff/details" },
          ]} />

          {banners && banners.length > 0 && (
            <div className="w-full overflow-hidden rounded-[22px] shadow-md"><Banner slides={banners} /></div>
          )}

          <div className="bg-white rounded-[22px] p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-extrabold tracking-[2px] text-[#6b7690]">QUICK ACTIONS</span>
              <span className="flex-1 h-px bg-[#e6e9f0]" />
            </div>
            <div className="grid grid-cols-4 gap-x-1.5 gap-y-3">
              {quickActions.map((a) => (
                <Link key={a.label} href={a.href} onClick={a.onClick} className="flex flex-col items-center gap-2 group">
                  <span className={`${a.bg} ${a.color} size-[58px] rounded-[18px] flex items-center justify-center transition-all group-active:scale-95`}><a.icon size={24} /></span>
                  <span className="text-[10px] font-black text-gray-700 uppercase text-center leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <BlueFooterBand />
      </div>
    </StaffLayout>
  );
}

"use client";
import {
  Activity,
  AlertCircle,
  Award,
  Banknote,
  Contact,
  MessageSquare,
  PhoneCall,
  ShieldAlert,
  Star,
  User,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import Marquee from "react-fast-marquee";
import { toast } from "react-toastify";
import PrayerTimes from "../shared/PrayerTimes";

import { StaffLayout } from "@/components/layout";
import Banner from "@/components/ui/Banner";
import { StaffBalanceBar } from "./StaffBalanceBar";
import { Building2, CheckCircle2, ChevronRight, Clock3, Users, XCircle } from "lucide-react";

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
  adminPhone,
  activeComplaints,
  activeNotices,
  certificateToken,
  banners,
}: StaffDashboardClientProps) {
  const unreadNotices = activeNotices.filter((n) => !n.isRead);
  const showMarquee =
    activeComplaints.length > 0 ||
    unreadNotices.length > 0 ||
    (stats?.pendingServices || 0) > 0;

  const roleLabel = staffData.role === "electrician" ? "Electrician" : "Service Technician";

  return (
    <StaffLayout balance={stats?.availableBalance || 0}>
      {/* Welcome block */}
      <div className="relative overflow-hidden bg-[#eef3fb] px-3 pt-3 pb-1">
        <span className="absolute -top-10 left-0 right-0 h-14 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] rounded-b-[60%_100%]" />
        <span className="absolute right-3 top-4 font-script text-[clamp(20px,6vw,30px)] leading-[0.95] text-right text-[#0b3d91] rotate-[-8deg] hidden min-[380px]:block">Service<br />Today<br />Better<br />Tomorrow</span>
        <div className="relative flex items-center gap-3 min-[380px]:pr-20 mt-2">
          {staffData.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={staffData.photoUrl} alt="" className="size-[clamp(72px,22vw,100px)] rounded-full object-cover border-[3px] border-white shadow-[0_0_0_3px_#1f7cf0] shrink-0" />
          ) : (
            <span className="size-[clamp(72px,22vw,100px)] rounded-full bg-[#1f7cf0] border-[3px] border-white shadow-[0_0_0_3px_#1f7cf0] flex items-center justify-center text-2xl font-extrabold text-white shrink-0"><User size={36} /></span>
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[13px] font-semibold text-[#3d4a63]">Welcome Back,</span>
            <span className="text-[clamp(17px,5vw,22px)] font-extrabold text-[#16213a] leading-tight">{staffData.name}</span>
            <span className="text-[13px] font-semibold text-[#6b7690]">{roleLabel}</span>
            <span className="mt-1 self-start inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md bg-[#0b3d91] text-white text-[11px] font-extrabold"><Users size={13} />SE Service Team</span>
          </div>
        </div>
        <div className="relative mt-3 flex justify-center"><StaffBalanceBar amount={stats?.availableBalance || 0} /></div>
      </div>

      <div className="flex flex-col gap-4 px-2 text-gray-800 pb-24 bg-[#eef3fb]">
        {/* Banner */}
        {banners && banners.length > 0 && (
          <div className="mt-1 w-full overflow-hidden shadow-md rounded-[12px]">
            <Banner slides={banners} />
          </div>
        )}

        {showMarquee && (
          <Marquee
            speed={50}
            gradient={false}
            pauseOnHover={true}
            className="py-1"
          >
            {/* Active Complaints */}
            {activeComplaints.map((c) => (
              <Link
                key={c.complaintId}
                href={`/staff/complaints/${c.complaintId}`}
                className="flex items-center mx-6 group font-black"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                    অভিযোগ
                  </span>
                  <span className="text-red-700 text-sm tracking-wide group-hover:underline uppercase">
                    সতর্কতা: আপনার বিরুদ্ধে একটি অভিযোগ জমা হয়েছে (আইডি:{" "}
                    {c.complaintId})। বিস্তারিত দেখতে এখানে ক্লিক করুন।
                  </span>
                </div>
              </Link>
            ))}

            {/* Unread Notices */}
            {unreadNotices.map((n) => (
              <Link
                key={n.id}
                href="/staff/notifications"
                className="flex items-center mx-6 group font-black"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`${n.notice.priority === "urgent" ? "bg-amber-600" : "bg-blue-600"} text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter`}
                  >
                    নোটিশ
                  </span>
                  <span className="text-slate-900 text-sm tracking-wide group-hover:underline uppercase">
                    {n.notice.title}: {n.notice.content.substring(0, 50)}...
                    বিস্তারিত দেখুন।
                  </span>
                </div>
              </Link>
            ))}

            {/* Assigned Services */}
            {(stats?.pendingServices || 0) > 0 && (
              <Link
                href="/staff/services"
                className="flex items-center mx-6 group font-black"
              >
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
                    সার্ভিস
                  </span>
                  <span className="text-slate-900 text-sm tracking-wide group-hover:underline uppercase">
                    আপনার জন্য {stats.pendingServices}টি সার্ভিস পেন্ডিং আছে।
                    দ্রুত কাজ শুরু করুন।
                  </span>
                </div>
              </Link>
            )}
          </Marquee>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: staffData.completedServices || 0, label: "Completed", icon: CheckCircle2, bg: "bg-[#e9f9ef] border-[#bfe8cd]", iconBg: "bg-[#1a9c4b]", text: "text-[#178a42]", href: "/staff/services" },
            { value: staffData.pendingServices || 0, label: "Pending", icon: Clock3, bg: "bg-[#fff6e3] border-[#f5dfa0]", iconBg: "bg-[#e0a11b]", text: "text-[#b8620b]", href: "/staff/tasks" },
            { value: staffData.canceledServices || 0, label: "Canceled", icon: XCircle, bg: "bg-[#ffe9ec] border-[#f7c3ca]", iconBg: "bg-[#e0243f]", text: "text-[#c81f38]", href: "/staff/tracking" },
            { value: staffData.serviceCenterServices || 0, label: "Service Center", icon: Building2, bg: "bg-[#e8f1ff] border-[#bcd4fb]", iconBg: "bg-[#1f7cf0]", text: "text-[#1b6fd6]", href: "/staff/tracking" },
          ].map((c) => (
            <Link key={c.label} href={c.href} className={`${c.bg} border rounded-[10px] p-2 flex flex-col gap-1.5 relative min-h-[96px]`}>
              <span className="absolute right-1.5 top-2 text-[#9aa4b8]"><ChevronRight size={14} strokeWidth={2.5} /></span>
              <span className={`${c.iconBg} size-8 rounded-full text-white flex items-center justify-center`}><c.icon size={15} strokeWidth={2.4} /></span>
              <span className="text-[clamp(16px,5vw,22px)] font-extrabold text-[#16213a] leading-none">{c.value}</span>
              <span className={`${c.text} text-[clamp(9px,2.7vw,11px)] font-bold leading-tight`}>{c.label}</span>
            </Link>
          ))}
        </div>

        {/* Action Grid */}
        <div className="bg-white rounded-[12px] shadow-sm p-3 sm:p-6">
          <div className="grid grid-cols-5 md:grid-cols-8 gap-x-1.5 gap-y-4 sm:gap-6">
            {[
              {
                label: "Services",
                icon: Wrench,
                href: "/staff/services",
                color: "text-emerald-500",
                bg: "bg-emerald-50",
              },
              {
                label: "Profile",
                icon: User,
                href: "/staff/details",
                color: "text-indigo-500",
                bg: "bg-indigo-50",
              },
              {
                label: "Payment",
                icon: Wallet,
                href: "/staff/payment",
                color: "text-rose-500",
                bg: "bg-rose-50",
              },
              {
                label: "History",
                icon: Activity,
                href: "/staff/tracking",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                label: "Feedbacks",
                icon: Star,
                href: "/staff/feedbacks",
                color: "text-orange-500",
                bg: "bg-orange-50",
              },
              {
                label: "WhatsApp",
                icon: MessageSquare,
                href: "https://wa.me/8801310673600",
                color: "text-green-500",
                bg: "bg-green-50",
              },
              {
                label: "Support",
                icon: PhoneCall,
                href: `/staff/support`,
                color: "text-brand",
                bg: "bg-brand/5",
              },
              {
                label: "Complains",
                icon: ShieldAlert,
                href: "/staff/complaints",
                color: "text-red-500",
                bg: "bg-red-50",
              },
              {
                label: "Emergency Services",
                icon: AlertCircle,
                href: "/staff/jorori-seba",
                color: "text-red-500",
                bg: "bg-red-50",
              },
              {
                label: "Certificate",
                icon: Award,
                href: certificateToken
                  ? `/staff/certificate?token=${certificateToken}`
                  : "#",
                onClick: (e: any) => {
                  if (!certificateToken) {
                    e.preventDefault();
                    toast.error(
                      "আপনার জন্য কোনো সার্টিফিকেট ইস্যু করা হয়নি। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।",
                    );
                  }
                },
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
              {
                label: "Loan",
                icon: Banknote,
                href: "/staff/loan",
                color: "text-teal-500",
                bg: "bg-teal-50",
              },
              {
                label: "ID Card",
                icon: Contact,
                href: "/staff/id-card",
                color: "text-fuchsia-500",
                bg: "bg-fuchsia-50",
              },
            ].map((action, i) => (
              <Link
                key={action.label}
                href={action.href}
                onClick={action.onClick}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className={`${action.bg} ${action.color} size-12 sm:size-20 rounded-[12px] sm:rounded-[14px] shadow-sm flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 animate-in zoom-in-90 duration-300`}
                  style={{
                    animationDelay: `${i * 50}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <action.icon className="size-5 sm:size-8" />
                </div>

                <span className="text-[9px] sm:text-xs font-black text-gray-700 uppercase tracking-tighter sm:tracking-normal text-center leading-tight">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Prayer Times Widget */}
        <PrayerTimes />
      </div>
    </StaffLayout>
  );
}

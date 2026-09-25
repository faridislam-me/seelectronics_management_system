"use client";
import { customerLogout } from "@/actions/customerActions";
import { CustomerLayout } from "@/components/layout";
import Banner from "@/components/ui/Banner";
import clsx from "clsx";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Boxes,
  Crown,
  FileText,
  Loader2,
  LocateIcon,
  LogOut,
  MapPin,
  MessageSquare,
  PhoneCall,
  ShieldCheck,
  ShoppingCart,
  Star,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Marquee from "react-fast-marquee";
import PrayerTimes from "../shared/PrayerTimes";

interface CustomerDashboardClientProps {
  customer: {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    address: string | null;
    vipStatus?: string | null;
    vipCardNumber?: string | null;
    referralBalance?: number | string | null;
    isWarrantyStopped?: boolean;
    warrantyExpiryDate?: string | null;
  };
  stats: {
    totalServices: number;
    activeSubscriptions: number;
    dueAmount?: number;
    dueType?: "due" | "installment";
    isWarrantyExpired?: boolean;
    warrantyExpiryDate?: Date | null;
  } | null;
  adminPhone: string;
  banners?: { img: string | any }[];
}

export default function CustomerDashboardClient({
  customer,
  stats,
  adminPhone,
  banners,
}: CustomerDashboardClientProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [showSeIpsModal, setShowSeIpsModal] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const handleRedirect = (url: string, targetName: string) => {
    setLoadingTarget(targetName);
    setTimeout(() => {
      window.location.href = url;
    }, 600);
  };
  // ✅ Dashboard and Warranty logic
  const isWarrantyExpired = stats?.isWarrantyExpired ?? false;
  const isDashboardDisabled = customer.isWarrantyStopped ?? false;

  const Actions = [
    {
      label: "Invoice",
      icon: FileText,
      href: "/customer/invoice",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      label: "Warranty",
      icon: ShieldCheck,
      href: "/check-warranty",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },

    {
      label: "My Service",
      icon: Boxes,
      href: "/customer/services",
      color: "text-green-500",
      bg: "bg-green-50",
    },
    {
      label: "VIP Card",
      icon: Crown,
      href: "/customer/vip-card",
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      label: "Referral",
      icon: User,
      href: "/customer/referral",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Feedback",
      icon: Star,
      href: "/customer/feedback",
      color: "text-pink-500",
      bg: "bg-pink-50",
    },
    {
      label: "Support",
      icon: PhoneCall,
      href: `/customer/support`,
      color: "text-brand",
      bg: "bg-brand/5",
    },
    {
      label: "Coverage",
      icon: MapPin,
      href: "/coverage",
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "WhatsApp",
      icon: MessageSquare,
      href: `https://wa.me/8801310673600`,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      label: "Complaints",
      icon: FileText,
      href: "/customer/complain",
      color: "text-rose-500",
      bg: "bg-rose-50",
    },
    {
      label: "Subscription",
      icon: Zap,
      href: "/customer/plans",
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
    {
      label: "Location",
      icon: LocateIcon,
      href: "/location",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      label: "Emergency Services",
      icon: AlertCircle,
      href: "/customer/jorori-seba",
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Chat Support",
      icon: MessageSquare,
      href: "/customer/chat-support",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Team Members",
      icon: User,
      href: "/team-members",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      label: "Shop",
      icon: ShoppingCart,
      isSeIpsModal: true,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  const isVipCustomer = customer?.vipStatus === "approved";

  const dueAmount = Number(stats?.dueAmount || 0);
  const referralBalance = Number(customer?.referralBalance || 0);
  const statusLabel = isDashboardDisabled ? "Warranty Canceled" : isWarrantyExpired ? "Warranty Expired" : "Active";
  const statusOk = !isDashboardDisabled && !isWarrantyExpired;

  return (
    <CustomerLayout>
      <div className="flex flex-col gap-3.5 px-3 text-gray-800 pb-24 pt-3 bg-[#eef3fb]">
        {/* Welcome banner (admin managed slides) */}
        <div className="w-full overflow-hidden rounded-md shadow-sm">
          <Banner slides={banners && banners.length > 0 ? banners : undefined} />
        </div>

        {/* Warranty Notice Marquee */}
        {(isWarrantyExpired || isDashboardDisabled) && (
          <div className="bg-red-50 border border-red-200 rounded-[10px] overflow-hidden">
            <Marquee speed={45} pauseOnHover={true} gradient={false}>
              {isDashboardDisabled ? (
                <div className="flex items-center gap-2 text-red-600 font-semibold text-sm px-6 py-2">
                  <AlertTriangle size={18} />
                  {`প্রিয়  গ্রাহক ${customer?.name} (${customer.customerId}) আপনার পন্যের বকেয়া টাকা পরিশোধের জন্য বিভিন্ন সময় কল ও এসএমএস, ভয়েস এস এম এস দিয়েও আপনার সারা পাওয়া যায়নি দীর্ঘ সময় টাকা ও পরিশোধ করেননি তাই সেইলার কোম্পানির কাছে কাস্টমার আই ডি তে অভিযোগ জমা করায় আপনার ওয়ারেন্টি বাতিল  করেছে পুনরায় ওয়ারেন্টি বহাল রাখতে সেইলারের সাথে যোগাযোগ করুন অথবা কোম্পানিতে সরাসরি টাকা পরিশোধ করে ওয়ারেন্টি চালু করুন কাস্টমার কেয়ার ০৯৬৪৯৩৫৫৫৫৫ অথবা ০৯৬৩৯৬৭৩৬০০`}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 font-semibold text-sm px-6 py-2">
                  <ShieldCheck size={18} />
                  প্রিয় গ্রাহক আপনার পন্যের কোম্পানির দেওয়া ওয়ারেন্টি শেষ হয়ে গেছে ।
                </div>
              )}
            </Marquee>
          </div>
        )}

        {/* Profile card */}
        <div className={clsx("rounded-lg p-3 sm:p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)] flex flex-col gap-3", statusOk ? "bg-white" : "bg-red-50 border border-red-200")}>
          <div className="flex items-center gap-3">
            <span className="size-[52px] rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><User size={28} strokeWidth={2.2} /></span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[clamp(16px,4.8vw,20px)] font-extrabold text-[#16213a] leading-tight truncate">{customer.name}</span>
              <span className="text-[13px] font-semibold text-[#6b7690] truncate">ID: {customer.customerId}</span>
            </div>
            <span className={clsx("inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md text-[12px] font-extrabold whitespace-nowrap shrink-0", statusOk ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>
              <span className={clsx("size-1.5 rounded-full", statusOk ? "bg-[#1a9c4b]" : "bg-[#e0243f]")} />{statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <a href={`tel:${customer.phone}`} className="flex items-center gap-2.5 p-2.5 rounded-md border border-[#e3e8f1] bg-white min-w-0">
              <span className="size-10 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><PhoneCall size={18} /></span>
              <span className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-[#6b7690]">Phone</span>
                <span className="text-[clamp(13px,3.8vw,15px)] font-extrabold text-[#16213a] truncate">{customer.phone}</span>
              </span>
            </a>
            <Link href="/customer/invoice" className={clsx("flex items-center gap-2.5 p-2.5 rounded-md border min-w-0", dueAmount > 0 ? (stats?.dueType === "installment" ? "bg-[#fff6e3] border-[#f5dfa0]" : "bg-[#ffe9ec] border-[#f7c3ca]") : "bg-[#e9f9ef] border-[#bfe8cd]")}>
              <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0 text-white", dueAmount > 0 ? (stats?.dueType === "installment" ? "bg-[#e0a11b]" : "bg-[#e0243f]") : "bg-[#1a9c4b]")}><Banknote size={18} /></span>
              <span className="flex flex-col min-w-0 flex-1">
                <span className={clsx("text-[clamp(13px,3.8vw,15px)] font-extrabold truncate", dueAmount > 0 ? (stats?.dueType === "installment" ? "text-[#b8620b]" : "text-[#c81f38]") : "text-[#178a42]")}>৳{dueAmount.toLocaleString()}</span>
                <span className="text-[11px] font-bold tracking-wide text-[#6b7690] uppercase">{dueAmount > 0 ? (stats?.dueType === "installment" ? "Installment" : "Due") : "No due"}</span>
              </span>
              <span className="text-[#9aa4b8] shrink-0">›</span>
            </Link>
          </div>

          {/* VIP band */}
          <Link href="/customer/vip-card" className="rounded-md bg-[#0a2f70] bg-[linear-gradient(110deg,#0a2f70_0%,#0d3f96_60%,#0a2f70_100%)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(10,47,112,0.3)] relative overflow-hidden">
            <span className="absolute -right-6 -bottom-10 size-32 rounded-full border-[12px] border-white/5" />
            <span className="size-10 rounded-md bg-[#f5c542] text-[#0a2f70] flex items-center justify-center shrink-0"><Crown size={22} strokeWidth={2.4} /></span>
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-[15px] font-extrabold tracking-wide text-[#f5c542]">{isVipCustomer ? "VIP MEMBER" : "VIP CARD"}</span>
              <span className="text-[12px] font-semibold text-white/90 truncate">{isVipCustomer ? `Premium Access Enabled · Balance ৳${referralBalance.toLocaleString()}` : "প্রিমিয়াম সুবিধা পেতে ভিআইপি কার্ডের জন্য আবেদন করুন"}</span>
            </span>
            <span className="shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-md bg-[#f5c542] text-[#0a2f70] text-[12px] font-extrabold">{isVipCustomer ? "View Benefits" : "Apply"} ›</span>
          </Link>
        </div>

        {/* Services / Subscription cards */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link href="/customer/services" className="rounded-md border border-[#bfe8cd] bg-[#e9f9ef] p-3 flex items-center gap-3 min-h-[72px]">
            <span className="size-11 rounded-full bg-[#d4f3e0] text-[#1a9c4b] flex items-center justify-center shrink-0"><Boxes size={22} strokeWidth={2.2} /></span>
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-[clamp(18px,5vw,22px)] font-extrabold text-[#178a42] leading-none">{stats?.totalServices || 0}</span>
              <span className="text-[clamp(10px,3vw,12px)] font-extrabold text-[#178a42] uppercase tracking-wide">Services</span>
            </span>
            <span className="text-[#178a42]">›</span>
          </Link>
          <Link href="/customer/plans" className="rounded-md border border-[#dcc6fb] bg-[#f3e9ff] p-3 flex items-center gap-3 min-h-[72px]">
            <span className="size-11 rounded-full bg-[#e6d6fb] text-[#8b3fe8] flex items-center justify-center shrink-0"><Zap size={22} strokeWidth={2.2} /></span>
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-[clamp(18px,5vw,22px)] font-extrabold text-[#7a35d2] leading-none">{stats?.activeSubscriptions || 0}</span>
              <span className="text-[clamp(10px,3vw,12px)] font-extrabold text-[#7a35d2] uppercase tracking-wide">Subscription</span>
            </span>
            <span className="text-[#7a35d2]">›</span>
          </Link>
        </div>

        {/* Secondary Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-extrabold text-[#16213a]">
              Quick Actions
            </h3>
            <Link href="/customer/services" className="text-[12px] font-bold text-[#1f7cf0]">সবগুলো দেখুন ›</Link>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-x-2 gap-y-4 sm:gap-8">
            {Actions.map((action, i) => {
              if (isDashboardDisabled) {
                return (
                  <button
                    key={i}
                    onClick={() => setShowPopup(true)}
                    className="flex flex-col items-center gap-2 group opacity-50 cursor-not-allowed"
                  >
                    <div
                      className={`${action.bg || "bg-gray-50"} ${action.color} size-14 sm:size-20 rounded-lg shadow-sm flex items-center justify-center transition-all group-active:scale-95 animate-in zoom-in-90 duration-300`}
                      style={{
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <action.icon className="size-6 sm:size-8" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-700 text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              }

              if (action.isSeIpsModal) {
                return (
                  <button
                    key={i}
                    onClick={() => setShowSeIpsModal(true)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div
                      className={`${action.bg || "bg-gray-50"} ${action.color} size-14 sm:size-20 rounded-lg shadow-sm flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 animate-in zoom-in-90 duration-300`}
                      style={{
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <action.icon className="size-6 sm:size-8" />
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-700 text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={i}
                  href={action.href || "#"}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`${action.bg || "bg-gray-50"} ${action.color} size-14 sm:size-20 rounded-lg shadow-sm flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95 animate-in zoom-in-90 duration-300`}
                    style={{
                      animationDelay: `${i * 50}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <action.icon className="size-6 sm:size-8" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-gray-700 text-center leading-tight">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Prayer Times Widget */}
        <PrayerTimes />

        {/* Logout Button */}
        <form action={customerLogout} className="mt-4">
          <button className="w-full py-4 rounded-md bg-gray-200 text-gray-500 font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all text-sm flex items-center justify-center gap-3">
            <LogOut size={16} />
            Logout Account
          </button>
        </form>
        <p className="text-center text-gray-400 text-sm">
          SE Electronics Corporate Office
        </p>
      </div>

      {/* Warranty Canceled Popup */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="text-red-600 size-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ওয়ারেন্টি বাতিল
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-semibold">
              {`প্রিয়  গ্রাহক ${customer?.name} (${customer.customerId}) আপনার পন্যের বকেয়া টাকা পরিশোধের জন্য বিভিন্ন সময় কল ও এসএমএস, ভয়েস এস এম এস দিয়েও আপনার সারা পাওয়া যায়নি দীর্ঘ সময় টাকা ও পরিশোধ করেননি তাই সেইলার কোম্পানির কাছে কাস্টমার আই ডি তে অভিযোগ জমা করায় আপনার ওয়ারেন্টি বাতিল  করেছে পুনরায় ওয়ারেন্টি বহাল রাখতে সেইলারের সাথে যোগাযোগ করুন অথবা কোম্পানিতে সরাসরি টাকা পরিশোধ করে ওয়ারেন্টি চালু করুন কাস্টমার কেয়ার ০৯৬৪৯৩৫৫৫৫৫ অথবা ০৯৬৩৯৬৭৩৬০০`}
            </p>
            <button
              onClick={() => setShowPopup(false)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* SE IPS Modal */}
      {showSeIpsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200 relative">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Select Service
            </h3>
            <p className="text-gray-500 text-sm mb-6 font-medium">
              Choose where you would like to go
            </p>

            <div className="flex flex-col gap-3">
              <button
                disabled={!!loadingTarget}
                onClick={() => handleRedirect("https://seipsbd.com/", "seips")}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loadingTarget === "seips" ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  "SE IPS"
                )}
              </button>
              <button
                disabled={!!loadingTarget}
                onClick={() =>
                  handleRedirect("https://semartbd.com/", "semart")
                }
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loadingTarget === "semart" ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    <span>Redirecting...</span>
                  </>
                ) : (
                  "SE MART"
                )}
              </button>
            </div>

            <button
              disabled={!!loadingTarget}
              onClick={() => {
                setShowSeIpsModal(false);
                setLoadingTarget(null);
              }}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

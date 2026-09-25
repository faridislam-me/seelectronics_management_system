import { ImageWithLightbox } from "@/components/ui";
import { contactDetails } from "@/constants";
import { ApplicationTypes } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  BadgeCheck, Bell, CalendarCheck, CalendarDays, Check, ClipboardList, Clock, CreditCard, FileBadge, FileText, Headset, Home, IdCard,
  LucideIcon, Mail, MapPin, Package, Phone, Settings, ShieldCheck, Truck, User, UserCog, Wrench, X,
} from "lucide-react";
import Link from "next/link";

type Status = "pending" | "processing" | "approved" | "rejected" | "expired";

const typeConfig: Record<ApplicationTypes, { banner: string; sub: string; icon: LucideIcon; chip: string; steps: [string, string, string, string]; stepIcons: [LucideIcon, LucideIcon, LucideIcon, LucideIcon]; profileHref: string; noun: string }> = {
  seller_application: { banner: "Seller Tracking", sub: "আপনার সেলার আবেদনের বর্তমান অবস্থা", icon: Truck, chip: "SE Electronics Seller", steps: ["আবেদন জমা", "যাচাই প্রক্রিয়া", "ট্রেড লাইসেন্স", "সম্পূর্ণ"], stepIcons: [Check, FileText, IdCard, Check], profileHref: "/seller/login", noun: "সেলার আবেদন" },
  staff_application: { banner: "Staff Tracking", sub: "আপনার স্টাফ আবেদনের বর্তমান অবস্থা", icon: UserCog, chip: "SE Electronics Staff", steps: ["আবেদন জমা", "যাচাই প্রক্রিয়া", "NID যাচাই", "সম্পূর্ণ"], stepIcons: [Check, FileText, IdCard, Check], profileHref: "/staff/login", noun: "স্টাফ আবেদন" },
  subscription_application: { banner: "Subscription Tracking", sub: "আপনার সাবস্ক্রিপশন অনুরোধের বর্তমান অবস্থা", icon: CalendarCheck, chip: "SE Electronics Subscriber", steps: ["আবেদন জমা", "যাচাই প্রক্রিয়া", "প্যাকেজ সেটআপ", "সম্পূর্ণ"], stepIcons: [Check, FileText, Package, Check], profileHref: "/customer/login", noun: "সাবস্ক্রিপশন অনুরোধ" },
  service_application: { banner: "Service Tracking", sub: "আপনার সার্ভিস অনুরোধের বর্তমান অবস্থা", icon: Wrench, chip: "SE Electronics Customer", steps: ["অনুরোধ জমা", "যাচাই প্রক্রিয়া", "সার্ভিস সেন্টার", "সম্পূর্ণ"], stepIcons: [Check, FileText, Wrench, Check], profileHref: "/customer/login", noun: "সার্ভিস অনুরোধ" },
  vip_card_application: { banner: "VIP Card Tracking", sub: "আপনার ভিআইপি কার্ড আবেদনের বর্তমান অবস্থা", icon: CreditCard, chip: "SE Electronics VIP", steps: ["আবেদন জমা", "যাচাই প্রক্রিয়া", "কার্ড ইস্যু", "সম্পূর্ণ"], stepIcons: [Check, FileText, CreditCard, Check], profileHref: "/customer/login", noun: "ভিআইপি কার্ড আবেদন" },
};

const statusMeta: Record<Status, { label: string; chip: string; title: (noun: string) => string }> = {
  pending: { label: "PENDING", chip: "bg-[#fff6e3] text-[#c98a00] border-[#f0c55a]", title: (n) => `আপনার ${n} প্রক্রিয়াধীন` },
  processing: { label: "PROCESSING", chip: "bg-[#e8f1ff] text-[#1b6fd6] border-[#8fbcf7]", title: (n) => `আপনার ${n} যাচাই চলছে` },
  approved: { label: "APPROVED", chip: "bg-[#e9f9ef] text-[#178a42] border-[#8fd9a8]", title: (n) => `আপনার ${n} অনুমোদিত হয়েছে` },
  rejected: { label: "REJECTED", chip: "bg-[#ffe9ec] text-[#c81f38] border-[#f3a3ae]", title: (n) => `আপনার ${n} বাতিল হয়েছে` },
  expired: { label: "EXPIRED", chip: "bg-gray-100 text-gray-600 border-gray-300", title: (n) => `আপনার ${n} এর মেয়াদ শেষ` },
};

export type ApplicationTrackViewProps = {
  type: ApplicationTypes;
  status: Status;
  message: string;
  applicantName: string;
  phone: string;
  appliedAt: Date;
  photoUrl?: string | null;
  headline?: string | null;
  extraRows?: { label: string; value: React.ReactNode; icon: LucideIcon }[];
};

export default function ApplicationTrackView({ type, status, message, applicantName, phone, appliedAt, photoUrl, headline, extraRows = [] }: ApplicationTrackViewProps) {
  const cfg = typeConfig[type];
  const meta = statusMeta[status] ?? statusMeta.pending;
  const failed = status === "rejected" || status === "expired";
  // number of completed steps (out of 4)
  const done = status === "approved" ? 4 : status === "processing" ? 2 : 1;
  const active = failed ? -1 : status === "approved" ? -1 : done; // index of the step in progress
  const BannerIcon = cfg.icon;
  const displayName = headline || applicantName;
  const initials = displayName.trim().slice(0, 2).toUpperCase();

  const rows = [
    { label: "Applicant Name", value: applicantName, icon: User },
    { label: "Phone Number", value: phone, icon: Phone },
    { label: "Status", value: <span className={clsx("inline-flex items-center px-3 h-8 rounded-lg border-2 text-[12px] font-extrabold tracking-[1.5px]", meta.chip)}>{meta.label}</span>, icon: Clock },
    { label: "Applied Date", value: formatDate(appliedAt), icon: CalendarDays },
    ...extraRows,
  ];

  const stepSub = (i: number) => {
    if (i === 0) return formatDate(appliedAt);
    if (failed) return i === 1 ? (status === "rejected" ? "বাতিল" : "মেয়াদ শেষ") : "—";
    if (i < done) return "সম্পন্ন";
    if (i === active) return "প্রক্রিয়াধীন";
    if (i === 3) return "এখনো সম্পন্ন নয়";
    return "অপেক্ষমান";
  };

  const nav = [
    { label: "Home", icon: Home, href: "/" },
    { label: "My Applications", icon: ClipboardList, href: "#", current: true },
    { label: "Support", icon: Headset, href: `tel:${contactDetails.customerCare}` },
    { label: "Profile", icon: User, href: cfg.profileHref },
  ];

  return (
    <div className="min-h-screen bg-[#eef3fb] flex flex-col">
      {/* App header */}
      <header className="sticky top-0 z-40 bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white">
        <div className="max-w-[640px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span className="size-11 rounded-lg bg-[#1f7cf0] text-white font-extrabold text-lg flex items-center justify-center shadow-[0_6px_16px_rgba(0,40,120,0.35)]">SE</span>
            <span className="flex flex-col leading-tight">
              <span className="font-extrabold text-lg">SE Electronics</span>
              <span className="text-white/85 text-[11px] font-medium">Smart Solution &nbsp;Better Life</span>
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="relative size-11 flex items-center justify-center">
              <Bell size={24} strokeWidth={2} />
              {!failed && <span className="absolute top-1 right-1 min-w-5 h-5 px-1 rounded-full bg-[#e5484d] text-[11px] font-extrabold flex items-center justify-center">{done}</span>}
            </span>
            <span className="size-11 flex items-center justify-center"><Settings size={24} strokeWidth={2} /></span>
          </span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[640px] mx-auto px-3.5 pt-3.5 pb-28 flex flex-col gap-3.5">
        {/* Banner */}
        <section className="relative overflow-hidden rounded-[12px] bg-[#0a2f70] bg-[linear-gradient(100deg,#0a2f70_0%,#0d3f96_45%,#1b5fd0_70%,#0a2f70_100%)] text-white shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute right-[26%] -top-10 h-[200%] w-24 bg-white/10 rotate-[18deg]" />
          <span className="absolute right-[22%] -top-10 h-[200%] w-3 bg-[#7fb4ff]/50 rotate-[18deg]" />
          <div className="relative flex items-center">
            <div className="flex items-center gap-3.5 p-4 flex-1 min-w-0">
              <span className="size-[68px] rounded-full bg-[#0b3d91] border-[3px] border-[#4c9bff] flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(76,155,255,0.25)]"><BannerIcon size={32} strokeWidth={2} /></span>
              <span className="flex flex-col gap-1 min-w-0">
                <span className="text-[21px] font-extrabold leading-tight">{cfg.banner}</span>
                <span className="text-[13px] text-white/90 leading-snug">{cfg.sub}</span>
                <span className="mt-1 h-1.5 w-28 rounded-full bg-white/20 overflow-hidden"><span className={clsx("block h-full rounded-full bg-[#4c9bff]", failed ? "w-1/4 bg-[#e0243f]" : done === 4 ? "w-full bg-[#2ecc71]" : done === 2 ? "w-1/2" : "w-1/4")} /></span>
              </span>
            </div>
            <div className="flex w-[34%] shrink-0 items-center justify-center py-4 pr-3">
              <span className="font-script text-[38px] leading-[0.9] text-center rotate-[-6deg] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">SE Electronics<br /><span className="font-sans text-[13px] font-bold tracking-wide">সাথে সবসময়</span></span>
            </div>
          </div>
        </section>

        {/* Contact strip */}
        <section className="bg-white rounded-[12px] p-3.5 shadow-[0_4px_18px_rgba(11,61,145,0.06)] grid grid-cols-3 divide-x divide-[#eef1f6]">
          {[
            { icon: Phone, label: "হেল্পলাইন", value: contactDetails.customerCare, href: `tel:${contactDetails.customerCare}` },
            { icon: Mail, label: "Email", value: contactDetails.email, href: `mailto:${contactDetails.email}` },
            { icon: MapPin, label: "হেড অফিস", value: contactDetails.headOffice.trim() },
          ].map((c) => {
            const inner = (
              <>
                <span className="size-8 sm:size-10 rounded-full bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><c.icon size={15} /></span>
                <span className="flex flex-col min-w-0 leading-tight">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-[#6b7690]">{c.label}</span>
                  <span className="text-[10.5px] sm:text-[12px] font-extrabold text-[#16213a] break-all">{c.value}</span>
                </span>
              </>
            );
            const cls = "flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 first:pl-0 last:pr-0";
            return c.href ? <a key={c.label} href={c.href} className={cls}>{inner}</a> : <div key={c.label} className={cls}>{inner}</div>;
          })}
        </section>

        {/* Applicant */}
        <section className="bg-white rounded-[12px] shadow-[0_4px_18px_rgba(11,61,145,0.06)] overflow-hidden">
          <div className="flex items-center gap-4 p-4 bg-[#f5f8fd]">
            {photoUrl ? (
              <div className="size-[92px] rounded-full overflow-hidden border-[3px] border-[#1f7cf0] shadow-[0_0_0_3px_#e8f1ff] shrink-0 bg-white">
                <ImageWithLightbox src={photoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <span className="size-[92px] rounded-full bg-[#1f7cf0] border-[3px] border-white shadow-[0_0_0_3px_#1f7cf0] flex items-center justify-center text-2xl font-extrabold text-white shrink-0">{initials || "SE"}</span>
            )}
            <span className="flex flex-col gap-1.5 min-w-0">
              <span className="flex items-center gap-1.5 text-[22px] font-extrabold text-[#16213a] leading-tight"><span className="truncate">{displayName}</span>{status === "approved" ? <BadgeCheck size={22} className="text-[#1f7cf0] shrink-0" fill="#1f7cf0" stroke="white" /> : <ShieldCheck size={20} className="text-[#1f7cf0] shrink-0" />}</span>
              <span className="self-start px-3 py-1 rounded-lg bg-[#e8f1ff] text-[#1b6fd6] text-[13px] font-semibold">{cfg.chip}</span>
            </span>
          </div>
          <div className="px-4 pb-1">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 py-3.5 border-b border-[#eef1f6] last:border-0">
                <span className="text-[#0b3d91]"><r.icon size={20} strokeWidth={2.2} /></span>
                <span className="text-[15px] font-semibold text-[#16213a] flex-1">{r.label}</span>
                <span className="text-[15px] font-extrabold text-[#16213a] text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status + stepper */}
        <section className={clsx("rounded-[12px] p-4 border shadow-[0_4px_18px_rgba(11,61,145,0.06)]", status === "approved" ? "bg-[#eafaf0] border-[#bfe8cd]" : failed ? "bg-[#fff0f2] border-[#f7c3ca]" : "bg-[#e8f1ff] border-[#cfe0fb]")}>
          <div className="flex gap-3.5">
            <span className={clsx("size-[68px] rounded-full border-[3px] flex items-center justify-center shrink-0", status === "approved" ? "bg-[#d4f3e0] border-[#1a9c4b] text-[#1a9c4b]" : failed ? "bg-[#ffe0e4] border-[#e0243f] text-[#e0243f]" : "bg-[#d6e7ff] border-[#1f7cf0] text-[#1f7cf0]")}>
              {failed ? <X size={30} strokeWidth={2.5} /> : status === "approved" ? <Check size={30} strokeWidth={2.5} /> : <BannerIcon size={30} strokeWidth={2} />}
            </span>
            <div className="flex flex-col gap-1.5 min-w-0">
              <span className="text-[16px] font-extrabold text-[#16213a] leading-snug">{meta.title(cfg.noun)}</span>
              <p className="text-[13.5px] leading-relaxed text-[#3d4a63] whitespace-pre-line"><b className="text-[#16213a]">{applicantName}</b>, {message.replace(new RegExp(`^${applicantName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*,?\\s*`), "")}</p>
            </div>
          </div>

          <div className="mt-6 flex items-start">
            {cfg.steps.map((label, i) => {
              const StepIcon = cfg.stepIcons[i];
              const isDone = i < done;
              const isActive = i === active;
              const isFailed = failed && i === 1;
              return (
                <div key={label} className="flex items-start flex-1 last:flex-none">
                  <div className="flex flex-col items-center gap-2 w-[68px] sm:w-24">
                    <span className={clsx("size-12 rounded-full flex items-center justify-center border-[3px] transition-all",
                      isFailed ? "bg-[#e0243f] border-[#e0243f] text-white" :
                      isDone ? "bg-[#1f7cf0] border-[#1f7cf0] text-white shadow-[0_6px_14px_rgba(31,124,240,0.35)]" :
                      isActive ? "bg-[#1f7cf0] border-[#1f7cf0] text-white shadow-[0_0_0_5px_#cfe0fb]" :
                      "bg-white border-[#d7deea] text-[#9aa4b8]")}>
                      {isFailed ? <X size={22} strokeWidth={2.6} /> : isDone && !isActive ? <Check size={22} strokeWidth={2.8} /> : <StepIcon size={22} strokeWidth={2.2} />}
                    </span>
                    <span className={clsx("text-[13px] font-extrabold text-center leading-tight", isDone || isActive ? "text-[#16213a]" : "text-[#6b7690]")}>{label}</span>
                    <span className="text-[11px] font-semibold text-[#6b7690] text-center leading-tight -mt-1">{stepSub(i)}</span>
                  </div>
                  {i < 3 && <span className={clsx("flex-1 h-1 rounded-full mt-[22px] -mx-4", i < done - 1 || (i === done - 1 && active === done) ? "bg-[#1f7cf0]" : "bg-[#d7deea]")} />}
                </div>
              );
            })}
          </div>
        </section>

        {headline && (
          <section className="bg-white rounded-[12px] p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)] flex items-center gap-3">
            <span className="size-11 rounded-lg bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><FileBadge size={20} /></span>
            <span className="flex flex-col"><span className="text-xs font-semibold text-[#6b7690]">যাচাই করা হবে</span><span className="text-[14px] font-extrabold text-[#16213a]">ট্রেড লাইসেন্স, NID ও দোকানের ছবি</span></span>
          </section>
        )}
        <p className="text-center text-[11px] font-semibold text-[#9aa4b8]">© SE Electronics · {contactDetails.website}</p>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-2 left-1/2 -translate-x-1/2 w-[calc(100%-16px)] max-w-[600px] h-[76px] bg-white rounded-[12px] shadow-[0_-4px_24px_rgba(11,61,145,0.15)] grid grid-cols-4 items-center px-2 z-50">
        {nav.map((n) => (
          <Link key={n.label} href={n.href} className={clsx("relative flex flex-col items-center justify-center gap-1 min-h-11", n.current ? "text-[#1f7cf0]" : "text-[#6b7690]")}>
            <n.icon size={24} strokeWidth={2} />
            <span className="text-[12px] font-bold">{n.label}</span>
            {n.current && <span className="absolute -bottom-2 w-14 h-1 rounded-full bg-[#1f7cf0]" />}
          </Link>
        ))}
      </nav>
    </div>
  );
}

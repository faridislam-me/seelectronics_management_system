"use client";

import { contactDetails } from "@/constants";
import { AlertCircle, Building2, ChevronRight, Clock, Headphones, HelpCircle, Mail, MessageCircle, PhoneCall, Ticket, UserCog, Users } from "lucide-react";
import Link from "next/link";

const SUPPORT_CONTACTS = [
  { label: "কাস্টমার কেয়ার", englishLabel: "Customer Care", number: "09649355555", icon: Headphones, tile: "bg-[#1f7cf0]", bg: "bg-[#e8f1ff] border-[#bcd4fb]", btn: "bg-[#d6e7ff] text-[#1b6fd6]", description: "২৪/৭ যেকোনো কারিগরি ও সাধারণ সহায়তার জন্য কল করুন।" },
  { label: "মার্কেটিং ম্যানেজার", englishLabel: "Marketing Manager", number: "01322247774", icon: UserCog, tile: "bg-[#8b3fe8]", bg: "bg-[#f3e9ff] border-[#dcc6fb]", btn: "bg-[#e6d6fb] text-[#7a35d2]", description: "পণ্য রিভিও, প্রমোশন ও মার্কেটিং বিষয়ক আলোচনার জন্য।" },
  { label: "অফিস মোবাইল", englishLabel: "Office Mobile", number: "01310673600", icon: Building2, tile: "bg-[#1a9c4b]", bg: "bg-[#e9f9ef] border-[#bfe8cd]", btn: "bg-[#d4f3e0] text-[#178a42]", description: "অফিসিয়াল অর্ডার স্ট্যাটাস ও অন্যান্য ডকুমেন্টস সংক্রান্ত কাজে।" },
];

const HOURS = "শনিবার - বৃহস্পতিবার: সকাল ০৯:০০ - রাত ০৮:০০";

/** Shared support screen (customer + staff). Text content unchanged; only the presentation. */
export default function SupportScreen({ ticketHref = "/customer/complain" }: { ticketHref?: string }) {
  const quick = [
    { label: "কল করুন", sub: "সরাসরি কথা বলুন", icon: PhoneCall, color: "bg-[#1f7cf0]", href: `tel:${contactDetails.customerCare}` },
    { label: "WhatsApp", sub: "দ্রুত সাপোর্ট পেতে", icon: MessageCircle, color: "bg-[#1a9c4b]", href: `https://wa.me/${contactDetails.whatsApp.replace("+", "")}` },
    { label: "ইমেইল", sub: "লিখিত অভিযোগ", icon: Mail, color: "bg-[#8b3fe8]", href: "mailto:support@seelectronics.com" },
    { label: "সাপোর্ট টিকিট", sub: "অনলাইন সাপোর্ট", icon: Ticket, color: "bg-[#e0a11b]", href: ticketHref },
  ];

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-24 text-[#16213a]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
        <span className="absolute -right-8 -top-10 size-40 rounded-full bg-white/10" />
        <span className="absolute right-3 top-3 font-script text-[clamp(13px,3.6vw,16px)] leading-[1] text-right text-white/90 rotate-[-6deg]">আমরা আছি<br />আপনার সাথে</span>
        <div className="relative flex items-start gap-3 pr-16">
          <span className="size-12 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Headphones size={26} /></span>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[2px] text-white/85"><span className="relative flex size-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2ecc71] opacity-75" /><span className="relative inline-flex rounded-full size-2 bg-[#2ecc71]" /></span>সরাসরি সাপোর্ট</span>
            <span className="text-[13px] font-semibold text-white/90">এস ই ইলেকট্রনিকস</span>
            <span className="text-[clamp(22px,6.6vw,28px)] font-extrabold leading-none">সাপোর্ট টিম</span>
            <span className="text-[14px] font-bold">সহযোগিতার জন্য আমাদের টিম, আপনার পাশে সবসময়</span>
          </div>
        </div>
        <p className="relative mt-3 text-[13px] leading-relaxed text-white/90">আপনার যেকোনো সমস্যা বা জিজ্ঞাসায় আমাদের দক্ষ টিম আপনার সেবায় নিয়োজিত। নিচের বাটনগুলোতে ক্লিক করে সরাসরি যোগাযোগ করুন।</p>
        <a href={`tel:${contactDetails.customerCare}`} className="relative mt-3 inline-flex items-center gap-2 h-10 px-4 rounded-md bg-white/15 border border-white/30 text-[13px] font-extrabold"><Headphones size={16} />কিভাবে সাহায্য চান?<ChevronRight size={15} /></a>
      </section>

      {/* Quick contact */}
      <section className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex flex-col gap-2.5">
        <span className="flex items-center gap-2 text-[16px] font-extrabold"><span className="size-8 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Headphones size={16} /></span>দ্রুত যোগাযোগ করুন</span>
        <div className="grid grid-cols-4 gap-2">
          {quick.map((q) => (
            <a key={q.label} href={q.href} target={q.href.startsWith("http") ? "_blank" : undefined} rel="noopener" className="rounded-md bg-white p-2 flex flex-col items-center text-center gap-1.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
              <span className={`size-11 rounded-full ${q.color} text-white flex items-center justify-center`}><q.icon size={20} /></span>
              <span className="text-[12px] font-extrabold leading-tight">{q.label}</span>
              <span className="text-[10px] font-semibold text-[#5b6784] leading-tight">{q.sub}</span>
              <span className={`size-5 rounded-full ${q.color} text-white flex items-center justify-center`}><ChevronRight size={11} strokeWidth={3} /></span>
            </a>
          ))}
        </div>
      </section>

      {/* Contact list */}
      <span className="flex items-center gap-2 text-[16px] font-extrabold px-0.5 mt-1"><span className="size-8 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Users size={16} /></span>আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন</span>
      {SUPPORT_CONTACTS.map((c) => (
        <div key={c.number} className={`rounded-md border p-2.5 flex items-center gap-3 ${c.bg}`}>
          <span className={`size-12 rounded-full ${c.tile} text-white flex items-center justify-center shrink-0`}><c.icon size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 gap-0.5">
            <span className="text-[14px] font-extrabold leading-tight">{c.label} <span className="text-[10px] font-bold text-[#5b6784] uppercase tracking-wide">· {c.englishLabel}</span></span>
            <span className="text-[clamp(16px,4.8vw,20px)] font-extrabold tabular-nums leading-tight">{c.number}</span>
            <span className="text-[11px] font-semibold text-[#5b6784] leading-snug">{c.description}</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5b6784]"><Clock size={12} />{HOURS}</span>
          </span>
          <a href={`tel:${c.number}`} className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-extrabold ${c.btn}`}><PhoneCall size={14} />কল করুন<ChevronRight size={13} /></a>
        </div>
      ))}

      {/* FAQ + Email */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex flex-col gap-1.5">
          <span className="flex items-center gap-2"><span className="size-9 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center"><HelpCircle size={18} /></span><span className="text-[14px] font-extrabold">সেবার সময়</span></span>
          <span className="text-[12px] font-semibold text-[#3d4a63] leading-snug">{HOURS}</span>
          <span className="self-start inline-flex items-center h-7 px-2.5 rounded-md bg-[#1a9c4b] text-white text-[11px] font-extrabold">সচল রয়েছে</span>
        </div>
        <a href="mailto:support@seelectronics.com" className="rounded-md bg-[#f3e9ff] border border-[#dcc6fb] p-2.5 flex flex-col gap-1.5">
          <span className="flex items-center gap-2"><span className="size-9 rounded-full bg-[#8b3fe8] text-white flex items-center justify-center"><Mail size={18} /></span><span className="text-[14px] font-extrabold">ইমেইল করুন</span></span>
          <span className="text-[12px] font-semibold text-[#3d4a63] leading-snug">যেকোনো তথ্যের জন্য:</span>
          <span className="self-start inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#e6d6fb] text-[#7a35d2] text-[11px] font-extrabold break-all"><Mail size={12} />support@seelectronics.com</span>
        </a>
      </div>

      {/* Emergency */}
      <div className="rounded-md bg-[#e9f9ef] border border-[#bfe8cd] p-2.5 flex items-center gap-3">
        <span className="size-11 rounded-full bg-[#1a9c4b] text-white flex items-center justify-center shrink-0"><AlertCircle size={22} /></span>
        <span className="flex flex-col min-w-0 flex-1"><span className="text-[14px] font-extrabold">জরুরী সহায়তা প্রয়োজন?</span><span className="text-[11px] font-semibold text-[#3d4a63]">প্রয়োজনে আমাদের সাথে দ্রুত যোগাযোগ করুন</span></span>
        <a href={`tel:${contactDetails.customerCare}`} className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#1a9c4b] text-white text-[12px] font-extrabold"><PhoneCall size={14} />ইমারজেন্সি কল<ChevronRight size={13} /></a>
      </div>

      <p className="text-center text-[12px] font-medium text-[#5b6784] leading-relaxed px-2">আমাদের সাপোর্ট টিম আপনার সেবার জন্য সর্বদাই তৎপর। কল করতে কোনো সমস্যা হলে আপনি ইমেইল অথবা ফেসবুক পেজে মেসেজ দিতে পারেন।</p>
      <Link href="/" className="sr-only">Home</Link>
    </div>
  );
}

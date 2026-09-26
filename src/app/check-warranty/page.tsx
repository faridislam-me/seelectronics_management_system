"use client";

import { getInvoiceByNumber } from "@/actions";
import { CustomerAppFooter, CustomerAppNav, SEWordmark } from "@/components/ui/CustomerAppChrome";
import { contactDetails } from "@/constants";
import { calculateWarrantyEndDate, formatDate, isWarrantyValid } from "@/utils";
import clsx from "clsx";
import { Calendar, CalendarCheck, CheckCircle2, FileText, Headset, Home, IdCard, Info, Lock, Mail, MapPin, Menu, Phone, Search, ShieldCheck, TimerOff, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const reasons = [
  { icon: ShieldCheck, text: "ওয়ারেন্টি স্ট্যাটাস জানুন" },
  { icon: CalendarCheck, text: "ওয়ারেন্টির মেয়াদ পরীক্ষা করুন" },
  { icon: Lock, text: "নির্ভরযোগ্য সেবা নিশ্চিত করুন" },
  { icon: Headset, text: "দ্রুত ও সহজ সাপোর্ট পান" },
];

export default function CheckWarrantyPage() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [warrantyData, setWarrantyData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) return setError("ইনভয়েস নম্বর প্রবেশ করান");
    setLoading(true); setError(""); setWarrantyData(null);
    try {
      const response = await getInvoiceByNumber(invoiceNumber.trim());
      if (!response.success) setError("দুঃখিত, এই ইনভয়েস নাম্বার দিয়ে কোনো তথ্য পাওয়া যায়নি। সম্ভবত এটি এস ই ইলেকট্রনিকস এর ইনভয়েস নয়। সঠিক নাম্বার দিয়ে আবার চেষ্টা করুন।");
      else setWarrantyData(response.data);
    } catch {
      setError("একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-24">
      <header className="relative bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 pt-3 pb-7 rounded-b-[26px] overflow-hidden">
        <span className="absolute -right-10 -top-14 size-56 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <Link href="/"><SEWordmark /></Link>
          <span className="h-10 w-px bg-white/40" />
          <span className="text-[clamp(14px,4vw,17px)] font-extrabold leading-tight flex-1 min-w-0">বিশ্বাসে প্রযুক্তি<br />সেবায় আমরা</span>
          <Link href="/customer/profile" aria-label="Menu" className="size-10 flex items-center justify-center"><Menu size={26} /></Link>
        </div>
      </header>

      <main className="px-2 -mt-4 relative flex flex-col gap-2.5 max-w-[560px] mx-auto">
        {/* Hero */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex items-center gap-3 shadow-[0_6px_18px_rgba(11,61,145,0.10)]">
          <span className="relative size-[72px] shrink-0 flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-[#e8f1ff]" />
            <ShieldCheck size={44} className="relative text-[#0b3d91]" strokeWidth={2} />
          </span>
          <span className="flex flex-col min-w-0 leading-tight">
            <span className="text-[clamp(22px,6.4vw,28px)] font-extrabold text-[#0b3d91]">ওয়ারেন্টি চেক</span>
            <span className="text-[13px] font-semibold text-[#3d4a63]">আপনার পণ্যের ওয়ারেন্টি স্ট্যাটাস সহজেই যাচাই করুন</span>
          </span>
        </section>

        {/* Contact strip */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 grid grid-cols-2 gap-x-2 gap-y-2.5 text-[12px]">
          <span className="flex items-center gap-2 min-w-0"><span className="size-9 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><Phone size={16} /></span><span className="flex flex-col min-w-0"><span className="text-[#5b6784] font-semibold">হেল্পলাইন</span><span className="font-extrabold truncate">{contactDetails.customerCare}</span></span></span>
          <span className="flex items-center gap-2 min-w-0 border-l border-[#eef1f6] pl-2"><span className="size-9 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><Mail size={16} /></span><span className="flex flex-col min-w-0"><span className="text-[#5b6784] font-semibold">ইমেইল</span><span className="font-extrabold truncate">{contactDetails.email}</span></span></span>
          <span className="col-span-2 flex items-center gap-2 min-w-0 border-t border-[#eef1f6] pt-2"><span className="size-9 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><MapPin size={16} /></span><span className="font-extrabold">হেড অফিস : {contactDetails.headOffice.trim()}</span></span>
        </section>

        {/* Form */}
        <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_6px_18px_rgba(11,61,145,0.10)]">
          <div className="flex items-center gap-3 bg-[#0b3d91] bg-[linear-gradient(100deg,#0a2f70_0%,#1259c9_100%)] text-white px-3 py-3">
            <span className="size-10 rounded-full bg-white/15 border border-white/25 flex items-center justify-center"><ShieldCheck size={20} /></span>
            <span className="text-[clamp(16px,4.8vw,20px)] font-extrabold">ওয়ারেন্টি চেক করুন</span>
          </div>
          <div className="p-3 flex flex-col gap-2.5">
            <label className="relative block">
              <span className="absolute left-0 top-0 h-12 w-11 flex items-center justify-center text-[#5b6784]"><FileText size={20} /></span>
              <input type="text" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} placeholder="ইনভয়েস নম্বর লিখুন" disabled={loading} className="w-full h-12 rounded-md border border-[#dfe6f2] bg-[#f8fafd] pl-11 pr-3 text-[15px] font-semibold outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]" />
            </label>
            <button onClick={handleSubmit} disabled={loading} className="h-12 rounded-md bg-[#0b3d91] text-white text-[16px] font-extrabold inline-flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_8px_20px_rgba(11,61,145,0.3)] active:scale-[0.98] transition-all">
              <Search size={20} strokeWidth={2.6} />{loading ? "Checking..." : "Check"}
            </button>
            {error && <p className="rounded-md bg-[#ffe9ec] border border-[#f7c3ca] text-[#c81f38] text-[13px] font-medium p-3 leading-relaxed">{error}</p>}
          </div>
        </section>

        {/* Results */}
        {warrantyData && (
          <>
            <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-1">
              <span className="text-[15px] font-extrabold mb-1">গ্রাহকের তথ্য</span>
              {[
                { icon: User, label: "নাম", value: warrantyData.customerName },
                { icon: IdCard, label: "কাস্টমার আইডি", value: warrantyData.customerId },
                { icon: Phone, label: "ফোন নম্বর", value: warrantyData.customerPhone },
                { icon: Calendar, label: "ক্রয়ের তারিখ", value: formatDate(warrantyData.date) },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 py-2 border-t border-[#eef1f6] first-of-type:border-0">
                  <span className="size-9 rounded-md bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><r.icon size={17} /></span>
                  <span className="flex flex-col min-w-0"><span className="text-[11px] font-semibold text-[#5b6784]">{r.label}</span><span className="text-[14px] font-extrabold truncate">{r.value}</span></span>
                </div>
              ))}
            </section>
            <section className="flex flex-col gap-2">
              <span className="text-[15px] font-extrabold px-0.5">ক্রয়কৃত পণ্য</span>
              {warrantyData.products.map((product: any, index: number) => {
                const has = product.warrantyDurationMonths > 0;
                const valid = has && isWarrantyValid(product.warrantyStartDate, product.warrantyDurationMonths);
                const end = has ? calculateWarrantyEndDate(product.warrantyStartDate, product.warrantyDurationMonths) : null;
                return (
                  <div key={index} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[15px] font-extrabold">{product.type.toUpperCase()} · {product.model}</span>
                      <span className={clsx("inline-flex items-center gap-1 px-2 h-7 rounded-md border text-[11px] font-extrabold", !has ? "bg-gray-100 text-gray-600 border-gray-200" : valid ? "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]" : "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]")}>
                        {!has ? "ওয়ারেন্টি নেই" : valid ? <><CheckCircle2 size={13} />ওয়ারেন্টি আছে</> : <><TimerOff size={13} />ওয়ারেন্টি শেষ</>}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <span className="rounded-md bg-[#f5f7fb] p-2 flex flex-col"><span className="text-[#5b6784] font-semibold">ওয়ারেন্টি</span><span className="font-extrabold">{has ? `${product.warrantyDurationMonths} মাস` : "N/A"}</span></span>
                      <span className="rounded-md bg-[#f5f7fb] p-2 flex flex-col"><span className="text-[#5b6784] font-semibold">শুরুর তারিখ</span><span className="font-extrabold">{formatDate(product.warrantyStartDate)}</span></span>
                      {end && <span className="col-span-2 rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-2 flex flex-col"><span className="text-[#8a4a05] font-semibold">{valid ? "ওয়ারেন্টি শেষ হবে" : "ওয়ারেন্টি শেষ হয়েছে"}</span><span className="font-extrabold text-[#c81f38]">{formatDate(end)}</span></span>}
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}

        {/* Why check */}
        <section className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-3">
          <span className="flex items-center gap-2"><span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Info size={18} /></span><span className="text-[clamp(15px,4.4vw,18px)] font-extrabold">কেন ওয়ারেন্টি চেক করবেন?</span></span>
          <div className="grid grid-cols-4 divide-x divide-[#eef1f6]">
            {reasons.map((r) => (
              <div key={r.text} className="flex flex-col items-center text-center gap-1.5 px-1">
                <span className="size-12 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center"><r.icon size={24} strokeWidth={2} /></span>
                <span className="text-[11px] font-bold leading-tight">{r.text}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <CustomerAppFooter tagline="আপনার আস্থাই আমাদের শক্তি" />

      <CustomerAppNav active="/check-warranty" items={[
        { label: "হোম", icon: Home, href: "/customer/profile" },
        { label: "ওয়ারেন্টি চেক", icon: ShieldCheck, href: "/check-warranty" },
        { label: "প্রোফাইল", icon: User, href: "/customer/profile" },
      ]} />
    </div>
  );
}

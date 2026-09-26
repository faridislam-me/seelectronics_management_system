"use client";

import { createService } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import { InputField } from "@/components";
import { batteryTypes, contactDetails, ipsBrands, productPowerRatings, productTypes, stabilizerBrands, stabilizerPowerRatings } from "@/constants";
import { useThemeColor } from "@/hooks";
import clsx from "clsx";
import { Box, Calendar, CheckCircle2, ChevronRight, ClipboardList, FileText, Headset, Home, ImagePlus, LucideIcon, MapPin, Phone, Send, Settings, ShieldCheck, Truck, User, Wrench } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

const requirementsList: { title: string; description: string; icon: LucideIcon }[] = [
  {
    icon: User,
    title: "প্রয়োজনীয় যোগাযোগের তথ্য (Contact Information)",
    description: `সার্ভিসিং প্রক্রিয়া দ্রুত সম্পন্ন করার জন্য আপনার সম্পূর্ণ ও সঠিক তথ্য প্রদান করা অত্যাবশ্যক। ফর্মে নিম্নলিখিত তথ্যগুলি বাংলায় পূরণ করুন, নাম গ্রাহকের সম্পূর্ণ নাম গ্যারান্টি কার্ড বা অনলাইন ইনভয়েস অনুযায়ী, মোবাইল নাম্বার, যে নাম্বারে প্রতি মাসে ব্যাটারি পানির জন্য এস এম এস ও কল যার সেই নাম্বারটা, ঠিকানা (বর্তমান) আপনার বর্তমান যে আপনার আই পি এস ও ব্যাটারি বা আমাদের অন্যান্য ইলেকট্রনিক্স ডিভাইস আছে এর সম্পূর্ণ ঠিকানা, থানা, পোস্ট অফিস, জেলা`,
  },
  {
    icon: ImagePlus,
    title: "প্রোডাক্ট এবং ওয়ারেন্টি সংক্রান্ত ডকুমেন্টেশন",
    description: "আপনার প্রোডাক্টের ওয়ারেন্টি স্ট্যাটাস যাচাই এবং সমস্যার সঠিক কারণ অনুসন্ধানের জন্য নিম্নলিখিত ডকুমেন্টগুলি স্পষ্ট ছবি আকারে আপলোড করা বাধ্যতামূলক, নষ্ট প্রোডাক্টের ছবি (সামনের ও পিছনের) ২ টি ছবি, গ্যারান্টি কার্ডের ছবি, আপনার গ্যারান্টি কার্ডের ১টি স্পষ্ট ছবি আপলোড করতে হবে। গ্যারান্টি কার্ডের ছবি ছাড়া কোনো আবেদন গ্রহণ করা হবে না। বাধ্যতামূলক দিতে হবে, সমস্যার সংক্ষিপ্ত ভিডিও ১টি ভিডিও (সর্বোচ্চ ৬০ সেকেন্ড)",
  },
  {
    icon: Settings,
    title: "আইপিএস এবং ব্যাটারির প্রযুক্তিগত বিবরণ (IPS & Battery Technical Details)",
    description: "প্রোডাক্টের ধরন আইপিএস IPS মডেল নম্বর, ভিএ (VA) রেটিং এবং ওয়াট (Watt) আউটপুট ক্ষমতা। ব্যাটারি ব্র্যান্ডের নাম  অন্যান্য BhatBattery মডেল নম্বর এবং ব্যাটারির অ্যাম্পিয়ার (Ah) উল্লেখ করতে হবে।",
  },
  {
    icon: Wrench,
    title: "সার্ভিসিং এবং ওয়ারেন্টির শর্তাবলী (Terms and Conditions of Servicing)",
    description: "সার্ভিসিং-এর খরচ ও প্রক্রিয়া সম্পূর্ণরূপে নিম্নলিখিত নিয়মের উপর নির্ভরশীল ওয়ারেন্টি সময়কালের মধ্যে (Under Warranty Period):​ফ্রি সার্ভিস: এস ই ইলেকট্রনিকস কর্তৃক নির্ধারিত গ্যারান্টি সময়কাল (ওয়ারেন্টি কার্ডে উল্লেখিত) মধ্যে যদি প্রোডাক্টে উৎপাদনজনিত (Manufacturing Defect) ত্রুটি দেখা দেয়, তবে সার্ভিসিং বা মেরামত সম্পূর্ণ বিনামূল্যে করা হবে।",
  },
  {
    icon: ShieldCheck,
    title: "রিপ্লেসমেন্ট",
    description: "যদি উৎপাদনজনিত ত্রুটির কারণে মেরামত সম্ভব না হয়, তবে কোম্পানির নীতিমালা অনুযায়ী সমমানের বা উন্নতমানের নতুন একটি প্রোডাক্ট দিয়ে প্রতিস্থাপন (Replacement) করা হতে পারে।",
  },
  {
    icon: Truck,
    title: "কুরিয়ার চার্জ",
    description: "ওয়ারেন্টি সময়কালে সার্ভিসিং-এর জন্য আমাদের সার্ভিস সেন্টারে প্রোডাক্ট পাঠানো এবং মেরামত শেষে ফেরত আনার কুরিয়ার চার্জ গ্রাহককে বহন করতে হতে পারে সিলেট সিটির বাইরে হতে অথবা কোম্পানি কর্তৃক আংশিক/সম্পূর্ণ বহন করা হতে পারে (কোম্পানির তৎকালীন নীতিমালা অনুসারে)।",
  },
  {
    icon: Calendar,
    title: "ওয়ারেন্টি সময়কালের বাইরে (Out of Warranty Period)",
    description: `সার্ভিস চার্জ প্রযোজ্যতা: যদি গ্যারান্টি সময়কাল শেষ হয়ে যায় বা ত্রুটি অপব্যবহার/বাহ্যিক কারণে (যেমন: অতিরিক্ত লোড, ভুল সংযোগ, প্রাকৃতিক দুর্যোগ,বজ্রপাত,  অগ্নিসংযোগ, পানি প্রবেশ, পোকামাকড় ইত্যাদি) সৃষ্টি হয়, তবে তা ওয়ারেন্টির আওতাভুক্ত হবে না।
        প্রদেয় মূল্য: এই ক্ষেত্রে, সার্ভিসিং-এর ধরন অনুযায়ী (যেমন: যন্ত্রাংশের মূল্য, টেকনিশিয়ান ফি, মেরামতের খরচ) একটি সার্ভিস চার্জ ধার্য করা হবে। সার্ভিসিং শুরু করার আগে এই চার্জ সম্পর্কে আপনাকে বিস্তারিত অবহিত করা হবে এবং আপনার সম্মতি সাপেক্ষে কাজ শুরু হবে।
        `,
  },
  {
    icon: Truck,
    title: "কুরিয়ার চার্জ বা ভাড়া",
    description: "সিলেট সিটির বাইরে হলে  ওয়ারেন্টি-বহির্ভূত সার্ভিসের ক্ষেত্রে প্রোডাক্ট আনা-নেওয়ার সমস্ত কুরিয়ার চার্জ গ্রাহককে বহন করতে হবে।",
  },
  {
    icon: FileText,
    title: "সাধারণ নিয়মাবলী (General Rules)",
    description: `তথ্যের সত্যতা: ফর্মে প্রদত্ত সকল তথ্য অবশ্যই সঠিক ও নির্ভুল হতে হবে। ভুল তথ্য প্রদানের কারণে আপনার সার্ভিসিং আবেদন বাতিল হতে পারে বা প্রক্রিয়া বিলম্বিত হতে পারে।
​যোগাযোগের সময়: আপনার অনলাইন আবেদন জমা দেওয়ার পর আপনার নাম্বারে সার্ভিস অনুরোধ গ্রহণের একটি এসএমএস চলে যাবে ২৪ থেকে ৪৮ ঘণ্টার মধ্যে (সরকারি ছুটির দিন বাদে) আমাদের টেকনিক্যাল টিম আপনার প্রদত্ত মোবাইল নাম্বারে যোগাযোগ করবে।
​কাস্টামারের বাসায় ডিভাইস মেরামত বা সার্ভিসিং-এর সময় কোনো ব্যক্তিগত পন্য লাইট, প্লাক, সকেট ক্ষতিগ্রস্ত হলে এস ই ইলেকট্রনিকস তার জন্য দায়ী থাকবে না।
​ত্রুটিপূর্ণ পণ্য ফেরত: সার্ভিসিং বা রিপ্লেসমেন্ট পাওয়ার জন্য ত্রুটিপূর্ণ প্রোডাক্টটি অবশ্যই আমাদের সার্ভিস সেন্টারে (কুরিয়ারের মাধ্যমে) অথবা আমাদের টিমের মাধ্যমে আনতে পারবেন গাড়ি ভাড়া প্রযোজ্য পৌঁছানোর ব্যবস্থা করতে হবে।
`,
  },
];

const steps = ["বেসিক তথ্য", "পণ্যের তথ্য", "সমস্যার বিবরণ", "ছবি আপলোড", "রিভিউ ও সাবমিট"];

function AppHeader({ homeHref }: { homeHref: string }) {
  return (
    <header className="bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 h-[60px] flex items-center gap-2.5 rounded-b-[16px]">
      <Link href={homeHref} aria-label="Back" className="size-10 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Home size={19} /></Link>
      <span className="text-[24px] font-extrabold italic tracking-[-1px] leading-none">SE</span>
      <span className="flex flex-col leading-tight min-w-0 flex-1"><span className="text-[16px] font-extrabold truncate">SE Electronics</span><span className="text-[10.5px] text-white/85 font-medium truncate">Smart Power | Better Tomorrow</span></span>
      <a href={`tel:${contactDetails.customerCare}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold leading-tight"><Headset size={20} /><span>Service<br />Support</span></a>
    </header>
  );
}

function SectionCard({ n, icon: Icon, title, children }: { n: number; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <div className="flex items-center gap-2.5 px-3 py-2.5 bg-[#e8f1ff] border-b border-[#cfe0fb]">
        <span className="size-8 rounded-full bg-[#0b3d91] text-white text-[13px] font-extrabold flex items-center justify-center">{n}</span>
        <span className="text-[15px] font-extrabold text-[#16213a]">{title}</span>
        <Icon size={16} className="ml-auto text-[#1f7cf0]" />
      </div>
      <div className="p-3 flex flex-col gap-3">{children}</div>
    </section>
  );
}

const selectCls = "w-full h-11 rounded-md border border-[#dfe6f2] bg-[#f8fafd] px-3 text-[14px] font-semibold text-[#16213a] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";
const Label = ({ text, req }: { text: string; req?: boolean }) => <span className="text-[13px] font-bold text-[#16213a]">{text} {req && <span className="text-[#e0243f]">*</span>}</span>;

export default function GetServiceForm({ preferredStaffId, customerId, customerData }: { preferredStaffId?: string; customerId?: string; customerData?: any }) {
  useThemeColor("#0b3d91");
  const [response, createServiceAction, isPending] = useActionState(createService, undefined);
  const [showToC, setShowToC] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [issueLen, setIssueLen] = useState(0);
  const [selectedDistrict, setSelectedDistrict] = useState(customerData?.district || "");
  const [selectedProductType, setSelectedProductType] = useState("");
  const districts = Object.keys(geoData);
  const thanas = geoData[selectedDistrict as keyof typeof geoData] || [];
  const homeHref = customerId ? "/customer/profile" : "/";

  useEffect(() => {
    if (!isPending && response && !response.success) toast.error(response.message);
  }, [isPending]);

  if (response?.success) {
    return (
      <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-md bg-white border border-[#dfe6f2] p-6 text-center flex flex-col items-center gap-3">
          <span className="size-20 rounded-full bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center"><CheckCircle2 size={44} /></span>
          <p className="text-[15px] leading-relaxed text-[#16213a]">আসসালামু আলাইকুম প্রিয় স্যার/মেডাম আপনার তথ্য সঠিক ভাবে প্রেরণ করা হয়েছে। তথ্য যাচাইয়ের পর আমাদের দক্ষ ইঞ্জিনিয়ার টিম আপনার সাথে যোগাযোগ করবে সেই পর্যন্ত আমাদের সাথে থাকুন ধন্যবাদ।</p>
          <Link href={homeHref} className="h-11 px-5 rounded-md bg-[#1f7cf0] text-white font-bold inline-flex items-center">{customerId ? "Back to Profile" : "Back to Home"}</Link>
        </div>
      </div>
    );
  }

  if (showToC) {
    return (
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
        <AppHeader homeHref={homeHref} />
        <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-[720px] mx-auto">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#e6efff_0%,#f5f8ff_55%,#0b3d91_56%,#1259c9_100%)] border border-[#cfe0fb] p-3 min-h-[128px] flex items-center shadow-[0_6px_18px_rgba(11,61,145,0.10)]">
            <span className="absolute right-3 top-1/2 -translate-y-1/2 w-[40%] text-right text-white font-extrabold text-[clamp(12px,3.6vw,15px)] leading-snug">আপনার সন্তুষ্টিই<br />আমাদের<br />প্রধান লক্ষ্য</span>
            <div className="flex items-center gap-3 w-[60%]">
              <span className="size-14 rounded-md bg-white text-[#1f7cf0] flex items-center justify-center shrink-0 shadow-sm"><ClipboardList size={30} /></span>
              <span className="flex flex-col leading-tight">
                <span className="text-[clamp(17px,5vw,22px)] font-extrabold text-[#0b3d91]">অনলাইনে সার্ভিস কন্ডিশন</span>
                <span className="text-[12px] font-bold text-[#1f7cf0]">Terms &amp; Conditions</span>
                <span className="text-[11.5px] font-semibold text-[#3d4a63]">অনলাইন সার্ভিসের জন্য নিচের শর্তাবলী সমূহ প্রযোজ্য।</span>
              </span>
            </div>
          </section>

          <p className="text-[12.5px] font-medium text-[#3d4a63] leading-relaxed px-0.5">প্রিয় গ্রাহক, এস ই ইলেকট্রনিকস-এর আইপিএস, ব্যাটারি ও অন্যান্য ইলেকট্রনিক পণ্য অনলাইন সার্ভিসিং-এর জন্য আবেদন করার জন্য আপনাকে ধন্যবাদ। আপনার সমস্যার দ্রুত ও কার্যকর সমাধানের জন্য নিম্নলিখিত শর্তাবলী ও নির্দেশিকাগুলি অত্যন্ত মনোযোগ সহকারে পড়ুন এবং মেনে চলুন।</p>

          {requirementsList.map((item) => (
            <details key={item.title} className="rounded-md bg-white border border-[#dfe6f2] shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
              <summary className="list-none cursor-pointer p-2.5 flex items-center gap-3">
                <span className="size-12 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><item.icon size={24} /></span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className="text-[14px] font-extrabold">{item.title}</span>
                  <span className="text-[11.5px] font-medium text-[#3d4a63] line-clamp-2">{item.description.trim()}</span>
                </span>
                <ChevronRight size={18} className="text-[#1f7cf0] shrink-0 transition-transform [details[open]_&]:rotate-90" />
              </summary>
              <p className="px-3 pb-3 -mt-1 text-[12.5px] leading-relaxed text-[#3d4a63] whitespace-pre-line">{item.description.trim()}</p>
            </details>
          ))}

          <label className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="size-5 mt-0.5 accent-[#1f7cf0] shrink-0" />
            <span className="flex flex-col leading-snug"><span className="text-[13px] font-extrabold">আমি উপরের সকল শর্তাবলী পড়েছি এবং সম্মত আছি।</span><span className="text-[11.5px] font-medium text-[#3d4a63]">উপরোক্ত &quot;এস ই ইলেকট্রনিকস অনলাইন সার্ভিসিং-এর শর্তাবলী ও নির্দেশিকা&quot; আমি মনোযোগ সহকারে পড়েছি এবং এতে সম্মত হয়ে, আমার সার্ভিসিং আবেদন প্রক্রিয়া শুরু করতে চাই।</span></span>
          </label>
          <button disabled={!agreed} onClick={() => setShowToC(false)} className="h-12 rounded-md bg-[#1f7cf0] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all"><Send size={18} />সার্ভিস অনুরোধ করুন</button>
          <p className="text-center text-[11px] font-bold text-[#9aa4b8]">© SEIPSBD, All Rights Reserved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
      <AppHeader homeHref={homeHref} />
      <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-[720px] mx-auto">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <span className="absolute -right-8 -top-10 size-44 rounded-full bg-white/10" />
          <span className="absolute right-3 top-3 w-[30%] text-right font-extrabold text-[clamp(11px,3.2vw,14px)] leading-snug text-white">আপনার সমস্যার<br />সমাধান আমাদের<br />প্রতিশ্রুতি</span>
          <div className="relative flex items-center gap-3 pr-[32%]">
            <span className="size-14 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wrench size={28} /></span>
            <span className="flex flex-col leading-tight"><span className="text-[13px] font-bold text-white/90">Online Service</span><span className="text-[clamp(22px,6.4vw,28px)] font-extrabold leading-none text-[#7fd1ff]">Request</span></span>
          </div>
          <p className="relative mt-2 text-[12.5px] font-semibold text-white/95 pr-[32%]">ঘরে বসেই নিন দ্রুত ও নির্ভরযোগ্য সার্ভিস সেবা</p>
          <p className="relative text-[11.5px] text-white/85">SE Electronics আপনার পাশে সবসময় · হেল্পলাইন {contactDetails.customerCare}</p>
        </section>

        {/* Steps */}
        <div className="rounded-md bg-white border border-[#dfe6f2] px-2 py-2.5 flex items-start">
          {steps.map((s, i) => (
            <div key={s} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1 w-14">
                <span className={clsx("size-8 rounded-full text-[12px] font-extrabold flex items-center justify-center border-2", i === 0 ? "bg-[#1f7cf0] border-[#1f7cf0] text-white shadow-[0_0_0_4px_#dbeafe]" : "bg-white border-[#d7deea] text-[#5b6784]")}>{i + 1}</span>
                <span className="text-[10px] font-bold text-center leading-tight">{s}</span>
              </div>
              {i < steps.length - 1 && <span className="flex-1 h-0.5 bg-[#e3e8f1] mt-4 -mx-3" />}
            </div>
          ))}
        </div>

        <form action={createServiceAction} className="flex flex-col gap-2.5">
          <input type="hidden" name="staffId" value={preferredStaffId || ""} />
          <input type="hidden" name="customerId" value={customerId || ""} />

          <SectionCard n={1} icon={User} title="বেসিক তথ্য">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2.5"><span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0 mt-6"><User size={18} /></span><div className="flex-1"><InputField label="নাম" name="customerName" placeholder="আপনার নাম লিখুন" defaultValue={customerData?.name || ""} /></div></div>
              <div className="flex gap-2.5"><span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0 mt-6"><Phone size={18} /></span><div className="flex-1"><InputField label="মোবাইল নাম্বার" name="customerPhone" type="tel" placeholder="মোবাইল নাম্বার লিখুন" defaultValue={customerData?.phone || ""} /></div></div>
            </div>
            <div className="flex gap-2.5"><span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0 mt-6"><MapPin size={18} /></span><div className="flex-1"><InputField label="বর্তমান ঠিকানা" name="customerAddress" placeholder="বাড়ি/এলাকা/জেলা লিখুন" defaultValue={customerData?.address || ""} /></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:pl-0 pl-[50px]">
              <label className="flex flex-col gap-1"><Label text="জেলা" req /><select required name="customerAddressDistrict" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className={selectCls}><option value="">নির্বাচন করুন</option>{districts.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}</select></label>
              <label className="flex flex-col gap-1"><Label text="থানা" req /><select required name="customerAddressPoliceStation" defaultValue={customerData?.policeStation || ""} className={selectCls}><option value="">নির্বাচন করুন</option>{thanas.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></label>
              <InputField label="পোস্ট অফিস" name="customerAddressPostOffice" defaultValue={customerData?.postOffice || ""} />
            </div>
          </SectionCard>

          <SectionCard n={2} icon={Box} title="পণ্যের তথ্য">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2.5"><span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0 mt-6"><Box size={18} /></span><label className="flex-1 flex flex-col gap-1"><Label text="পণ্যের ধরণ" req /><select required name="productType" value={selectedProductType} onChange={(e) => setSelectedProductType(e.target.value)} className={selectCls}><option value="">নির্বাচন করুন</option>{productTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></label></div>
              <div className="flex gap-2.5"><span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0 mt-6"><FileText size={18} /></span><div className="flex-1"><InputField label="মেমো নং" name="memoNumber" placeholder="লিখুন (যদি জানা থাকে)" required={false} /></div></div>
            </div>
            {(selectedProductType === "ips" || selectedProductType === "battery") && (
              <label className="flex flex-col gap-1"><Label text="আইপিএস ব্র্যান্ড" req /><select required name="ipsBrand" className={selectCls}><option value="">নির্বাচন করুন</option>{ipsBrands.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
            )}
            {selectedProductType && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedProductType === "others" ? <InputField label="পণ্যের মডেল" name="productModel" required /> : (
                  <label className="flex flex-col gap-1"><Label text="পণ্যের মডেল" req /><select required name="productModel" className={selectCls}><option value="">নির্বাচন করুন</option>{(selectedProductType === "stabilizer" ? stabilizerBrands : batteryTypes).map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
                )}
                {selectedProductType === "others" ? <InputField label="পণ্যের ওয়াট/ভিএ" name="powerRating" required /> : (
                  <label className="flex flex-col gap-1"><Label text="পণ্যের ওয়াট/ভিএ" req /><select name="powerRating" className={selectCls}><option value="">নির্বাচন করুন</option>{(selectedProductType === "stabilizer" ? stabilizerPowerRatings : productPowerRatings).map((r) => <option key={r} value={r}>{r}</option>)}</select></label>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard n={3} icon={FileText} title="সমস্যার বিবরণ">
            <div className="flex gap-2.5">
              <span className="size-10 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><FileText size={18} /></span>
              <label className="flex-1 relative">
                <textarea required name="reportedIssue" maxLength={500} onChange={(e) => setIssueLen(e.target.value.length)} placeholder="সমস্যার বিস্তারিত লিখুন..." className="w-full min-h-[110px] rounded-md border border-[#dfe6f2] bg-[#f8fafd] p-3 text-[14px] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]" />
                <span className="absolute right-2 bottom-2 text-[11px] font-semibold text-[#9aa4b8]">{issueLen}/500</span>
              </label>
            </div>
          </SectionCard>

          <SectionCard n={4} icon={ImagePlus} title="ছবি আপলোড">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InputField label="ওয়ারেন্টি কার্ডের ছবি" name="warrantyCardPhoto" type="file" />
              <InputField label="প্রোডাক্টের ছবি (সামনে)" placeholder="সামনের দিকের ছবি" name="productFrontPhoto" type="file" />
              <InputField label="প্রোডাক্টের ছবি (পেছনে)" placeholder="পেছনের দিকের ছবি" name="productBackPhoto" type="file" />
            </div>
            <p className="text-[11px] font-semibold text-[#5b6784]">(JPG, PNG বা WebP - Max {process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB || 2}MB)</p>
          </SectionCard>

          <label className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex items-start gap-3 cursor-pointer">
            <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-5 mt-0.5 accent-[#1f7cf0] shrink-0" />
            <span className="text-[12.5px] font-bold leading-snug">আমি নিশ্চিত করছি যে, প্রদত্ত তথ্য সঠিক এবং আমার ডিভাইস/পণ্যের সমস্যা সম্পর্কিত।</span>
          </label>
          <button type="submit" disabled={isPending || !confirmed} className="h-12 rounded-md bg-[#1f7cf0] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all"><Send size={18} />{isPending ? "Submitting..." : "সাবমিট করুন"}</button>
          <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2 text-[11.5px] font-semibold text-[#3d4a63]"><Headset size={18} className="text-[#1f7cf0] shrink-0" />সার্ভিস রিকুয়েস্ট জমা দেওয়ার পর আমাদের টিম আপনার সাথে যোগাযোগ করবে। আপনার পণ্যের সার্ভিসং এর জন্য উপরের বক্স গুলা পূরণ করে আমাদের SEIPSBD সার্ভিসং টিমকে সঠিক তথ্য দিয়ে সহযোগিতা করুন।</div>
        </form>
      </div>
    </div>
  );
}

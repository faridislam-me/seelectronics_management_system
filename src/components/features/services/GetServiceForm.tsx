"use client";

import { createService } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import PageBanner from "@/components/ui/PageBanner";
import { batteryTypes, contactDetails, ipsBrands, productPowerRatings, productTypes, stabilizerBrands, stabilizerPowerRatings } from "@/constants";
import { useThemeColor } from "@/hooks";
import clsx from "clsx";
import { Box, Building2, Calendar, Check, CheckCircle2, ChevronDown, ChevronRight, ClipboardList, FileText, Gauge, Headset, Home, ImagePlus, LucideIcon, Mail, Map as MapIcon, MapPin, Phone, Send, Settings, ShieldCheck, Truck, UploadCloud, User, Wrench, X, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
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
    <header className="bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 h-[56px] flex items-center gap-2.5">
      <Link href={homeHref} aria-label="Back" className="size-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0"><Home size={18} /></Link>
      <span className="flex flex-col leading-tight min-w-0 flex-1"><span className="text-[16px] font-extrabold truncate">SE Electronics</span><span className="text-[10.5px] text-white/85 font-medium truncate">Smart Power | Better Tomorrow</span></span>
      <a href={`tel:${contactDetails.customerCare}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold leading-tight"><Headset size={20} /><span>Service<br />Support</span></a>
    </header>
  );
}

function SectionCard({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} data-step={n - 1} className="scroll-mt-[76px] rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
        <span className="size-7 rounded-full bg-[#0b3d91] text-white text-[13px] font-extrabold flex items-center justify-center">{n}</span>
        <span className="text-[15px] font-extrabold text-[#0b3d91]">{title}</span>
      </div>
      <div className="p-2.5 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

const boxCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white pl-9 pr-2.5 text-[14px] font-semibold text-[#16213a] placeholder:font-medium placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";
const Label = ({ text, req }: { text: string; req?: boolean }) => <span className="text-[12.5px] font-bold text-[#16213a]">{text} {req && <span className="text-[#e0243f]">*</span>}</span>;

/** Text input with its icon inside the box. */
function Field({ icon: Icon, label, req = true, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <Label text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <input {...props} required={req} className={boxCls} />
      </span>
    </label>
  );
}

/** Select with its icon inside the box. */
function SelectField({ icon: Icon, label, req = true, options, format, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean; options: readonly string[]; format?: (v: string) => string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <Label text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <select {...props} required={req} className={clsx(boxCls, "appearance-none pr-7")}>
          <option value="">নির্বাচন করুন</option>
          {options.map((o) => <option key={o} value={o}>{format ? format(o) : o}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5b6784] pointer-events-none" />
      </span>
    </label>
  );
}

/** Compact dashed upload tile with preview. */
function UploadBox({ name, label }: { name: string; label: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);
  const maxMb = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB || 2);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setPreview(null);
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`ফাইল ${maxMb} MB-এর বেশি হতে পারবে না!`);
      e.target.value = "";
      return setPreview(null);
    }
    setPreview(URL.createObjectURL(file));
  };
  return (
    <div className={clsx("relative h-[100px] rounded-md border border-dashed overflow-hidden", preview ? "border-[#1f7cf0]" : "border-[#b9cdee] bg-[#f7faff]")}>
      {preview ? (
        <>
          <Image src={preview} alt={label} fill className="object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] font-bold text-center py-0.5 truncate px-1">{label}</span>
          <button type="button" aria-label="Remove" onClick={() => { setPreview(null); if (ref.current) ref.current.value = ""; }} className="absolute top-1 right-1 z-20 size-6 rounded-md bg-black/55 text-white flex items-center justify-center"><X size={14} /></button>
        </>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
          <UploadCloud size={22} className="text-[#1f5fc9]" />
          <span className="text-[11px] font-bold text-[#16213a] leading-tight">{label} <span className="text-[#e0243f]">*</span></span>
          <span className="text-[9px] font-medium text-[#5b6784] leading-tight">(JPG, PNG বা WebP - Max {maxMb}MB)</span>
        </span>
      )}
      <input ref={ref} type="file" name={name} accept="image/png, image/jpeg, image/webp" required={!preview} onChange={onChange} className={clsx("absolute inset-0 opacity-0 cursor-pointer", preview ? "z-10" : "z-20")} />
    </div>
  );
}

const sectionIds = ["sr-basic", "sr-product", "sr-issue", "sr-photos", "sr-submit"];

export default function GetServiceForm({ preferredStaffId, customerId, customerData }: { preferredStaffId?: string; customerId?: string; customerData?: any }) {
  useThemeColor("#0b3d91");
  const [response, createServiceAction, isPending] = useActionState(createService, undefined);
  const [showToC, setShowToC] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [issueLen, setIssueLen] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const lockUntil = useRef(0);
  const [selectedDistrict, setSelectedDistrict] = useState(customerData?.district || "");
  const [selectedProductType, setSelectedProductType] = useState("");
  const districts = Object.keys(geoData);
  const thanas = geoData[selectedDistrict as keyof typeof geoData] || [];
  const homeHref = customerId ? "/customer/profile" : "/";
  const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

  useEffect(() => {
    if (!isPending && response && !response.success) toast.error(response.message);
  }, [isPending]);

  // Highlight the step whose section is currently under the sticky step bar.
  useEffect(() => {
    if (showToC) return;
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      let current = 0;
      sectionIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = i;
      });
      const last = document.getElementById(sectionIds[sectionIds.length - 1]);
      if (last && window.innerHeight + window.scrollY >= document.body.scrollHeight - 4 && last.getBoundingClientRect().top < window.innerHeight * 0.5) current = sectionIds.length - 1;
      setActiveStep(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showToC]);

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

  const goToStep = (i: number) => {
    setActiveStep(i);
    lockUntil.current = Date.now() + 1200;
    document.getElementById(sectionIds[i])?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
      <AppHeader homeHref={homeHref} />
      <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-[720px] mx-auto">
        <PageBanner src="/banners/service-request.jpg" alt="Online Service Request - ঘরে বসেই নিন দ্রুত ও নির্ভরযোগ্য সার্ভিস সেবা" width={757} height={211} href={`tel:${contactDetails.customerCare}`} external />

        {/* Steps (sticky, clickable) */}
        <nav className="sticky top-0 z-30 -mx-2 px-2 py-1.5 bg-[#eef3fb]/95 backdrop-blur-sm">
          <div className="rounded-md bg-white border border-[#dfe6f2] px-1.5 py-2 flex items-start shadow-[0_2px_8px_rgba(11,61,145,0.05)]">
            {steps.map((st, i) => {
              const active = i === activeStep;
              const done = i < activeStep;
              return (
                <div key={st} className="flex items-start flex-1 last:flex-none">
                  <button type="button" onClick={() => goToStep(i)} className="flex flex-col items-center gap-1 w-[58px]">
                    <span className={clsx("size-8 rounded-full text-[12px] font-extrabold flex items-center justify-center border-2 transition-all", active ? "bg-[#1f7cf0] border-[#1f7cf0] text-white shadow-[0_0_0_4px_#dbeafe]" : done ? "bg-[#0b3d91] border-[#0b3d91] text-white" : "bg-white border-[#d7deea] text-[#5b6784]")}>{done ? <Check size={15} strokeWidth={3} /> : i + 1}</span>
                    <span className={clsx("text-[10px] font-bold text-center leading-tight", active ? "text-[#1f7cf0]" : "text-[#3d4a63]")}>{st}</span>
                  </button>
                  {i < steps.length - 1 && <span className={clsx("flex-1 h-0.5 mt-4 -mx-2.5", done ? "bg-[#0b3d91]" : "bg-[#e3e8f1]")} />}
                </div>
              );
            })}
          </div>
        </nav>

        <form action={createServiceAction} className="flex flex-col gap-2.5">
          <input type="hidden" name="staffId" value={preferredStaffId || ""} />
          <input type="hidden" name="customerId" value={customerId || ""} />

          <SectionCard id={sectionIds[0]} n={1} title="বেসিক তথ্য">
            <div className="grid grid-cols-2 gap-2">
              <Field icon={User} label="নাম" name="customerName" placeholder="আপনার নাম লিখুন" defaultValue={customerData?.name || ""} />
              <Field icon={Phone} label="মোবাইল নাম্বার" name="customerPhone" type="tel" placeholder="মোবাইল নাম্বার লিখুন" defaultValue={customerData?.phone || ""} />
            </div>
            <Field icon={MapPin} label="বর্তমান ঠিকানা" name="customerAddress" placeholder="বাড়ি/এলাকা/জেলা লিখুন" defaultValue={customerData?.address || ""} />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <SelectField icon={MapIcon} label="জেলা" name="customerAddressDistrict" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} options={districts} format={cap} />
              <SelectField icon={Building2} label="থানা" name="customerAddressPoliceStation" defaultValue={customerData?.policeStation || ""} options={thanas} format={cap} />
              <Field icon={Mail} label="পোস্ট অফিস" name="customerAddressPostOffice" placeholder="পোস্ট অফিস" defaultValue={customerData?.postOffice || ""} className="col-span-2 sm:col-span-1" />
            </div>
          </SectionCard>

          <SectionCard id={sectionIds[1]} n={2} title="পণ্যের তথ্য">
            <div className="grid grid-cols-2 gap-2">
              <SelectField icon={Box} label="পণ্যের ধরণ" name="productType" value={selectedProductType} onChange={(e) => setSelectedProductType(e.target.value)} options={productTypes} format={(t) => t.toUpperCase()} />
              <Field icon={FileText} label="মেমো নং" name="memoNumber" placeholder="লিখুন (যদি জানা থাকে)" req={false} />
            </div>
            {(selectedProductType === "ips" || selectedProductType === "battery") && (
              <SelectField icon={Zap} label="আইপিএস ব্র্যান্ড" name="ipsBrand" options={ipsBrands} />
            )}
            {selectedProductType && (
              <div className="grid grid-cols-2 gap-2">
                {selectedProductType === "others" ? (
                  <Field icon={Settings} label="পণ্যের মডেল" name="productModel" placeholder="মডেল লিখুন" />
                ) : (
                  <SelectField icon={Settings} label="পণ্যের মডেল" name="productModel" options={selectedProductType === "stabilizer" ? stabilizerBrands : batteryTypes} />
                )}
                {selectedProductType === "others" ? (
                  <Field icon={Gauge} label="পণ্যের ওয়াট/ভিএ" name="powerRating" placeholder="ওয়াট/ভিএ লিখুন" />
                ) : (
                  <SelectField icon={Gauge} label="পণ্যের ওয়াট/ভিএ" name="powerRating" req={false} options={selectedProductType === "stabilizer" ? stabilizerPowerRatings : productPowerRatings} />
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard id={sectionIds[2]} n={3} title="সমস্যার বিবরণ">
            <label className="relative block">
              <FileText size={17} className="absolute left-2.5 top-2.5 text-[#1f5fc9] pointer-events-none" />
              <textarea required name="reportedIssue" maxLength={500} rows={3} onChange={(e) => setIssueLen(e.target.value.length)} placeholder="সমস্যার বিস্তারিত লিখুন..." className="w-full min-h-[84px] rounded-md border border-[#d9e2f0] bg-white pl-9 pr-2.5 pt-2 pb-5 text-[14px] outline-none placeholder:text-[#9aa4b8] focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0] block" />
              <span className="absolute right-2 bottom-1.5 text-[11px] font-semibold text-[#9aa4b8]">{issueLen}/500</span>
            </label>
          </SectionCard>

          <SectionCard id={sectionIds[3]} n={4} title="ছবি আপলোড">
            <div className="grid grid-cols-3 gap-2">
              <UploadBox name="warrantyCardPhoto" label="ওয়ারেন্টি কার্ডের ছবি" />
              <UploadBox name="productFrontPhoto" label="প্রোডাক্টের ছবি (সামনে)" />
              <UploadBox name="productBackPhoto" label="প্রোডাক্টের ছবি (পেছনে)" />
            </div>
          </SectionCard>

          <div id={sectionIds[4]} data-step={4} className="scroll-mt-[76px] flex flex-col gap-2.5">
            <label className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-start gap-3 cursor-pointer">
              <input type="checkbox" required checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="size-5 mt-0.5 accent-[#0b3d91] shrink-0" />
              <span className="text-[12.5px] font-bold leading-snug">আমি নিশ্চিত করছি যে, প্রদত্ত তথ্য সঠিক এবং আমার ডিভাইস/পণ্যের সমস্যা সম্পর্কিত।</span>
            </label>
            <button type="submit" disabled={isPending || !confirmed} className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all"><Send size={18} />{isPending ? "Submitting..." : "সাবমিট করুন"}</button>
            <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2 text-[11.5px] font-semibold text-[#3d4a63]"><Headset size={18} className="text-[#1f7cf0] shrink-0" /><span>সার্ভিস রিকুয়েস্ট জমা দেওয়ার পর আমাদের টিম আপনার সাথে যোগাযোগ করবে। আপনার পণ্যের সার্ভিসং এর জন্য উপরের বক্স গুলা পূরণ করে আমাদের SEIPSBD সার্ভিসং টিমকে সঠিক তথ্য দিয়ে সহযোগিতা করুন। হেল্পলাইন {contactDetails.customerCare}</span></div>
          </div>
        </form>
      </div>
    </div>
  );
}

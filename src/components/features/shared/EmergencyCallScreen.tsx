"use client";

import PageBanner from "@/components/ui/PageBanner";
import clsx from "clsx";
import {
  Activity,
  Baby,
  Check,
  ChevronRight,
  ExternalLink,
  Fingerprint,
  Flame,
  Headset,
  Hospital,
  Info,
  LucideIcon,
  Megaphone,
  MapPin,
  Phone,
  PhoneCall,
  Scale,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Wind,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type Tone = "red" | "navy" | "green" | "blue" | "teal" | "pink" | "purple" | "indigo" | "orange" | "rose";

type Service = {
  name: string;
  helpBangla: string;
  number: string;
  description: string;
  icon: LucideIcon;
  tone: Tone;
};

const TONES: Record<Tone, { card: string; icon: string; title: string; num: string; btn: string }> = {
  red: { card: "bg-[#fff1f1] border-[#fbd5d5]", icon: "bg-[#e0243f]", title: "text-[#c81f38]", num: "text-[#c81f38]", btn: "bg-[#e0243f]" },
  rose: { card: "bg-[#fff1f4] border-[#fbd3dc]", icon: "bg-[#e11d48]", title: "text-[#be123c]", num: "text-[#be123c]", btn: "bg-[#e11d48]" },
  orange: { card: "bg-[#fff6ec] border-[#fde0bf]", icon: "bg-[#f57c1f]", title: "text-[#d9640a]", num: "text-[#d9640a]", btn: "bg-[#f57c1f]" },
  green: { card: "bg-[#eefaf3] border-[#c8ecd6]", icon: "bg-[#1a9c4b]", title: "text-[#178a42]", num: "text-[#0f6b33]", btn: "bg-[#1a9c4b]" },
  blue: { card: "bg-[#eef5ff] border-[#cfe0fb]", icon: "bg-[#1f7cf0]", title: "text-[#1b5fc9]", num: "text-[#0b3d91]", btn: "bg-[#1f7cf0]" },
  navy: { card: "bg-[#eef3fb] border-[#d3def2]", icon: "bg-[#0b3d91]", title: "text-[#0b3d91]", num: "text-[#0b2a66]", btn: "bg-[#0b3d91]" },
  indigo: { card: "bg-[#f0f1ff] border-[#d6d9fb]", icon: "bg-[#4f46e5]", title: "text-[#4338ca]", num: "text-[#3730a3]", btn: "bg-[#4f46e5]" },
  purple: { card: "bg-[#f6f0ff] border-[#e2d4fb]", icon: "bg-[#7c3aed]", title: "text-[#6d28d9]", num: "text-[#5b21b6]", btn: "bg-[#7c3aed]" },
  pink: { card: "bg-[#fff0f7] border-[#fbd0e5]", icon: "bg-[#db2777]", title: "text-[#be185d]", num: "text-[#be185d]", btn: "bg-[#db2777]" },
  teal: { card: "bg-[#ecfaf8] border-[#c5ece6]", icon: "bg-[#0d9488]", title: "text-[#0f766e]", num: "text-[#115e59]", btn: "bg-[#0d9488]" },
};

// Bangladesh Divisions and Districts Data
const DIVISION_DATA: Record<string, string[]> = {
  "ঢাকা": ["ঢাকা", "নারায়ণগঞ্জ", "গাজীপুর", "মুন্সিগঞ্জ", "মানিকগঞ্জ", "নরসিংদী", "ফরিদপুর", "গোপালগঞ্জ", "মাদারীপুর", "শরীয়তপুর", "রাজবাড়ী", "কিশোরগঞ্জ", "টাঙ্গাইল"],
  "চট্টগ্রাম": ["চট্টগ্রাম", "কক্সবাজার", "রাঙ্গামাটি", "বান্দরবান", "খাগড়াছড়ি", "কুমিল্লা", "ফেনী", "লক্ষ্মীপুর", "নোয়াখালী", "চাঁদপুর", "ব্রাহ্মণবাড়িয়া"],
  "সিলেট": ["সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ"],
  "রাজশাহী": ["রাজশাহী", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "বগুড়া", "জয়পুরহাট", "সিরাজগঞ্জ"],
  "খুলনা": ["খুলনা", "যশোর", "সাতক্ষীরা", "বাগেরহাট", "ঝিনাইদহ", "মাগুরা", "নড়াইল", "কুষ্টিয়া", "চুয়াডাঙ্গা", "মেহেরপুর"],
  "বরিশাল": ["বরিশাল", "পটুয়াখালী", "ভোলা", "পিরোজপুর", "বরগুনা", "ঝালকাঠি"],
  "রংপুর": ["রংপুর", "দিনাজপুর", "ঠাকুরগাঁও", "পঞ্চগড়", "কুড়িগ্রাম", "গাইবান্ধা", "নীলফামারী", "লালমনিরহাট"],
  "ময়মনসিংহ": ["ময়মনসিংহ", "জামালপুর", "শেরপুর", "নেত্রকোনা"],
};

// National/Common Services
const NATIONAL_SERVICES: Service[] = [
  { name: "ন্যাশনাল ইমারজেন্সি", helpBangla: "জাতীয় জরুরি সেবা", number: "999", description: "পুলিশ, ফায়ার সার্ভিস এবং অ্যাম্বুলেন্সের জন্য একটি সমন্বিত হেল্পলাইন।", icon: ShieldAlert, tone: "red" },
  { name: "ন্যাশনাল হেল্পলাইন", helpBangla: "জাতীয় তথ্য ও সেবা", number: "333", description: "যেকোনো সরকারি তথ্য, সামাজিক সমস্যা এবং সেবার জন্য কল করুন।", icon: Info, tone: "navy" },
  { name: "হেলথ উইন্ডো", helpBangla: "স্বাস্থ্য বাতায়ন", number: "16263", description: "২৪ ঘণ্টা অভিজ্ঞ ডাক্তারদের ফ্রি স্বাস্থ্য পরামর্শ ও অ্যাম্বুলেন্স সেবা।", icon: Activity, tone: "green" },
  { name: "নারী ও শিশু হেল্পলাইন", helpBangla: "সহিংসতা প্রতিরোধ", number: "109", description: "নারী ও শিশু নির্যাতন প্রতিরোধে অবিলম্বে সহায়তার জন্য কল করুন।", icon: UserCheck, tone: "teal" },
  { name: "চাইল্ড হেল্পলাইন", helpBangla: "শিশু সুরক্ষা", number: "1098", description: "বিপদাপন্ন শিশুদের অভিযোগ ও জরুরি সুরক্ষার জন্য বিশেষ সেবা।", icon: Baby, tone: "pink" },
  { name: "অ্যান্টি-করাপশন", helpBangla: "দুদক হেল্পলাইন", number: "106", description: "দুর্নীতি বা অনিয়ম সম্পর্কে সরাসরি অভিযোগ বা তথ্য প্রদান করুন।", icon: Scale, tone: "purple" },
  { name: "এনআইডি হেল্পলাইন", helpBangla: "জাতীয় পরিচয়পত্র", number: "105", description: "স্মার্ট কার্ড এবং এনআইডি সংক্রান্ত যেকোনো তথ্যের জন্য কল করুন।", icon: Fingerprint, tone: "indigo" },
  { name: "ডিজাস্টার ম্যানেজমেন্ট", helpBangla: "দুর্যোগ সতর্কতা", number: "1090", description: "বন্যা, ঘূর্ণিঝড় সহ প্রাকৃতিক দুর্যোগের আগাম সতর্কবার্তা জানতে।", icon: Wind, tone: "orange" },
];

// Example Local Services (This would normally come from an API or database)
const LOCAL_SERVICES_DATABASE: Record<string, Record<string, Service[]>> = {
  "ঢাকা": {
    "ঢাকা": [
      { name: "ডিএমপি হেডকোয়ার্টার্স", helpBangla: "পুলিশ কন্ট্রোল রুম", number: "01320-040100", description: "ঢাকা মেট্রোপলিটন পুলিশ জরুরি সহায়তা", icon: ShieldCheck, tone: "blue" },
      { name: "ঢাকা মেডিকেল কলেজ", helpBangla: "ঢামেক জরুরি বিভাগ", number: "01732-601815", description: "দেশের বৃহত্তম সরকারি সাধারণ হাসপাতাল", icon: Hospital, tone: "rose" },
      { name: "সদরদপ্তর ফায়ার সার্ভিস", helpBangla: "ফায়ার কন্ট্রোল রুম", number: "02-9555555", description: "ফায়ার সার্ভিস ও সিভিল ডিফেন্স হেডকোয়ার্টার্স", icon: Flame, tone: "orange" },
      { name: "ন্যাশনাল হার্ট ফাউন্ডেশন", helpBangla: "হৃদরোগ জরুরি সেবা", number: "02-58051252", description: "হৃদরোগীদের জন্য বিশেষায়িত চিকিৎসা কেন্দ্র", icon: Stethoscope, tone: "red" },
    ],
    "নারায়ণগঞ্জ": [
      { name: "নারায়ণগঞ্জ মডেল থানা", helpBangla: "পুলিশ কন্ট্রোল রুম", number: "01320-107405", description: "নারায়ণগঞ্জ সদর এলাকার জন্য জরুরি পুলিশ সেবা", icon: ShieldCheck, tone: "blue" },
      { name: "৩০০ শয্যা হাসপাতাল", helpBangla: "ভিক্টোরিয়া জেনারেল হাসপাতাল", number: "01912-340623", description: "নারায়ণগঞ্জ জেলার প্রধান সরকারি হাসপাতাল", icon: Hospital, tone: "rose" },
    ],
  },
  "চট্টগ্রাম": {
    "চট্টগ্রাম": [
      { name: "সিএমপি হেডকোয়ার্টার্স", helpBangla: "চট্টগ্রাম পুলিশ সেবা", number: "01320-050100", description: "চট্টগ্রাম মেট্রোপলিটন পুলিশ জরুরি সহায়তা", icon: ShieldCheck, tone: "blue" },
      { name: "চমেক হাসপাতাল", helpBangla: "চট্টগ্রাম মেডিকেল জরুরি", number: "01732-401815", description: "চট্টগ্রামের প্রধান সরকারি সাধারণ হাসপাতাল", icon: Hospital, tone: "rose" },
    ],
  },
};

const TIPS = [
  "জরুরি পরিস্থিতিতে সময় নষ্ট করবেন না",
  "সঠিক তথ্য প্রদান করুন",
  "মিথ্যা তথ্য প্রচার করবেন না",
  "সরকারি সেবার অপব্যবহার দণ্ডনীয় অপরাধ",
];

const selectCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white px-2.5 text-[13px] font-bold text-[#16213a] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0] disabled:opacity-50";

/** Government emergency call screen shared by the customer and staff apps. */
export default function EmergencyCallScreen() {
  const [division, setDivision] = useState<string>("");
  const [district, setDistrict] = useState<string>("");

  const localServices = useMemo(() => {
    if (!division || !district) return [];
    return LOCAL_SERVICES_DATABASE[division]?.[district] || [];
  }, [division, district]);

  const hasSelection = division || district;
  const scrollToList = () => document.getElementById("emergency-all-numbers")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
      <PageBanner src="/banners/gov-emergency.jpg" alt="ইমারজেন্সি সরকারি কল - জরুরি প্রয়োজনে সরকারি সহায়তা পেতে এখনই কল করুন" width={798} height={352} href="tel:999" external />

      {/* Strip */}
      <section className="rounded-md bg-[linear-gradient(100deg,#0a2f70_0%,#0b3d91_55%,#1259c9_100%)] text-white p-2.5 flex items-center gap-2.5 shadow-[0_6px_18px_rgba(11,61,145,0.25)]">
        <span className="size-10 rounded-full bg-white text-[#1f7cf0] flex items-center justify-center shrink-0"><PhoneCall size={20} /></span>
        <span className="flex flex-col min-w-0 flex-1 leading-tight">
          <span className="text-[clamp(13px,4vw,16px)] font-extrabold">জরুরি সরকারি কল নম্বর সমূহ</span>
          <span className="text-[11px] font-medium text-white/85">ক্লিক করুন এবং সরাসরি কল করুন</span>
        </span>
        <button type="button" onClick={scrollToList} className="shrink-0 inline-flex items-center gap-1 h-8 px-2 rounded-md border border-white/60 text-[11.5px] font-bold">
          <Headset size={14} />সকল নম্বর<ChevronRight size={14} />
        </button>
      </section>

      {/* Filters */}
      <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 grid grid-cols-2 gap-2 items-end">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11.5px] font-bold text-[#5b6784] inline-flex items-center gap-1"><MapPin size={12} className="text-[#1f7cf0]" />বিভাগ নির্বাচন করুন</span>
          <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); }} className={selectCls}>
            <option value="">সকল বিভাগ</option>
            {Object.keys(DIVISION_DATA).map((div) => <option key={div} value={div}>{div}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[11.5px] font-bold text-[#5b6784] inline-flex items-center gap-1"><Search size={12} className="text-[#1f7cf0]" />জেলা নির্বাচন করুন</span>
          <select value={district} disabled={!division} onChange={(e) => setDistrict(e.target.value)} className={selectCls}>
            <option value="">{division ? "সিলেক্ট করুন..." : "প্রথমে বিভাগ সিলেক্ট করুন"}</option>
            {division && DIVISION_DATA[division].map((dist) => <option key={dist} value={dist}>{dist}</option>)}
          </select>
        </label>
        {hasSelection && (
          <button type="button" onClick={() => { setDivision(""); setDistrict(""); }} className="col-span-2 h-9 rounded-md bg-[#f5f7fb] border border-[#e3e8f1] text-[12px] font-bold text-[#5b6784] inline-flex items-center justify-center gap-1.5">
            <X size={14} /> রিসেট
          </button>
        )}
      </section>

      {/* Local services */}
      {localServices.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionTitle icon={MapPin} text={`স্থানীয় জরুরি সেবা (${district})`} />
          <TileGrid services={localServices} />
        </section>
      )}

      {division && district && localServices.length === 0 && (
        <section className="rounded-md bg-[#fff8e6] border border-[#f5dfa0] p-3 text-center flex flex-col items-center gap-1.5">
          <Info size={26} className="text-[#e0a11b]" />
          <span className="text-[13.5px] font-extrabold text-[#8a5a00]">দুঃখিত! এই এলাকায় স্থানীয় সেবা যুক্ত নেই</span>
          <p className="text-[12px] text-[#9a6b10] leading-relaxed">
            আপনার এলাকার জন্য আমাদের কাছে এখনো স্থানীয় নাম্বার নেই। অনুগ্রহ করে আমাদের সাথে শেয়ার করুন। <br />
            তবে নিচের <strong>জাতীয় সেবাগুলো</strong> ২৪/৭ সচল রয়েছে।
          </p>
        </section>
      )}

      {/* National services */}
      <section id="emergency-all-numbers" className="scroll-mt-16 flex flex-col gap-2">
        <SectionTitle icon={ShieldAlert} text={hasSelection ? "সাধারণ জরুরি নাম্বার" : "জাতীয় জরুরি সেবা"} />
        <TileGrid services={NATIONAL_SERVICES} />
      </section>

      {/* Important info */}
      <section className="relative overflow-hidden rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-2.5 flex gap-2">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <span className="self-start inline-flex items-center gap-1.5 h-7 pl-1.5 pr-3 rounded-md bg-[#0b3d91] text-white text-[12.5px] font-extrabold"><Megaphone size={15} />গুরুত্বপূর্ণ তথ্য</span>
          {TIPS.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#16213a]"><span className="size-4 rounded-full bg-[#1a9c4b] text-white flex items-center justify-center shrink-0"><Check size={11} strokeWidth={3} /></span>{t}</span>
          ))}
        </div>
        <div className="shrink-0 w-[92px] flex flex-col items-center justify-center gap-1.5 text-center">
          <span aria-hidden className="relative w-16 h-10 rounded-sm bg-[#006a4e] shadow-sm"><span className="absolute left-[42%] top-1/2 -translate-x-1/2 -translate-y-1/2 size-5 rounded-full bg-[#f42a41]" /></span>
          <span className="text-[11px] font-extrabold text-[#0b2a66] leading-tight -rotate-3">সচেতন নাগরিক<br />নিরাপদ বাংলাদেশ</span>
        </div>
      </section>

      {/* Green strip */}
      <section className="rounded-md bg-[#eefaf3] border border-[#c8ecd6] p-2 flex items-center gap-2.5">
        <span className="size-9 rounded-full bg-[#1a9c4b] text-white flex items-center justify-center shrink-0"><Phone size={18} /></span>
        <span className="flex-1 min-w-0 text-[11.5px] font-bold text-[#0f5c2e] leading-snug">জরুরি সহায়তার জন্য<br />সবসময় পাশে আছে সরকার</span>
        <span className="shrink-0 text-right text-[12px] font-extrabold text-[#178a42] leading-tight">বাংলাদেশ<br />সরকার</span>
      </section>

      {/* Source + report (kept from the previous page) */}
      <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <span className="size-8 rounded-md bg-[#f5f7fb] border border-[#e3e8f1] flex items-center justify-center shrink-0"><ShieldCheck size={16} className="text-[#5b6784]" /></span>
          <span className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[12.5px] font-extrabold text-[#3d4a63]">তথ্যসূত্র ও নিরাপত্তা</span>
            <span className="text-[11.5px] text-[#5b6784] leading-relaxed">সকল তথ্য সরকারি পোর্টাল থেকে সংগৃহীত। জরুরি মুহূর্তে ৯৯৯ নাম্বারে ডায়াল করাই সবচেয়ে নিরাপদ।</span>
          </span>
        </div>
        <button type="button" className="h-9 px-2 rounded-md border border-[#d9e2f0] text-[12px] font-bold text-[#5b6784] inline-flex items-center justify-center gap-1.5">
          ভুল বা নতুন নাম্বার রিপোর্ট ক্লিক করুন <ExternalLink size={14} />
        </button>
      </section>
    </div>
  );
}

function SectionTitle({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="size-7 rounded-md bg-[#0b3d91] text-white flex items-center justify-center shrink-0"><Icon size={15} /></span>
      <span className="text-[14.5px] font-extrabold text-[#0b2a66]">{text}</span>
      <span className="h-px flex-1 bg-[#dfe6f2]" />
    </div>
  );
}

function TileGrid({ services }: { services: Service[] }) {
  return (
    <div className="grid grid-cols-2 min-[340px]:grid-cols-3 sm:grid-cols-4 gap-1.5">
      {services.map((s) => <ServiceTile key={s.number + s.name} service={s} />)}
    </div>
  );
}

function ServiceTile({ service }: { service: Service }) {
  const t = TONES[service.tone];
  const short = service.number.length <= 5;
  return (
    <div className={clsx("min-w-0 rounded-md border p-1.5 flex flex-col items-center text-center gap-0.5", t.card)}>
      <span className={clsx("size-10 rounded-full text-white flex items-center justify-center shadow-sm", t.icon)}><service.icon size={20} strokeWidth={2.2} /></span>
      <span className={clsx("mt-0.5 text-[clamp(10.5px,3.2vw,12.5px)] font-extrabold leading-tight line-clamp-2", t.title)}>{service.helpBangla}</span>
      <span className="text-[9.5px] font-semibold text-[#5b6784] leading-tight line-clamp-1 max-w-full">{service.name}</span>
      <span className={clsx("font-extrabold leading-none tabular-nums break-all", short ? "text-[clamp(19px,6vw,24px)]" : "text-[clamp(10.5px,3.3vw,13px)] mt-0.5", t.num)}>{service.number}</span>
      <span className="text-[9.5px] font-medium text-[#3d4a63] leading-snug line-clamp-2 min-h-[25px]">{service.description}</span>
      <a href={`tel:${service.number}`} className={clsx("mt-auto w-full h-7 rounded-md text-white text-[11px] font-extrabold inline-flex items-center justify-center gap-1 active:scale-95 transition-transform", t.btn)}>
        <Phone size={12} strokeWidth={2.6} />এখনই কল করুন
      </a>
    </div>
  );
}

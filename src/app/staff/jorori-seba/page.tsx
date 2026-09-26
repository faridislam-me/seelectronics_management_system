"use client";

import PageBanner from "@/components/ui/PageBanner";
import { StaffLayout } from "@/components/layout";
import {
  Activity,
  Baby,
  ExternalLink,
  Fingerprint,
  Flame,
  Hospital,
  Info,
  MapPin,
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

// Bangladesh Divisions and Districts Data
const DIVISION_DATA: Record<string, string[]> = {
  ঢাকা: [
    "ঢাকা",
    "নারায়ণগঞ্জ",
    "গাজীপুর",
    "মুন্সিগঞ্জ",
    "মানিকগঞ্জ",
    "নরসিংদী",
    "ফরিদপুর",
    "গোপালগঞ্জ",
    "মাদারীপুর",
    "শরীয়তপুর",
    "রাজবাড়ী",
    "কিশোরগঞ্জ",
    "টাঙ্গাইল",
  ],
  চট্টগ্রাম: [
    "চট্টগ্রাম",
    "কক্সবাজার",
    "রাঙ্গামাটি",
    "বান্দরবান",
    "খাগড়াছড়ি",
    "কুমিল্লা",
    "ফেনী",
    "লক্ষ্মীপুর",
    "নোয়াখালী",
    "চাঁদপুর",
    "ব্রাহ্মণবাড়িয়া",
  ],
  সিলেট: ["সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ"],
  রাজশাহী: [
    "রাজশাহী",
    "নওগাঁ",
    "নাটোর",
    "চাঁপাইনবাবগঞ্জ",
    "পাবনা",
    "বগুড়া",
    "জয়পুরহাট",
    "সিরাজগঞ্জ",
  ],
  খুলনা: [
    "খুলনা",
    "যশোর",
    "সাতক্ষীরা",
    "বাগেরহাট",
    "ঝিনাইদহ",
    "মাগুরা",
    "নড়াইল",
    "কুষ্টিয়া",
    "চুয়াডাঙ্গা",
    "মেহেরপুর",
  ],
  বরিশাল: ["বরিশাল", "পটুয়াখালী", "ভোলা", "পিরোজপুর", "বরগুনা", "ঝালকাঠি"],
  রংপুর: [
    "রংপুর",
    "দিনাজপুর",
    "ঠাকুরগাঁও",
    "পঞ্চগড়",
    "কুড়িগ্রাম",
    "গাইবান্ধা",
    "নীলফামারী",
    "লালমনিরহাট",
  ],
  ময়মনসিংহ: ["ময়মনসিংহ", "জামালপুর", "শেরপুর", "নেত্রকোনা"],
};

// National/Common Services
const NATIONAL_SERVICES = [
  {
    name: "ন্যাশনাল ইমারজেন্সি",
    helpBangla: "জাতীয় জরুরি সেবা",
    number: "999",
    description:
      "পুলিশ, ফায়ার সার্ভিস এবং অ্যাম্বুলেন্সের জন্য একটি সমন্বিত হেল্পলাইন।",
    icon: ShieldAlert,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-100",
  },
  {
    name: "ন্যাশনাল হেল্পলাইন",
    helpBangla: "জাতীয় তথ্য ও সেবা",
    number: "333",
    description: "যেকোনো সরকারি তথ্য, সামাজিক সমস্যা এবং সেবার জন্য কল করুন।",
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
  },
  {
    name: "হেলথ উইন্ডো",
    helpBangla: "স্বাস্থ্য বাতায়ন",
    number: "16263",
    description:
      "২৪ ঘণ্টা অভিজ্ঞ ডাক্তারদের ফ্রি স্বাস্থ্য পরামর্শ ও অ্যাম্বুলেন্স সেবা।",
    icon: Activity,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-100",
  },
  {
    name: "নারী ও শিশু হেল্পলাইন",
    helpBangla: "সহিংসতা প্রতিরোধ",
    number: "109",
    description:
      "নারী ও শিশু নির্যাতন প্রতিরোধে অবিলম্বে সহায়তার জন্য কল করুন।",
    icon: UserCheck,
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-100",
  },
  {
    name: "চাইল্ড হেল্পলাইন",
    helpBangla: "শিশু সুরক্ষা",
    number: "1098",
    description: "বিপদাপন্ন শিশুদের অভিযোগ ও জরুরি সুরক্ষার জন্য বিশেষ সেবা।",
    icon: Baby,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
  },
  {
    name: "অ্যান্টি-করাপশন",
    helpBangla: "দুদক হেল্পলাইন",
    number: "106",
    description:
      "দুর্নীতি বা অনিয়ম সম্পর্কে সরাসরি অভিযোগ বা তথ্য প্রদান করুন।",
    icon: Scale,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-100",
  },
  {
    name: "এনআইডি হেল্পলাইন",
    helpBangla: "জাতীয় পরিচয়পত্র",
    number: "105",
    description:
      "স্মার্ট কার্ড এবং এনআইডি সংক্রান্ত যেকোনো তথ্যের জন্য কল করুন।",
    icon: Fingerprint,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-100",
  },
  {
    name: "ডিজাস্টার ম্যানেজমেন্ট",
    helpBangla: "দুর্যোগ সতর্কতা",
    number: "1090",
    description:
      "বন্যা, ঘূর্ণিঝড় সহ প্রাকৃতিক দুর্যোগের আগাম সতর্কবার্তা জানতে।",
    icon: Wind,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
  },
];

// Example Local Services (This would normally come from an API or database)
const LOCAL_SERVICES_DATABASE: Record<string, Record<string, any[]>> = {
  ঢাকা: {
    ঢাকা: [
      {
        name: "ডিএমপি হেডকোয়ার্টার্স",
        helpBangla: "পুলিশ কন্ট্রোল রুম",
        number: "01320-040100",
        description: "ঢাকা মেট্রোপলিটন পুলিশ জরুরি সহায়তা",
        icon: ShieldCheck,
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
      },
      {
        name: "ঢাকা মেডিকেল কলেজ",
        helpBangla: "ঢামেক জরুরি বিভাগ",
        number: "01732-601815",
        description: "দেশের বৃহত্তম সরকারি সাধারণ হাসপাতাল",
        icon: Hospital,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-100",
      },
      {
        name: "সদরদপ্তর ফায়ার সার্ভিস",
        helpBangla: "ফায়ার কন্ট্রোল রুম",
        number: "02-9555555",
        description: "ফায়ার সার্ভিস ও সিভিল ডিফেন্স হেডকোয়ার্টার্স",
        icon: Flame,
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-100",
      },
      {
        name: "ন্যাশনাল হার্ট ফাউন্ডেশন",
        helpBangla: "হৃদরোগ জরুরি সেবা",
        number: "02-58051252",
        description: "হৃদরোগীদের জন্য বিশেষায়িত চিকিৎসা কেন্দ্র",
        icon: Stethoscope,
        color: "text-red-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-100",
      },
    ],
    নারায়ণগঞ্জ: [
      {
        name: "নারায়ণগঞ্জ মডেল থানা",
        helpBangla: "পুলিশ কন্ট্রোল রুম",
        number: "01320-107405",
        description: "নারায়ণগঞ্জ সদর এলাকার জন্য জরুরি পুলিশ সেবা",
        icon: ShieldCheck,
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
      },
      {
        name: "৩০০ শয্যা হাসপাতাল",
        helpBangla: "ভিক্টোরিয়া জেনারেল হাসপাতাল",
        number: "01912-340623",
        description: "নারায়ণগঞ্জ জেলার প্রধান সরকারি হাসপাতাল",
        icon: Hospital,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-100",
      },
    ],
  },
  চট্টগ্রাম: {
    চট্টগ্রাম: [
      {
        name: "সিএমপি হেডকোয়ার্টার্স",
        helpBangla: "চট্টগ্রাম পুলিশ সেবা",
        number: "01320-050100",
        description: "চট্টগ্রাম মেট্রোপলিটন পুলিশ জরুরি সহায়তা",
        icon: ShieldCheck,
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-100",
      },
      {
        name: "চমেক হাসপাতাল",
        helpBangla: "চট্টগ্রাম মেডিকেল জরুরি",
        number: "01732-401815",
        description: "চট্টগ্রামের প্রধান সরকারি সাধারণ হাসপাতাল",
        icon: Hospital,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
        borderColor: "border-rose-100",
      },
    ],
  },
};

export default function JoruriSebaPage() {
  const [division, setDivision] = useState<string>("");
  const [district, setDistrict] = useState<string>("");

  const localServices = useMemo(() => {
    if (!division || !district) return [];
    return LOCAL_SERVICES_DATABASE[division]?.[district] || [];
  }, [division, district]);

  const hasSelection = division || district;

  return (
    <StaffLayout balance={0}>
      <div className="flex flex-col gap-6 p-4 sm:p-6 text-gray-800 pb-24 font-sans">
        {/* Elegant Header Section (Optimized size for dashboard) */}
        <PageBanner src="/banners/emergency.jpg" alt="জরুরি কল - Emergency Call" width={721} height={273} href="tel:09649355555" />

        {/* --- Advanced Filtering Section --- */}
        <div className="bg-white rounded-md p-5 border border-gray-100 shadow-sm transition-all">
          <div className="flex flex-col md:flex-row items-end gap-4">
            {/* Division Filter */}
            <div className="w-full md:w-auto flex-1 space-y-2">
              <label className="text-[13px] font-black text-gray-400 uppercase  flex items-center gap-2 px-1">
                <MapPin size={12} className="text-brand" /> বিভাগ নির্বাচন করুন
              </label>
              <select
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                  setDistrict(""); // Reset district when division changes
                }}
                className="w-full h-12 px-4 rounded-md border border-gray-200 bg-gray-50 text-sm font-bold focus:border-brand focus:ring-0 transition-colors"
              >
                <option value="">সকল বিভাগ</option>
                {Object.keys(DIVISION_DATA).map((div) => (
                  <option key={div} value={div}>
                    {div}
                  </option>
                ))}
              </select>
            </div>

            {/* District Filter */}
            <div className="w-full md:w-auto flex-1 space-y-2">
              <label className="text-[13px] font-black text-gray-400 uppercase  flex items-center gap-2 px-1">
                <Search size={12} className="text-brand" /> জেলা নির্বাচন করুন
              </label>
              <select
                value={district}
                disabled={!division}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full h-12 px-4 rounded-md border border-gray-200 bg-gray-50 text-sm font-bold focus:border-brand focus:ring-0 transition-colors disabled:opacity-50"
              >
                <option value="">
                  {division ? "সিলেক্ট করুন..." : "প্রথমে বিভাগ সিলেক্ট করুন"}
                </option>
                {division &&
                  DIVISION_DATA[division].map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
              </select>
            </div>

            {/* Reset Filter Button */}
            {hasSelection && (
              <button
                onClick={() => {
                  setDivision("");
                  setDistrict("");
                }}
                className="w-full md:w-auto h-12 px-6 flex items-center justify-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-md text-xs font-black uppercase  transition-all"
              >
                <X size={16} /> রিসেট
              </button>
            )}
          </div>
        </div>

        {/* --- Results Section --- */}

        {/* Local Services Heading & Grid */}
        {localServices.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
              <h2 className="text-[14px] font-black text-brand-600 uppercase  bg-brand-50 px-4 py-2 rounded-full border border-brand-100 flex items-center gap-2 shadow-sm">
                <MapPin size={14} /> স্থানীয় জরুরি সেবা ({district})
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {localServices.map((service, idx) => (
                <ServiceCard key={idx} service={service} />
              ))}
            </div>
          </div>
        )}

        {/* No Local Results Prompt */}
        {division && district && localServices.length === 0 && (
          <div className="p-8 rounded-md bg-amber-50 border border-amber-100 text-center space-y-3">
            <Info size={32} className="mx-auto text-amber-500" />
            <h3 className="text-md font-black text-amber-800 uppercase tracking-widest">
              দুঃখিত! এই এলাকায় স্থানীয় সেবা যুক্ত নেই
            </h3>
            <p className="text-sm text-amber-600/80 max-w-sm mx-auto">
              আপনার এলাকার জন্য আমাদের কাছে এখনো স্থানীয় নাম্বার নেই। অনুগ্রহ
              করে আমাদের সাথে শেয়ার করুন। <br />
              তবে নিচের <strong>জাতীয় সেবাগুলো</strong> ২৪/৭ সচল রয়েছে।
            </p>
          </div>
        )}

        {/* National/Common Services Section */}
        <div className="mt-4">
          {!hasSelection ? (
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-[14px] font-black text-gray-400 p-2 uppercase  ">
                জাতীয় জরুরি সেবা
              </h2>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
          ) : (
            <div className="flex items-center gap-4 mb-8 mt-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
              <h2 className="text-[12px] font-black text-gray-400 uppercase  px-4">
                সাধারণ জরুরি নাম্বার
              </h2>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {NATIONAL_SERVICES.map((service, idx) => (
              <ServiceCard key={idx} service={service} />
            ))}
          </div>
        </div>

        {/* Static Footer Section (Optimized) */}
        <div className="mt-8 p-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-center md:text-left">
            <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
              <ShieldCheck className="text-gray-400" size={20} />
            </div>
            <div>
              <p className="text-[14px] font-black text-gray-400 uppercase  mb-1">
                তথ্যসূত্র ও নিরাপত্তা
              </p>
              <p className="text-sm text-gray-500 max-w-md font-medium">
                সকল তথ্য সরকারি পোর্টাল থেকে সংগৃহীত। জরুরি মুহূর্তে ৯৯৯
                নাম্বারে ডায়াল করাই সবচেয়ে নিরাপদ।
              </p>
            </div>
          </div>
          <button className="px-3 py-2 rounded-md border border-gray-200 text-[14px] font-black uppercase  text-gray-400 hover:text-brand hover:border-brand transition-all flex items-center gap-2 group">
            ভুল বা নতুন নাম্বার রিপোর্ট ক্লিক করুন{" "}
            <ExternalLink
              size={20}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>
      </div>
    </StaffLayout>
  );
}

// Internal reusable ServiceCard component
function ServiceCard({ service }: { service: any }) {
  return (
    <div
      className={`group relative overflow-hidden bg-white rounded-md border ${service.borderColor} p-6 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all duration-500 transform hover:-translate-y-1`}
    >
      <div className="flex items-start justify-start mb-6 gap-4">
        <div
          className={`p-4 rounded-md ${service.bgColor} ${service.color} transition-all group-hover:scale-110 group-hover:rotate-3 duration-300 shadow-sm border border-black/5`}
        >
          <service.icon size={26} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-black text-gray-900 leading-tight">
            {service.helpBangla}
          </h3>
          <p className="text-[13px] font-black uppercase  text-gray-400 group-hover:text-brand transition-colors">
            {service.name}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums drop-shadow-sm group-hover:text-brand transition-colors">
          {service.number}
        </div>
        <div className="h-px w-6 bg-gray-100 group-hover:w-full transition-all duration-500" />
        <p className="text-sm text-gray-500 font-medium leading-relaxed line-clamp-2 min-h-[32px]">
          {service.description}
        </p>

        <a
          href={`tel:${service.number}`}
          className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-md font-black uppercase  text-[13px] transition-all duration-300 ${service.bgColor} ${service.color} hover:shadow-lg active:scale-95 border ${service.borderColor}`}
        >
          <PhoneCall size={14} strokeWidth={3} />
          এখনই কল করুন
        </a>
      </div>
      <div
        className={`absolute bottom-0 right-0 w-24 h-24 ${service.bgColor} opacity-0 group-hover:opacity-30 rounded-tl-full transition-all duration-500 -mr-12 -mb-12 blur-2xl`}
      />
    </div>
  );
}

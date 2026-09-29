"use client";

import { verifyAuthToken } from "@/actions";
import { DelayedLoading } from "@/components";
import SuccessPopup from "@/components/ui/SuccessPopup";
import { contactDetails } from "@/constants";
import { useThemeColor } from "@/hooks";
import { AppError } from "@/utils";
import { Check, ClipboardList, Headset, Mail, MapPin, Phone, Send } from "lucide-react";
import { useEffect, useState } from "react";
import PublicRegistrationForm from "./PublicRegistrationForm";

function AppHeader() {
  return (
    <header className="bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-3 h-[56px] flex items-center gap-2.5">
      <span className="flex flex-col leading-tight min-w-0 flex-1">
        <span className="text-[16px] font-extrabold truncate">SE Electronics</span>
        <span className="text-[10.5px] text-white/85 font-medium truncate">Smart Solution &nbsp;Better Life</span>
      </span>
      <a href={`tel:${contactDetails.customerCare}`} className="inline-flex items-center gap-1.5 text-[11px] font-bold leading-tight">
        <Headset size={20} />
        <span>Service<br />Support</span>
      </a>
    </header>
  );
}

export default function RegistrationPage({ token }: { token: string }) {
  useThemeColor("#0b3d91");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showRequirements, setShowRequirements] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [name, setName] = useState("");
  const requirementsList = [
    { id: 1, text: "ভালো অভিজ্ঞতার জন্য গুগল ক্রোম ব্রাউজার (প্রস্তাবিত)" },
    { id: 2, text: "নিজ নামের এন আই ডি দিয়ে নিবন্ধিত মোবাইল সিম নাম্বার (আবশ্যক)" },
    { id: 3, text: "জাতীয় পরিচয়পত্র (আবশ্যক)" },
    { id: 4, text: "সব সময় চালু আছে এমন সচল মোবাইল নাম্বার নিজ নামে নিবন্ধিত (আবশ্যক)" },
    { id: 5, text: "নিজের চেহারার ছবি পাসপোর্ট সাইজ স্পষ্ট ছবি (আবশ্যক)" },
    { id: 10, text: "নাম স্থানীয় ও বর্তমান ঠিকানা (আবশ্যক)" },
    { id: 6, text: "নমিনির জাতীয় পরিচয়পত্র (প্রযোজ্য ক্ষেত্রে আবশ্যক)" },
    { id: 7, text: "ইউটিলিটি বিলের কপি (ঐচ্ছিক)" },
    { id: 8, text: "ই-মেইল (প্রযোজ্য ক্ষেত্রে আবশ্যক)" },
    { id: 9, text: "পেশার প্রমাণপত্র (প্রযোজ্য)" },
  ];

  useEffect(() => {
    verifyAuthToken(token)
      .then((res) => {
        setIsTokenValid(res.isValid);
        setIsVerifying(false);
      })
      .catch((err) => console.error(err));
  }, []);

  if (isVerifying) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <DelayedLoading />
      </div>
    );
  }

  if (!isVerifying && !isTokenValid) {
    throw new AppError("টোকেনটি সঠিক নয় বা মেয়াদ উত্তীর্ণ হয়ে গেছে।");
  }

  const hero = (
    <section className="relative overflow-hidden rounded-md bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-3 shadow-[0_10px_30px_rgba(10,47,112,0.30)]">
      <span className="absolute -right-10 -top-12 size-44 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <span className="size-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><ClipboardList size={24} /></span>
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[12px] font-bold text-white/85">টেকনিশিয়ান / ইলেকট্রিশিয়ান নিবন্ধন ফর্ম</span>
          <span className="text-[clamp(16px,4.8vw,20px)] font-extrabold">এস ই ইলেকট্রনিকস সার্ভিস এজেন্ট নিয়োগ আবেদন</span>
        </span>
      </div>
    </section>
  );

  const contact = (
    <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 grid grid-cols-2 gap-x-2 gap-y-2 text-[12px]">
      <a href={`tel:${contactDetails.customerCare}`} className="flex items-center gap-2 min-w-0">
        <span className="size-8 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><Phone size={15} /></span>
        <span className="flex flex-col min-w-0"><span className="text-[#5b6784] font-semibold">হেল্পলাইন</span><span className="font-extrabold truncate text-[#16213a]">{contactDetails.customerCare}</span></span>
      </a>
      <span className="flex items-center gap-2 min-w-0 border-l border-[#eef1f6] pl-2">
        <span className="size-8 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><Mail size={15} /></span>
        <span className="flex flex-col min-w-0"><span className="text-[#5b6784] font-semibold">Email</span><span className="font-extrabold truncate text-[#16213a]">{contactDetails.email}</span></span>
      </span>
      <span className="col-span-2 flex items-center gap-2 min-w-0 border-t border-[#eef1f6] pt-2">
        <span className="size-8 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><MapPin size={15} /></span>
        <span className="font-bold text-[#16213a]">হেড অফিস: {contactDetails.headOffice}</span>
      </span>
    </section>
  );

  if (showRequirements) {
    return (
      <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
        <AppHeader />
        <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-[720px] mx-auto">
          {hero}
          <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
            <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
              <span className="size-7 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><ClipboardList size={15} /></span>
              <span className="text-[15px] font-extrabold text-[#0b3d91]">রেজিস্ট্রেশন নির্দেশিকা</span>
            </div>
            <div className="p-2.5 flex flex-col gap-2">
              <p className="text-[12.5px] leading-relaxed text-[#3d4a63]">এস ই ইলেকট্রনিকস সার্ভিস এজেন্ট হিসেবে যোগ দিতে নিচের প্রয়োজনীয় তথ্য ও নথিগুলো সাথে রাখুন।</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {requirementsList.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-md bg-[#f5f8fd] border border-[#eef1f6]">
                    <span className="size-5 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center shrink-0 mt-0.5"><Check size={12} strokeWidth={3} /></span>
                    <span className="text-[12.5px] font-bold text-[#16213a] leading-snug">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <label className="rounded-md bg-[#e8f1ff] border border-[#cfe0fb] p-2.5 flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="size-5 mt-0.5 accent-[#1f7cf0] shrink-0" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
            <span className="text-[13px] font-extrabold leading-snug">আমি সকল নিয়ম ও শর্তগুলোতে সম্মত আছি এবং সঠিক তথ্য প্রদানে অঙ্গীকার করছি।</span>
          </label>

          <button
            className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all"
            disabled={!isAgreed}
            onClick={() => setShowRequirements(false)}
          >
            <Send size={18} />আবেদন শুরু করুন
          </button>

          <p className="text-[12px] text-[#5b6784] leading-relaxed text-center font-medium">ইতিমধ্যে আবেদন করে থাকলে আবেদনের স্ট্যাটাস জানতে আপনার নাম্বারে এসএমএস এ পাঠানো লিঙ্কে ক্লিক করুন।</p>
          <p className="text-center text-[11px] font-bold text-[#9aa4b8]">© SEIPSBD, All Rights Reserved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] text-[#16213a] pb-6">
      <AppHeader />
      <div className="px-2 pt-2 flex flex-col gap-2.5 max-w-[720px] mx-auto">
        {hero}
        {contact}
        <p className="rounded-md bg-white border border-[#dfe6f2] px-2.5 py-2 text-[12px] font-bold text-[#3d4a63] text-center">দয়া করে নিচের প্রতিটি ফিল্ড সঠিক তথ্য দিয়ে পূরণ করুন</p>
        <PublicRegistrationForm
          token={token}
          onRegistrationComplete={(n) => {
            setName(n);
            setShowSuccessMessage(true);
          }}
        />
      </div>

      {showSuccessMessage && (
        <SuccessPopup
          title={`অভিনন্দন ${name}!`}
          message="আপনার রেজিস্ট্রেশন আবেদন সফলভাবে গৃহীত হয়েছে। আমাদের টিম আপনার তথ্য যাচাই করে দ্রুতই যোগাযোগ করবে।"
          buttonLabel="হোম পেজে ফিরে যান"
          href="/"
        />
      )}
    </div>
  );
}

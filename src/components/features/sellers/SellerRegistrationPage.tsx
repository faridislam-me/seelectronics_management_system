"use client";

import { verifySellerRegistrationToken } from "@/actions";
import { DelayedLoading } from "@/components/ui";
import { contactDetails } from "@/constants";
import { useThemeColor } from "@/hooks";
import { AppError } from "@/utils";
import { BadgeCheck, CheckCircle2, FileBadge, IdCard, Mail, Phone, Smartphone, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SellerRegistrationForm from "./SellerRegistrationForm";

const requirements = [
  { icon: FileBadge, text: "দোকানের বৈধ ট্রেড লাইসেন্স ও তার স্পষ্ট ছবি" },
  { icon: IdCard, text: "মালিকের জাতীয় পরিচয়পত্র (NID), সামনের ও পেছনের ছবি" },
  { icon: UserRound, text: "মালিকের পাসপোর্ট সাইজ স্পষ্ট ছবি" },
  { icon: Store, text: "সাইনবোর্ড সহ দোকানের সামনের স্পষ্ট ছবি" },
  { icon: Smartphone, text: "নিজ নামে নিবন্ধিত সচল মোবাইল নাম্বার" },
];

function Hero({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <section className="bg-[#0b3d91] bg-[radial-gradient(120%_90%_at_10%_0%,#1b5fd0_0%,#0b3d91_55%,#072a66_100%)] text-white px-5 pt-5 pb-16 rounded-b-[44px] relative overflow-hidden">
      <span className="absolute -right-12 -top-16 size-64 rounded-full bg-white/10" />
      <span className="absolute -left-16 bottom-4 size-40 rounded-full bg-white/5" />
      <div className="flex items-center gap-2.5 relative">
        <span className="size-11 rounded-2xl bg-[#1f7cf0] text-white font-extrabold flex items-center justify-center shadow-[0_6px_16px_rgba(0,40,120,0.35)]">SE</span>
        <span className="flex flex-col leading-tight">
          <span className="font-extrabold text-base">SE Electronics</span>
          <span className="text-white/80 text-[10px] font-medium tracking-wide">Smart Solution &nbsp;Better Life</span>
        </span>
        <span className="ml-auto text-[10px] font-extrabold tracking-[2px] text-white/70">{kicker}</span>
      </div>
      <h1 className="relative mt-6 text-[22px] sm:text-[26px] leading-snug font-extrabold">{title}</h1>
      <p className="relative mt-2 text-[13px] leading-relaxed text-white/80">{subtitle}</p>
      <div className="relative mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] font-semibold text-white/90">
        <span className="inline-flex items-center gap-1.5"><Phone size={13} className="text-[#7fb4ff]" />{contactDetails.customerCare}</span>
        <span className="inline-flex items-center gap-1.5"><Mail size={13} className="text-[#7fb4ff]" />{contactDetails.email}</span>
      </div>
    </section>
  );
}

export default function SellerRegistrationPage({ token }: { token: string }) {
  useThemeColor("#0b3d91");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [showRequirements, setShowRequirements] = useState(true);
  const [isAgreed, setIsAgreed] = useState(false);
  const [done, setDone] = useState<{ name: string; sellerId?: string } | null>(null);

  useEffect(() => {
    verifySellerRegistrationToken(token).then((res) => { setIsTokenValid(res.isValid); setIsVerifying(false); }).catch(console.error);
  }, []);

  if (isVerifying) return <div className="absolute inset-0 flex items-center justify-center"><DelayedLoading /></div>;
  if (!isTokenValid) throw new AppError("টোকেনটি সঠিক নয় বা মেয়াদ উত্তীর্ণ হয়ে গেছে।");

  if (done) {
    return (
      <div className="min-h-screen bg-[#eef3fb] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-[26px] p-8 text-center shadow-[0_10px_30px_rgba(11,61,145,0.12)] animate-in zoom-in-95 duration-500">
          <div className="size-24 mx-auto rounded-full bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center shadow-[0_0_0_8px_#f3fcf6]"><CheckCircle2 size={52} strokeWidth={2.2} /></div>
          <h2 className="mt-6 text-2xl font-extrabold text-[#16213a]">অভিনন্দন {done.name}!</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[#6b7690] font-medium">আপনার সেলার আবেদনটি সফলভাবে জমা হয়েছে। আমাদের টিম আপনার ট্রেড লাইসেন্স ও তথ্য যাচাই করে দ্রুতই যোগাযোগ করবে। ট্র্যাকিং লিংক আপনার মোবাইলে SMS করা হয়েছে।</p>
          <Link href="/" className="mt-8 inline-flex w-full h-13 py-3.5 items-center justify-center rounded-full bg-[#0b3d91] bg-[linear-gradient(110deg,#0a2f70_0%,#1b5fd0_100%)] text-white font-extrabold shadow-[0_10px_30px_rgba(10,47,112,0.35)]">হোম পেজে ফিরে যান</Link>
        </div>
      </div>
    );
  }

  if (showRequirements) {
    return (
      <div className="min-h-screen bg-[#eef3fb]">
        <div className="max-w-[560px] mx-auto pb-10">
          <Hero kicker="SELLER APPLICATION" title="অথরাইজড সেলার / ডিলার আবেদন" subtitle="এস ই ইলেকট্রনিকস এর অথরাইজড সেলার হিসেবে যুক্ত হতে নিচের নথিগুলো হাতের কাছে রাখুন। আবেদন সম্পূর্ণ করতে ৫ মিনিটের মতো সময় লাগবে।" />
          <div className="px-4 -mt-10 relative flex flex-col gap-3.5">
            <div className="bg-white rounded-[22px] p-4 shadow-[0_10px_30px_rgba(11,61,145,0.12)] flex flex-col gap-1">
              <span className="text-[15px] font-extrabold text-[#16213a] mb-1">যা যা লাগবে</span>
              {requirements.map((r) => (
                <div key={r.text} className="flex items-center gap-3.5 py-3 border-t border-[#eef1f6] first-of-type:border-0">
                  <span className="size-11 rounded-2xl bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0"><r.icon size={20} /></span>
                  <span className="text-[14px] font-bold text-[#16213a] leading-snug flex-1">{r.text}</span>
                  <BadgeCheck size={18} className="text-[#1a9c4b] shrink-0" />
                </div>
              ))}
            </div>
            <label className="bg-white rounded-[22px] p-4 shadow-[0_4px_18px_rgba(11,61,145,0.06)] flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="size-5 mt-0.5 accent-[#1f7cf0] shrink-0" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
              <span className="text-[14px] font-bold text-[#16213a] leading-snug">আমি সকল নিয়ম ও শর্তগুলোতে সম্মত আছি এবং সঠিক তথ্য প্রদানে অঙ্গীকার করছি।</span>
            </label>
            <button className="w-full h-14 rounded-full bg-[#0b3d91] bg-[linear-gradient(110deg,#0a2f70_0%,#1b5fd0_100%)] text-white font-extrabold text-base tracking-wide shadow-[0_10px_30px_rgba(10,47,112,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all" disabled={!isAgreed} onClick={() => setShowRequirements(false)}>আবেদন শুরু করুন</button>
            <p className="text-center text-xs font-semibold text-[#6b7690] px-4">ইতিমধ্যে আবেদন করে থাকলে আবেদনের স্ট্যাটাস জানতে আপনার নাম্বারে এসএমএস এ পাঠানো লিঙ্কে ক্লিক করুন।</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fb]">
      <div className="max-w-[760px] mx-auto pb-10">
        <Hero kicker="SELLER APPLICATION" title="সেলার / ডিলার আবেদন ফরম" subtitle="প্রতিটি ফিল্ড সঠিক তথ্য দিয়ে পূরণ করুন। ট্রেড লাইসেন্স ও NID এর তথ্য যাচাই করে আপনার আবেদন অনুমোদন করা হবে।" />
        <div className="px-4 -mt-10 relative">
          <div className="bg-white rounded-[22px] p-4 sm:p-6 shadow-[0_10px_30px_rgba(11,61,145,0.12)]">
            <SellerRegistrationForm mode="create" token={token} onComplete={setDone} />
          </div>
        </div>
      </div>
    </div>
  );
}

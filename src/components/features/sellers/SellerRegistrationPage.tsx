"use client";

import { verifySellerRegistrationToken } from "@/actions";
import { DelayedLoading } from "@/components/ui";
import { contactDetails } from "@/constants";
import { useThemeColor } from "@/hooks";
import { AppError } from "@/utils";
import { CheckCircle, FileText } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SellerRegistrationForm from "./SellerRegistrationForm";

const requirements = [
  "দোকানের বৈধ ট্রেড লাইসেন্স ও তার স্পষ্ট ছবি (আবশ্যক)",
  "মালিকের জাতীয় পরিচয়পত্র, সামনের ও পেছনের ছবি (আবশ্যক)",
  "নিজ নামে নিবন্ধিত সচল মোবাইল নাম্বার (আবশ্যক)",
  "মালিকের পাসপোর্ট সাইজ স্পষ্ট ছবি (আবশ্যক)",
  "দোকানের সামনের স্পষ্ট ছবি, সাইনবোর্ড সহ (আবশ্যক)",
  "ব্যাংক / মোবাইল ব্যাংকিং তথ্য (আবশ্যক)",
];

export default function SellerRegistrationPage({ token }: { token: string }) {
  useThemeColor("#9ca3af");
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
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500"><CheckCircle size={48} /></div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-brand mb-4">অভিনন্দন {done.name}!</h2>
        <p className="text-lg text-gray-600 max-w-md leading-relaxed mb-8 font-medium">আপনার সেলার আবেদনটি সফলভাবে জমা হয়েছে। আমাদের টিম আপনার ট্রেড লাইসেন্স ও তথ্য যাচাই করে দ্রুতই যোগাযোগ করবে। ট্র্যাকিং লিংক আপনার মোবাইলে SMS করা হয়েছে।</p>
        <Link href="/" className="px-10 py-4 bg-brand text-white rounded-md font-black text-lg hover:bg-brand-800 transition-all shadow-lg shadow-brand/20">হোম পেজে ফিরে যান</Link>
      </div>
    );
  }

  if (showRequirements) {
    return (
      <div className="max-w-xl mx-auto mt-6 sm:mt-10 bg-white p-6 sm:p-10 rounded-md shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-brand/5 rounded-md flex items-center justify-center mb-6 mx-auto"><FileText className="text-brand" size={32} /></div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand mb-2 text-center leading-tight">সেলার / ডিলার আবেদন নির্দেশিকা</h2>
        <p className="text-base sm:text-lg text-gray-500 text-center mb-8 leading-relaxed">এস ই ইলেকট্রনিকস অথরাইজড সেলার হিসেবে যুক্ত হতে নিচের নথিগুলো সাথে রাখুন।</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {requirements.map((t) => (
            <div key={t} className="flex items-start gap-3 p-4 bg-gray-50 rounded-md border border-gray-100">
              <span className="bg-emerald-500 text-white rounded-md flex items-center justify-center w-6 h-6 shrink-0 text-sm font-bold">✓</span>
              <span className="text-sm sm:text-base font-bold text-gray-700 leading-tight">{t}</span>
            </div>
          ))}
        </div>
        <div className="mb-8 p-4 sm:p-6 bg-brand/5 rounded-md border border-brand/10">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="w-5 h-5 mt-0.5" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
            <span className="text-sm sm:text-base font-bold text-gray-700 leading-snug">আমি সকল নিয়ম ও শর্তগুলোতে সম্মত আছি এবং সঠিক তথ্য প্রদানে অঙ্গীকার করছি।</span>
          </label>
        </div>
        <button className="w-full py-4 sm:py-5 bg-brand text-white rounded-md font-black text-lg sm:text-xl hover:bg-brand-800 active:scale-[0.98] transition-all shadow-lg shadow-brand/20 disabled:opacity-50" disabled={!isAgreed} onClick={() => setShowRequirements(false)}>আবেদন শুরু করুন</button>
        <p className="mt-8 text-sm text-gray-500 text-center font-medium">ইতিমধ্যে আবেদন করে থাকলে আবেদনের স্ট্যাটাস জানতে আপনার নাম্বারে এসএমএস এ পাঠানো লিঙ্কে ক্লিক করুন।</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-6 flex flex-col gap-1 bg-white p-6 sm:p-8 rounded-md border border-gray-100 shadow-sm text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-brand leading-tight">এস ই ইলেকট্রনিকস সেলার / ডিলার নিয়োগ আবেদন</h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 mt-4 text-base sm:text-lg text-gray-500">
            <span className="font-bold">হেল্পলাইন: <span className="text-brand font-black">{contactDetails.customerCare}</span></span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="font-bold">Email: <span className="text-brand font-black">{contactDetails.email}</span></span>
          </div>
          <p className="text-sm sm:text-base text-gray-400 mt-2 uppercase tracking-wider font-bold">হেড অফিস: {contactDetails.headOffice}</p>
        </div>
        <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 p-4 border-b border-gray-100"><p className="text-sm font-bold text-gray-600 text-center">দয়া করে নিচের প্রতিটি ফিল্ড সঠিক তথ্য দিয়ে পূরণ করুন</p></div>
          <div className="p-4 sm:p-8">
            <SellerRegistrationForm mode="create" token={token} onComplete={setDone} />
          </div>
        </div>
      </div>
    </div>
  );
}

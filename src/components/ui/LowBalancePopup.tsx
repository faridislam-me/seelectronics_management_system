"use client";

import { AlertTriangle, Wallet } from "lucide-react";

/** Notice shown when a withdrawal is requested with too little balance. */
export default function LowBalancePopup({ name, balance, onClose }: { name?: string | null; balance: number; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[90] bg-[#0b3d91]/25 backdrop-blur-[2px] flex items-center justify-center p-3" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] rounded-md bg-white border border-[#dfe6f2] px-4 pt-5 pb-4 flex flex-col items-center gap-3 text-center shadow-[0_20px_50px_rgba(11,61,145,0.25)]">
        <div className="relative size-24 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[#fff6e3]" />
          <span className="relative size-16 rounded-full bg-white border-[4px] border-[#e0a11b] text-[#e0a11b] flex items-center justify-center"><AlertTriangle size={30} strokeWidth={2.4} /></span>
        </div>
        <h3 className="text-[19px] font-extrabold text-[#0b2a66]">পর্যাপ্ত ব্যালেন্স নেই</h3>
        <p className="w-full rounded-md bg-[#fff8ea] border border-[#f5dfa0] p-3 text-[13.5px] leading-relaxed text-[#3d4a63]">
          প্রিয় <b className="text-[#16213a]">{name || "গ্রাহক"}</b>, আপনার পর্যাপ্ত ব্যালেন্স নেই। অনুগ্রহ করে ব্যালেন্স এড করুন এবং পুনরায় আবার চেষ্টা করুন।
        </p>
        <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-[#eef4fd] border border-[#dfe8f7] text-[13px] font-bold text-[#0b3d91]"><Wallet size={16} />বর্তমান ব্যালেন্স: ৳{Number(balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <button type="button" onClick={onClose} className="w-full h-11 rounded-md bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)] text-white text-[14px] font-extrabold">ঠিক আছে</button>
      </div>
    </div>
  );
}

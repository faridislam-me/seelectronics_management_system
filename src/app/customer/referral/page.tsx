"use client";

import { Banknote, Calendar, ChevronRight, ClipboardList, History, Phone, User, Wallet } from "lucide-react";
import Link from "next/link";
import { useReferral } from "./_components/ReferralProvider";

export default function CustomerReferralPage() {
  const { data } = useReferral();
  const bonuses: any[] = data.bonuses ?? [];

  return (
    <>
      {/* Commission card */}
      <section className="relative overflow-hidden rounded-md bg-[#0b3d91] bg-[linear-gradient(115deg,#0a2f70_0%,#1259c9_55%,#1f7cf0_100%)] text-white p-3.5 shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
        <span className="absolute -right-6 -top-10 size-40 rounded-full bg-white/10" />
        {/* wallet + coins illustration */}
        <svg className="absolute right-3 top-6 w-[120px] h-[96px]" viewBox="0 0 120 96" fill="none" aria-hidden="true">
          <ellipse cx="66" cy="84" rx="44" ry="8" fill="#000" opacity="0.18" />
          <rect x="36" y="22" width="70" height="52" rx="9" fill="#2f7ff0" />
          <rect x="36" y="32" width="70" height="42" rx="9" fill="#1f5fc9" />
          <rect x="80" y="44" width="26" height="18" rx="5" fill="#7fb4ff" />
          <circle cx="93" cy="53" r="4" fill="#0b3d91" />
          <text x="46" y="60" fontSize="16" fontWeight="800" fill="#fff" fontStyle="italic">SE</text>
          <ellipse cx="22" cy="72" rx="16" ry="6" fill="#e0a11b" /><rect x="6" y="60" width="32" height="12" fill="#f5c542" /><ellipse cx="22" cy="60" rx="16" ry="6" fill="#ffd966" />
          <ellipse cx="22" cy="52" rx="16" ry="6" fill="#e0a11b" /><rect x="6" y="46" width="32" height="6" fill="#f5c542" /><ellipse cx="22" cy="46" rx="16" ry="6" fill="#ffd966" />
          <path d="M100 8l4 8M112 6l-2 9M108 22l8-2" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
        <div className="relative flex flex-col gap-1.5 pr-[120px]">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/90"><Wallet size={16} />মোট কমিশন</span>
          <span className="text-[clamp(28px,8.5vw,38px)] font-extrabold leading-none">৳ {Number(data.balance || 0).toLocaleString("en-IN")}</span>
          <span className="mt-1 inline-flex items-center gap-2 text-[14px] font-extrabold"><User size={15} className="text-white/85" />{data?.name || "Customer"}</span>
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-white/90"><Phone size={14} className="text-white/85" />{data?.phone || ""}</span>
        </div>
        <Link href="/customer/vip-card" className="relative mt-3 flex items-center gap-2 rounded-md bg-white/15 border border-white/25 px-3 h-11 text-[13px] font-bold">
          <ClipboardList size={17} className="shrink-0" /><span className="flex-1 truncate">আপনার রেফারেল কোড সক্রিয় আছে</span><ChevronRight size={16} />
        </Link>
      </section>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/customer/referral/cash-out" className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_18px_rgba(11,61,145,0.06)] active:scale-[0.98] transition-all">
          <span className="size-11 rounded-full bg-[#e9f9ef] text-[#1a9c4b] flex items-center justify-center shrink-0"><Banknote size={22} /></span>
          <span className="text-[15px] font-extrabold flex-1">ক্যাশ আউট</span><ChevronRight size={16} className="text-[#9aa4b8]" />
        </Link>
        <Link href="/customer/referral/history" className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_18px_rgba(11,61,145,0.06)] active:scale-[0.98] transition-all">
          <span className="size-11 rounded-full bg-[#f3e9ff] text-[#8b3fe8] flex items-center justify-center shrink-0"><History size={22} /></span>
          <span className="text-[15px] font-extrabold flex-1">ইতিহাস</span><ChevronRight size={16} className="text-[#9aa4b8]" />
        </Link>
      </div>

      {/* Earnings */}
      <div className="flex items-center justify-between mt-1">
        <span className="flex items-center gap-2">
          <span className="size-9 rounded-md bg-[#0b3d91] text-white flex items-center justify-center"><ClipboardList size={18} /></span>
          <span className="text-[17px] font-extrabold">রেফারেল আর্নিং</span>
        </span>
        <Link href="/customer/referral/history" className="text-[13px] font-bold text-[#1f7cf0] inline-flex items-center gap-1">{bonuses.length.toLocaleString("bn-BD")} টি রেকর্ড<ChevronRight size={15} /></Link>
      </div>

      <div className="flex flex-col gap-2">
        {bonuses.length === 0 ? (
          <div className="rounded-md bg-white border border-[#dfe6f2] p-6 text-center text-[13px] font-medium text-[#5b6784]">এখনও কোনো রেফারেল বোনাস নেই।</div>
        ) : (
          bonuses.map((bonus) => (
            <div key={bonus.id} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-3 shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
              <span className="size-12 rounded-full bg-[#e8f1ff] text-[#0b3d91] flex items-center justify-center shrink-0"><User size={24} /></span>
              <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="text-[14px] font-extrabold truncate">{bonus.referredCustomerName}</span>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#5b6784]"><Calendar size={13} />{new Date(bonus.createdAt).toLocaleDateString("bn-BD")}</span>
              </span>
              <span className="shrink-0 rounded-md bg-[#e8f1ff] px-2.5 py-1.5 text-center">
                <span className="block text-[15px] font-extrabold text-[#1b6fd6] leading-tight">+৳{Number(bonus.bonusEarned).toLocaleString()}</span>
                <span className="block text-[10px] font-bold text-[#5b6784]">(কমিশন ২%)</span>
              </span>
              <ChevronRight size={16} className="text-[#9aa4b8] shrink-0" />
            </div>
          ))
        )}
      </div>
    </>
  );
}

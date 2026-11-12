"use client";

import { getMyRechargeRequests } from "@/actions/rechargeActions";
import OperatorIcon from "@/components/features/recharge/OperatorIcon";
import clsx from "clsx";
import { ArrowLeft, ChevronRight, Gift, History, Loader2, Package, Smartphone, Zap } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useReferral } from "../_components/ReferralProvider";

// Each recharge type is its own page now (operator tabs → category → package →
// tap-to-confirm), reached from the tiles below.
const TYPE_TILES = [
  { href: "direct", label: "রিচার্জ", desc: "ইনস্ট্যান্ট টাকা", icon: Smartphone, color: "#0b3d91", bg: "#e8f1ff" },
  { href: "regular", label: "রেগুলার প্যাক", desc: "বান্ডেল অফার", icon: Gift, color: "#e84393", bg: "#fde7f1" },
  { href: "drive", label: "ড্রাইভ প্যাক", desc: "ড্রাইভ ব্যালেন্স", icon: Package, color: "#00695c", bg: "#d8f3ee" },
  { href: "offer", label: "ড্রাইভ অফার", desc: "বিশেষ অফার", icon: Zap, color: "#b8700a", bg: "#fdefd6" },
];

const RECHARGE_TYPE_BN: Record<string, string> = {
  recharge: "রিচার্জ",
  regular_pack: "রেগুলার প্যাক",
  drive_pack: "ড্রাইভ প্যাক",
  drive_offer: "ড্রাইভ অফার",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "প্রক্রিয়াধীন", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "সম্পন্ন", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "ব্যর্থ", cls: "bg-red-50 text-red-700 border-red-200" },
};

type RecentRecharge = {
  id?: string | number;
  requestCode: string;
  rechargePhone: string;
  operator: string;
  amount: number;
  rechargeType: string;
  status: string;
  createdAt: string | Date;
};

export default function RechargeLandingPage() {
  const { data } = useReferral();
  const balance = Number(data.balance || 0);

  const [recent, setRecent] = useState<RecentRecharge[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const loadRecent = useCallback(async () => {
    const res = await getMyRechargeRequests();
    if (res.success && Array.isArray(res.data)) setRecent(res.data as RecentRecharge[]);
    setLoadingRecent(false);
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/referral" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">মোবাইল রিচার্জ</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">রেফারেল ব্যালেন্স থেকে ইনস্ট্যান্ট রিচার্জ</span>
        </span>
        <Link href="/customer/referral/recharge/history" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <History size={18} className="text-[#5b6784]" />
        </Link>
      </div>

      {/* Balance banner */}
      <div className="rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Smartphone size={22} /></span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">ব্যবহারযোগ্য ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">৳{balance.toLocaleString("en-IN")}</span>
        </span>
      </div>

      {/* Type tiles → separate pages */}
      <div className="grid grid-cols-2 gap-2.5">
        {TYPE_TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={`/customer/referral/recharge/${t.href}`}
              className="rounded-md bg-white border border-[#dfe6f2] p-3 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.98] transition"
            >
              <span className="size-11 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: t.bg, color: t.color }}>
                <Icon size={22} />
              </span>
              <span className="flex flex-col min-w-0 flex-1 leading-tight">
                <span className="text-[13px] font-extrabold text-[#0f1729]">{t.label}</span>
                <span className="text-[10.5px] font-semibold text-[#5b6784] truncate">{t.desc}</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-[#c9d3e6]" />
            </Link>
          );
        })}
      </div>

      {/* Recent recharges */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-[#0b3d91]"><History size={15} /> সাম্প্রতিক রিচার্জ</p>
          <Link href="/customer/referral/recharge/history" className="text-[11px] font-bold text-[#5b6784] inline-flex items-center">সব দেখুন <ChevronRight size={14} /></Link>
        </div>

        {loadingRecent ? (
          <div className="flex items-center justify-center py-5"><Loader2 className="size-5 animate-spin text-[#0b3d91]" /></div>
        ) : recent.length === 0 ? (
          <p className="text-[11px] text-[#5b6784] py-4 text-center">কোনো রিচার্জ পাওয়া যায়নি</p>
        ) : (
          <div className="flex flex-col divide-y divide-[#eef2f9]">
            {recent.slice(0, 6).map((r) => {
              const sm = STATUS_META[r.status] || STATUS_META.pending;
              return (
                <div key={r.id ?? r.requestCode} className="flex items-center gap-2.5 py-2.5">
                  <OperatorIcon operatorKey={r.operator} size={30} />
                  <span className="flex flex-col leading-tight flex-1 min-w-0">
                    <span className="text-[12.5px] font-extrabold text-[#0f1729] font-mono">{r.rechargePhone}</span>
                    <span className="text-[10px] font-semibold text-[#5b6784] truncate">{RECHARGE_TYPE_BN[r.rechargeType] || "রিচার্জ"} · {r.requestCode}</span>
                  </span>
                  <span className="flex flex-col items-end leading-tight shrink-0">
                    <span className="text-[13px] font-extrabold text-[#0b3d91]">৳{Number(r.amount).toLocaleString("en-US")}</span>
                    <span className={clsx("text-[9px] font-bold px-1.5 py-0.5 rounded-full border mt-0.5", sm.cls)}>{sm.label}</span>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

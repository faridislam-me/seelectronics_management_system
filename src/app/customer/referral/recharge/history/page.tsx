"use client";

import { getMyRechargeRequests } from "@/actions/rechargeActions";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700", icon: Clock },
  processing: { label: "প্রক্রিয়াধীন", cls: "bg-blue-50 text-blue-700", icon: Clock },
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42]", icon: CheckCircle2 },
  rejected: { label: "ব্যর্থ", cls: "bg-red-50 text-red-700", icon: XCircle },
};

const OPERATORS: Record<string, string> = {
  grameenphone: "Grameenphone",
  banglalink: "Banglalink",
  robi: "Robi",
  airtel: "Airtel",
  teletalk: "Teletalk",
  skitto: "Skitto",
};

const TYPE_LABELS: Record<string, string> = {
  recharge: "রিচার্জ",
  regular_pack: "রেগুলার প্যাক",
  drive_pack: "ড্রাইভ প্যাক",
  drive_offer: "ড্রাইভ অফার",
};

const TYPE_TABS: { key: string; label: string }[] = [
  { key: "all", label: "সব" },
  { key: "recharge", label: "রিচার্জ" },
  { key: "regular_pack", label: "রেগুলার প্যাক" },
  { key: "drive_pack", label: "ড্রাইভ প্যাক" },
  { key: "drive_offer", label: "ড্রাইভ অফার" },
];

export default function RechargeHistoryPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getMyRechargeRequests().then((res) => {
      if (res.success && Array.isArray(res.data)) setRequests(res.data);
      setLoading(false);
    });
  }, []);

  const visible = filter === "all" ? requests : requests.filter((r) => r.rechargeType === filter);

  return (
    <>
      <div className="flex items-center gap-2.5">
        <Link href="/customer/referral/recharge" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="text-[16px] font-extrabold">রিচার্জ ইতিহাস</span>
      </div>

      {/* Type tabs — each type's history shown separately */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-2 px-2 [scrollbar-width:none]">
        {TYPE_TABS.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              className={clsx(
                "shrink-0 h-8 px-3 rounded-full border text-[11.5px] font-extrabold transition-colors",
                active ? "border-[#0b3d91] bg-[#0b3d91] text-white" : "border-[#dfe6f2] bg-white text-[#5b6784] hover:bg-[#f5f7fb]",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="size-6 border-2 border-[#0b3d91] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <p className="text-center text-[12px] text-[#5b6784] py-8">এই ধরনের কোনো রিচার্জ ইতিহাস নেই</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((r) => {
            const sm = STATUS_META[r.status] || STATUS_META.pending;
            const Icon = sm.icon;
            return (
              <div key={r.id} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0", sm.cls)}><Icon size={18} /></span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className="text-[13px] font-extrabold">{r.rechargePhone} · {OPERATORS[r.operator] || r.operator}</span>
                  <span className="text-[11px] font-semibold text-[#5b6784]">
                    {TYPE_LABELS[r.rechargeType] || "রিচার্জ"} · {formatDate(r.createdAt)} · {r.requestCode}
                  </span>
                  {r.driverRef && (
                    <span className="text-[10px] font-bold text-[#0e8a7d]">ড্রাইভার: {r.driverRef}</span>
                  )}
                  {r.status === "rejected" && r.rejectReason && (
                    <span className="text-[10px] text-red-500 mt-0.5">{r.rejectReason}</span>
                  )}
                </span>
                <span className="flex flex-col items-end shrink-0">
                  <span className="text-[14px] font-extrabold">৳{Number(r.amount).toLocaleString()}</span>
                  <span className={clsx("text-[10px] font-extrabold uppercase", sm.cls.split(" ")[1])}>{sm.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

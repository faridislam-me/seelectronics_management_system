"use client";

import { getInstallmentPlans } from "@/actions/installmentActions";
import clsx from "clsx";
import { CreditCard, Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CreateInstallmentModal from "./CreateInstallmentModal";

export type InstallmentPlanRow = {
  planCode: string;
  customerName: string;
  customerPhone: string;
  productModel: string;
  months: number;
  monthlyAmount: number;
  financedAmount: number;
  status: string;
  paidCount: number;
  remainingAmount: number;
  remainingCount: number;
};

export const STATUS_META: Record<string, { label: string; cls: string }> = {
  active: { label: "চলমান", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "সম্পন্ন", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  defaulted: { label: "খেলাপি", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  banned: { label: "ব্যান", cls: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const bdt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const FILTERS = [
  { value: "", label: "সব" },
  { value: "active", label: "চলমান" },
  { value: "completed", label: "সম্পন্ন" },
  { value: "banned", label: "ব্যান" },
];

export default function InstallmentsClient({ initialPlans }: { initialPlans: InstallmentPlanRow[] }) {
  const [plans, setPlans] = useState<InstallmentPlanRow[]>(initialPlans);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRun = useRef(true);

  const fetchPlans = useCallback(async (q: string, s: string) => {
    setLoading(true);
    const res = await getInstallmentPlans({ query: q, status: s || undefined, limit: "50" });
    setPlans(res.success && Array.isArray(res.data) ? (res.data as InstallmentPlanRow[]) : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchPlans(query, status), 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, status, fetchPlans]);

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="size-10 rounded-lg bg-[#0b3d91] text-white flex items-center justify-center"><CreditCard size={20} /></span>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">কিস্তি (Installments)</h1>
            <p className="text-xs text-gray-500">মোট {plans.length} টি প্ল্যান</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="__btn flex items-center gap-2">
          <Plus size={18} strokeWidth={2.5} /> নতুন কিস্তি
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="__input pl-9" placeholder="কোড / নাম / ফোন / মডেল দিয়ে খুঁজুন" />
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={clsx(
                "px-3 h-9 rounded-md text-xs font-bold border transition-colors",
                status === f.value ? "bg-[#0b3d91] text-white border-[#0b3d91]" : "bg-white dark:bg-gray-800 text-gray-600 border-gray-200 dark:border-gray-700 hover:bg-gray-50",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-0.5 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#0b3d91]" /></div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <CreditCard size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">কোনো কিস্তি প্ল্যান নেই</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {plans.map((p) => {
              const sm = STATUS_META[p.status] || STATUS_META.active;
              const progress = p.months > 0 ? Math.round((p.paidCount / p.months) * 100) : 0;
              return (
                <Link
                  key={p.planCode}
                  href={`/installments/${p.planCode}`}
                  className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3.5 flex flex-col gap-2.5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-black text-gray-900 dark:text-white truncate">{p.customerName}</p>
                      <p className="text-xs text-gray-500 truncate">{p.customerPhone}</p>
                    </div>
                    <span className={clsx("shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded-full border", sm.cls)}>{sm.label}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-gray-500">{p.planCode}</span>
                    <span className="text-gray-600 dark:text-gray-300 truncate ml-2">{p.productModel}</span>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                      <span>{p.paidCount}/{p.months} কিস্তি</span>
                      <span>বাকি {bdt(p.remainingAmount)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className={clsx("h-full rounded-full", p.status === "completed" ? "bg-emerald-500" : "bg-[#1f7cf0]")} style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-0.5 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="text-[11px] text-gray-500">মাসিক</span>
                    <span className="font-black text-[#0b3d91] dark:text-blue-300">{bdt(p.monthlyAmount)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showCreate && <CreateInstallmentModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

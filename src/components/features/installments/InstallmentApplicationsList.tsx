"use client";

import { formatDate } from "@/utils";
import clsx from "clsx";
import { ChevronRight, ClipboardList, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review: { label: "পর্যালোচনায়", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  approved: { label: "অনুমোদিত", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700 border-red-200" },
};

const FILTERS = [
  { value: "", label: "সব" },
  { value: "pending", label: "অপেক্ষমান" },
  { value: "under_review", label: "পর্যালোচনায়" },
  { value: "approved", label: "অনুমোদিত" },
  { value: "rejected", label: "প্রত্যাখ্যাত" },
];

// Human-readable category labels for the stored productType codes.
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  fridge: "ফ্রিজ",
  ac: "এসি",
  tv: "টিভি",
  oven: "ওভেন",
  washing_machine: "ওয়াশিং মেশিন",
  mobile: "মোবাইল",
  ips: "আই পি এস",
  battery: "ব্যাটারি",
  ips_package: "আই পি এস প্যাকেজ",
  stabilizer: "স্ট্যাবিলাইজার",
  blender: "ব্লেন্ডার",
  others: "অন্যান্য",
};

/** Category label: free-text "others" value wins, else the mapped type label. */
function categoryLabel(a: any): string | null {
  if (a.productType === "others" && a.productTypeOther) return a.productTypeOther;
  if (a.productType) return PRODUCT_TYPE_LABELS[a.productType] || a.productType;
  return a.productTypeOther || null;
}

export default function InstallmentApplicationsList({ apps }: { apps: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("query") || "");

  const push = (key: string, val: string) => {
    const p = new URLSearchParams(sp.toString());
    if (val) p.set(key, val);
    else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ClipboardList size={20} className="text-[#0b3d91]" />
          <h1 className="text-lg font-black text-gray-900">কিস্তি আবেদন</h1>
          <span className="text-xs font-bold text-gray-400">({apps.length})</span>
        </div>
        <Link href="/installments" className="text-xs font-bold text-[#0b3d91] hover:underline">← কিস্তি তালিকা</Link>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && push("query", query)}
            placeholder="কোড, নাম, ফোন..."
            className="__input pl-9"
          />
        </div>
        <select
          value={sp.get("status") || ""}
          onChange={(e) => push("status", e.target.value)}
          className="__input w-auto min-w-[130px]"
        >
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-auto flex-1 rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="text-left font-semibold px-3 py-2.5">কোড</th>
              <th className="text-left font-semibold px-3 py-2.5">গ্রাহক</th>
              <th className="text-left font-semibold px-3 py-2.5">পণ্য</th>
              <th className="text-left font-semibold px-3 py-2.5">তারিখ</th>
              <th className="text-center font-semibold px-3 py-2.5">অবস্থা</th>
              <th className="text-right font-semibold px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {apps.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">কোনো আবেদন নেই</td></tr>
            ) : (
              apps.map((a) => {
                const sm = STATUS_META[a.status] || STATUS_META.pending;
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono font-bold text-xs">{a.applicationCode}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold">{a.customerName}</p>
                      <p className="text-xs text-gray-400">{a.customerPhone}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold">
                        {a.productBrand ? `${a.productBrand} ` : ""}{a.productModel}
                      </p>
                      {(categoryLabel(a) || a.productSpec) && (
                        <p className="text-xs text-gray-500">
                          {[categoryLabel(a), a.productSpec].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">{formatDate(a.createdAt)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", sm.cls)}>{sm.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Link href={`/installments/applications/${a.applicationCode}`} className="inline-flex items-center gap-1 text-xs font-bold text-[#0b3d91] hover:underline">
                        দেখুন<ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

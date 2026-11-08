"use client";

import { reviewRechargeRequest } from "@/actions/rechargeActions";
import { Modal } from "@/components/ui";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { Ban, CheckCircle2, Loader2, Search, Smartphone } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  processing: { label: "প্রক্রিয়াধীন", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  completed: { label: "সম্পন্ন", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700 border-red-200" },
};

const OPERATORS: Record<string, string> = {
  grameenphone: "Grameenphone",
  banglalink: "Banglalink",
  robi: "Robi",
  airtel: "Airtel",
  teletalk: "Teletalk",
};

const FILTERS = [
  { value: "", label: "সব" },
  { value: "pending", label: "অপেক্ষমান" },
  { value: "completed", label: "সম্পন্ন" },
  { value: "rejected", label: "প্রত্যাখ্যাত" },
];

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export default function RechargeRequestsClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [query, setQuery] = useState(sp.get("query") || "");

  // Action state
  const [target, setTarget] = useState<any>(null);
  const [actionType, setActionType] = useState<"complete" | "reject">("complete");
  const [rejectReason, setRejectReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const push = (key: string, val: string) => {
    const p = new URLSearchParams(sp.toString());
    if (val) p.set(key, val);
    else p.delete(key);
    router.push(`${pathname}?${p.toString()}`);
  };

  const handleAction = async () => {
    if (!target) return;
    setSaving(true);
    const res = await reviewRechargeRequest(target.requestCode, actionType, {
      rejectReason: actionType === "reject" ? rejectReason : undefined,
      adminNotes: adminNotes || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success(res.message);
      setTarget(null);
      setRejectReason("");
      setAdminNotes("");
      router.refresh();
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Smartphone size={20} className="text-[#0b3d91]" />
          <h1 className="text-lg font-black text-gray-900">মোবাইল রিচার্জ</h1>
          <span className="text-xs font-bold text-gray-400">({requests.length})</span>
        </div>
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
              <th className="text-left font-semibold px-3 py-2.5">রিচার্জ নম্বর</th>
              <th className="text-left font-semibold px-3 py-2.5">অপারেটর</th>
              <th className="text-right font-semibold px-3 py-2.5">পরিমাণ</th>
              <th className="text-left font-semibold px-3 py-2.5">তারিখ</th>
              <th className="text-center font-semibold px-3 py-2.5">অবস্থা</th>
              <th className="text-right font-semibold px-3 py-2.5">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">কোনো অনুরোধ নেই</td></tr>
            ) : (
              requests.map((r) => {
                const sm = STATUS_META[r.status] || STATUS_META.pending;
                const isPending = r.status === "pending" || r.status === "processing";
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono font-bold text-xs">{r.requestCode}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-bold">{r.customerName}</p>
                      <p className="text-xs text-gray-400">{r.customerPhone}</p>
                    </td>
                    <td className="px-3 py-2.5 font-semibold font-mono">{r.rechargePhone}</td>
                    <td className="px-3 py-2.5 font-semibold">{OPERATORS[r.operator] || r.operator}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{bdt(r.amount)}</td>
                    <td className="px-3 py-2.5 text-gray-500">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={clsx("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", sm.cls)}>{sm.label}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {isPending ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => { setTarget(r); setActionType("complete"); }} className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-md inline-flex items-center gap-1"><CheckCircle2 size={13} />সম্পন্ন</button>
                          <button onClick={() => { setTarget(r); setActionType("reject"); }} className="text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-md border border-red-200 inline-flex items-center gap-1"><Ban size={13} />বাতিল</button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action modal */}
      {target && (
        <Modal isVisible title={actionType === "complete" ? `রিচার্জ সম্পন্ন — ${target.requestCode}` : `রিচার্জ প্রত্যাখ্যান — ${target.requestCode}`} onClose={() => setTarget(null)}>
          <div className="space-y-3 max-w-sm">
            <div className="rounded-md bg-gray-50 border border-gray-200 p-3 text-sm space-y-1">
              <p><span className="text-gray-400">নম্বর:</span> <b className="font-mono">{target.rechargePhone}</b></p>
              <p><span className="text-gray-400">অপারেটর:</span> <b>{OPERATORS[target.operator]}</b></p>
              <p><span className="text-gray-400">পরিমাণ:</span> <b className="text-[#0b3d91]">{bdt(target.amount)}</b></p>
              <p><span className="text-gray-400">গ্রাহক:</span> <b>{target.customerName}</b> ({target.customerPhone})</p>
            </div>

            {actionType === "complete" ? (
              <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700">
                <p className="font-bold">রিচার্জ সম্পন্ন হলে গ্রাহকের রেফারেল ব্যালেন্স থেকে {bdt(target.amount)} কর্তন করা হবে।</p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-gray-500">প্রত্যাখ্যানের কারণ</label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} className="__input resize-none" placeholder="কারণ লিখুন..." />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500">অ্যাডমিন নোট (ঐচ্ছিক)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="__input resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setTarget(null)} className="px-4 py-2 rounded-md hover:bg-gray-100">বাতিল</button>
              <button
                disabled={saving}
                onClick={handleAction}
                className={clsx(
                  "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2",
                  actionType === "complete" ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700",
                )}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "সেভ হচ্ছে..." : actionType === "complete" ? "সম্পন্ন করুন" : "প্রত্যাখ্যান করুন"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

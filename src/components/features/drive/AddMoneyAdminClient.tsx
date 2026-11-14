"use client";

import { reviewAddMoneyRequest } from "@/actions/driveBalanceActions";
import clsx from "clsx";
import { CheckCircle2, Clock, Loader2, Phone, Search, Wallet, X, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "যাচাই চলছে", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "অনুমোদিত", cls: "bg-green-50 text-green-700 border-green-200" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700 border-red-200" },
};

const METHOD_LABEL: Record<string, string> = { bkash: "bKash", nagad: "Nagad", rocket: "Rocket" };

const STATUS_TABS = [
  { key: "", label: "সব" },
  { key: "pending", label: "যাচাই চলছে" },
  { key: "approved", label: "অনুমোদিত" },
  { key: "rejected", label: "প্রত্যাখ্যাত" },
];

export default function AddMoneyAdminClient({ requests }: { requests: any[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const activeStatus = sp.get("status") || "";
  const [q, setQ] = useState(sp.get("query") || "");

  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const runSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("query", q.trim());
    if (activeStatus) params.set("status", activeStatus);
    router.push(`/drive-add-money${params.toString() ? `?${params}` : ""}`);
  };

  const setStatus = (status: string) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("query", q.trim());
    if (status) params.set("status", status);
    router.push(`/drive-add-money${params.toString() ? `?${params}` : ""}`);
  };

  const approve = async (code: string) => {
    setProcessing(code);
    const res = await reviewAddMoneyRequest(code, "approve");
    setProcessing(null);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message || "আপডেট করা যায়নি");
    }
  };

  const reject = async () => {
    if (!rejectFor) return;
    setProcessing(rejectFor.requestCode);
    const res = await reviewAddMoneyRequest(rejectFor.requestCode, "reject", {
      rejectReason: rejectReason.trim() || undefined,
    });
    setProcessing(null);
    setRejectFor(null);
    setRejectReason("");
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message || "আপডেট করা যায়নি");
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center gap-2.5">
        <span className="size-10 rounded-lg bg-[#0b3d91] text-white flex items-center justify-center shrink-0">
          <Wallet size={20} />
        </span>
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">অ্যাড মানি অনুরোধ</h1>
          <p className="text-xs font-semibold text-gray-500">ড্রাইভ ব্যালেন্সে টাকা যোগের অনুরোধ যাচাই ও অনুমোদন করুন</p>
        </div>
      </div>

      {/* Search + status filter */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="কোড / নাম / ফোন / TrxID খুঁজুন"
              className="w-full h-10 rounded-lg border border-gray-200 pl-9 pr-3 text-sm font-semibold focus:border-[#0b3d91] focus:outline-none"
            />
          </div>
          <button onClick={runSearch} className="h-10 px-4 rounded-lg bg-[#0b3d91] text-white text-sm font-extrabold">খুঁজুন</button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatus(t.key)}
              className={clsx(
                "shrink-0 h-8 px-3.5 rounded-full border text-xs font-extrabold transition-colors",
                activeStatus === t.key ? "bg-[#0b3d91] text-white border-[#0b3d91]" : "bg-white text-gray-500 border-gray-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl bg-white border border-dashed border-gray-200 p-10 text-center flex flex-col items-center gap-2">
          <span className="size-14 rounded-full bg-gray-50 flex items-center justify-center"><Wallet className="text-gray-300" size={28} /></span>
          <p className="text-sm font-extrabold text-gray-700">কোনো অ্যাড মানি অনুরোধ নেই</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {requests.map((r) => {
            const st = STATUS[r.status] || STATUS.pending;
            const busy = processing === r.requestCode;
            return (
              <div key={r.id} className="rounded-xl bg-white border border-gray-200 p-3.5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-gray-900 truncate">{r.customerName}</p>
                    <p className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                      <Phone size={11} /> {r.customerPhone} · <span className="font-mono">{r.customerId}</span>
                    </p>
                  </div>
                  <span className={clsx("shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full border", st.cls)}>{st.label}</span>
                </div>

                <div className="rounded-lg bg-[#f6f8fc] border border-gray-100 p-2.5 flex items-center justify-between">
                  <span className="text-2xl font-black text-[#0b3d91]">{bdt(Number(r.amount))}</span>
                  <span className="text-xs font-extrabold text-gray-600 uppercase bg-white border border-gray-200 px-2 py-1 rounded-md">{METHOD_LABEL[r.method] || r.method}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                  <div>
                    <p className="font-semibold text-gray-400">প্রেরকের নম্বর</p>
                    <p className="font-bold text-gray-800 font-mono">{r.senderNumber}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400">ট্রানজেকশন আইডি</p>
                    <p className="font-bold text-gray-800 font-mono break-all">{r.transactionId}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400">কোড</p>
                    <p className="font-bold text-gray-800 font-mono">{r.requestCode}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-400">সময়</p>
                    <p className="font-bold text-gray-800">{new Date(r.createdAt).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </div>

                {r.note && <p className="text-[11.5px] text-gray-600 bg-gray-50 rounded-md px-2.5 py-1.5"><b>নোট:</b> {r.note}</p>}
                {r.status === "rejected" && r.rejectReason && (
                  <p className="text-[11.5px] text-red-600 bg-red-50 border border-red-100 rounded-md px-2.5 py-1.5"><b>কারণ:</b> {r.rejectReason}</p>
                )}

                {r.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => approve(r.requestCode)}
                      disabled={busy}
                      className="flex-[2] h-10 rounded-lg bg-green-600 text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      অনুমোদন ও ব্যালেন্স যোগ
                    </button>
                    <button
                      onClick={() => setRejectFor(r)}
                      disabled={busy}
                      className="flex-1 h-10 rounded-lg border border-red-200 text-red-600 text-[13px] font-extrabold inline-flex items-center justify-center gap-1 disabled:opacity-60"
                    >
                      <XCircle size={15} /> বাতিল
                    </button>
                  </div>
                )}
                {r.status !== "pending" && r.processedAt && (
                  <p className="text-[10.5px] font-semibold text-gray-400 flex items-center gap-1">
                    <Clock size={11} /> {new Date(r.processedAt).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })} এ প্রক্রিয়া
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={() => !processing && setRejectFor(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-4 flex flex-col gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-base font-extrabold text-gray-900">অনুরোধ বাতিল</p>
              <button onClick={() => setRejectFor(null)} className="size-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16} /></button>
            </div>
            <p className="text-[12.5px] font-semibold text-gray-600">
              <b>{rejectFor.customerName}</b> এর <b>{bdt(Number(rejectFor.amount))}</b> অনুরোধ বাতিল করবেন? (ব্যালেন্স যোগ হবে না)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              placeholder="বাতিলের কারণ (ঐচ্ছিক)"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold focus:border-[#0b3d91] focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setRejectFor(null)} className="flex-1 h-10 rounded-lg border border-gray-200 text-gray-600 text-[13px] font-extrabold">ফিরে যান</button>
              <button
                onClick={reject}
                disabled={!!processing}
                className="flex-1 h-10 rounded-lg bg-red-600 text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {processing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} বাতিল করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

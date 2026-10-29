"use client";

import {
  decideSellerPaymentRequest,
  getSellerOutstandingDues,
  recordSellerDuePayment,
} from "@/actions";
import { Modal, Spinner } from "@/components/ui";
import clsx from "clsx";
import { AlertCircle, CheckCircle2, PlusCircle, Search, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "react-toastify";

const METHODS = ["cash", "bkash", "nagad", "rocket", "bank"] as const;
const money = (n: number) => `৳${Math.round(Number(n) || 0).toLocaleString()}`;

const statusChip = (status: string) =>
  clsx(
    "px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
    status === "approved" && "bg-green-100 text-green-700",
    status === "requested" && "bg-blue-100 text-blue-700",
    status === "rejected" && "bg-red-100 text-red-700",
  );

type DueOption = { targetRef: string; label: string; remaining: number };

export default function SellerPaymentAdminList({
  requests,
  sellersWithDues,
}: {
  requests: any[];
  sellersWithDues: { sellerId: string; name: string; totalDue: number }[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Approve / reject modal
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");

  // Manual record modal
  const [manualOpen, setManualOpen] = useState(false);
  const [mSeller, setMSeller] = useState("");
  const [mType, setMType] = useState<"purchase" | "service_charge">("purchase");
  const [mDues, setMDues] = useState<{ purchaseDues: DueOption[]; serviceDues: DueOption[] } | null>(null);
  const [mLoadingDues, setMLoadingDues] = useState(false);
  const [mTarget, setMTarget] = useState("");
  const [mAmount, setMAmount] = useState("");
  const [mMethod, setMMethod] = useState("cash");
  const [mNote, setMNote] = useState("");

  const filtered = requests.filter((r) => {
    const t = query.trim().toLowerCase();
    if (!t) return true;
    return [r.requestId, r.seller?.shopName, r.seller?.ownerName, r.sellerId, r.targetLabel, r.transactionId]
      .some((v: string) => v?.toLowerCase?.().includes(t));
  });

  const decide = (action: "approve" | "reject") => {
    if (!selected) return;
    startTransition(async () => {
      const res = await decideSellerPaymentRequest(selected.id, { action, adminNote: adminNote || undefined });
      toast(res.message, { type: res.success ? "success" : "error" });
      if (res.success) {
        setSelected(null);
        setAdminNote("");
        router.refresh();
      }
    });
  };

  // Load the chosen seller's outstanding dues for the manual-record picker.
  useEffect(() => {
    if (!manualOpen || !mSeller) {
      setMDues(null);
      setMTarget("");
      return;
    }
    setMLoadingDues(true);
    getSellerOutstandingDues(mSeller).then((res) => {
      setMLoadingDues(false);
      if (res.success) setMDues(res.data);
      else toast.error(res.message);
    });
  }, [manualOpen, mSeller]);

  const currentDueList: DueOption[] = mType === "purchase" ? mDues?.purchaseDues ?? [] : mDues?.serviceDues ?? [];
  const chosenDue = currentDueList.find((d) => d.targetRef === mTarget);

  // Default the amount to the chosen due's remaining.
  useEffect(() => {
    if (chosenDue) setMAmount(String(Math.round(chosenDue.remaining)));
  }, [mTarget]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitManual = () => {
    const amt = Number(mAmount);
    if (!mSeller) return toast.error("সেলার নির্বাচন করুন");
    if (!mTarget) return toast.error("বকেয়া নির্বাচন করুন");
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("সঠিক পরিমাণ দিন");
    startTransition(async () => {
      const res = await recordSellerDuePayment({
        sellerId: mSeller,
        targetType: mType,
        targetRef: mTarget,
        amount: amt,
        paymentMethod: mMethod,
        note: mNote || undefined,
      });
      toast(res.message, { type: res.success ? "success" : "error" });
      if (res.success) {
        setManualOpen(false);
        setMSeller("");
        setMTarget("");
        setMAmount("");
        setMNote("");
        router.refresh();
      }
    });
  };

  const pendingCount = requests.filter((r) => r.status === "requested").length;

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by seller, request ID, product or TrxID..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-amber-600">{pendingCount} pending</span>
          <button
            onClick={() => setManualOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl bg-brand text-white text-sm font-bold"
          >
            <PlusCircle className="size-4" />
            ম্যানুয়াল পেমেন্ট
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto min-h-[300px]">
        <table className="w-full text-sm text-left min-w-[900px] whitespace-nowrap">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-5 py-3 font-bold text-gray-700">Request</th>
              <th className="px-5 py-3 font-bold text-gray-700">Seller</th>
              <th className="px-5 py-3 font-bold text-gray-700">For</th>
              <th className="px-5 py-3 font-bold text-gray-700">Payment Info</th>
              <th className="px-5 py-3 font-bold text-gray-700 text-right">Amount</th>
              <th className="px-5 py-3 font-bold text-gray-700 text-right">Status</th>
              <th className="px-5 py-3 font-bold text-gray-700 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <AlertCircle className="size-8" />
                    <span>No seller payments found</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3">
                    <p className="font-bold text-gray-800">{r.requestId}</p>
                    <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-bold text-gray-800">{r.seller?.shopName || r.seller?.ownerName || r.sellerId}</p>
                    <p className="text-xs text-gray-500">{r.sellerId}{r.seller?.phone ? ` · ${r.seller.phone}` : ""}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-700">{r.targetType === "purchase" ? "মালের বাকি" : "সার্ভিস চার্জ"}</p>
                    <p className="text-xs text-gray-500">{r.targetLabel}{r.targetRef2 ? ` · ${r.targetRef2}` : ""}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-700 uppercase">{r.paymentMethod}</p>
                    <p className="text-xs text-brand font-mono">
                      {r.senderNumber || "—"}{r.transactionId ? ` · ${r.transactionId}` : ""}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-right font-bold text-gray-800">{money(r.amount)}</td>
                  <td className="px-5 py-3 text-right"><span className={statusChip(r.status)}>{r.status}</span></td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "requested" ? (
                      <button
                        onClick={() => setSelected(r)}
                        className="h-8 px-3 rounded-lg bg-brand/10 text-brand text-xs font-bold hover:bg-brand/20"
                      >
                        যাচাই করুন
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium">{r.adminNote ? r.adminNote : "Processed"}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approve / reject */}
      {selected && (
        <Modal isVisible title={`পেমেন্ট যাচাই — ${selected.requestId}`} onClose={() => setSelected(null)} width="500">
          <div className="space-y-4 pt-2">
            <div className="bg-brand/5 p-4 rounded-xl border border-brand/10 space-y-2 text-sm">
              <Row k="সেলার" v={`${selected.seller?.shopName || selected.sellerId}`} />
              <Row k="বাবদ" v={`${selected.targetType === "purchase" ? "মালের বাকি" : "সার্ভিস চার্জ"} — ${selected.targetLabel}`} />
              {selected.targetRemaining != null && <Row k="বর্তমান বাকি" v={money(selected.targetRemaining)} />}
              <Row k="পরিমাণ" v={money(selected.amount)} bold />
              <Row k="মাধ্যম" v={String(selected.paymentMethod).toUpperCase()} />
              <Row k="সেন্ডার নম্বর" v={selected.senderNumber || "—"} />
              <Row k="ট্রানজেকশন আইডি" v={selected.transactionId || "—"} />
              {selected.note && <Row k="সেলারের নোট" v={selected.note} />}
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Admin Note (Optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="মন্তব্য / বাতিলের কারণ..."
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-brand/20 h-20 resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => decide("reject")}
                disabled={isPending}
                className="h-11 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <XCircle className="size-5" />
                বাতিল
              </button>
              <button
                onClick={() => decide("approve")}
                disabled={isPending}
                className="h-11 rounded-xl font-bold bg-brand text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPending ? <Spinner className="invert" /> : <><CheckCircle2 className="size-5" />অনুমোদন (পেইড)</>}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual record */}
      {manualOpen && (
        <Modal isVisible title="ম্যানুয়াল পেমেন্ট রেকর্ড" onClose={() => setManualOpen(false)} width="500">
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">সেলার</label>
              <select
                value={mSeller}
                onChange={(e) => { setMSeller(e.target.value); setMTarget(""); }}
                className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              >
                <option value="">— সেলার নির্বাচন করুন (বকেয়া আছে) —</option>
                {sellersWithDues.map((s) => (
                  <option key={s.sellerId} value={s.sellerId}>{s.name} · বাকি {money(s.totalDue)}</option>
                ))}
              </select>
            </div>

            {mSeller && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {(["purchase", "service_charge"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => { setMType(t); setMTarget(""); }}
                      className={clsx(
                        "h-10 rounded-xl text-sm font-bold border",
                        mType === t ? "bg-brand text-white border-brand" : "bg-white text-gray-700 border-gray-200",
                      )}
                    >
                      {t === "purchase" ? "মালের বাকি" : "সার্ভিস চার্জ"}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">বকেয়া</label>
                  {mLoadingDues ? (
                    <div className="py-3 flex justify-center"><Spinner /></div>
                  ) : (
                    <select
                      value={mTarget}
                      onChange={(e) => setMTarget(e.target.value)}
                      className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    >
                      <option value="">— বকেয়া নির্বাচন করুন —</option>
                      {currentDueList.map((d) => (
                        <option key={d.targetRef} value={d.targetRef}>{d.label} · বাকি {money(d.remaining)}</option>
                      ))}
                    </select>
                  )}
                  {!mLoadingDues && currentDueList.length === 0 && (
                    <p className="text-xs text-gray-400 mt-1">এই ধরনের কোনো বকেয়া নেই</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">পরিমাণ (৳)</label>
                    <input
                      value={mAmount}
                      onChange={(e) => setMAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                      inputMode="decimal"
                      className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">মাধ্যম</label>
                    <select
                      value={mMethod}
                      onChange={(e) => setMMethod(e.target.value)}
                      className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none uppercase"
                    >
                      {METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1.5 block">নোট (ঐচ্ছিক)</label>
                  <input
                    value={mNote}
                    onChange={(e) => setMNote(e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>

                <button
                  onClick={submitManual}
                  disabled={isPending}
                  className="w-full h-11 rounded-xl font-bold bg-brand text-white shadow-lg shadow-brand/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Spinner className="invert" /> : <><CheckCircle2 className="size-5" />পেমেন্ট রেকর্ড করুন</>}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{k}:</span>
      <span className={clsx("text-right", bold ? "font-bold text-gray-900" : "font-semibold text-gray-700")}>{v}</span>
    </div>
  );
}

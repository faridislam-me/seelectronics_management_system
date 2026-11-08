"use client";

import { requestMobileRecharge, getMyRechargeRequests } from "@/actions/rechargeActions";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, Clock, Loader2, Smartphone, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useReferral } from "../_components/ReferralProvider";

const OPERATORS = [
  { value: "grameenphone", label: "Grameenphone", color: "text-[#00a550]" },
  { value: "banglalink", label: "Banglalink", color: "text-[#f7941d]" },
  { value: "robi", label: "Robi", color: "text-[#e2001a]" },
  { value: "airtel", label: "Airtel", color: "text-[#e40000]" },
  { value: "teletalk", label: "Teletalk", color: "text-[#0066b3]" },
];

const STATUS_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700", icon: Clock },
  processing: { label: "প্রক্রিয়াধীন", cls: "bg-blue-50 text-blue-700", icon: Clock },
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42]", icon: CheckCircle2 },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700", icon: XCircle },
};

export default function MobileRechargePage() {
  const router = useRouter();
  const { data } = useReferral();
  const balance = Number(data.balance || 0);

  const [rechargePhone, setRechargePhone] = useState("");
  const [operator, setOperator] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    getMyRechargeRequests().then((res) => {
      if (res.success && Array.isArray(res.data)) setRequests(res.data);
    });
  }, []);

  const handleSubmit = async () => {
    if (!rechargePhone.trim()) { toast.error("রিচার্জ নম্বর দিন"); return; }
    if (!operator) { toast.error("অপারেটর নির্বাচন করুন"); return; }
    const amt = Number(amount);
    if (!amt || amt < 10) { toast.error("ন্যূনতম ৳১০"); return; }
    if (amt > balance) { toast.error("অপর্যাপ্ত ব্যালেন্স"); return; }

    setLoading(true);
    const res = await requestMobileRecharge({
      rechargePhone: rechargePhone.trim(),
      operator,
      amount: amt,
    });
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setRechargePhone("");
      setOperator("");
      setAmount("");
      router.refresh();
      // Refresh list
      const updated = await getMyRechargeRequests();
      if (updated.success && Array.isArray(updated.data)) setRequests(updated.data);
    } else {
      toast.error(res.message);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/referral" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="flex flex-col leading-tight">
          <span className="text-[16px] font-extrabold">মোবাইল রিচার্জ</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">রেফারেল ব্যালেন্স থেকে রিচার্জ করুন</span>
        </span>
      </div>

      {/* Balance banner */}
      <div className="rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Smartphone size={22} /></span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">ব্যবহারযোগ্য ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">৳{balance.toLocaleString("en-IN")}</span>
        </span>
      </div>

      {/* Form */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">রিচার্জ নম্বর *</label>
          <input
            value={rechargePhone}
            onChange={(e) => setRechargePhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">অপারেটর *</label>
          <div className="grid grid-cols-3 gap-1.5">
            {OPERATORS.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => setOperator(op.value)}
                className={clsx(
                  "h-9 rounded-md border text-[11px] font-extrabold transition-colors",
                  operator === op.value
                    ? "border-[#0b3d91] bg-[#e8f1ff] text-[#0b3d91]"
                    : "border-[#dfe6f2] bg-white text-[#5b6784] hover:bg-[#f5f7fb]",
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">পরিমাণ (৳) *</label>
          <input
            type="number"
            min="10"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ন্যূনতম ৳১০"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <Smartphone size={18} />}
          {loading ? "জমা হচ্ছে..." : "রিচার্জ অনুরোধ করুন"}
        </button>
      </div>

      {/* Previous requests */}
      {requests.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[14px] font-extrabold">আগের অনুরোধ</span>
          {requests.map((r) => {
            const sm = STATUS_META[r.status] || STATUS_META.pending;
            const Icon = sm.icon;
            return (
              <div key={r.id} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
                <span className={clsx("size-10 rounded-full flex items-center justify-center shrink-0", sm.cls)}><Icon size={18} /></span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className="text-[13px] font-extrabold">{r.rechargePhone} · {OPERATORS.find((o) => o.value === r.operator)?.label || r.operator}</span>
                  <span className="text-[11px] font-semibold text-[#5b6784]">{formatDate(r.createdAt)} · {r.requestCode}</span>
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

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        অনুরোধ জমা দেওয়ার পর অ্যাডমিন ম্যানুয়ালি রিচার্জ করে সম্পন্ন করবেন।
      </p>
    </>
  );
}

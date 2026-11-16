"use client";

import { requestStaffMobileRecharge } from "@/actions/staffRechargeActions";
import OperatorIcon, { OPERATOR_META } from "@/components/features/recharge/OperatorIcon";
import clsx from "clsx";
import { AlertTriangle, ArrowLeft, CheckCircle2, Copy, Loader2, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const OPERATOR_KEYS = ["grameenphone", "banglalink", "robi", "airtel", "teletalk", "skitto"];
const QUICK = [20, 50, 100, 200, 500, 1000];

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

type SuccessResult = {
  phone: string;
  operator: string;
  operatorKey: string;
  amount: number;
  trxId: string;
  newBalance: number;
  time: string;
};

export default function StaffRechargeFlow({ initialBalance }: { initialBalance: number }) {
  const router = useRouter();
  const [balance, setBalance] = useState(initialBalance);
  const [operator, setOperator] = useState("grameenphone");
  const [rechargePhone, setRechargePhone] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessResult | null>(null);
  const [insufficient, setInsufficient] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const doRecharge = async () => {
    const amt = Number(amount);
    if (!rechargePhone.trim()) return toast.error("রিচার্জ নম্বর দিন");
    if (!amt || amt < 20) return toast.error("ন্যূনতম ৳২০");
    if (amt > balance) {
      setInsufficient(amt);
      return;
    }
    setSubmitting(true);
    const res = await requestStaffMobileRecharge({ rechargePhone: rechargePhone.trim(), operator, amount: amt });
    setSubmitting(false);
    if (res.success && "detail" in res && res.detail) {
      setSuccess(res.detail);
      setBalance(res.detail.newBalance);
      setAmount("");
      router.refresh();
    } else if (!res.success && "code" in res && res.code === "insufficient") {
      setBalance(res.balance);
      setInsufficient(amt);
    } else {
      toast.error(res.message || "রিচার্জ করা যায়নি");
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/staff/payment" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">মোবাইল রিচার্জ</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">আপনার ব্যালেন্স থেকে ইনস্ট্যান্ট রিচার্জ</span>
        </span>
      </div>

      {/* Balance banner */}
      <div className="rounded-md text-white p-3 flex items-center gap-3 bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
        <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
          <Wallet size={22} />
        </span>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[11px] font-semibold text-white/80">ব্যবহারযোগ্য ব্যালেন্স</span>
          <span className="text-[22px] font-extrabold">{bdt(balance)}</span>
        </span>
      </div>

      {/* Operator tabs */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div className="grid grid-cols-6 gap-1.5">
          {OPERATOR_KEYS.map((key) => {
            const active = operator === key;
            const color = OPERATOR_META[key]?.color || "#0b3d91";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setOperator(key)}
                className={clsx("flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all", active ? "border-transparent" : "border-[#dfe6f2] bg-white hover:bg-[#f5f7fb]")}
                style={active ? { backgroundColor: `${color}14`, borderColor: color } : undefined}
              >
                <OperatorIcon operatorKey={key} size={32} shape="circle" />
                <span className="text-[8.5px] font-bold leading-none text-center" style={{ color: active ? color : "#5b6784" }}>
                  {OPERATOR_META[key]?.labelBn || key}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Phone + amount */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">রিচার্জ নম্বর *</label>
          <input
            value={rechargePhone}
            onChange={(e) => setRechargePhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            inputMode="numeric"
            className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">পরিমাণ (৳) *</label>
          <input
            type="number"
            min="20"
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="ন্যূনতম ৳২০"
            className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(String(q))}
                className="h-8 px-3 rounded-full border border-[#dfe6f2] bg-white text-[12px] font-extrabold text-[#0b3d91] hover:bg-[#eef3fb]"
              >
                ৳{q}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={doRecharge}
          disabled={submitting}
          className="w-full h-12 rounded-md text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 bg-[#0b3d91] shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
          {submitting ? "রিচার্জ হচ্ছে..." : "রিচার্জ করুন"}
        </button>
      </div>

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        রিচার্জ স্বয়ংক্রিয়ভাবে প্রক্রিয়া হবে এবং আপনার ব্যালেন্স থেকে কর্তন করা হবে।
      </p>

      {/* Insufficient popup */}
      {insufficient !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5" onClick={() => setInsufficient(null)}>
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="size-16 rounded-full bg-[#fdeaed] flex items-center justify-center">
              <AlertTriangle size={34} className="text-[#c81f38]" />
            </span>
            <p className="text-[18px] font-extrabold text-[#c81f38]">অপর্যাপ্ত ব্যালেন্স</p>
            <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">
              আপনি যে পরিমাণ রিচার্জ করতে চাচ্ছেন, বর্তমানে আপনার ব্যালেন্সে পর্যাপ্ত নেই।
            </p>
            <div className="w-full rounded-md bg-[#f6f8fc] border border-[#e4e9f2] px-3 py-2 flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#5b6784]">ব্যবহারযোগ্য ব্যালেন্স</span>
              <span className="text-[#0f1729]">{bdt(balance)}</span>
            </div>
            <div className="w-full rounded-md bg-[#fdeaed] border border-[#f7c3ca] px-3 py-2 flex items-center justify-between text-[12px] font-bold">
              <span className="text-[#c81f38]">প্রয়োজন</span>
              <span className="text-[#c81f38]">{bdt(insufficient)}</span>
            </div>
            <button type="button" onClick={() => setInsufficient(null)} className="w-full h-11 rounded-md text-[13px] font-extrabold border bg-white text-[#45506b] border-[#dfe6f2]">
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* Success popup */}
      {success && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#0b3d91] to-[#1f7cf0]">
          <div className="flex flex-col items-center pt-10 pb-6 px-4">
            <div className="size-20 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.4)]"><CheckCircle2 size={44} className="text-white" /></div>
            <p className="text-[22px] font-extrabold text-white mt-4">আপনার রিচার্জ</p>
            <p className="text-[20px] font-extrabold text-[#22c55e]">সফল হয়েছে</p>
          </div>
          <div className="flex-1 px-4 pb-4 overflow-auto">
            <div className="rounded-xl bg-white p-4 flex items-center gap-3 shadow-lg">
              <OperatorIcon operatorKey={success.operatorKey} size={48} shape="circle" />
              <span className="flex flex-col flex-1 min-w-0">
                <span className="text-[15px] font-extrabold text-[#0f1729]">{success.operator}</span>
                <span className="text-[13px] font-semibold text-[#5b6784]">{success.phone}</span>
              </span>
              <span className="shrink-0 text-[11px] font-extrabold text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded-full border border-[#22c55e]/20">সম্পন্ন</span>
            </div>
            <div className="rounded-xl bg-white mt-3 p-4 shadow-lg grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">ট্রানজেকশন আইডি</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <p className="text-[11px] font-bold text-[#0f1729] truncate">{success.trxId}</p>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(success.trxId); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="shrink-0">
                    <Copy size={14} className={copied ? "text-[#22c55e]" : "text-[#b0bdd0]"} />
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">সর্বমোট</p>
                <p className="text-[14px] font-extrabold text-[#0b3d91] mt-0.5">{bdt(success.amount)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">নতুন ব্যালেন্স</p>
                <p className="text-[14px] font-extrabold text-[#0f1729] mt-0.5">{bdt(success.newBalance)}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#5b6784]">সময়</p>
                <p className="text-[12px] font-bold text-[#0f1729] mt-0.5">{new Date(success.time).toLocaleString("bn-BD", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-6 pt-2">
            <button type="button" onClick={() => setSuccess(null)} className="w-full h-12 rounded-xl bg-white text-[#0b3d91] text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-lg">আরেকটি রিচার্জ</button>
          </div>
        </div>
      )}
    </div>
  );
}

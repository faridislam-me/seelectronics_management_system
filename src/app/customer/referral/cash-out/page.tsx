"use client";

import { useState, useTransition } from "react";
import { toast } from "react-toastify";
import { requestReferralPayment } from "@/actions";
import { methodLogos, methodThemes } from "@/components/features/payments/paymentThemes";
import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, CircleCheckBig, History, Phone, StickyNote, Wallet, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useReferral } from "../_components/ReferralProvider";
import { useRouter } from "next/navigation";

const methods = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
];

export default function CashOutPage() {
  const { data, refetch } = useReferral();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bkash");
  const [walletNumber, setWalletNumber] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTxId, setLastTxId] = useState("");

  const handleRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("সঠিক পরিমাণ দিন");
    if (!walletNumber) return toast.error("ওয়ালেট নম্বর দিন");

    startTransition(async () => {
      const res = await requestReferralPayment({
        amount: Number(amount),
        paymentMethod,
        walletNumber,
        ...(note ? { note } : {}),
      });

      if (res.success) {
        setLastTxId(res.requestId || "TXN" + Date.now().toString().slice(-6));
        setShowSuccessModal(true);
        setAmount("");
        setWalletNumber("");
        await refetch();
      } else {
        toast.error(res.message);
      }
    });
  };

  const theme = methodThemes[paymentMethod] ?? methodThemes.bank;
  const overBalance = !!amount && Number(amount) > data.balance;
  const inputCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white text-[14px] font-semibold text-[#16213a] placeholder:font-medium placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";

  return (
    <>
      {/* Title */}
      <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <Link href="/customer/referral" aria-label="Back" className="size-9 rounded-md bg-[#eef3fb] text-[#0b3d91] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[17px] font-extrabold text-[#0b2a66]">Cash Out Request</span>
          <span className="text-[11.5px] font-semibold text-[#5b6784] truncate">রেফারেল কমিশন উত্তোলন</span>
        </span>
        <Link href="/customer/referral/history" aria-label="History" className="size-9 rounded-md bg-[#f3e9ff] text-[#8b3fe8] flex items-center justify-center shrink-0"><History size={18} /></Link>
      </section>

      {/* AVAILABLE BALANCE */}
      <section className="relative overflow-hidden rounded-md bg-[linear-gradient(115deg,#0a2f70_0%,#1259c9_55%,#1f7cf0_100%)] text-white p-3 flex items-center gap-3 shadow-[0_10px_30px_rgba(10,47,112,0.3)]">
        <span className="absolute -right-8 -top-12 size-36 rounded-full bg-white/10" />
        <span className="relative size-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Wallet size={22} /></span>
        <span className="relative flex flex-col min-w-0 leading-tight">
          <span className="text-[10.5px] font-bold tracking-[2px] text-white/80">AVAILABLE BALANCE</span>
          <span className="text-[clamp(24px,7.5vw,32px)] font-extrabold truncate">
            ৳ {data?.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
          </span>
        </span>
      </section>

      {/* Payout Destination */}
      <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div className="px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7] text-[14px] font-extrabold text-[#0b3d91]">Payout Destination</div>
        <div className="p-2.5 flex flex-col gap-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[12.5px] font-bold">Payment Method</span>
            <div className="grid grid-cols-3 gap-2">
              {methods.map((m) => {
                const t = methodThemes[m.value];
                const active = paymentMethod === m.value;
                return (
                  <button key={m.value} type="button" onClick={() => setPaymentMethod(m.value)} aria-pressed={active}
                    className={clsx("relative h-14 rounded-md border-2 flex flex-col items-center justify-center gap-0.5 transition-all", active ? clsx(t.card, t.border, "shadow-sm") : "bg-white border-[#e6ebf4]")}>
                    {active && <span className={clsx("absolute top-1 right-1 size-4 rounded-full flex items-center justify-center text-white", m.value === "bkash" ? "bg-[#e2136e]" : m.value === "nagad" ? "bg-[#f15a22]" : "bg-[#8c3494]")}><Check size={11} strokeWidth={3.5} /></span>}
                    <Image src={methodLogos[m.value]} alt={m.label} width={28} height={28} className="size-7 object-contain" />
                    <span className={clsx("text-[11.5px] font-extrabold", active ? t.mark : "text-[#3d4a63]")}>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] font-bold">Wallet Number</span>
            <span className="relative">
              <Phone size={16} className={clsx("absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none", theme.mark)} />
              <input type="text" inputMode="tel" value={walletNumber} onChange={(e) => setWalletNumber(e.target.value)} placeholder="e.g. 017XXXXXXXX" className={clsx(inputCls, "pl-9 pr-2.5")} />
            </span>
          </label>
        </div>
      </section>

      {/* Enter Transaction Details */}
      <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <div className="px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7] text-[14px] font-extrabold text-[#0b3d91]">Enter Transaction Details</div>
        <div className="p-2.5 flex flex-col gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] font-bold">Amount (৳)</span>
            <span className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] font-extrabold text-[#1a9c4b] pointer-events-none">৳</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="1" placeholder="0.00" className={clsx(inputCls, "pl-8 pr-2.5", overBalance && "border-[#e0243f] focus:border-[#e0243f] focus:ring-[#e0243f]")} />
            </span>
          </label>
          <label className="relative block">
            <StickyNote size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (Optional)" className={clsx(inputCls, "pl-9 pr-2.5")} />
          </label>
        </div>
      </section>

      {/* Request Payment */}
      <button onClick={() => handleRequest()} disabled={isPending || !amount || Number(amount) > data.balance}
        className="w-full h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none">
        <span>{isPending ? "Sending..." : "Request Payment"}</span>
        {!isPending && <ArrowRight size={17} />}
      </button>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-[#0b3d91]/25 backdrop-blur-[2px] flex items-center justify-center z-[60] p-3">
          <div className="relative bg-white border border-[#dfe6f2] rounded-md p-4 w-full max-w-sm text-center shadow-[0_20px_50px_rgba(11,61,145,0.25)] flex flex-col items-center gap-3">
            <button type="button" aria-label="Close" onClick={() => { setShowSuccessModal(false); router.push("/customer/referral"); }} className="absolute top-2 right-2 size-8 rounded-md text-[#5b6784] flex items-center justify-center"><X size={18} /></button>
            <span className="size-20 rounded-full bg-[#e9f9ef] flex items-center justify-center"><CircleCheckBig size={42} className="text-[#1a9c4b]" /></span>
            <h2 className="text-[20px] font-extrabold text-[#0b2a66]">Request Sent!</h2>
            <p className="text-[13px] text-[#3d4a63] font-medium leading-relaxed">Your cash out request has been successfully sent. They will process it shortly.</p>
            <div className="w-full bg-[#eef4fd] border border-[#dfe8f7] px-3 h-10 rounded-md flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-[#5b6784] uppercase">Request ID</span>
              <span className="text-[#16213a] font-extrabold text-[13px] truncate">{lastTxId}</span>
            </div>
            <div className="w-full grid grid-cols-2 gap-2">
              <button onClick={() => { setShowSuccessModal(false); router.push("/customer/referral"); }} className="h-10 rounded-md font-bold text-[13px] border border-[#dfe6f2] text-[#3d4a63] bg-white active:scale-[0.98] transition-all">Close</button>
              <button onClick={() => { setShowSuccessModal(false); router.push("/customer/referral/history"); }} className="h-10 rounded-md font-bold text-[13px] bg-[#0b3d91] text-white active:scale-[0.98] transition-all">View History</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

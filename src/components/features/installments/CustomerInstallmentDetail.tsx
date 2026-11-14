"use client";

import { Modal } from "@/components/ui";
import { claimInstallmentPayment } from "@/actions/installmentActions";
import { contactDetails, paymentDetails } from "@/constants";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  History,
  Loader2,
  Phone,
  Send,
  Wallet,
} from "lucide-react";
import { productImage } from "@/lib/serviceStatusStyle";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "চলমান", cls: "bg-[#e8f1ff] text-[#1b6fd6]" },
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42]" },
  defaulted: { label: "খেলাপি", cls: "bg-[#fff6e3] text-[#b8620b]" },
  banned: { label: "ব্যান", cls: "bg-[#ffe9ec] text-[#c81f38]" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-500" },
};

const PAY_METHODS = [
  { key: "bkash" as const, label: "bKash", color: "text-[#d1137b]", bg: "bg-[#e2136e]", logo: "/payment-methods/bkash.jpg", number: paymentDetails.bkash.number },
  { key: "nagad" as const, label: "Nagad", color: "text-[#ec1c24]", bg: "bg-[#ec1c24]", logo: "/payment-methods/nagad.jpg", number: paymentDetails.nagad.number },
  { key: "rocket" as const, label: "Rocket", color: "text-[#8a2be2]", bg: "bg-[#8a2be2]", logo: "/payment-methods/rocket.jpg", number: paymentDetails.rocket.number },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "অফিসে নগদ",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "ব্যাংক",
};

// Application approval-journey steps (same order as the apply tracking page),
// shown as the plan's "ট্র্যাকিং" — NOT the payment schedule.
const APP_STEPS: { key: string; label: string }[] = [
  { key: "pending", label: "পেন্ডিং আছে" },
  { key: "processing", label: "প্রসেসিং হচ্ছে" },
  { key: "nid_verify", label: "এনআইডি ভেরিফাই" },
  { key: "address_verify", label: "ঠিকানা যাচাই" },
  { key: "guarantor_verify", label: "জামিনদার ভেরিফাই" },
  { key: "bank_check_verify", label: "ব্যাংক চেক ভেরিফাই" },
  { key: "documents_verified", label: "সকল কাগজপত্র যাচাই সম্পন্ন" },
  { key: "approved", label: "কিস্তির জন্য অনুমোদিত" },
  { key: "ready_for_delivery", label: "পণ্য হস্তান্তরের জন্য প্রস্তুত" },
];

const METHOD_COLORS: Record<string, string> = {
  cash: "text-[#178a42] bg-[#e9f9ef]",
  bkash: "text-[#d1137b] bg-[#fce7f3]",
  nagad: "text-[#ec1c24] bg-[#fee2e2]",
  rocket: "text-[#8a2be2] bg-[#f3e8ff]",
  bank: "text-[#0b3d91] bg-[#e8f1ff]",
};

export default function CustomerInstallmentDetail({ data }: { data: any }) {
  const { plan, schedule, nextDue, productImageUrl } = data;
  const s = STATUS[plan.status] || STATUS.active;
  const [showPay, setShowPay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<typeof PAY_METHODS[number] | null>(null);
  const [txId, setTxId] = useState("");
  const [payNum, setPayNum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const paidSchedules = schedule.filter((r: any) => r.status === "paid");
  // The installment product (brand + model) — shown on each payment-history card
  // next to the method so the customer sees which product the কিস্তি is for.
  const productLabel = [plan.productBrand, plan.productModel].filter(Boolean).join(" ");
  // Hero image: admin-set photo wins, else a real per-type product photo.
  const heroImg = productImageUrl || productImage(plan.productType === "ips_package" ? "ips" : plan.productType);

  // Application approval-journey tracking from the originating application
  // (dated steps), shown as the plan's "ট্র্যাকিং" — NOT the payment schedule.
  const application = data.application;
  const appTracking: { step: string; createdAt: any }[] = data.appTracking || [];
  const stepDates: Record<string, string> = {};
  for (const t of appTracking) {
    if (!stepDates[t.step]) stepDates[t.step] = t.createdAt;
  }
  const currentStepIdx = application ? APP_STEPS.findIndex((s) => s.key === application.trackingStep) : -1;
  // An approved plan's journey is complete at least up to "approved".
  const lastDoneIdx = currentStepIdx >= 0 ? currentStepIdx : APP_STEPS.length - 1;

  const resetPayModal = () => {
    setShowPay(false);
    setSelectedMethod(null);
    setTxId("");
    setPayNum("");
  };

  const handlePaymentClaim = async () => {
    if (!txId.trim() || !payNum.trim() || !selectedMethod || !nextDue) return;
    setSubmitting(true);
    const res = await claimInstallmentPayment({
      planCode: plan.planCode,
      scheduleId: nextDue.id,
      paymentMethod: selectedMethod.key,
      transactionId: txId.trim(),
      paymentNumber: payNum.trim(),
    });
    setSubmitting(false);
    if (res.success) {
      toast.success(res.message);
      resetPayModal();
    } else {
      toast.error(res.message || "জমা দেওয়া যায়নি");
    }
  };

  const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div className="rounded-lg bg-white border border-[#e4e9f2] p-2.5 shadow-[0_3px_10px_rgba(11,61,145,0.05)]">
      <p className="text-[10px] font-semibold text-[#5b6784]">{label}</p>
      <p className={clsx("text-[13.5px] font-extrabold mt-0.5", accent ? "text-[#0b3d91]" : "text-[#16213a]")}>{value}</p>
    </div>
  );

  const HeroStat = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) => (
    <div className="flex flex-col items-center text-center px-1 gap-0.5">
      <span className={clsx("inline-flex", accent ? "text-[#0b3d91]" : "text-[#7b8aa3]")}>{icon}</span>
      <span className="text-[9.5px] font-semibold text-[#5b6784] leading-tight">{label}</span>
      <span className={clsx("text-[12.5px] font-black leading-tight", accent ? "text-[#0b3d91]" : "text-[#16213a]")}>{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/installments" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[16px] font-extrabold truncate">{plan.productModel}</span>
          <span className="text-[11px] font-bold text-[#5b6784] font-mono">{plan.planCode}</span>
        </span>
        <span className={clsx("shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full border", s.cls)}>{s.label}</span>
      </div>

      {/* Hero card — product photo + model/code/status + key figures */}
      <div className="rounded-xl bg-white border border-[#e4e9f2] p-3 shadow-[0_6px_18px_rgba(11,61,145,0.07)]">
        <div className="flex items-center gap-3">
          <span className="size-[80px] rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e9f2] bg-[#f3f8ff] p-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImg} alt={plan.productModel} className="w-full h-full object-contain" />
          </span>
          <div className="flex flex-col min-w-0 flex-1 leading-tight gap-1">
            <span className="text-[19px] font-black truncate">{plan.productModel}</span>
            <span className="text-[12px] font-bold text-[#0b3d91] font-mono">{plan.planCode}</span>
            <span className={clsx("self-start text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-full border", s.cls)}>{s.label}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 mt-3 pt-3 border-t border-[#eef1f6] divide-x divide-[#eef1f6]">
          <HeroStat icon={<Wallet size={16} />} label="ডাউন পেমেন্ট" value={bdt(plan.downPayment)} />
          <HeroStat icon={<CreditCard size={16} />} label="মাসিক কিস্তি" value={bdt(plan.monthlyAmount)} accent />
          <HeroStat icon={<CalendarDays size={16} />} label="মেয়াদ" value={`${plan.months} মাস`} />
        </div>
      </div>

      {/* Key figure cards */}
      <div className="grid grid-cols-3 gap-2">
        <Stat label="মোট (চার্জসহ)" value={bdt(plan.totalPayable)} />
        <Stat label="কিস্তি পরিশোধ" value={`${data.paidCount}/${plan.months}`} accent />
        <Stat label="বাকি" value={bdt(data.remainingAmount)} />
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/pdf/download?type=installment-invoice&id=${plan.planCode}`}
          target="_blank"
          className="flex items-center justify-center gap-1.5 h-10 rounded-lg bg-white border border-[#dfe6f2] text-[#0b3d91] text-[13px] font-extrabold shadow-[0_3px_10px_rgba(11,61,145,0.05)]"
        >
          <Download size={16} /> ইনভয়েস
        </Link>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center justify-center gap-1.5 h-10 rounded-lg bg-white border border-[#dfe6f2] text-[#0b3d91] text-[13px] font-extrabold shadow-[0_3px_10px_rgba(11,61,145,0.05)]"
        >
          <History size={16} /> পেমেন্ট হিস্টোরি
        </button>
      </div>

      {/* Next due / Pay Now */}
      {plan.status === "active" && nextDue && (
        <div className="rounded-xl bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
          <span className="size-11 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Clock size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[11px] font-semibold text-white/85">পরবর্তী কিস্তি (#{nextDue.installmentNo}) — {formatDate(nextDue.dueDate)}</span>
            <span className="text-[20px] font-extrabold">{bdt(nextDue.amount)}</span>
          </span>
          <button onClick={() => setShowPay(true)} className="shrink-0 h-9 px-3 rounded-lg bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center gap-1.5">
            <Wallet size={16} />Pay Now
          </button>
        </div>
      )}

      {/* Tracking — the application approval journey (dated), not payments */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="text-[14px] font-extrabold mb-3 flex items-center gap-2">
          <History size={18} className="text-[#0b3d91]" /> আবেদনের ট্র্যাকিং
        </p>
        {application ? (
          <div className="relative pl-6">
            {APP_STEPS.map((step, i) => {
              const done = i <= lastDoneIdx;
              const isLast = i === APP_STEPS.length - 1;
              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  {!isLast && <div className={clsx("absolute left-[-14px] top-[22px] w-[2.5px] h-[calc(100%-6px)]", done ? "bg-[#1a9c4b]" : "bg-[#dfe6f2]")} />}
                  <div className={clsx("absolute left-[-22px] top-[2px] size-[18px] rounded-full flex items-center justify-center border-2", done ? "bg-[#1a9c4b] border-[#1a9c4b]" : "bg-white border-[#b0bdd0]")}>
                    {done ? <CheckCircle2 size={11} className="text-white" strokeWidth={3} /> : <span className="size-[6px] rounded-full bg-[#b0bdd0]" />}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={clsx("text-[13.5px] font-extrabold leading-tight", done ? "text-[#0f1729]" : "text-[#7b8aa3]")}>{step.label}</p>
                    <span className={clsx("shrink-0 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full", done ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#e8f1ff] text-[#1b6fd6]")}>
                      {done ? "সম্পন্ন" : "মুলতুবি"}
                    </span>
                  </div>
                  {stepDates[step.key] && (
                    <p className="text-[11px] font-bold text-[#178a42] mt-0.5">
                      {new Date(stepDates[step.key]).toLocaleString("bn-BD", { dateStyle: "medium" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[#5b6784] text-center py-3">এই প্ল্যানের জন্য আবেদনের ট্র্যাকিং পাওয়া যায়নি।</p>
        )}
      </div>

      {/* Schedule */}
      <div id="schedule" className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="px-3 py-2.5 text-[14px] font-extrabold border-b border-[#eef1f6]">কিস্তির সময়সূচি</p>
        <div className="divide-y divide-[#eef1f6]">
          {schedule.map((row: any) => {
            const paid = row.status === "paid";
            const claimed = row.status === "claimed";
            return (
              <div key={row.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className={clsx("size-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-extrabold", paid ? "bg-[#e9f9ef] text-[#178a42]" : claimed ? "bg-[#fff6e3] text-[#b8620b]" : "bg-[#f5f7fb] text-[#5b6784]")}>
                  {paid ? <CheckCircle2 size={16} /> : claimed ? <Clock size={16} /> : row.installmentNo}
                </span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className="text-[13px] font-extrabold">কিস্তি #{row.installmentNo}</span>
                  <span className="text-[11px] font-semibold text-[#5b6784]">
                    {formatDate(row.dueDate)}
                    {paid && row.paidAt ? ` · পরিশোধিত ${formatDate(row.paidAt)}` : ""}
                  </span>
                  {(paid || claimed) && row.paymentMethod && (
                    <span className="text-[10px] font-bold text-[#5b6784] mt-0.5">
                      {METHOD_LABELS[row.paymentMethod] || row.paymentMethod}
                      {row.paymentNumber ? ` · ${row.paymentNumber}` : ""}
                      {row.transactionId ? ` · TxID: ${row.transactionId}` : ""}
                    </span>
                  )}
                </span>
                <span className="flex flex-col items-end shrink-0">
                  <span className="text-[13px] font-extrabold">{bdt(row.amount)}</span>
                  <span className={clsx("text-[10px] font-extrabold uppercase", paid ? "text-[#178a42]" : claimed ? "text-[#b8620b]" : "text-[#b8620b]")}>{paid ? "পরিশোধিত" : claimed ? "যাচাইয়ের অপেক্ষায়" : "বাকি"}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment History Modal */}
      {showHistory && (
        <Modal isVisible title="পেমেন্ট হিস্টোরি" onClose={() => setShowHistory(false)}>
          <div className="space-y-3 max-w-md">
            {paidSchedules.length === 0 ? (
              <p className="text-center text-[#5b6784] py-6">এখনো কোনো পেমেন্ট হয়নি</p>
            ) : (
              paidSchedules.map((row: any) => {
                const mc = METHOD_COLORS[row.paymentMethod] || "text-gray-600 bg-gray-50";
                return (
                  <div key={row.id} className="rounded-md border border-[#dfe6f2] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-extrabold">কিস্তি #{row.installmentNo}</span>
                      <span className="text-[15px] font-extrabold text-[#178a42]">{bdt(row.paidAmount || row.amount)}</span>
                    </div>
                    {productLabel && (
                      <p className="text-[12px] font-bold text-[#0b3d91] mb-2 leading-tight">{productLabel}</p>
                    )}
                    <div className="space-y-1.5 text-[12px]">
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-[#5b6784] shrink-0" />
                        <span className="font-semibold text-[#5b6784]">
                          {row.paidAt ? new Date(row.paidAt).toLocaleString("bn-BD", { dateStyle: "long", timeStyle: "short" }) : formatDate(row.paidAt)}
                        </span>
                      </div>
                      {row.paymentMethod && (
                        <div className="flex items-center gap-2">
                          <Banknote size={13} className="text-[#5b6784] shrink-0" />
                          <span className={clsx("font-extrabold text-[11px] px-2 py-0.5 rounded-full", mc)}>
                            {METHOD_LABELS[row.paymentMethod] || row.paymentMethod}
                          </span>
                        </div>
                      )}
                      {row.paymentNumber && (
                        <div className="flex items-center gap-2">
                          <Phone size={13} className="text-[#5b6784] shrink-0" />
                          <span className="font-bold text-[#16213a]">নম্বর: <span className="font-mono">{row.paymentNumber}</span></span>
                        </div>
                      )}
                      {row.transactionId && (
                        <div className="flex items-center gap-2">
                          <CreditCard size={13} className="text-[#5b6784] shrink-0" />
                          <span className="font-bold text-[#16213a]">TxID: <span className="font-mono">{row.transactionId}</span></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <button onClick={() => setShowHistory(false)} className="w-full h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold">
              বন্ধ করুন
            </button>
          </div>
        </Modal>
      )}

      {/* Pay Now popup — 2-step: method select → form */}
      {showPay && (
        <Modal isVisible title={selectedMethod ? `${selectedMethod.label} পেমেন্ট` : "কিস্তি পরিশোধ"} onClose={resetPayModal}>
          <div className="space-y-3 max-w-sm text-[#16213a]">
            {/* Amount header */}
            <div className="rounded-md bg-[#eef3fb] border border-[#dfe6f2] p-3 text-center">
              <p className="text-[12px] font-semibold text-[#5b6784]">এই কিস্তির পরিমাণ</p>
              <p className="text-[24px] font-extrabold text-[#0b3d91]">{bdt(nextDue?.amount || plan.monthlyAmount)}</p>
              {nextDue && <p className="text-[11px] text-[#5b6784]">কিস্তি #{nextDue.installmentNo} · {formatDate(nextDue.dueDate)}</p>}
            </div>

            {!selectedMethod ? (
              <>
                {/* Step 1: Method selection */}
                <p className="text-[12.5px] font-semibold text-[#5b6784]">নিচের যেকোনো নম্বরে <b className="text-[#16213a]">Send Money</b> করে পেমেন্ট জমা দিন:</p>

                <div className="space-y-2">
                  {PAY_METHODS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setSelectedMethod(m)}
                      className="w-full flex items-center justify-between rounded-md border border-[#dfe6f2] px-3 py-2.5 hover:bg-[#f5f7fb] active:scale-[0.98] transition-all"
                    >
                      <span className="flex items-center gap-2.5">
                        <span className="size-9 rounded-md bg-white border border-[#dfe6f2] overflow-hidden flex items-center justify-center shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.logo} alt={m.label} className="w-full h-full object-contain" />
                        </span>
                        <span className="flex flex-col text-left leading-tight">
                          <span className={clsx("text-[13px] font-extrabold", m.color)}>{m.label}</span>
                          <span className="text-[11px] font-mono text-[#5b6784]">{m.number}</span>
                        </span>
                      </span>
                      <ChevronRight size={16} className="text-[#b0bdd0]" />
                    </button>
                  ))}
                  <div className="flex items-center justify-between rounded-md border border-[#dfe6f2] px-3 py-2.5">
                    <span className="flex items-center gap-2.5">
                      <span className="size-9 rounded-md bg-white border border-[#dfe6f2] overflow-hidden flex items-center justify-center shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/payment-methods/bank.jpg" alt="Bank" className="w-full h-full object-contain" />
                      </span>
                      <span className="flex flex-col text-left leading-tight">
                        <span className="text-[13px] font-extrabold text-[#0b3d91]">Bank Transfer</span>
                        <span className="text-[11px] font-mono text-[#5b6784]">{paymentDetails.bank.accountNumber}</span>
                      </span>
                    </span>
                  </div>
                </div>

                <div className="rounded-md bg-[#fff8e6] border border-[#f5dfa0] p-2.5 text-[12px] text-[#8a5a12] font-semibold flex items-start gap-2">
                  <Phone size={15} className="shrink-0 mt-0.5" />
                  <span>অফিসে নগদ পরিশোধ করলে <b>{contactDetails.customerCare}</b> নম্বরে জানান।</span>
                </div>

                <button onClick={resetPayModal} className="w-full h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold">
                  বন্ধ করুন
                </button>
              </>
            ) : (
              <>
                {/* Step 2: Payment claim form */}
                <p className="text-[12.5px] font-semibold text-[#5b6784]">
                  <span className={clsx("font-extrabold", selectedMethod.color)}>{selectedMethod.label}</span> এ <b className="font-mono">{selectedMethod.number}</b> নম্বরে Send Money করে নিচের তথ্য দিন:
                </p>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">কাস্টমার আইডি</label>
                    <div className="h-10 rounded-md border border-[#dfe6f2] bg-[#f5f7fb] px-3 flex items-center text-[13px] font-bold text-[#5b6784]">
                      {plan.customerId}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">নাম</label>
                    <div className="h-10 rounded-md border border-[#dfe6f2] bg-[#f5f7fb] px-3 flex items-center text-[13px] font-bold text-[#5b6784]">
                      {plan.customerName}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">ট্রানজেকশন আইডি *</label>
                    <input
                      type="text"
                      value={txId}
                      onChange={(e) => setTxId(e.target.value)}
                      placeholder="যেমন: TXN1234ABCD"
                      className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">যে নম্বর থেকে পাঠিয়েছেন *</label>
                    <input
                      type="tel"
                      value={payNum}
                      onChange={(e) => setPayNum(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button onClick={() => setSelectedMethod(null)} className="flex-1 h-10 rounded-md border border-[#dfe6f2] text-[#5b6784] text-[13px] font-extrabold">
                    ← পিছনে
                  </button>
                  <button
                    onClick={handlePaymentClaim}
                    disabled={!txId.trim() || !payNum.trim() || submitting}
                    className="flex-[2] h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
                    {submitting ? "জমা হচ্ছে..." : "পেমেন্ট জমা দিন"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

"use client";

import { Modal } from "@/components/ui";
import { contactDetails, paymentDetails } from "@/constants";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  History,
  Phone,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const bdt = (n: number) => `৳${Number(n).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "চলমান", cls: "bg-[#e8f1ff] text-[#1b6fd6]" },
  completed: { label: "সম্পন্ন", cls: "bg-[#e9f9ef] text-[#178a42]" },
  defaulted: { label: "খেলাপি", cls: "bg-[#fff6e3] text-[#b8620b]" },
  banned: { label: "ব্যান", cls: "bg-[#ffe9ec] text-[#c81f38]" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-500" },
};

const PAY_METHODS = [
  { key: "bkash", label: "bKash", color: "text-[#d1137b]", number: paymentDetails.bkash.number },
  { key: "nagad", label: "Nagad", color: "text-[#ec1c24]", number: paymentDetails.nagad.number },
  { key: "rocket", label: "Rocket", color: "text-[#8a2be2]", number: paymentDetails.rocket.number },
];

const METHOD_LABELS: Record<string, string> = {
  cash: "অফিসে নগদ",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "ব্যাংক",
};

const METHOD_COLORS: Record<string, string> = {
  cash: "text-[#178a42] bg-[#e9f9ef]",
  bkash: "text-[#d1137b] bg-[#fce7f3]",
  nagad: "text-[#ec1c24] bg-[#fee2e2]",
  rocket: "text-[#8a2be2] bg-[#f3e8ff]",
  bank: "text-[#0b3d91] bg-[#e8f1ff]",
};

export default function CustomerInstallmentDetail({ data }: { data: any }) {
  const { plan, schedule, nextDue } = data;
  const s = STATUS[plan.status] || STATUS.active;
  const [showPay, setShowPay] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const paidSchedules = schedule.filter((r: any) => r.status === "paid");

  const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-2.5">
      <p className="text-[10.5px] font-semibold text-[#5b6784]">{label}</p>
      <p className={clsx("text-[14px] font-extrabold", accent ? "text-[#0b3d91]" : "text-[#16213a]")}>{value}</p>
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
        <span className={clsx("shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full", s.cls)}>{s.label}</span>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/pdf/download?type=installment-invoice&id=${plan.planCode}`}
          target="_blank"
          className="flex items-center justify-center gap-1.5 h-10 rounded-md bg-white border border-[#dfe6f2] text-[#0b3d91] text-[13px] font-extrabold"
        >
          <Download size={16} /> ইনভয়েস
        </Link>
        <button
          onClick={() => setShowHistory(true)}
          className="flex items-center justify-center gap-1.5 h-10 rounded-md bg-white border border-[#dfe6f2] text-[#0b3d91] text-[13px] font-extrabold"
        >
          <History size={16} /> পেমেন্ট হিস্টোরি
        </button>
      </div>

      {/* Next due / Pay Now */}
      {plan.status === "active" && nextDue && (
        <div className="rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 flex items-center gap-3 shadow-[0_8px_22px_rgba(11,61,145,0.25)]">
          <span className="size-11 rounded-md bg-white/15 border border-white/25 flex items-center justify-center shrink-0"><Clock size={22} /></span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight">
            <span className="text-[11px] font-semibold text-white/85">পরবর্তী কিস্তি (#{nextDue.installmentNo}) — {formatDate(nextDue.dueDate)}</span>
            <span className="text-[20px] font-extrabold">{bdt(nextDue.amount)}</span>
          </span>
          <button onClick={() => setShowPay(true)} className="shrink-0 h-9 px-3 rounded-md bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center gap-1.5">
            <Wallet size={16} />Pay Now
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <Stat label="মোট (চার্জসহ)" value={bdt(plan.totalPayable)} />
        <Stat label="ডাউন পেমেন্ট" value={bdt(plan.downPayment)} />
        <Stat label="মাসিক কিস্তি" value={bdt(plan.monthlyAmount)} accent />
        <Stat label="মেয়াদ" value={`${plan.months} মাস`} />
        <Stat label="পরিশোধিত" value={`${data.paidCount}/${plan.months} · ${bdt(data.paidAmount)}`} />
        <Stat label="বাকি" value={bdt(data.remainingAmount)} />
      </div>

      {/* Schedule */}
      <div className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="px-3 py-2.5 text-[14px] font-extrabold border-b border-[#eef1f6]">কিস্তির সময়সূচি</p>
        <div className="divide-y divide-[#eef1f6]">
          {schedule.map((row: any) => {
            const paid = row.status === "paid";
            return (
              <div key={row.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className={clsx("size-8 rounded-full flex items-center justify-center shrink-0 text-[12px] font-extrabold", paid ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#f5f7fb] text-[#5b6784]")}>
                  {paid ? <CheckCircle2 size={16} /> : row.installmentNo}
                </span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className="text-[13px] font-extrabold">কিস্তি #{row.installmentNo}</span>
                  <span className="text-[11px] font-semibold text-[#5b6784]">
                    {formatDate(row.dueDate)}
                    {paid && row.paidAt ? ` · পরিশোধিত ${formatDate(row.paidAt)}` : ""}
                  </span>
                  {paid && row.paymentMethod && (
                    <span className="text-[10px] font-bold text-[#5b6784] mt-0.5">
                      {METHOD_LABELS[row.paymentMethod] || row.paymentMethod}
                      {row.paymentNumber ? ` · ${row.paymentNumber}` : ""}
                      {row.transactionId ? ` · TxID: ${row.transactionId}` : ""}
                    </span>
                  )}
                </span>
                <span className="flex flex-col items-end shrink-0">
                  <span className="text-[13px] font-extrabold">{bdt(row.amount)}</span>
                  <span className={clsx("text-[10px] font-extrabold uppercase", paid ? "text-[#178a42]" : "text-[#b8620b]")}>{paid ? "পরিশোধিত" : "বাকি"}</span>
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
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[14px] font-extrabold">কিস্তি #{row.installmentNo}</span>
                      <span className="text-[15px] font-extrabold text-[#178a42]">{bdt(row.paidAmount || row.amount)}</span>
                    </div>
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

      {/* Pay Now popup */}
      {showPay && (
        <Modal isVisible title="কিস্তি পরিশোধ" onClose={() => setShowPay(false)}>
          <div className="space-y-3 max-w-sm text-[#16213a]">
            <div className="rounded-md bg-[#eef3fb] border border-[#dfe6f2] p-3 text-center">
              <p className="text-[12px] font-semibold text-[#5b6784]">এই কিস্তির পরিমাণ</p>
              <p className="text-[24px] font-extrabold text-[#0b3d91]">{bdt(nextDue?.amount || plan.monthlyAmount)}</p>
              {nextDue && <p className="text-[11px] text-[#5b6784]">কিস্তি #{nextDue.installmentNo} · {formatDate(nextDue.dueDate)}</p>}
            </div>

            <p className="text-[12.5px] font-semibold text-[#5b6784]">নিচের যেকোনো নম্বরে <b className="text-[#16213a]">Send Money</b> করুন অথবা অফিসে নগদ পরিশোধ করুন:</p>

            <div className="space-y-2">
              {PAY_METHODS.map((m) => (
                <div key={m.key} className="flex items-center justify-between rounded-md border border-[#dfe6f2] px-3 py-2">
                  <span className={clsx("text-[13px] font-extrabold", m.color)}>{m.label}</span>
                  <span className="text-[14px] font-extrabold font-mono tracking-wide">{m.number}</span>
                </div>
              ))}
              <div className="flex items-center justify-between rounded-md border border-[#dfe6f2] px-3 py-2">
                <span className="text-[13px] font-extrabold text-[#0b3d91]">Bank</span>
                <span className="text-[12px] font-bold text-right">{paymentDetails.bank.bankName}<br />{paymentDetails.bank.accountNumber}</span>
              </div>
            </div>

            <div className="rounded-md bg-[#fff8e6] border border-[#f5dfa0] p-2.5 text-[12px] text-[#8a5a12] font-semibold flex items-start gap-2">
              <Phone size={15} className="shrink-0 mt-0.5" />
              <span>
                পেমেন্ট করার পর <b>পেমেন্ট নম্বর</b> ও <b>ট্রানজেকশন আইডি</b> সহ <b>{contactDetails.customerCare}</b> নম্বরে জানান।
                অফিসে নগদ পরিশোধ করলেও জানিয়ে দিন।
              </span>
            </div>

            <button onClick={() => setShowPay(false)} className="w-full h-10 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-2">
              <CreditCard size={16} /> বুঝেছি
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

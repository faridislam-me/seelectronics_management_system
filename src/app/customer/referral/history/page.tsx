"use client";

import { methodLogos, methodThemes } from "@/components/features/payments/paymentThemes";
import clsx from "clsx";
import { ArrowLeft, Calendar, CheckCircle2, Clock, History, Phone, Receipt, XCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useReferral } from "../_components/ReferralProvider";

const statusMeta = (s: string) =>
  s === "completed"
    ? { cls: "bg-[#e9f9ef] text-[#178a42] border-[#bfe8cd]", icon: CheckCircle2 }
    : s === "rejected"
      ? { cls: "bg-[#ffe9ec] text-[#c81f38] border-[#f7c3ca]", icon: XCircle }
      : { cls: "bg-[#fff6e3] text-[#b8620b] border-[#f5dfa0]", icon: Clock };

export default function HistoryPage() {
  const { data } = useReferral();

  return (
    <>
      <section className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <Link href="/customer/referral" aria-label="Back" className="size-9 rounded-md bg-[#eef3fb] text-[#0b3d91] flex items-center justify-center shrink-0"><ArrowLeft size={18} /></Link>
        <span className="size-9 rounded-md bg-[#f3e9ff] text-[#8b3fe8] flex items-center justify-center shrink-0"><History size={18} /></span>
        <span className="text-[17px] font-extrabold text-[#0b2a66] flex-1 min-w-0 truncate">পেমেন্ট ইতিহাস</span>
        <span className="shrink-0 h-7 px-2 rounded-md bg-[#eef4fd] text-[11.5px] font-bold text-[#1b6fd6] inline-flex items-center">{data.requests.length} টি</span>
      </section>

      {data.requests.length === 0 ? (
        <div className="rounded-md bg-white border border-dashed border-[#c9d3e6] p-6 text-center text-[13px] font-medium text-[#5b6784]">কোনো পেমেন্ট ইতিহাস নেই।</div>
      ) : (
        data.requests.map((req: any) => {
          const key = String(req.paymentMethod || "").toLowerCase();
          const t = methodThemes[key] ?? methodThemes.bank;
          const logo = methodLogos[key];
          const m = statusMeta(req.status);
          return (
            <div key={req.id} className={clsx("relative overflow-hidden rounded-md border p-2.5 flex flex-col gap-2 shadow-[0_4px_14px_rgba(11,61,145,0.06)]", t.card, t.border)}>
              {logo && <span aria-hidden className="pointer-events-none absolute -right-2 -bottom-3 size-24 opacity-[0.10]"><Image src={logo} alt="" fill sizes="96px" className="object-contain" /></span>}
              <div className="relative flex items-start justify-between gap-2">
                <span className="text-[12px] font-bold text-[#5b6784] uppercase tracking-wide break-all">#{req.requestId}</span>
                <span className={clsx("shrink-0 inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[10.5px] font-extrabold uppercase", m.cls)}><m.icon size={12} />{req.status}</span>
              </div>
              <div className="relative flex items-center gap-2.5">
                <span className="size-10 rounded-md bg-white border border-[#eef1f6] flex items-center justify-center shrink-0">
                  {logo ? <Image src={logo} alt={req.paymentMethod} width={26} height={26} className="size-6 object-contain" /> : <Receipt size={18} className="text-[#1f5fc9]" />}
                </span>
                <span className="flex flex-col min-w-0 flex-1 leading-tight">
                  <span className={clsx("text-[14px] font-extrabold capitalize", t.mark)}>{req.paymentMethod}</span>
                  <span className="text-[12.5px] font-bold text-[#16213a] inline-flex items-center gap-1"><Phone size={12} className="text-[#5b6784]" />{req.walletNumber}</span>
                </span>
                <span className="shrink-0 text-right leading-tight">
                  <span className="block text-[17px] font-extrabold text-[#16213a]">৳{Number(req.amount).toLocaleString()}</span>
                  <span className="text-[11px] font-semibold text-[#5b6784] inline-flex items-center gap-1"><Calendar size={11} />{new Date(req.createdAt).toLocaleDateString("bn-BD")}</span>
                </span>
              </div>
              {(req.senderNumber || req.transactionId) && (
                <div className="relative rounded-md bg-white/70 border border-[#eef1f6] px-2.5 py-1.5 flex flex-col gap-1 text-[12px]">
                  {req.senderNumber && (
                    <span className="flex justify-between gap-2"><span className="font-bold text-[#5b6784]">প্রেরকের নম্বর</span><b className="text-[#16213a] break-all text-right">{req.senderNumber}</b></span>
                  )}
                  {req.transactionId && (
                    <span className="flex justify-between gap-2"><span className="font-bold text-[#5b6784]">ট্রানজেকশন আইডি</span><b className="text-[#16213a] break-all text-right">{req.transactionId}</b></span>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </>
  );
}

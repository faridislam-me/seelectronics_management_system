"use client";

import { PaymentDataType } from "@/types";
import clsx from "clsx";
import { Calendar, CheckCircle2, ChevronRight, Clock, CreditCard, Download, HandCoins, Landmark, LucideIcon, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type Filter = "all" | "paid" | "pending" | "received" | "bank" | "failed";

const statusMeta = (p: PaymentDataType) => {
  const s = p.status as string;
  if (s === "credited") return { label: "RECEIVED", chip: "bg-[#e8f1ff] text-[#1b6fd6]", solid: "bg-[#1f7cf0] text-white", icon: Download, filter: "received" as Filter };
  if (s === "completed") return { label: "PAID", chip: "bg-[#e9f9ef] text-[#178a42]", solid: "bg-[#1a9c4b] text-white", icon: CheckCircle2, filter: "paid" as Filter };
  if (s === "rejected") return { label: "FAILED", chip: "bg-[#ffe9ec] text-[#c81f38]", solid: "bg-[#e0243f] text-white", icon: XCircle, filter: "failed" as Filter };
  return { label: "PENDING", chip: "bg-[#fff6e3] text-[#b8620b]", solid: "bg-[#e0a11b] text-white", icon: Clock, filter: "pending" as Filter };
};

const messageFor = (p: PaymentDataType) => {
  const s = p.status as string;
  if (s === "credited") return "এস ইলেকট্রনিক্স আপনার সার্ভিস আইডির টাকা ভার্চুয়াল একাউন্টে পেমেন্টটি পাঠানো হয়েছে। পেমেন্ট আইডি এবং বিস্তারিত জানতে আপনার পেমেন্ট হিস্ট্রি চেক করুন।";
  if (s === "completed") return "টেকনিশিয়ান/ ইলেকট্রিশিয়ান, এস ই ইলেকট্রনিকস-এ আপনার টাকা উত্তোলন রিকোয়েস্ট পেমেন্ট এডমিন প্যানেল থেকে সফলভাবে পরিশোধ করা হয়েছে। অনুগ্রহ করে আপনার একাউন্ট চেক করে নিন।";
  if (s === "approved") return `এস ইলেকট্রনিক্স এডমিন প্যানেলে আপনার পেমেন্ট রিকোয়েস্টটি সফলভাবে সাবমিট হয়েছে। খুব শীঘ্রই টাকা আপনার ${p.paymentMethod || "Bkash"} একাউন্টে মাধ্যমে নির্দিষ্ট সময়ে পাঠিয়ে দেওয়া হবে।`;
  return `আপনার পেমেন্ট রিকোয়েস্ট (৳${p.amount}) এখন ${p.status} অবস্থায় আছে।`;
};

function FilterBar({ filters, value, onChange }: { filters: { key: Filter; label: string; icon: LucideIcon }[]; value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2 [scrollbar-width:none]">
      {filters.map((f) => (
        <button key={f.key} type="button" onClick={() => onChange(f.key)} className={clsx("shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-bold border transition-all", value === f.key ? "bg-[#1f7cf0] text-white border-[#1f7cf0] shadow-[0_6px_14px_rgba(31,124,240,0.35)]" : "bg-white text-[#16213a] border-[#dfe6f2]")}>
          <f.icon size={15} />{f.label}
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-8 text-center flex flex-col items-center gap-2">
      <CreditCard size={36} className="text-[#c9d3e6]" />
      <span className="text-[15px] font-extrabold">No History Yet</span>
    </div>
  );
}

/** Detailed history (message + status), used on /staff/payment/payment-history. */
export function PaymentHistoryList({ payments }: { payments: PaymentDataType[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const list = payments.filter((p) => filter === "all" || statusMeta(p).filter === filter || (filter === "bank" && p.paymentMethod === "bank"));
  return (
    <div className="flex flex-col gap-2.5">
      <FilterBar value={filter} onChange={setFilter} filters={[
        { key: "all", label: "All", icon: Calendar }, { key: "paid", label: "Paid", icon: CheckCircle2 }, { key: "pending", label: "Pending", icon: Clock }, { key: "received", label: "Received", icon: Landmark }, { key: "bank", label: "Bank", icon: Landmark },
      ]} />
      {list.length === 0 ? <EmptyState /> : list.map((p) => {
        const m = statusMeta(p);
        const isRequest = p.status !== "credited";
        const Tile = isRequest ? HandCoins : Landmark;
        const tile = m.filter === "pending" ? "bg-[#e0a11b]" : isRequest ? "bg-[#1a9c4b]" : "bg-[#1f7cf0]";
        return (
          <Link key={p.paymentId} href={`/staff/payment/${p.invoiceNumber}`} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-start gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.99] transition-all">
            <span className={clsx("size-11 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5", tile)}><Tile size={20} /></span>
            <span className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-[12.5px] font-extrabold text-[#0b3d91] uppercase tracking-wide leading-tight">{isRequest ? "Cash Out Payment Request" : "Technician Payment Cash In"}</span>
              <span className="text-[11.5px] font-medium text-[#3d4a63] leading-snug">{messageFor(p)}</span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#5b6784]">
                <span className="inline-flex items-center gap-1 whitespace-nowrap"><Calendar size={12} />{p.createdAt ? new Date(p.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" }) : ""}</span>
                <span className="whitespace-nowrap">Status: <span className={clsx("font-extrabold", m.filter === "pending" ? "text-[#b8620b]" : "text-[#5b6784]")}>{m.label}</span></span>
              </span>
            </span>
            <span className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="rounded-md bg-[#e9f9ef] text-[#178a42] px-2 py-1 text-[15px] font-extrabold leading-none">৳{p.amount?.toLocaleString()}</span>
              <span className={clsx("inline-flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-extrabold tracking-wide", m.solid)}><m.icon size={11} strokeWidth={2.8} />{m.label}</span>
            </span>
            <ChevronRight size={16} className="text-[#9aa4b8] shrink-0 self-center" />
          </Link>
        );
      })}
    </div>
  );
}

/** Compact list (invoice, tag, date, id, amount), used on /staff/payment. */
export function PaymentCompactList({ payments }: { payments: PaymentDataType[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const list = payments.filter((p) => filter === "all" || statusMeta(p).filter === filter);
  return (
    <div className="flex flex-col gap-2.5">
      <FilterBar value={filter} onChange={setFilter} filters={[
        { key: "all", label: "All", icon: CreditCard }, { key: "paid", label: "Paid", icon: CheckCircle2 }, { key: "pending", label: "Pending", icon: Clock }, { key: "failed", label: "Failed", icon: XCircle },
      ]} />
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[18px] font-extrabold">Payment History</span>
        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-white border border-[#dfe6f2] text-[12px] font-bold text-[#5b6784]"><Calendar size={13} />{list.length} records</span>
      </div>
      {list.length === 0 ? <EmptyState /> : list.map((p) => {
        const m = statusMeta(p);
        const isBal = p.invoiceNumber.startsWith("BAL-");
        const title = isBal ? "BAL#" + p.paymentId.substring(0, 8) : "SFC#" + p.invoiceNumber;
        return (
          <Link key={p.paymentId} href={`/staff/payment/${p.invoiceNumber}`} className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-center gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] active:scale-[0.99] transition-all">
            <span className={clsx("size-12 rounded-md flex items-center justify-center shrink-0", isBal ? "bg-[#f3e9ff] text-[#8b3fe8]" : "bg-[#e8f1ff] text-[#1f7cf0]")}>{isBal ? <Landmark size={22} /> : <CreditCard size={22} />}</span>
            <span className="flex flex-col gap-1 min-w-0 flex-1">
              <span className="text-[13px] font-extrabold truncate">{title}</span>
              <span className="self-start px-2 h-5 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10px] font-bold inline-flex items-center">SE Electronics</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5b6784]"><Calendar size={12} />{new Date(p.date || p.createdAt!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="text-[11px] font-semibold text-[#5b6784] truncate">Payment Id: {p.paymentId}</span>
            </span>
            <span className="flex flex-col items-end gap-1.5 shrink-0">
              <span className={clsx("inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-[10.5px] font-extrabold tracking-wide", m.chip)}><m.icon size={12} strokeWidth={2.8} />{m.label}</span>
              <span className="text-[clamp(18px,5.4vw,22px)] font-extrabold leading-none">৳{p.amount?.toLocaleString()}</span>
            </span>
            <ChevronRight size={16} className="text-[#9aa4b8] shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}

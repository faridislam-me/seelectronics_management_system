"use client";

import { sellerToggleCustomerBlock, sellerUpdateCustomerContact, type SellerSoldProduct } from "@/actions/sellerActions";
import { Modal } from "@/components/ui";
import { serviceChargeDue, serviceChargeReasonLabel } from "@/constants/serviceCharges";
import { productImage, serviceStatusStyle } from "@/lib/serviceStatusStyle";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  Ban, Banknote, Calendar, CheckCircle2, ChevronRight, Clock, CreditCard, Download, FileText, Hash, Home, MapPin, Pencil, Phone,
  ShieldCheck, ShieldX, User, Wrench, XCircle, Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import SellerRequestModal from "./SellerRequestModal";

function Row({ icon: Icon, label, value, tone }: { icon: typeof User; label: string; value: React.ReactNode; tone?: "red" | "green" }) {
  return (
    <span className="flex items-start gap-2 py-1.5 text-[12.5px]">
      <Icon size={15} className="text-[#1f5fc9] mt-0.5 shrink-0" />
      <span className="w-[100px] shrink-0 text-[#5b6784] font-semibold">{label}</span>
      <b className={clsx("min-w-0 break-words", tone === "red" && "text-[#c81f38]", tone === "green" && "text-[#178a42]")}>{value}</b>
    </span>
  );
}

const Section = ({ icon: Icon, title, sub, right, children }: { icon: typeof User; title: string; sub: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <section className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex flex-col gap-1.5">
    <span className="flex items-center justify-between gap-2 mb-0.5">
      <span className="flex items-center gap-2.5">
        <span className="size-9 rounded-full bg-[#0b3d91] text-white flex items-center justify-center"><Icon size={18} /></span>
        <span className="flex flex-col leading-tight"><span className="text-[15px] font-extrabold text-[#0b3d91]">{title}</span><span className="text-[10.5px] font-bold uppercase tracking-wide text-[#5b6784]">{sub}</span></span>
      </span>
      {right}
    </span>
    {children}
  </section>
);

/** Everything about one unit the seller sold: the product, its customer, purchase, service history and the request buttons. */
export default function SellerProductDetailClient({ product: p, siblings }: { product: SellerSoldProduct; siblings: SellerSoldProduct[] }) {
  const router = useRouter();
  const [request, setRequest] = useState<"repair" | "install" | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: p.customerName, phone: p.customerPhone, address: p.customerAddress });
  const [busy, setBusy] = useState(false);
  const [blockFor, setBlockFor] = useState(false);

  const warrantyOk = p.warrantyActive && !p.isWarrantyStopped;
  const noWarranty = p.warrantyDurationMonths === 0;
  const active = p.services.find((s) => !["completed", "canceled"].includes(s.status));
  const serviceDue = p.services.reduce((t, s) => t + serviceChargeDue(s.charge), 0);

  const saveContact = async () => {
    setBusy(true);
    const res = await sellerUpdateCustomerContact(p.customerId, form);
    setBusy(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) { setEditing(false); router.refresh(); }
  };

  const toggleBlock = async (reason?: "due" | "misuse") => {
    if (!p.isWarrantyStopped && !reason) return setBlockFor(true);
    setBlockFor(false);
    setBusy(true);
    const res = await sellerToggleCustomerBlock(p.customerId, reason);
    setBusy(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) router.refresh();
  };

  return (
    <div className="flex flex-col gap-2.5 p-2">
      {request && <SellerRequestModal product={p} kind={request} onClose={() => setRequest(null)} />}

      {/* Product header */}
      <section className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex flex-col gap-2.5">
        <div className="flex items-start gap-3">
          <span className="relative size-[92px] rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
            <Image src={productImage(p.type)} alt={p.type} fill sizes="92px" className="object-contain p-1" />
          </span>
          <span className="flex flex-col gap-1.5 min-w-0 flex-1">
            <span className="self-start px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10px] font-extrabold tracking-wide inline-flex items-center uppercase">{p.type}</span>
            <span className="text-[16px] font-extrabold leading-tight break-words text-[#16213a]">{p.model}{p.quantity > 1 ? ` × ${p.quantity}` : ""}</span>
            {p.serialNumber && <span className="text-[11px] font-bold text-[#5b6784] break-all">S/N: {p.serialNumber}</span>}
            <span className={clsx("self-start inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] font-extrabold", warrantyOk ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>
              {warrantyOk ? <ShieldCheck size={14} /> : <ShieldX size={14} />}
              {noWarranty ? "ওয়ারেন্টি নেই" : p.isWarrantyStopped ? (p.warrantyStopReason === "misuse" ? "ওয়ারেন্টি বাতিল" : "বকেয়ায় ব্লক") : p.warrantyActive ? "ওয়ারেন্টি চালু" : "ওয়ারেন্টি শেষ"}
            </span>
          </span>
        </div>

        {/* The two things a seller comes here to do */}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setRequest("repair")} className={clsx("h-12 rounded-md text-[13.5px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(23,138,66,0.25)]", active?.type === "repair" ? "bg-[#f5f8fd] border border-[#e3ebf7] text-[#5b6784] shadow-none" : "bg-[#1a9c4b] text-white")}>
            <Wrench size={17} />{active?.type === "repair" ? "সার্ভিস চলছে" : "সার্ভিস রিকোয়েস্ট"}
          </button>
          <button type="button" onClick={() => setRequest("install")} className={clsx("h-12 rounded-md text-[13.5px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_14px_rgba(31,124,240,0.3)]", active?.type === "install" ? "bg-[#f5f8fd] border border-[#e3ebf7] text-[#5b6784] shadow-none" : "bg-[#1f7cf0] text-white")}>
            <Home size={17} />{active?.type === "install" ? "ইন্সটল চলছে" : "ইন্সটল আবেদন"}
          </button>
        </div>
        {active && (
          <Link href={`/service-track?trackingId=${active.serviceId}`} className="flex items-center gap-2 rounded-md border border-[#cfe0fb] bg-[#e8f1ff] px-2.5 py-2 text-[12px] font-bold text-[#1b6fd6]">
            <Clock size={14} />চলমান {active.type === "install" ? "ইন্সটল" : "সার্ভিস"} #{active.serviceId} · {serviceStatusStyle(active.status).label}<ChevronRight size={14} className="ml-auto" />
          </Link>
        )}
      </section>

      {/* Customer */}
      <Section icon={User} title="কাস্টমার" sub="Customer" right={
        <span className="flex gap-1">
          <button type="button" title="তথ্য এডিট" onClick={() => setEditing(true)} className="size-8 rounded-md border-2 border-[#bcd4fb] text-[#1f7cf0] inline-flex items-center justify-center"><Pencil size={14} /></button>
          <button type="button" title={p.isWarrantyStopped ? "আনব্লক" : "ব্লক"} disabled={busy} onClick={() => toggleBlock()} className={clsx("size-8 rounded-md border-2 inline-flex items-center justify-center disabled:opacity-50", p.isWarrantyStopped ? "border-[#bfe8cd] text-[#178a42]" : "border-[#f7c3ca] text-[#c81f38]")}>{p.isWarrantyStopped ? <ShieldCheck size={14} /> : <Ban size={14} />}</button>
        </span>
      }>
        <div className="flex flex-col divide-y divide-[#eef1f6]">
          <Row icon={User} label="নাম" value={p.customerName} />
          <Row icon={Phone} label="মোবাইল" value={<a href={`tel:${p.customerPhone}`} className="text-[#1f5fc9] underline underline-offset-2">{p.customerPhone}</a>} />
          <Row icon={MapPin} label="ঠিকানা" value={p.customerAddress} />
          <Row icon={Hash} label="Customer ID" value={<>#{p.originalCustomerId || p.customerId}{p.originalCustomerId && p.originalCustomerId !== p.customerId ? <span className="block text-[11px] font-semibold text-[#5b6784]">অ্যাকাউন্ট #{p.customerId}</span> : null}</>} />
        </div>
        {p.isWarrantyStopped && (
          <p className={clsx("rounded-md border p-2 text-[12px] font-semibold", p.warrantyStopReason === "misuse" ? "bg-[#fff1f2] border-[#f7c3ca] text-[#c81f38]" : "bg-[#fff8ea] border-[#f5dfa0] text-[#8a4a05]")}>
            {p.warrantyStopReason === "misuse" ? "অপব্যবহারের কারণে এই কাস্টমারের ওয়ারেন্টি বাতিল করা আছে।" : "বকেয়া পরিশোধ না করায় এই কাস্টমারের ড্যাশবোর্ড ও ওয়ারেন্টি বন্ধ আছে।"}
          </p>
        )}
        {siblings.length > 0 && (
          <div className="flex flex-col gap-1 mt-1">
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#5b6784]">এই কাস্টমারের কাছে আপনার অন্য বিক্রি</span>
            {siblings.map((s) => (
              <Link key={s.id} href={`/seller/products/${s.id}`} className="flex items-center gap-2 rounded-md border border-[#eef1f6] bg-[#f9fbfe] px-2.5 py-1.5 text-[12px] font-semibold text-[#3d4a63]">
                <span className="px-1.5 h-5 rounded bg-[#e8f1ff] text-[#1b6fd6] text-[9.5px] font-extrabold uppercase inline-flex items-center">{s.type}</span>
                <span className="min-w-0 flex-1 truncate">{s.model} · #{s.invoiceNumber} · {formatDate(s.invoiceDate)}</span>
                <ChevronRight size={14} className="text-[#9aa6bd]" />
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Purchase + warranty */}
      <Section icon={FileText} title="কেনার তথ্য" sub="Purchase &amp; Warranty">
        <div className="flex flex-col divide-y divide-[#eef1f6]">
          <Row icon={Calendar} label="বিক্রির তারিখ" value={formatDate(p.invoiceDate)} />
          <Row icon={Banknote} label="দাম" value={`৳${p.unitPrice.toLocaleString()}${p.quantity > 1 ? ` × ${p.quantity} = ৳${(p.unitPrice * p.quantity).toLocaleString()}` : ""}`} />
          <Row icon={ShieldCheck} label="ওয়ারেন্টি" value={noWarranty ? "নেই" : `${p.warrantyDurationMonths} মাস (${formatDate(p.warrantyStartDate)} থেকে)`} />
          {!noWarranty && <Row icon={p.warrantyActive ? Clock : XCircle} label={p.warrantyActive ? "শেষ হবে" : "শেষ হয়েছে"} value={formatDate(p.warrantyEnd)} tone={p.warrantyActive ? "green" : "red"} />}
          <Row icon={Hash} label="Invoice No" value={`#${p.invoiceNumber}`} />
          <Row icon={CreditCard} label="পেমেন্ট" value={<>{String(p.paymentType).toUpperCase()} · {p.invoiceDue > 0 ? <span className="text-[#c81f38]">বাকি ৳{p.invoiceDue.toLocaleString()}</span> : <span className="text-[#178a42]">পরিশোধিত</span>}</>} />
        </div>
        <a href={`/pdf/download?type=invoice&id=${p.invoiceNumber}`} target="_blank" className="mt-1 h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold tracking-wide inline-flex items-center justify-between px-3 shadow-[0_6px_14px_rgba(11,61,145,0.3)]">
          <span className="inline-flex items-center gap-2"><Download size={17} />ইনভয়েস ডাউনলোড</span><ChevronRight size={16} />
        </a>
      </Section>

      {/* Service / install history */}
      {serviceDue > 0 && (
        <div className="rounded-md border border-[#f5dfa0] bg-[#fff8ea] p-2.5 flex items-center gap-2 text-[12.5px] font-bold text-[#8a4a05]">
          <Banknote size={16} className="shrink-0" />এই পণ্যের সার্ভিস চার্জ বাকি ৳{Math.round(serviceDue).toLocaleString()} — কাস্টমারের কাছ থেকে আদায় করে অফিসে জমা দিন।
        </div>
      )}
      <Section icon={Wrench} title="সার্ভিস ও ইন্সটল" sub="এই পণ্যের হিস্টোরি" right={
        <span className="text-[11px] font-extrabold text-[#5b6784] text-right leading-tight">
          <span className="inline-flex items-center gap-1"><Zap size={12} className="text-[#1f7cf0]" />{p.installCount} ইন্সটল</span><br />
          <span className="inline-flex items-center gap-1"><Wrench size={12} className="text-[#1f7cf0]" />{p.repairCount} সার্ভিস</span>
        </span>
      }>
        {p.services.length === 0 ? (
          <p className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-3 py-3 text-[12.5px] font-semibold text-[#5b6784] text-center">এই পণ্যের জন্য এখনো কোনো সার্ভিস বা ইন্সটল হয়নি।</p>
        ) : (
          p.services.map((s, i) => {
            const st = serviceStatusStyle(s.status);
            const done = s.status === "completed";
            const canceled = s.status === "canceled";
            const StatusIcon = done ? CheckCircle2 : canceled ? XCircle : Clock;
            return (
              <Link key={s.serviceId} href={`/service-track?trackingId=${s.serviceId}`} className="rounded-md border border-[#eef1f6] bg-[#f9fbfe] p-2.5 flex items-center gap-2.5">
                <span className="size-10 rounded-md bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center shrink-0">{s.type === "install" ? <Zap size={20} /> : <Wrench size={20} />}</span>
                <span className="flex flex-col gap-0.5 min-w-0 flex-1 leading-tight">
                  <span className="text-[13px] font-extrabold">{s.type === "install" ? "ইন্সটল" : "সার্ভিস"} #{p.services.length - i}</span>
                  <span className="text-[11.5px] font-semibold text-[#5b6784] break-all">ID: {s.serviceId} · {formatDate(s.createdAt)}{s.staffName ? ` · ${s.staffName}` : ""}</span>
                  {s.charge && (
                    <span className={clsx("text-[11px] font-extrabold", serviceChargeDue(s.charge) > 0 ? "text-[#b8620b]" : "text-[#178a42]")}>
                      চার্জ ৳{Math.round(s.charge.amount).toLocaleString()} ({serviceChargeReasonLabel(s.charge.reason)}) · {s.charge.status === "waived" ? "মওকুফ" : serviceChargeDue(s.charge) > 0 ? `বাকি ৳${Math.round(serviceChargeDue(s.charge)).toLocaleString()}` : "পরিশোধিত"}
                    </span>
                  )}
                </span>
                <span className={clsx("shrink-0 inline-flex items-center gap-1 px-2 h-7 rounded-md border text-[10px] font-extrabold", st.cls)}><StatusIcon size={12} strokeWidth={2.6} />{st.label}</span>
                <ChevronRight size={16} className="text-[#0b3d91] shrink-0" />
              </Link>
            );
          })
        )}
      </Section>

      <Link href="/seller/customers" className="h-10 rounded-md bg-white border border-[#dfe6f2] text-[#0b3d91] text-[12.5px] font-extrabold inline-flex items-center justify-center gap-2">
        <FileText size={15} />সব বিক্রি দেখুন
      </Link>

      {editing && (
        <Modal isVisible title="কাস্টমারের তথ্য এডিট" width="500" onClose={() => setEditing(false)}>
          <div className="flex flex-col gap-2.5">
            {(["name", "phone", "address"] as const).map((k) => (
              <label key={k} className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-gray-700">{k === "name" ? "নাম" : k === "phone" ? "মোবাইল" : "ঠিকানা"}</span>
                <input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="h-11 rounded-md px-3 border border-gray-200 bg-gray-50 text-sm outline-none focus:border-brand" />
              </label>
            ))}
            <p className="text-xs text-[#6b7690]">শুধু নাম, মোবাইল ও ঠিকানা বদলাবে — পণ্য, দাম বা ইনভয়েস বদলাতে অফিসে যোগাযোগ করুন।</p>
            <button onClick={saveContact} disabled={busy} className="h-11 rounded-md bg-[#1f7cf0] text-white font-extrabold text-sm disabled:opacity-50">{busy ? "সেভ হচ্ছে..." : "সেভ করুন"}</button>
          </div>
        </Modal>
      )}

      {blockFor && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-2" onClick={() => setBlockFor(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] rounded-md bg-white p-3 flex flex-col gap-2.5">
            <span className="text-[14.5px] font-extrabold text-[#16213a]">{p.customerName} — ব্লক করার কারণ</span>
            <button type="button" onClick={() => toggleBlock("due")} className="rounded-md border border-[#f5dfa0] bg-[#fff8ea] p-2.5 text-left">
              <span className="block text-[13px] font-extrabold text-[#8a4a05]">বকেয়া টাকা পরিশোধ না করা</span>
              <span className="block text-[11.5px] text-[#8a4a05]/80">ড্যাশবোর্ড বন্ধ থাকবে, বকেয়ার নোটিশ যাবে</span>
            </button>
            <button type="button" onClick={() => toggleBlock("misuse")} className="rounded-md border border-[#f7c3ca] bg-[#fff1f2] p-2.5 text-left">
              <span className="block text-[13px] font-extrabold text-[#c81f38]">অপব্যবহার/নষ্ট প্রমাণিত — ওয়ারেন্টি বাতিল</span>
              <span className="block text-[11.5px] text-[#c81f38]/80">ওয়ারেন্টি বাতিলের নোটিশ ও SMS যাবে</span>
            </button>
            <button type="button" onClick={() => setBlockFor(false)} className="h-9 rounded-md border border-[#dfe6f2] text-[13px] font-bold text-[#5b6784]">বাতিল</button>
          </div>
        </div>
      )}
    </div>
  );
}

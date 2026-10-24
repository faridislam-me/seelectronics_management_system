"use client";

import type { SellerSoldProduct } from "@/actions/sellerActions";
import CustomerForm from "@/components/features/customers/CustomerForm";
import { serviceChargeDue } from "@/constants/serviceCharges";
import { productImage, serviceStatusStyle } from "@/lib/serviceStatusStyle";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { ChevronRight, Download, Info, Phone, Plus, Search, ShieldCheck, ShieldX, Wrench, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FilterChips, SellerTabs } from "./sellerShared";

type Filter = "all" | "warranty" | "expired" | "inservice" | "due" | "servicedue";

/**
 * The seller's sales as one card per unit sold (not one row per customer):
 * tap a product (বিস্তারিত) to see everything about it and to request a
 * service / install from there; the card itself only links to details + invoice.
 */
export default function SellerSalesClient({ products, counts }: { products: SellerSoldProduct[]; counts: { sales: number; services: number; installs: number } }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const isActive = (s: { status: string }) => !["completed", "canceled"].includes(s.status);
  const serviceDueOf = (p: SellerSoldProduct) => p.services.reduce((t, s) => t + serviceChargeDue(s.charge), 0);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return products.filter((p) => {
      if (t && ![p.customerName, p.customerPhone, p.customerId, p.originalCustomerId, p.invoiceNumber, p.model, p.serialNumber, p.customerAddress].some((v) => v?.toLowerCase().includes(t))) return false;
      const warrantyOk = p.warrantyActive && !p.isWarrantyStopped;
      if (filter === "warranty" && !warrantyOk) return false;
      if (filter === "expired" && warrantyOk) return false;
      if (filter === "inservice" && !p.services.some(isActive)) return false;
      if (filter === "due" && !(p.invoiceDue > 0)) return false;
      if (filter === "servicedue" && !(serviceDueOf(p) > 0)) return false;
      return true;
    });
  }, [products, q, filter]);

  const customers = new Set(products.map((p) => p.customerId)).size;
  const inWarranty = products.filter((p) => p.warrantyActive && !p.isWarrantyStopped).length;
  const card = "rounded-md bg-white border border-[#dfe6f2] shadow-[0_4px_14px_rgba(11,61,145,0.06)]";

  return (
    <div className="flex flex-col gap-2.5 p-2">
      {showAdd && <CustomerForm mode="create" role="seller" onClose={() => { setShowAdd(false); router.refresh(); }} />}

      <SellerTabs active="sales" counts={counts} />

      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-lg font-extrabold text-[#16213a]">আমার বিক্রি</span>
          <span className="text-xs font-semibold text-[#6b7690]">{products.length} টি পণ্য · {customers} জন কাস্টমার · {inWarranty} টি ওয়ারেন্টিতে</span>
        </div>
        <button onClick={() => setShowAdd(true)} className="h-11 px-3.5 rounded-md bg-[#1f7cf0] text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-[0_6px_16px_rgba(31,124,240,0.35)] active:scale-[0.98] transition-all">
          <Plus size={18} strokeWidth={2.6} />নতুন বিক্রি
        </button>
      </div>

      <label className="flex items-center gap-2 h-11 px-3.5 rounded-md bg-white border border-[#e3e8f1] text-sm">
        <Search size={16} className="text-[#9aa4b8]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="নাম, ফোন, কাস্টমার আইডি, ইনভয়েস বা মডেল" className="flex-1 outline-none bg-transparent" />
      </label>

      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { key: "all", label: `সব (${products.length})` },
          { key: "warranty", label: `ওয়ারেন্টি আছে (${inWarranty})` },
          { key: "expired", label: `ওয়ারেন্টি শেষ (${products.length - inWarranty})` },
          { key: "inservice", label: `সার্ভিসে আছে (${products.filter((p) => p.services.some(isActive)).length})` },
          { key: "due", label: `বাকি আছে (${products.filter((p) => p.invoiceDue > 0).length})` },
          { key: "servicedue", label: `সার্ভিস চার্জ বাকি (${products.filter((p) => serviceDueOf(p) > 0).length})` },
        ]}
      />

      {products.length === 0 && (
        <div className={clsx(card, "p-8 text-center flex flex-col items-center gap-2")}>
          <span className="text-[15px] font-extrabold text-[#16213a]">এখনো কোনো বিক্রি নেই</span>
          <span className="text-[12.5px] font-medium text-[#5b6784]">উপরের &quot;নতুন বিক্রি&quot; বাটনে ক্লিক করে প্রথম কাস্টমার ও পণ্য যোগ করুন।</span>
        </div>
      )}
      {products.length > 0 && list.length === 0 && <div className={clsx(card, "p-6 text-center text-[13px] font-semibold text-[#5b6784]")}>কিছু পাওয়া যায়নি</div>}

      {list.map((p) => {
        const warrantyOk = p.warrantyActive && !p.isWarrantyStopped;
        const active = p.services.find(isActive);
        const latest = p.services[0];
        const href = `/seller/products/${p.id}`;
        return (
          <article key={p.id} className={clsx(card, "p-2.5 flex flex-col gap-2")}>
            <Link href={href} className="flex items-start gap-2.5">
              <span className="relative size-[76px] rounded-md bg-white border border-[#e6ebf4] overflow-hidden shrink-0">
                <Image src={productImage(p.type)} alt={p.type} fill sizes="76px" className="object-contain p-1" />
              </span>
              <span className="flex flex-col gap-1 min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="px-2 h-6 rounded-md bg-[#e8f1ff] text-[#1b6fd6] text-[10px] font-extrabold tracking-wide inline-flex items-center uppercase">{p.type}</span>
                  <span className={clsx("inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10.5px] font-extrabold", p.isWarrantyStopped ? "bg-[#fff6e3] text-[#b8620b]" : warrantyOk ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>
                    {warrantyOk ? <ShieldCheck size={12} /> : <ShieldX size={12} />}
                    {p.isWarrantyStopped ? (p.warrantyStopReason === "misuse" ? "ওয়ারেন্টি বাতিল" : "বকেয়া ব্লক") : p.warrantyDurationMonths === 0 ? "ওয়ারেন্টি নেই" : warrantyOk ? `ওয়ারেন্টি ${formatDate(p.warrantyEnd)} পর্যন্ত` : "ওয়ারেন্টি শেষ"}
                  </span>
                </span>
                <span className="text-[14px] font-extrabold text-[#16213a] leading-tight break-words">{p.model}{p.quantity > 1 ? ` × ${p.quantity}` : ""}</span>
                <span className="text-[13px] font-bold text-[#16213a] leading-tight truncate">{p.customerName}</span>
                <span className="text-[11.5px] font-semibold text-[#6b7690] leading-tight">#{p.invoiceNumber} · ID {p.originalCustomerId || p.customerId} · {formatDate(p.invoiceDate)}</span>
              </span>
              <ChevronRight size={18} className="text-[#9aa6bd] shrink-0 self-center" />
            </Link>

            <div className="flex flex-wrap items-center gap-1.5 text-[11.5px] font-semibold text-[#5b6784]">
              <a href={`tel:${p.customerPhone}`} className="inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#f5f8fd] border border-[#e3ebf7] text-[#0b3d91] font-bold"><Phone size={12} />{p.customerPhone}</a>
              <span className={clsx("inline-flex items-center h-7 px-2 rounded-md border", p.invoiceDue > 0 ? "bg-[#fff6e3] border-[#f5dfa0] text-[#b8620b] font-extrabold" : "bg-[#f5f8fd] border-[#e3ebf7]")}>
                {p.invoiceDue > 0 ? `বাকি ৳${p.invoiceDue.toLocaleString()}` : `৳${(p.unitPrice * p.quantity).toLocaleString()} · পরিশোধিত`}
              </span>
              {serviceDueOf(p) > 0 && (
                <span className="inline-flex items-center h-7 px-2 rounded-md border bg-[#fff6e3] border-[#f5dfa0] text-[#b8620b] font-extrabold">সার্ভিস বাকি ৳{Math.round(serviceDueOf(p)).toLocaleString()}</span>
              )}
              {latest && (() => {
                const st = serviceStatusStyle(latest.status);
                return (
                  <Link href={`/service-track?trackingId=${latest.serviceId}`} className={clsx("ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md border text-[10.5px] font-extrabold truncate", st.cls)}>
                    {latest.type === "install" ? <Zap size={11} /> : <Wrench size={11} />}
                    {st.label}
                  </Link>
                );
              })()}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link href={href} className="h-10 rounded-md text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 bg-[#1f7cf0] text-white shadow-[0_4px_12px_rgba(31,124,240,0.3)]">
                <Info size={15} />বিস্তারিত
              </Link>
              <a href={`/pdf/download?type=invoice&id=${p.invoiceNumber}`} target="_blank" className="h-10 rounded-md text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 bg-[#f5f8fd] border border-[#d6e2f5] text-[#0b3d91]">
                <Download size={15} />ইনভয়েস
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}

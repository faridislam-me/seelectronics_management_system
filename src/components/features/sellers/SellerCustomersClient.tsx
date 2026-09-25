"use client";

import { BlueCard, BlueChip } from "@/components/ui/BlueDashboard";
import CustomerForm from "@/components/features/customers/CustomerForm";
import { PaymentTypes } from "@/types";
import { formatDate } from "@/utils";
import { Pencil, Plus, Search, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type SellerCustomer = {
  customerId: string;
  name: string;
  phone: string;
  address: string;
  invoiceNumber: string;
  isWarrantyStopped: boolean | null;
  createdAt: Date;
  referredByVipCard: string | null;
  sellerId: string | null;
  invoice: {
    id: string;
    total: number;
    subtotal: number;
    dueAmount: number;
    dueType: "due" | "installment" | null;
    notes: string | null;
    paymentType: string;
    date: Date;
    products: { type: string; model: string; quantity: number; warrantyStartDate: Date; warrantyDurationMonths: number }[];
  } | null;
  services: { serviceId: string; status: string; type: string; productType: string; productModel: string; staffName: string | null; createdAt: Date }[];
};

export default function SellerCustomersClient({ customers, inWarranty }: { customers: SellerCustomer[]; inWarranty: number }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<SellerCustomer | null>(null);
  const [query, setQuery] = useState("");
  const now = new Date();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => [c.name, c.phone, c.customerId, c.invoiceNumber, c.address].some((v) => v?.toLowerCase().includes(q)));
  }, [customers, query]);

  const toFormData = (c: SellerCustomer) => ({
    customerId: c.customerId,
    name: c.name,
    phone: c.phone,
    address: c.address,
    referredByVipCard: c.referredByVipCard,
    sellerId: c.sellerId,
    invoice: {
      id: c.invoice?.id || "",
      date: c.invoice ? new Date(c.invoice.date) : new Date(),
      paymentType: (c.invoice?.paymentType || "cash") as PaymentTypes,
      subtotal: c.invoice?.subtotal || 0,
      total: c.invoice?.total || 0,
      dueAmount: c.invoice?.dueAmount || 0,
      dueType: (c.invoice?.dueType || "due") as "due" | "installment",
      notes: c.invoice?.notes || "",
    },
  });

  const close = () => { setShowAdd(false); setEditing(null); router.refresh(); };

  return (
    <div className="flex flex-col gap-3.5 p-3.5">
      {showAdd && <CustomerForm mode="create" role="seller" onClose={close} />}
      {editing && <CustomerForm mode="update" role="seller" customerData={toFormData(editing)} onClose={close} />}

      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-lg font-extrabold text-[#16213a]">My customers</span>
          <span className="text-xs font-semibold text-[#6b7690]">{customers.length} customers · {inWarranty} in warranty</span>
        </div>
        <button onClick={() => setShowAdd(true)} className="h-11 px-4 rounded-lg bg-[#1f7cf0] text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-[0_6px_16px_rgba(31,124,240,0.35)] active:scale-[0.98] transition-all">
          <Plus size={18} strokeWidth={2.6} />পণ্য বিক্রি / কাস্টমার এড
        </button>
      </div>

      <label className="flex items-center gap-2 h-11 px-3.5 rounded-lg bg-white border border-[#e3e8f1] text-sm">
        <Search size={16} className="text-[#9aa4b8]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="নাম, ফোন, আইডি বা ইনভয়েস দিয়ে খুঁজুন" className="flex-1 outline-none bg-transparent" />
      </label>

      <BlueCard className="flex flex-col gap-2.5">
        {customers.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-6">এখনো কোনো কাস্টমার নেই। উপরের বাটনে ক্লিক করে প্রথম বিক্রি এন্ট্রি করুন।</div>
        )}
        {customers.length > 0 && filtered.length === 0 && <div className="text-center text-sm text-gray-400 py-6">কিছু পাওয়া যায়নি</div>}
        {filtered.map((c) => {
          const products = c.invoice?.products ?? [];
          const warranty = !c.isWarrantyStopped && products.some((p) => { const e = new Date(p.warrantyStartDate); e.setMonth(e.getMonth() + p.warrantyDurationMonths); return e > now; });
          const active = c.services.some((s) => !["completed", "canceled"].includes(s.status));
          return (
            <details key={c.customerId} className="p-3 rounded-[10px] bg-[#f5f7fb]">
              <summary className="list-none cursor-pointer flex items-center gap-3">
                <span className="size-10 rounded-full bg-[#fff3d6] text-[#b8620b] flex items-center justify-center text-sm font-extrabold shrink-0">{c.name.slice(0, 2).toUpperCase()}</span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span className="text-[13px] font-extrabold text-[#16213a] truncate">{c.name}</span>
                  <span className="text-xs font-semibold text-[#6b7690] truncate">{products.map((p) => `${p.type.toUpperCase()} ${p.model}`).join(", ") || "—"} · {c.phone}</span>
                </span>
                {active ? <BlueChip tone="blue">IN SERVICE</BlueChip> : warranty ? <BlueChip tone="green">WARRANTY</BlueChip> : <BlueChip tone="red">EXPIRED</BlueChip>}
              </summary>
              <div className="mt-3 pt-3 border-t border-[#e6e9f0] flex flex-col gap-1 text-xs">
                <span className="text-[#6b7690]">ID <b className="text-[#16213a]">{c.customerId}</b> · Invoice <b className="text-[#16213a]">{c.invoiceNumber}</b> · {formatDate(c.createdAt)}</span>
                <span className="text-[#6b7690]">Address: <b className="text-[#16213a]">{c.address}</b></span>
                {c.invoice && <span className="text-[#6b7690]">Total ৳{c.invoice.total.toLocaleString()} · Due ৳{c.invoice.dueAmount.toLocaleString()} · {c.invoice.paymentType.toUpperCase()}</span>}
                {products.map((p, i) => { const e = new Date(p.warrantyStartDate); e.setMonth(e.getMonth() + p.warrantyDurationMonths); return <span key={i} className="text-[#6b7690]">{p.type.toUpperCase()} {p.model} × {p.quantity} · warranty until <b className="text-[#16213a]">{formatDate(e)}</b></span>; })}
                <span className="font-bold text-[#16213a] mt-1">Services ({c.services.length})</span>
                {c.services.length === 0 && <span className="text-[#6b7690]">No service yet</span>}
                {c.services.map((s) => (
                  <Link key={s.serviceId} href={`/service-track?trackingId=${s.serviceId}`} className="flex items-center justify-between gap-2 py-1">
                    <span className="text-[#6b7690]">{s.serviceId} · {formatDate(s.createdAt)}{s.staffName ? ` · ${s.staffName}` : ""}</span>
                    <BlueChip tone={s.status === "completed" ? "green" : s.status === "canceled" ? "red" : "blue"}>{s.status.replace(/_/g, " ").toUpperCase()}</BlueChip>
                  </Link>
                ))}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditing(c)} className="h-9 px-3 rounded-lg border-2 border-[#bcd4fb] text-[#1f7cf0] text-xs font-bold inline-flex items-center gap-1.5"><Pencil size={14} />এডিট</button>
                  <Link href="/get-service" className="h-9 px-3 rounded-lg border-2 border-[#bfe8cd] text-[#178a42] text-xs font-bold inline-flex items-center gap-1.5"><Wrench size={14} />সার্ভিস রিকোয়েস্ট</Link>
                </div>
              </div>
            </details>
          );
        })}
      </BlueCard>
    </div>
  );
}

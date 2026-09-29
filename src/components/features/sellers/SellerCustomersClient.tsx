"use client";

import { sellerRequestService, sellerToggleCustomerBlock } from "@/actions/sellerActions";
import { FilterChips, PayKind, SellerTabs, inWarranty as calcWarranty, payKind, payLabel, serviceStatusBn, statusTone } from "./sellerShared";
import clsx from "clsx";
import { BlueCard, BlueChip } from "@/components/ui/BlueDashboard";
import { Modal } from "@/components/ui";
import { toast } from "react-toastify";
import CustomerForm from "@/components/features/customers/CustomerForm";
import { PaymentTypes } from "@/types";
import { formatDate } from "@/utils";
import { Ban, Home, Pencil, Plus, Search, Send, ShieldCheck, Wrench } from "lucide-react";
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

export default function SellerCustomersClient({ customers, inWarranty, counts }: { customers: SellerCustomer[]; inWarranty: number; counts?: { sales: number; services: number; installs: number } }) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<SellerCustomer | null>(null);
  const [requesting, setRequesting] = useState<SellerCustomer | null>(null);
  const [reqProduct, setReqProduct] = useState(0);
  const [reqIssue, setReqIssue] = useState("");
  const [reqBusy, setReqBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [reqKind, setReqKind] = useState<"repair" | "install">("repair");
  const [pay, setPay] = useState<"all" | PayKind>("all");
  const [war, setWar] = useState<"all" | "yes" | "no">("all");
  const [blockBusy, setBlockBusy] = useState<string | null>(null);

  const toggleBlock = async (c: SellerCustomer) => {
    const blocking = !c.isWarrantyStopped;
    if (blocking && !window.confirm(`${c.name} কে ব্লক করবেন? ব্লক করলে কাস্টমারের ড্যাশবোর্ড ও ওয়ারেন্টি বন্ধ থাকবে।`)) return;
    setBlockBusy(c.customerId);
    const res = await sellerToggleCustomerBlock(c.customerId);
    setBlockBusy(null);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) router.refresh();
  };

  const submitRequest = async () => {
    if (!requesting) return;
    const p = requesting.invoice?.products?.[reqProduct];
    setReqBusy(true);
    const res = await sellerRequestService({
      customerId: requesting.customerId,
      productType: p?.type || "ips",
      productModel: p?.model || "",
      reportedIssue: reqIssue,
      type: reqKind,
    });
    setReqBusy(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) { setRequesting(null); setReqIssue(""); setReqProduct(0); router.refresh(); }
  };
  const now = new Date();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers.filter((c) => {
      if (q && ![c.name, c.phone, c.customerId, c.invoiceNumber, c.address].some((v) => v?.toLowerCase().includes(q))) return false;
      if (pay !== "all" && payKind(c.invoice) !== pay) return false;
      const w = calcWarranty(c.isWarrantyStopped, c.invoice?.products);
      if (war === "yes" && !w) return false;
      if (war === "no" && w) return false;
      return true;
    });
  }, [customers, query, pay, war]);

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
    <div className="flex flex-col gap-2.5 p-2">
      {showAdd && <CustomerForm mode="create" role="seller" onClose={close} />}
      {editing && <CustomerForm mode="update" role="seller" customerData={toFormData(editing)} onClose={close} />}
      {requesting && (
        <Modal isVisible title={reqKind === "install" ? "ইন্সটল আবেদন" : "সার্ভিস রিকোয়েস্ট"} width="500" onClose={() => setRequesting(null)}>
          <div className="flex flex-col gap-3">
            <div className="rounded-md bg-[#f5f7fb] p-3 text-sm">
              <div className="font-extrabold text-[#16213a]">{requesting.name} · {requesting.phone}</div>
              <div className="text-xs text-[#6b7690]">ID {requesting.customerId} · {requesting.address}</div>
            </div>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">{reqKind === "install" ? "কোন পণ্যের ইন্সটল?" : "কোন পণ্যের সার্ভিস?"}</span>
              <select value={reqProduct} onChange={(e) => setReqProduct(Number(e.target.value))} className="__input">
                {(requesting.invoice?.products ?? []).map((p, i) => <option key={i} value={i}>{p.type.toUpperCase()} {p.model} × {p.quantity}</option>)}
                {(requesting.invoice?.products ?? []).length === 0 && <option value={0}>পণ্যের তথ্য নেই</option>}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-gray-700">{reqKind === "install" ? "নোট (ঐচ্ছিক)" : "সমস্যা (ঐচ্ছিক)"}</span>
              <textarea value={reqIssue} onChange={(e) => setReqIssue(e.target.value)} rows={3} placeholder="কাস্টমার কী সমস্যার কথা বলেছে লিখুন" className="w-full rounded-md px-3 py-2 border border-gray-200 bg-gray-50 text-sm outline-none focus:border-brand" />
            </label>
            <p className="text-xs text-[#6b7690]">রিকোয়েস্ট পাঠালে সরাসরি SE Electronics এর {reqKind === "install" ? "ইন্সটলেশন" : "সার্ভিস"} লিস্টে যাবে। অফিস অনুমোদন করলে আপনার মোবাইলে SMS যাবে।</p>
            <button onClick={submitRequest} disabled={reqBusy} className="h-11 rounded-md bg-[#1a9c4b] text-white font-bold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"><Send size={16} />{reqBusy ? "পাঠানো হচ্ছে..." : "রিকোয়েস্ট পাঠান"}</button>
          </div>
        </Modal>
      )}

      <SellerTabs active="sales" counts={counts} />
      <div className="flex items-center gap-3">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-lg font-extrabold text-[#16213a]">বিক্রির লিস্ট</span>
          <span className="text-xs font-semibold text-[#6b7690]">{customers.length} customers · {inWarranty} in warranty</span>
        </div>
        <button onClick={() => setShowAdd(true)} className="h-11 px-4 rounded-md bg-[#1f7cf0] text-white font-bold text-sm inline-flex items-center gap-1.5 shadow-[0_6px_16px_rgba(31,124,240,0.35)] active:scale-[0.98] transition-all">
          <Plus size={18} strokeWidth={2.6} />পণ্য বিক্রি / কাস্টমার এড
        </button>
      </div>

      <label className="flex items-center gap-2 h-11 px-3.5 rounded-md bg-white border border-[#e3e8f1] text-sm">
        <Search size={16} className="text-[#9aa4b8]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="নাম, ফোন, আইডি বা ইনভয়েস দিয়ে খুঁজুন" className="flex-1 outline-none bg-transparent" />
      </label>

      <FilterChips value={pay} onChange={setPay} options={[{ key: "all", label: "সব পেমেন্ট" }, { key: "cash", label: payLabel.cash }, { key: "due", label: payLabel.due }, { key: "installment", label: payLabel.installment }]} />
      <FilterChips value={war} onChange={setWar} options={[{ key: "all", label: "সব ওয়ারেন্টি" }, { key: "yes", label: "ওয়ারেন্টি আছে" }, { key: "no", label: "ওয়ারেন্টি শেষ" }]} />

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
            <details key={c.customerId} className="p-3 rounded-md bg-[#f5f7fb]">
              <summary className="list-none cursor-pointer flex items-center gap-3">
                <span className="size-10 rounded-full bg-[#fff3d6] text-[#b8620b] flex items-center justify-center text-sm font-extrabold shrink-0">{c.name.slice(0, 2).toUpperCase()}</span>
                <span className="flex flex-col flex-1 min-w-0">
                  <span className="text-[13px] font-extrabold text-[#16213a] truncate">{c.name}</span>
                  <span className="text-xs font-semibold text-[#6b7690] truncate">{products.map((p) => `${p.type.toUpperCase()} ${p.model}`).join(", ") || "—"} · {c.phone}</span>
                </span>
                <span className="flex flex-col items-end gap-1 shrink-0">
                  {c.isWarrantyStopped ? <BlueChip tone="red">BLOCKED</BlueChip> : active ? <BlueChip tone="blue">IN SERVICE</BlueChip> : warranty ? <BlueChip tone="green">WARRANTY</BlueChip> : <BlueChip tone="red">EXPIRED</BlueChip>}
                  <span className="text-[10px] font-bold text-[#6b7690]">{payLabel[payKind(c.invoice)]}</span>
                </span>
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
                    <span className={clsx("h-6 px-2 rounded-md border text-[10.5px] font-extrabold inline-flex items-center", statusTone(s.status))}>{s.type === "install" ? "ইন্সটল · " : ""}{serviceStatusBn[s.status] ?? s.status}</span>
                  </Link>
                ))}
                <div className="flex flex-wrap gap-2 mt-2">
                  <button onClick={() => setEditing(c)} className="h-9 px-3 rounded-md border-2 border-[#bcd4fb] text-[#1f7cf0] text-xs font-bold inline-flex items-center gap-1.5"><Pencil size={14} />এডিট</button>
                  <button onClick={() => { setReqKind("repair"); setRequesting(c); setReqProduct(0); setReqIssue(""); }} className="h-9 px-3 rounded-md border-2 border-[#bfe8cd] text-[#178a42] text-xs font-bold inline-flex items-center gap-1.5"><Wrench size={14} />সার্ভিস রিকোয়েস্ট</button>
                  <button onClick={() => { setReqKind("install"); setRequesting(c); setReqProduct(0); setReqIssue(""); }} className="h-9 px-3 rounded-md border-2 border-[#bcd4fb] text-[#1f5fc9] text-xs font-bold inline-flex items-center gap-1.5"><Home size={14} />ইন্সটল আবেদন</button>
                  <button onClick={() => toggleBlock(c)} disabled={blockBusy === c.customerId} className={clsx("h-9 px-3 rounded-md border-2 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50", c.isWarrantyStopped ? "border-[#bfe8cd] text-[#178a42]" : "border-[#f7c3ca] text-[#c81f38]")}>{c.isWarrantyStopped ? <><ShieldCheck size={14} />আনব্লক</> : <><Ban size={14} />ব্লক</>}</button>
                </div>
              </div>
            </details>
          );
        })}
      </BlueCard>
    </div>
  );
}

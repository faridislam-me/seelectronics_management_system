"use client";

import { sellerRequestService, sellerToggleCustomerBlock } from "@/actions/sellerActions";
import { FilterSelects, PayKind, SellerTabs, inWarranty as calcWarranty, payKind, payLabel, serviceStatusBn, statusTone } from "./sellerShared";
import clsx from "clsx";
import { BlueChip } from "@/components/ui/BlueDashboard";
import { DataTable, EmptyRow, Td, Th } from "@/components/ui/DataTable";
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
  warrantyStopReason?: string | null;
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
    products: { type: string; model: string; serialNumber?: string | null; quantity: number; warrantyStartDate: Date; warrantyDurationMonths: number }[];
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
  const [blockFor, setBlockFor] = useState<SellerCustomer | null>(null);

  const toggleBlock = async (c: SellerCustomer, reason?: "due" | "misuse") => {
    const blocking = !c.isWarrantyStopped;
    // Blocking needs a reason: open the chooser first
    if (blocking && !reason) return setBlockFor(c);
    setBlockFor(null);
    setBlockBusy(c.customerId);
    const res = await sellerToggleCustomerBlock(c.customerId, reason);
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
          <Plus size={18} strokeWidth={2.6} />নতুন কাস্টমার
        </button>
      </div>

      <label className="flex items-center gap-2 h-11 px-3.5 rounded-md bg-white border border-[#e3e8f1] text-sm">
        <Search size={16} className="text-[#9aa4b8]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="নাম, ফোন, আইডি বা ইনভয়েস দিয়ে খুঁজুন" className="flex-1 outline-none bg-transparent" />
      </label>

      <FilterSelects pay={pay} onPay={setPay} war={war} onWar={setWar} />

      <DataTable>
        <thead>
          <tr>
            <Th>তারিখ</Th><Th>ইনভয়েস</Th><Th>কাস্টমার</Th><Th>ফোন</Th><Th>পণ্য</Th><Th>সিরিয়াল</Th><Th right>পরিমাণ</Th><Th>ওয়ারেন্টি শেষ</Th><Th>সার্ভিস</Th><Th right>মোট</Th><Th right>বাকি</Th><Th>পেমেন্ট</Th><Th>স্ট্যাটাস</Th><Th>অ্যাকশন</Th>
          </tr>
        </thead>
        <tbody>
          {customers.length === 0 && <EmptyRow cols={14} text="এখনো কোনো কাস্টমার নেই। উপরের বাটনে ক্লিক করে প্রথম কাস্টমার এড করুন।" />}
          {customers.length > 0 && filtered.length === 0 && <EmptyRow cols={14} text="কিছু পাওয়া যায়নি" />}
          {filtered.map((c, ci) => {
            const products = c.invoice?.products ?? [];
            const rows = products.length ? products : [null];
            const span = rows.length;
            const warranty = !c.isWarrantyStopped && products.some((p) => { const e = new Date(p.warrantyStartDate); e.setMonth(e.getMonth() + p.warrantyDurationMonths); return e > now; });
            const active = c.services.some((s) => !["completed", "canceled"].includes(s.status));
            const bg = ci % 2 ? "bg-[#f4f7fc]" : "bg-white";
            return rows.map((p, i) => {
              const mine = p ? c.services.filter((s) => s.productType === p.type && s.productModel === p.model) : [];
              const end = p ? (() => { const e = new Date(p.warrantyStartDate); e.setMonth(e.getMonth() + p.warrantyDurationMonths); return e; })() : null;
              return (
                <tr key={`${c.customerId}-${i}`} className={bg}>
                  {i === 0 && <Td rowSpan={span}>{formatDate(c.createdAt)}</Td>}
                  {i === 0 && <Td rowSpan={span} strong>{c.invoiceNumber}</Td>}
                  {i === 0 && <Td rowSpan={span} nowrap={false} className="min-w-[120px]"><b>{c.name}</b><span className="block text-[11px] text-[#6b7690]">{c.customerId}</span><span className="block text-[11px] text-[#6b7690]">{c.address}</span></Td>}
                  {i === 0 && <Td rowSpan={span}>{c.phone}</Td>}
                  <Td nowrap={false} className="min-w-[130px]">{p ? `${p.type.toUpperCase()} ${p.model}` : "—"}</Td>
                  <Td>{p?.serialNumber || "—"}</Td>
                  <Td right>{p ? p.quantity : "—"}</Td>
                  <Td className={end && end > now && !c.isWarrantyStopped ? "text-[#178a42] font-bold" : "text-[#c81f38] font-bold"}>{end ? formatDate(end) : "—"}</Td>
                  <Td className={mine.length ? "text-[#b8620b] font-bold" : "text-[#178a42]"}>
                    {p ? (mine.length ? <Link href={`/service-track?trackingId=${mine[0].serviceId}`}>{mine.length} বার · {serviceStatusBn[mine[0].status] ?? mine[0].status}</Link> : "হয়নি") : "—"}
                  </Td>
                  {i === 0 && <Td rowSpan={span} right strong>{c.invoice ? `৳${c.invoice.total.toLocaleString()}` : "—"}</Td>}
                  {i === 0 && <Td rowSpan={span} right strong className={c.invoice && c.invoice.dueAmount > 0 ? "text-[#b8620b]" : "text-[#178a42]"}>{c.invoice ? `৳${c.invoice.dueAmount.toLocaleString()}` : "—"}</Td>}
                  {i === 0 && <Td rowSpan={span}>{payLabel[payKind(c.invoice)]}</Td>}
                  {i === 0 && (
                    <Td rowSpan={span}>
                      {c.isWarrantyStopped ? (c.warrantyStopReason === "misuse" ? <BlueChip tone="red">ওয়ারেন্টি বাতিল</BlueChip> : <BlueChip tone="amber">বকেয়া ব্লক</BlueChip>) : active ? <BlueChip tone="blue">IN SERVICE</BlueChip> : warranty ? <BlueChip tone="green">WARRANTY</BlueChip> : <BlueChip tone="red">EXPIRED</BlueChip>}
                    </Td>
                  )}
                  {i === 0 && (
                    <Td rowSpan={span}>
                      <span className="flex gap-1">
                        <button title="এডিট" onClick={() => setEditing(c)} className="size-8 rounded-md border-2 border-[#bcd4fb] text-[#1f7cf0] inline-flex items-center justify-center"><Pencil size={14} /></button>
                        <button title="সার্ভিস রিকোয়েস্ট" onClick={() => { setReqKind("repair"); setRequesting(c); setReqProduct(0); setReqIssue(""); }} className="size-8 rounded-md border-2 border-[#bfe8cd] text-[#178a42] inline-flex items-center justify-center"><Wrench size={14} /></button>
                        <button title="ইন্সটল আবেদন" onClick={() => { setReqKind("install"); setRequesting(c); setReqProduct(0); setReqIssue(""); }} className="size-8 rounded-md border-2 border-[#bcd4fb] text-[#1f5fc9] inline-flex items-center justify-center"><Home size={14} /></button>
                        <button title={c.isWarrantyStopped ? "আনব্লক" : "ব্লক"} onClick={() => toggleBlock(c)} disabled={blockBusy === c.customerId} className={clsx("size-8 rounded-md border-2 inline-flex items-center justify-center disabled:opacity-50", c.isWarrantyStopped ? "border-[#bfe8cd] text-[#178a42]" : "border-[#f7c3ca] text-[#c81f38]")}>{c.isWarrantyStopped ? <ShieldCheck size={14} /> : <Ban size={14} />}</button>
                      </span>
                    </Td>
                  )}
                </tr>
              );
            });
          })}
        </tbody>
      </DataTable>
      {blockFor && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center p-2" onClick={() => setBlockFor(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[400px] rounded-md bg-white p-3 flex flex-col gap-2.5">
            <span className="text-[14.5px] font-extrabold text-[#16213a]">{blockFor.name} — ব্লক করার কারণ</span>
            <button type="button" onClick={() => toggleBlock(blockFor, "due")} className="rounded-md border border-[#f5dfa0] bg-[#fff8ea] p-2.5 text-left">
              <span className="block text-[13px] font-extrabold text-[#8a4a05]">বকেয়া টাকা পরিশোধ না করা</span>
              <span className="block text-[11.5px] text-[#8a4a05]/80">ড্যাশবোর্ড বন্ধ থাকবে, বকেয়ার নোটিশ যাবে</span>
            </button>
            <button type="button" onClick={() => toggleBlock(blockFor, "misuse")} className="rounded-md border border-[#f7c3ca] bg-[#fff1f2] p-2.5 text-left">
              <span className="block text-[13px] font-extrabold text-[#c81f38]">অপব্যবহার/নষ্ট প্রমাণিত — ওয়ারেন্টি বাতিল</span>
              <span className="block text-[11.5px] text-[#c81f38]/80">ওয়ারেন্টি বাতিলের নোটিশ ও SMS যাবে</span>
            </button>
            <button type="button" onClick={() => setBlockFor(null)} className="h-9 rounded-md border border-[#dfe6f2] text-[13px] font-bold text-[#5b6784]">বাতিল</button>
          </div>
        </div>
      )}
    </div>
  );
}

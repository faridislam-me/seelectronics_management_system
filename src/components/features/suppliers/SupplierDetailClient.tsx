"use client";

import {
  addSupplierTransaction,
  deleteSupplierTransaction,
  getSupplierMessageTemplates,
  sendSupplierSms,
  sendSupplierVoiceCall,
} from "@/actions/supplierActions";
import { Modal } from "@/components/ui";
import clsx from "clsx";
import { ArrowLeft, MessageSquare, Pencil, PhoneCall, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import SupplierFormModal from "./SupplierFormModal";

type Supplier = {
  supplierId: string;
  name: string;
  shopName: string;
  phone: string;
  address: string | null;
  origin: string | null;
  username: string;
  isActive: boolean;
  note: string | null;
};
type Entry = { transactionId: string; type: "purchase" | "payment"; amount: number; description: string | null; date: string | Date; balance: number };
type Totals = { purchased: number; paid: number; due: number; entries: number };

const taka = (n: number) => `৳${Math.round(n).toLocaleString("en-IN")}`;
const fmtDate = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const inputCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white px-2.5 text-[14px] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";

export default function SupplierDetailClient({ supplier, ledger, totals }: { supplier: Supplier; ledger: Entry[]; totals: Totals }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [msg, setMsg] = useState<{ mode: "sms" | "voice"; text: string; broadcastId: string } | null>(null);
  const [sending, setSending] = useState(false);

  const openSms = async (transactionId?: string) => {
    const res = await getSupplierMessageTemplates(supplier.supplierId, transactionId);
    if (!res.success) return void toast.error(res.message);
    setMsg({ mode: "sms", text: (transactionId && res.data.entry) || res.data.summary, broadcastId: "" });
  };
  const openVoice = async () => {
    const res = await getSupplierMessageTemplates(supplier.supplierId);
    if (!res.success) return void toast.error(res.message);
    setMsg({ mode: "voice", text: "", broadcastId: res.data.voiceBroadcastId ? String(res.data.voiceBroadcastId) : "" });
  };

  const send = async () => {
    if (!msg) return;
    setSending(true);
    const res = msg.mode === "sms" ? await sendSupplierSms(supplier.supplierId, msg.text) : await sendSupplierVoiceCall(supplier.supplierId, Number(msg.broadcastId));
    setSending(false);
    if (!res.success) return void toast.error(res.message);
    toast.success(res.message);
    setMsg(null);
  };

  const remove = async (e: Entry) => {
    if (!confirm(`Delete this ${e.type} entry of ${taka(e.amount)}?`)) return;
    const res = await deleteSupplierTransaction(e.transactionId);
    if (!res.success) return void toast.error(res.message);
    toast.success(res.message);
    router.refresh();
  };

  return (
    <div className="flex-1 overflow-auto flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Link href="/suppliers" className="size-9 rounded-md border border-[#d9e2f0] bg-white flex items-center justify-center" aria-label="Back"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-extrabold leading-tight">{supplier.name} <span className={clsx("ml-1 align-middle h-6 px-2 rounded-md text-[11px] font-extrabold inline-flex items-center", supplier.isActive ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#ffe9ec] text-[#c81f38]")}>{supplier.isActive ? "ACTIVE" : "INACTIVE"}</span></h1>
            <div className="text-[13px] text-[#5b6784]">{supplier.shopName} · {supplier.phone} · {supplier.origin || "—"} · ID {supplier.supplierId} · Login: {supplier.username}</div>
            {supplier.address && <div className="text-[12px] text-[#5b6784]">{supplier.address}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => openSms()} className="h-9 px-3 rounded-md bg-[#0b3d91] text-white text-[13px] font-bold inline-flex items-center gap-1.5"><MessageSquare size={16} />Send SMS</button>
          <button onClick={openVoice} className="h-9 px-3 rounded-md bg-[#1a9c4b] text-white text-[13px] font-bold inline-flex items-center gap-1.5"><PhoneCall size={16} />Voice Call</button>
          <button onClick={() => setEdit(true)} className="h-9 px-3 rounded-md border border-[#d9e2f0] bg-white text-[13px] font-bold inline-flex items-center gap-1.5"><Pencil size={15} />Edit</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md bg-white border border-[#dfe6f2] p-3"><div className="text-[12px] font-semibold text-[#5b6784]">Total Purchased (মাল)</div><div className="text-[20px] font-extrabold">{taka(totals.purchased)}</div></div>
        <div className="rounded-md bg-white border border-[#dfe6f2] p-3"><div className="text-[12px] font-semibold text-[#5b6784]">Total Paid (পরিশোধ)</div><div className="text-[20px] font-extrabold text-[#178a42]">{taka(totals.paid)}</div></div>
        <div className="rounded-md bg-white border border-[#dfe6f2] p-3"><div className="text-[12px] font-semibold text-[#5b6784]">Due (বাকি)</div><div className={clsx("text-[20px] font-extrabold", totals.due > 0 ? "text-[#c81f38]" : "text-[#178a42]")}>{taka(totals.due)}</div></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        <EntryForm supplierId={supplier.supplierId} type="purchase" onDone={() => router.refresh()} />
        <EntryForm supplierId={supplier.supplierId} type="payment" onDone={() => router.refresh()} />
      </div>

      <div className="rounded-md bg-white border border-[#dfe6f2] overflow-x-auto">
        <div className="px-3 py-2 font-extrabold border-b border-[#eef1f6]">Ledger ({totals.entries})</div>
        {ledger.length === 0 ? (
          <div className="p-6 text-center text-[#5b6784]">No entries yet.</div>
        ) : (
          <table className="w-full text-[14px]">
            <thead className="bg-[#f5f8fd] text-[#5b6784] text-[12px] uppercase">
              <tr>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Description</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-right px-3 py-2">Balance (due)</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {ledger.map((e) => (
                <tr key={e.transactionId} className="border-t border-[#eef1f6]">
                  <td className="px-3 py-2 whitespace-nowrap">{fmtDate(e.date)}</td>
                  <td className="px-3 py-2"><span className={clsx("h-6 px-2 rounded-md text-[11px] font-extrabold inline-flex items-center", e.type === "purchase" ? "bg-[#fff6e3] text-[#b8620b]" : "bg-[#e9f9ef] text-[#178a42]")}>{e.type === "purchase" ? "মাল গ্রহণ" : "পরিশোধ"}</span></td>
                  <td className="px-3 py-2 text-[#3d4a63]">{e.description || "—"}</td>
                  <td className={clsx("px-3 py-2 text-right whitespace-nowrap font-bold", e.type === "payment" && "text-[#178a42]")}>{e.type === "payment" ? "−" : "+"}{taka(e.amount)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-extrabold">{taka(e.balance)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => openSms(e.transactionId)} className="text-[#1f7cf0] mr-3 inline-flex items-center gap-1 text-[12px] font-bold" title="Send SMS about this entry"><MessageSquare size={14} />SMS</button>
                    <button onClick={() => remove(e)} className="text-[#c81f38]" aria-label="Delete entry"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {msg && (
        <Modal title={msg.mode === "sms" ? "Send SMS to supplier" : "Voice call to supplier"} isVisible width="500" onClose={() => setMsg(null)}>
          <div className="flex flex-col gap-3 py-1">
            <div className="text-[13px] text-[#5b6784]">To: <b className="text-[#16213a]">{supplier.name}</b> ({supplier.phone})</div>
            {msg.mode === "sms" ? (
              <>
                <textarea value={msg.text} onChange={(e) => setMsg({ ...msg, text: e.target.value })} rows={5} maxLength={600} className={inputCls + " h-auto py-2"} />
                <div className="text-[11px] text-[#5b6784] text-right">{msg.text.length}/600</div>
              </>
            ) : (
              <>
                <p className="text-[13px] text-[#3d4a63]">Voice calls play a pre-recorded message from the voice provider (MRAM). Enter the broadcast ID of the supplier reminder recording. Amounts are best sent by SMS.</p>
                <label className="flex flex-col gap-1 text-[13px] font-semibold">Voice Broadcast ID<input value={msg.broadcastId} onChange={(e) => setMsg({ ...msg, broadcastId: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={inputCls} /></label>
              </>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setMsg(null)} className="h-10 px-4 rounded-md border border-[#d9e2f0] font-bold">Cancel</button>
              <button onClick={send} disabled={sending || (msg.mode === "sms" ? !msg.text.trim() : !msg.broadcastId)} className="h-10 px-5 rounded-md bg-[#0b3d91] text-white font-bold disabled:opacity-60">{sending ? "Sending..." : msg.mode === "sms" ? "Send SMS" : "Start Call"}</button>
            </div>
          </div>
        </Modal>
      )}

      {edit && <SupplierFormModal initial={supplier} onClose={() => setEdit(false)} />}
    </div>
  );
}

function EntryForm({ supplierId, type, onDone }: { supplierId: string; type: "purchase" | "payment"; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = Object.fromEntries(new FormData(form));
    setPending(true);
    const res = await addSupplierTransaction({ ...fd, supplierId, type });
    setPending(false);
    if (!res.success) return void toast.error(res.message);
    toast.success(res.message);
    form.reset();
    onDone();
  };
  const isPurchase = type === "purchase";
  return (
    <form onSubmit={submit} className={clsx("rounded-md border p-3 flex flex-col gap-2", isPurchase ? "bg-[#fffaf0] border-[#f5dfa0]" : "bg-[#f3fbf6] border-[#bfe8cd]")}>
      <div className={clsx("font-extrabold text-[14px]", isPurchase ? "text-[#b8620b]" : "text-[#178a42]")}>{isPurchase ? "+ মাল গ্রহণ (Purchase)" : "+ পরিশোধ (Payment)"}</div>
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" type="number" min="1" step="0.01" required placeholder="Amount ৳" className={inputCls} />
        <input name="date" type="date" defaultValue={today} className={inputCls} />
      </div>
      <input name="description" placeholder={isPurchase ? "কী মাল / চালান নম্বর (optional)" : "কীভাবে দেওয়া হয়েছে (optional)"} className={inputCls} />
      <button type="submit" disabled={pending} className={clsx("h-10 rounded-md text-white font-bold disabled:opacity-60", isPurchase ? "bg-[#e0a11b]" : "bg-[#1a9c4b]")}>{pending ? "Saving..." : isPurchase ? "Add Purchase" : "Add Payment"}</button>
    </form>
  );
}

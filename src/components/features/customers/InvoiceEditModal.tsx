"use client";

import { getInvoiceForEdit, updateInvoiceById } from "@/actions";
import { Modal, Spinner } from "@/components";
import SellerSelect from "@/components/features/sellers/SellerSelect";
import { productTypes, warrantyMonths } from "@/constants";
import { formatWarrantyDuration } from "@/utils";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const PAYMENT_TYPES = ["cash", "bkash", "nagad", "rocket", "bank"] as const;

type Row = {
  type: string;
  model: string;
  serialNumber: string;
  quantity: number;
  unitPrice: number;
  warrantyStartDate: string; // yyyy-mm-dd
  warrantyDurationMonths: number;
};

const toDateInput = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

/**
 * Edit ONE invoice of a customer: its products (add / remove / change),
 * prices, date, payment method, due and note. Other invoices of the same
 * customer are untouched.
 */
export default function InvoiceEditModal({
  invoiceId,
  onClose,
  onSaved,
}: {
  invoiceId: string;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [date, setDate] = useState("");
  const [paymentType, setPaymentType] = useState<string>("cash");
  const [dueType, setDueType] = useState<"due" | "installment">("due");
  const [dueAmount, setDueAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [sellerId, setSellerId] = useState<string>("");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getInvoiceForEdit(invoiceId);
      setLoading(false);
      if (!res.success || !res.data) {
        toast.error(("message" in res && res.message) || "Could not load invoice");
        onClose();
        return;
      }
      const d = res.data;
      setInvoiceNumber(d.invoiceNumber);
      setDate(toDateInput(d.date));
      setPaymentType(String(d.paymentType || "cash"));
      setDueType((d.dueType as "due" | "installment") || "due");
      setDueAmount(Number(d.dueAmount) || 0);
      setNotes(d.notes || "");
      setSellerId((d as any).sellerId || "");
      setRows(
        (d.products as any[]).map((p) => ({
          type: p.type,
          model: p.model,
          serialNumber: p.serialNumber ?? "",
          quantity: Number(p.quantity) || 1,
          unitPrice: Number(p.unitPrice) || 0,
          warrantyStartDate: toDateInput(p.warrantyStartDate),
          warrantyDurationMonths: Number(p.warrantyDurationMonths) || 0,
        })),
      );
    })();
  }, [invoiceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = rows.reduce((t, r) => t + (Number(r.unitPrice) || 0) * (Number(r.quantity) || 0), 0);

  const update = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () =>
    setRows((rs) => [...rs, { type: "ips", model: "", serialNumber: "", quantity: 1, unitPrice: 0, warrantyStartDate: date || toDateInput(new Date()), warrantyDurationMonths: 12 }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, idx) => idx !== i));

  const save = async () => {
    if (rows.length === 0) return toast.error("অন্তত একটি পণ্য দিন");
    if (rows.some((r) => !r.model.trim() || r.quantity <= 0 || r.unitPrice < 0)) {
      return toast.error("প্রতিটি পণ্যের মডেল, পরিমাণ ও দাম দিন");
    }
    setSaving(true);
    const res = await updateInvoiceById(invoiceId, {
      date,
      paymentType,
      dueAmount: Number(dueAmount) || 0,
      dueType,
      notes,
      sellerId,
      products: rows,
    });
    setSaving(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) {
      onSaved?.();
      onClose();
    }
  };

  const input = "w-full bg-gray-50 border border-gray-200 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brand/20";

  return (
    <Modal title={`ইনভয়েস এডিট${invoiceNumber ? ` · #${invoiceNumber}` : ""}`} isVisible onClose={onClose} width="900">
      {loading ? (
        <div className="py-10 text-center"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Invoice-level fields */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="text-xs font-semibold text-gray-600 flex flex-col gap-1">তারিখ
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
            </label>
            <label className="text-xs font-semibold text-gray-600 flex flex-col gap-1">পেমেন্ট
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={input}>
                {PAYMENT_TYPES.map((p) => <option key={p} value={p}>{p.toUpperCase()}</option>)}
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600 flex flex-col gap-1">বাকির ধরন
              <select value={dueType} onChange={(e) => setDueType(e.target.value as "due" | "installment")} className={input}>
                <option value="due">Due</option>
                <option value="installment">Installment</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-gray-600 flex flex-col gap-1">বাকি (৳)
              <input type="number" min={0} value={dueAmount} onChange={(e) => setDueAmount(Number(e.target.value))} className={input} />
            </label>
          </div>

          {/* Seller / dealer this purchase is attributed to. Setting it here makes
              the product show in that seller's own account too. */}
          <div className="rounded-md border border-blue-100 bg-blue-50/40 p-2.5">
            <SellerSelect value={sellerId} onChange={setSellerId} className="text-start" />
            <p className="mt-1 text-[11px] text-gray-500">এই বিক্রিটি কোন সেলার/ডিলারের তা নির্বাচন করুন — তাহলে এটি ওই সেলারের একাউন্টেও দেখা যাবে। (Direct = সরাসরি SE Electronics)</p>
          </div>

          {/* Products */}
          <div className="overflow-x-auto border border-gray-100 rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-600">
                  <th className="px-2 py-2">ধরন</th>
                  <th className="px-2 py-2">মডেল</th>
                  <th className="px-2 py-2">সিরিয়াল</th>
                  <th className="px-2 py-2 w-16">পরিমাণ</th>
                  <th className="px-2 py-2 w-24">দাম</th>
                  <th className="px-2 py-2 w-28">ওয়ারেন্টি</th>
                  <th className="px-2 py-2 w-36">শুরুর তারিখ</th>
                  <th className="px-2 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1.5">
                      <select value={r.type} onChange={(e) => update(i, { type: e.target.value })} className={input}>
                        {productTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5"><input value={r.model} onChange={(e) => update(i, { model: e.target.value })} className={input} placeholder="মডেল" /></td>
                    <td className="px-2 py-1.5"><input value={r.serialNumber} onChange={(e) => update(i, { serialNumber: e.target.value })} className={input} placeholder="—" /></td>
                    <td className="px-2 py-1.5"><input type="number" min={1} value={r.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) })} className={input} /></td>
                    <td className="px-2 py-1.5"><input type="number" min={0} value={r.unitPrice} onChange={(e) => update(i, { unitPrice: Number(e.target.value) })} className={input} /></td>
                    <td className="px-2 py-1.5">
                      <select value={r.warrantyDurationMonths} onChange={(e) => update(i, { warrantyDurationMonths: Number(e.target.value) })} className={input}>
                        {warrantyMonths.map((m) => <option key={m} value={m}>{formatWarrantyDuration(m)}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-1.5"><input type="date" value={r.warrantyStartDate} onChange={(e) => update(i, { warrantyStartDate: e.target.value })} className={input} /></td>
                    <td className="px-2 py-1.5 text-center">
                      <button type="button" onClick={() => removeRow(i)} className="text-red-500 hover:text-red-700" title="মুছুন"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline"><Plus size={16} />পণ্য যোগ করুন</button>
            <span className="text-sm font-semibold text-gray-700">সাবটোটাল: ৳{subtotal.toLocaleString()}</span>
          </div>

          <label className="text-xs font-semibold text-gray-600 flex flex-col gap-1">নোট
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${input} h-16`} placeholder="ঐচ্ছিক" />
          </label>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md text-sm font-semibold">বাতিল</button>
            <button type="button" onClick={save} disabled={saving} className="__btn disabled:opacity-50">{saving ? "সেভ হচ্ছে..." : "সেভ করুন"}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

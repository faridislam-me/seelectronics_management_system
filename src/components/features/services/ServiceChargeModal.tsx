"use client";

import { collectServiceCharge, getServiceCharge, removeServiceCharge, setServiceCharge, waiveServiceCharge } from "@/actions/serviceChargeActions";
import { InputField, Modal, Spinner } from "@/components/ui";
import { SERVICE_CHARGE_METHODS, SERVICE_CHARGE_REASONS, type ServiceChargeReason, serviceChargeReasonLabel } from "@/constants/serviceCharges";
import type { ServicesType } from "@/types";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

type Charge = NonNullable<Awaited<ReturnType<typeof getServiceCharge>>["data"]>;

const money = (n: number) => `৳${Math.round(n).toLocaleString("en-US")}`;

/**
 * Admin: set the service charge on a job (out of warranty, out of city, parts…),
 * collect it (fully or in parts), waive the rest, or remove it. The customer
 * and the seller who sold the unit are notified by the server actions.
 */
export default function ServiceChargeModal({ serviceData, onClose }: { serviceData: ServicesType; onClose: () => void }) {
  const [charge, setCharge] = useState<Charge | null | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState<ServiceChargeReason>("out_of_warranty");
  const [note, setNote] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [method, setMethod] = useState<string>("cash");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<"waive" | "remove" | null>(null);

  const load = async () => {
    const res = await getServiceCharge(serviceData.serviceId);
    const c = res.success ? res.data : null;
    setCharge(c);
    if (c) {
      setAmount(String(c.amount));
      setReason((c.reason as ServiceChargeReason) || "other");
      setNote(c.note ?? "");
      setPayAmount(String(Math.max(0, c.amount - c.paidAmount)));
    }
  };
  useEffect(() => { load(); }, [serviceData.serviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<{ success: boolean; message: string }>) => {
    setBusy(true);
    const res = await fn();
    setBusy(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) { setEditing(false); setConfirm(null); await load(); }
    return res.success;
  };

  const due = charge && charge.status === "due" ? Math.max(0, charge.amount - charge.paidAmount) : 0;

  return (
    <Modal isVisible title="Service Charge" onClose={onClose} width="600">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <InputField label="Service ID" disabled value={serviceData.serviceId} />
          <InputField label="Customer" disabled value={`${serviceData.customerName} · ${serviceData.customerPhone}`} />
          <InputField label="Product" disabled value={`${serviceData.productType.toUpperCase()} ${serviceData.productModel}`} />
          <InputField label="Sold by" disabled value={charge?.seller ? `${charge.seller.shopName} (${charge.seller.sellerId})` : charge ? "SE Electronics (no seller)" : "—"} />
        </div>

        {charge === undefined && <div className="flex justify-center py-6"><Spinner /></div>}

        {charge && !editing && (
          <div className={clsx("rounded-md border p-3 space-y-1.5 text-sm", charge.status === "paid" ? "border-green-200 bg-green-50" : charge.status === "waived" ? "border-gray-200 bg-gray-50" : "border-amber-200 bg-amber-50")}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-base">{money(charge.amount)} <span className="font-semibold text-gray-500 text-xs">· {serviceChargeReasonLabel(charge.reason)}</span></span>
              <span className={clsx("px-2 h-6 rounded-md text-[11px] font-extrabold uppercase inline-flex items-center", charge.status === "paid" ? "bg-green-600 text-white" : charge.status === "waived" ? "bg-gray-500 text-white" : "bg-amber-500 text-white")}>
                {charge.status === "paid" ? "Paid" : charge.status === "waived" ? "Waived" : `Due ${money(due)}`}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Paid {money(charge.paidAmount)}{charge.paymentMethod ? ` via ${charge.paymentMethod.toUpperCase()}` : ""}{charge.paidAt ? ` on ${formatDate(charge.paidAt)}` : ""} · added {formatDate(charge.createdAt)}
            </div>
            {charge.note && <div className="text-xs text-gray-700">Note: {charge.note}</div>}
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={() => setEditing(true)} className="h-8 px-3 rounded-md border border-gray-300 bg-white text-xs font-bold">Edit charge</button>
              {charge.status === "due" && <button type="button" onClick={() => setConfirm("waive")} className="h-8 px-3 rounded-md border border-gray-300 bg-white text-xs font-bold">Waive</button>}
              <button type="button" onClick={() => setConfirm("remove")} className="h-8 px-3 rounded-md border border-red-200 bg-white text-xs font-bold text-red-600">Remove</button>
            </div>
            {confirm && (
              <div className="flex items-center justify-between gap-2 rounded-md border border-red-200 bg-white p-2 text-xs">
                <span className="font-semibold">{confirm === "waive" ? `Waive the remaining ${money(due)}?` : "Remove this charge completely?"}</span>
                <span className="flex gap-1">
                  <button type="button" disabled={busy} onClick={() => run(() => (confirm === "waive" ? waiveServiceCharge(serviceData.serviceId) : removeServiceCharge(serviceData.serviceId)))} className="h-7 px-2.5 rounded-md bg-red-600 text-white font-bold disabled:opacity-50">Yes</button>
                  <button type="button" onClick={() => setConfirm(null)} className="h-7 px-2.5 rounded-md border border-gray-300 font-bold">No</button>
                </span>
              </div>
            )}
          </div>
        )}

        {(charge === null || editing) && (
          <form
            className="space-y-3 rounded-md border border-gray-200 p-3"
            onSubmit={(e) => { e.preventDefault(); run(() => setServiceCharge(serviceData.serviceId, { amount: parseFloat(amount), reason, note })); }}
          >
            <div className="text-sm font-bold">{charge ? "Edit charge" : "Add service charge"}</div>
            <div className="grid grid-cols-2 gap-2">
              <InputField label="Amount (৳)" type="number" min="1" step="1" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Service charge" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value as ServiceChargeReason)} className="h-[42px] rounded-md border border-gray-200 bg-gray-50 px-3 text-sm outline-none">
                  {Object.entries(SERVICE_CHARGE_REASONS).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.english})</option>)}
                </select>
              </div>
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional) — e.g. parts replaced, distance" className="w-full h-16 rounded-md border border-gray-200 bg-gray-50 p-2 text-sm outline-none" />
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="__btn flex-1 disabled:opacity-50">{busy ? "Saving..." : charge ? "Update" : "Add charge"}</button>
              {editing && <button type="button" onClick={() => setEditing(false)} className="h-[42px] px-4 rounded-md border border-gray-300 text-sm font-bold">Cancel</button>}
            </div>
          </form>
        )}

        {charge && charge.status === "due" && !editing && (
          <form
            className="space-y-3 rounded-md border border-green-200 bg-green-50/40 p-3"
            onSubmit={(e) => { e.preventDefault(); run(() => collectServiceCharge(serviceData.serviceId, { amount: parseFloat(payAmount), method })); }}
          >
            <div className="text-sm font-bold">Collect payment</div>
            <div className="grid grid-cols-2 gap-2">
              <InputField label={`Amount (due ${money(due)})`} type="number" min="1" max={due} step="1" required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className="h-[42px] rounded-md border border-gray-200 bg-gray-50 px-3 text-sm outline-none">
                  {SERVICE_CHARGE_METHODS.map((m) => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={busy} className="__btn w-full bg-green-600 disabled:opacity-50">{busy ? "Saving..." : "Record payment"}</button>
          </form>
        )}
      </div>
    </Modal>
  );
}

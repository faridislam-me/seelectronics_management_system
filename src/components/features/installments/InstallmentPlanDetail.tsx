"use client";

import {
  addInstallmentScheduleRow,
  deleteInstallmentPlan,
  markInstallmentPaid,
  updateInstallmentPlanStatus,
  updateInstallmentPlanProduct,
  updateInstallmentScheduleRow,
} from "@/actions/installmentActions";
import { Modal } from "@/components/ui";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import { STATUS_META } from "./InstallmentsClient";

const bdt = (n: number) => `৳${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const DUE_META: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "বাকি", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
  paid: { label: "পরিশোধিত", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  overdue: { label: "খেলাপি", cls: "bg-red-50 text-red-700 border-red-200", icon: Clock },
  claimed: { label: "যাচাই বাকি", cls: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock },
};

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "bank", label: "Bank" },
];

const methodLabel = (m: string | null) =>
  m === "cash" ? "অফিসে নগদ" : METHODS.find((x) => x.value === m)?.label || m || "";

type Schedule = {
  id: string;
  installmentNo: number;
  dueDate: string | Date;
  amount: number;
  status: string;
  paidAmount: number;
  paidAt: string | Date | null;
  paymentMethod: string | null;
  transactionId: string | null;
  paymentNumber: string | null;
};

export default function InstallmentPlanDetail({ data }: { data: any }) {
  const router = useRouter();
  const plan = data.plan;
  const schedule: Schedule[] = data.schedule;
  const sm = STATUS_META[plan.status] || STATUS_META.active;

  const [payRow, setPayRow] = useState<Schedule | null>(null);
  const [paidAmount, setPaidAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [txn, setTxn] = useState("");
  const [payNum, setPayNum] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  // Schedule row add / edit / delete (#10, #13)
  const [addingRow, setAddingRow] = useState(false);
  const [editRow, setEditRow] = useState<Schedule | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDue, setEditDue] = useState("");
  const [editRowSaving, setEditRowSaving] = useState(false);

  const toDateInput = (d: string | Date) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
  };

  const addRow = async () => {
    setAddingRow(true);
    const res = await addInstallmentScheduleRow(plan.planCode);
    setAddingRow(false);
    if (res.success) {
      toast.success(res.message || "যোগ হয়েছে");
      router.refresh();
    } else {
      toast.error(res.message || "যোগ করা যায়নি");
    }
  };

  const openEditRow = (row: Schedule) => {
    setEditRow(row);
    setEditAmount(String(row.amount));
    setEditDue(toDateInput(row.dueDate));
  };

  const saveEditRow = async () => {
    if (!editRow) return;
    setEditRowSaving(true);
    const res = await updateInstallmentScheduleRow({
      scheduleId: editRow.id,
      amount: editAmount ? Number(editAmount) : undefined,
      dueDate: editDue || undefined,
    });
    setEditRowSaving(false);
    if (res.success) {
      toast.success(res.message || "আপডেট হয়েছে");
      setEditRow(null);
      router.refresh();
    } else {
      toast.error(res.message || "আপডেট করা যায়নি");
    }
  };

  const removePlan = async () => {
    if (!window.confirm("এই কিস্তি প্ল্যান ও এর পুরো সময়সূচি স্থায়ীভাবে মুছে ফেলবেন? এটি আর ফেরানো যাবে না।")) return;
    setStatusLoading(true);
    const res = await deleteInstallmentPlan(plan.planCode);
    setStatusLoading(false);
    if (res.success) {
      toast.success(res.message || "মুছে ফেলা হয়েছে");
      router.push("/installments");
      router.refresh();
    } else {
      toast.error(res.message || "মুছে ফেলা যায়নি");
    }
  };

  // Product / sticker-spec edit
  const [showEdit, setShowEdit] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [pForm, setPForm] = useState({
    productModel: plan.productModel || "",
    serialNumber: plan.serialNumber || "",
    productBrand: plan.productBrand || "",
    productSpec: plan.productSpec || "",
    vaWatt: plan.vaWatt || "",
    volt: plan.volt || "",
    displayType: plan.displayType || "",
  });
  const setPF = (k: keyof typeof pForm, v: string) => setPForm((f) => ({ ...f, [k]: v }));

  const openEdit = () => {
    setPForm({
      productModel: plan.productModel || "",
      serialNumber: plan.serialNumber || "",
      productBrand: plan.productBrand || "",
      productSpec: plan.productSpec || "",
      vaWatt: plan.vaWatt || "",
      volt: plan.volt || "",
      displayType: plan.displayType || "",
    });
    setShowEdit(true);
  };

  const saveProduct = async () => {
    if (!pForm.productModel.trim()) {
      toast.error("মডেল আবশ্যক");
      return;
    }
    setEditSaving(true);
    const res = await updateInstallmentPlanProduct(plan.planCode, pForm);
    setEditSaving(false);
    if (res.success) {
      toast.success(res.message || "আপডেট হয়েছে");
      setShowEdit(false);
      router.refresh();
    } else {
      toast.error(res.message || "আপডেট করা যায়নি");
    }
  };

  const openPay = (row: Schedule) => {
    setPayRow(row);
    setPaidAmount(String(row.amount));
    // For a "claimed" row the customer already submitted method/number/txn —
    // prefill so the admin only matches against bKash/Nagad and confirms.
    setMethod(row.paymentMethod || "cash");
    setTxn(row.transactionId || "");
    setPayNum(row.paymentNumber || "");
  };

  const confirmPay = async () => {
    if (!payRow) return;
    setSaving(true);
    const res = await markInstallmentPaid({
      scheduleId: payRow.id,
      paidAmount: paidAmount || undefined,
      paymentMethod: method,
      transactionId: txn || undefined,
      paymentNumber: payNum || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success(res.message || "পরিশোধিত");
      setPayRow(null);
      router.refresh();
    } else {
      toast.error(res.message || "আপডেট করা যায়নি");
    }
  };

  const changeStatus = async (status: "active" | "banned" | "cancelled") => {
    const confirmMsg =
      status === "banned"
        ? "এই কিস্তি অ্যাকাউন্ট ব্যান করবেন? গ্রাহকের কিস্তি প্রোফাইল লক হয়ে যাবে।"
        : status === "cancelled"
          ? "এই প্ল্যান বাতিল করবেন?"
          : "আবার চালু করবেন?";
    if (!window.confirm(confirmMsg)) return;
    setStatusLoading(true);
    const res = await updateInstallmentPlanStatus(plan.planCode, status);
    setStatusLoading(false);
    if (res.success) {
      toast.success(res.message || "আপডেট হয়েছে");
      router.refresh();
    } else {
      toast.error(res.message || "আপডেট করা যায়নি");
    }
  };

  const Stat = ({ label, value, accent }: { label: string; value: string; accent?: boolean }) => (
    <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3">
      <p className="text-[11px] font-semibold text-gray-500">{label}</p>
      <p className={clsx("text-base font-black", accent ? "text-[#0b3d91] dark:text-blue-300" : "text-gray-900 dark:text-white")}>{value}</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/installments" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"><ArrowLeft size={20} /></Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 dark:text-white truncate">{plan.customerName}</h1>
              <span className={clsx("text-[10px] font-bold uppercase px-2 py-1 rounded-full border", sm.cls)}>{sm.label}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{plan.planCode} · {plan.customerPhone}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/pdf/download?type=installment-invoice&id=${plan.planCode}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-[#0b3d91]/25 bg-[#0b3d91]/5 text-[#0b3d91] text-xs font-bold hover:bg-[#0b3d91]/10"
          >
            <Download size={15} /> ইনভয়েস
          </Link>
          <Link
            href={`/pdf/download?type=installment-sticker&id=${plan.planCode}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-gray-200 bg-white text-gray-600 text-xs font-bold hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <QrCode size={15} /> স্টিকার
          </Link>
          <Link
            href={`/pdf/download?type=installment-documents&id=${plan.planCode}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-gray-200 bg-white text-gray-600 text-xs font-bold hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
          >
            <FileText size={15} /> ফাইল (PDF)
          </Link>
          {plan.status === "banned" || plan.status === "cancelled" ? (
            <button disabled={statusLoading} onClick={() => changeStatus("active")} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
              <RotateCcw size={15} /> চালু করুন
            </button>
          ) : (
            <>
              <button disabled={statusLoading} onClick={() => changeStatus("banned")} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100">
                <Ban size={15} /> ব্যান
              </button>
              <button disabled={statusLoading} onClick={() => changeStatus("cancelled")} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-gray-200 bg-white text-gray-600 text-xs font-bold hover:bg-gray-50">
                বাতিল
              </button>
            </>
          )}
          <button disabled={statusLoading} onClick={removePlan} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-red-200 bg-white text-red-600 text-xs font-bold hover:bg-red-50">
            <Trash2 size={15} /> মুছুন
          </button>
        </div>
      </div>

      {/* Money stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <Stat label="ক্যাশ দাম" value={bdt(plan.cashPrice)} />
        <Stat label="অতিরিক্ত চার্জ" value={bdt(plan.extraCharge)} />
        <Stat label="মোট (চার্জসহ)" value={bdt(plan.totalPayable)} />
        <Stat label="ডাউন পেমেন্ট" value={bdt(plan.downPayment)} />
        <Stat label="কিস্তিতে ফাইন্যান্স" value={bdt(plan.financedAmount)} />
        <Stat label="মাসিক কিস্তি" value={bdt(plan.monthlyAmount)} accent />
        <Stat label="পরিশোধিত" value={`${data.paidCount}/${plan.months} · ${bdt(data.paidAmount)}`} />
        <Stat label="বাকি" value={`${data.remainingCount} · ${bdt(data.remainingAmount)}`} />
      </div>

      {/* Product + guarantor */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white"><ShieldCheck size={16} className="text-[#0b3d91]" /> পণ্য</p>
            <button onClick={openEdit} className="flex items-center gap-1 text-xs font-bold text-[#0b3d91] hover:underline"><Pencil size={13} /> এডিট</button>
          </div>
          <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
            <p><span className="text-gray-400">মডেল:</span> <b>{plan.productModel}</b>{plan.productType ? ` (${plan.productType})` : ""}</p>
            {plan.productBrand && <p><span className="text-gray-400">ব্র্যান্ড:</span> {plan.productBrand}</p>}
            {plan.productSpec && <p><span className="text-gray-400">সাইজ/স্পেক:</span> {plan.productSpec}</p>}
            {plan.serialNumber && <p><span className="text-gray-400">সিরিয়াল:</span> {plan.serialNumber}</p>}
            {plan.vaWatt && <p><span className="text-gray-400">VA/ওয়াট:</span> {plan.vaWatt}</p>}
            {plan.volt && <p><span className="text-gray-400">ভোল্ট:</span> {plan.volt}</p>}
            {plan.displayType && <p><span className="text-gray-400">ডিসপ্লে:</span> {plan.displayType}</p>}
            <p><span className="text-gray-400">মেয়াদ:</span> {formatDate(plan.startDate)} → {formatDate(plan.endDate)} ({plan.months} মাস)</p>
          </div>
        </div>
        <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white mb-2"><User size={16} className="text-[#0b3d91]" /> জামিনদার</p>
          {plan.guarantorName || plan.guarantorPhone ? (
            <div className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
              {plan.guarantorName && <p><b>{plan.guarantorName}</b></p>}
              {plan.guarantorPhone && <p>{plan.guarantorPhone}</p>}
              {plan.guarantorAddress && <p className="text-gray-400">{plan.guarantorAddress}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-400">যোগ করা হয়নি</p>
          )}
          {plan.notes && <p className="mt-2 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-2">{plan.notes}</p>}
        </div>
      </div>

      {/* Schedule */}
      <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm font-black text-gray-900 dark:text-white">কিস্তির সময়সূচি</p>
          {plan.status === "active" && (
            <button
              onClick={addRow}
              disabled={addingRow}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#0b3d91] border border-[#0b3d91]/25 bg-[#0b3d91]/5 hover:bg-[#0b3d91]/10 px-2.5 py-1.5 rounded-md disabled:opacity-50"
            >
              {addingRow ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} নতুন কিস্তি
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/40 text-gray-500 text-xs">
              <tr>
                <th className="text-left font-semibold px-4 py-2">#</th>
                <th className="text-left font-semibold px-4 py-2">তারিখ</th>
                <th className="text-right font-semibold px-4 py-2">পরিমাণ</th>
                <th className="text-center font-semibold px-4 py-2">অবস্থা</th>
                <th className="text-right font-semibold px-4 py-2">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {schedule.map((row) => {
                const dm = DUE_META[row.status] || DUE_META.pending;
                return (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                    <td className="px-4 py-2.5 font-bold text-gray-700 dark:text-gray-200">{row.installmentNo}</td>
                    <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{formatDate(row.dueDate)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold">{bdt(row.amount)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={clsx("inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border", dm.cls)}>
                        <dm.icon size={11} />{dm.label}
                      </span>
                      {row.status === "paid" && row.paidAt && (
                        <span className="block text-[10px] text-gray-400 mt-0.5">
                          {formatDate(row.paidAt)}{row.paymentMethod ? ` · ${methodLabel(row.paymentMethod)}` : ""}
                          {row.paymentNumber ? ` · ${row.paymentNumber}` : ""}
                          {row.transactionId ? ` · TxID: ${row.transactionId}` : ""}
                        </span>
                      )}
                      {row.status === "claimed" && (
                        <span className="block text-[10px] text-blue-600 dark:text-blue-300 font-semibold mt-1 leading-tight">
                          গ্রাহক জমা দিয়েছে{row.paymentMethod ? ` · ${methodLabel(row.paymentMethod)}` : ""}
                          {row.paymentNumber ? <><br />নম্বর: {row.paymentNumber}</> : ""}
                          {row.transactionId ? <><br />TxID: <span className="font-mono">{row.transactionId}</span></> : ""}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {row.status !== "paid" && plan.status === "active" ? (
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {row.status === "claimed" ? (
                            <button onClick={() => openPay(row)} className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-md whitespace-nowrap"><ShieldCheck size={13} /> যাচাই করুন</button>
                          ) : (
                            <button onClick={() => openPay(row)} className="text-xs font-bold text-white bg-[#0b3d91] hover:bg-[#0a2f70] px-3 py-1.5 rounded-md">পরিশোধ</button>
                          )}
                          <button onClick={() => openEditRow(row)} title="এডিট" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil size={13} /></button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark paid modal */}
      {payRow && (
        <Modal isVisible title={payRow.status === "claimed" ? `কিস্তি #${payRow.installmentNo} পেমেন্ট যাচাই` : `কিস্তি #${payRow.installmentNo} পরিশোধ`} onClose={() => setPayRow(null)}>
          <div className="space-y-3 max-w-sm">
            {payRow.status === "claimed" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 p-3 text-xs space-y-1">
                <p className="font-black text-blue-700 dark:text-blue-300 flex items-center gap-1.5"><ShieldCheck size={14} /> গ্রাহকের জমা দেওয়া তথ্য</p>
                <p className="text-gray-700 dark:text-gray-200"><span className="text-gray-500">মেথড:</span> <b>{methodLabel(payRow.paymentMethod)}</b></p>
                {payRow.paymentNumber && <p className="text-gray-700 dark:text-gray-200"><span className="text-gray-500">যে নম্বর থেকে পাঠিয়েছে:</span> <b className="font-mono">{payRow.paymentNumber}</b></p>}
                {payRow.transactionId && <p className="text-gray-700 dark:text-gray-200"><span className="text-gray-500">ট্রানজেকশন আইডি:</span> <b className="font-mono">{payRow.transactionId}</b></p>}
                <p className="text-[11px] text-blue-600/80 dark:text-blue-300/80 pt-0.5">bKash/Nagad স্টেটমেন্টের সাথে মিলিয়ে নিশ্চিত করুন। প্রয়োজনে নিচের তথ্য সংশোধন করতে পারেন।</p>
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500">পরিমাণ</label>
              <input type="number" min="0" step="0.01" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} className="__input" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">পেমেন্ট মেথড</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="__input">
                {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {method !== "cash" && (
              <div>
                <label className="text-xs font-semibold text-gray-500">পেমেন্ট নম্বর (যে নম্বর থেকে পাঠিয়েছে)</label>
                <input value={payNum} onChange={(e) => setPayNum(e.target.value)} className="__input" placeholder="01XXXXXXXXX" />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-gray-500">ট্রানজেকশন আইডি {method === "cash" ? "(optional)" : ""}</label>
              <input value={txn} onChange={(e) => setTxn(e.target.value)} className="__input" placeholder="TrxID" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setPayRow(null)} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">বাতিল</button>
              <button disabled={saving} onClick={confirmPay} className="__btn flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "সেভ হচ্ছে..." : payRow.status === "claimed" ? "যাচাই করে পরিশোধিত করুন" : "পরিশোধিত করুন"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit schedule row modal (#10) */}
      {editRow && (
        <Modal isVisible title={`কিস্তি #${editRow.installmentNo} এডিট`} onClose={() => setEditRow(null)}>
          <div className="space-y-3 max-w-sm">
            <div>
              <label className="text-xs font-semibold text-gray-500">পরিমাণ</label>
              <input type="number" min="0" step="0.01" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="__input" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">তারিখ</label>
              <input type="date" value={editDue} onChange={(e) => setEditDue(e.target.value)} className="__input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditRow(null)} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">বাতিল</button>
              <button disabled={editRowSaving} onClick={saveEditRow} className="__btn flex items-center gap-2">
                {editRowSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editRowSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal isVisible title="পণ্যের তথ্য এডিট" onClose={() => setShowEdit(false)}>
          <div className="space-y-3 max-w-md">
            <div>
              <label className="text-xs font-semibold text-gray-500">মডেল *</label>
              <input value={pForm.productModel} onChange={(e) => setPF("productModel", e.target.value)} className="__input" placeholder="মডেল / পণ্যের নাম" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">ব্র্যান্ড</label>
                <input value={pForm.productBrand} onChange={(e) => setPF("productBrand", e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">সাইজ / স্পেক (ইঞ্চি/টন)</label>
                <input value={pForm.productSpec} onChange={(e) => setPF("productSpec", e.target.value)} className="__input" placeholder="যেমন: ৩২ ইঞ্চি / ১.৫ টন" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">সিরিয়াল নম্বর</label>
                <input value={pForm.serialNumber} onChange={(e) => setPF("serialNumber", e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">VA / ওয়াট</label>
                <input value={pForm.vaWatt} onChange={(e) => setPF("vaWatt", e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">ভোল্ট</label>
                <input value={pForm.volt} onChange={(e) => setPF("volt", e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">ডিসপ্লে</label>
                <input value={pForm.displayType} onChange={(e) => setPF("displayType", e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
            </div>
            <div className="flex justify-end gap-x-3 pt-1">
              <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">বাতিল</button>
              <button disabled={editSaving} onClick={saveProduct} className="__btn flex items-center justify-center gap-2">
                {editSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editSaving ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

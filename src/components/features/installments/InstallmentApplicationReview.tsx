"use client";

import { reviewInstallmentApplication } from "@/actions/installmentActions";
import { Modal } from "@/components/ui";
import { formatDate } from "@/utils";
import clsx from "clsx";
import {
  ArrowLeft,
  Ban,
  Camera,
  CheckCircle2,
  CreditCard,
  Loader2,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review: { label: "পর্যালোচনায়", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  approved: { label: "অনুমোদিত", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700 border-red-200" },
};

function ImgCard({ src, label }: { src: string | null; label: string }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className="w-full h-32 object-cover bg-gray-50" />
        <span className="text-[11px] font-bold text-gray-500 px-2 py-1.5">{label}</span>
      </button>
      {open && (
        <Modal isVisible title={label} onClose={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={label} className="max-w-full max-h-[70vh] rounded object-contain" />
        </Modal>
      )}
    </>
  );
}

export default function InstallmentApplicationReview({ data }: { data: any }) {
  const router = useRouter();
  const sm = STATUS_META[data.status] || STATUS_META.pending;
  const urls = data.urls || {};
  const isPending = data.status === "pending" || data.status === "under_review";

  // Approve form state
  const [showApprove, setShowApprove] = useState(false);
  const [cashPrice, setCashPrice] = useState("");
  const [extraCharge, setExtraCharge] = useState("0");
  const [downPayment, setDownPayment] = useState("0");
  const [months, setMonths] = useState("12");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [serialNumber, setSerialNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reject state
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const cp = Number(cashPrice) || 0;
  const ec = Number(extraCharge) || 0;
  const dp = Number(downPayment) || 0;
  const m = Number(months) || 1;
  const total = cp + ec;
  const financed = total - dp;
  const monthly = financed > 0 ? Math.round((financed / m) * 100) / 100 : 0;

  const handleApprove = async () => {
    if (!cp || !m || !startDate) {
      toast.error("ক্যাশ দাম, মেয়াদ ও শুরুর তারিখ আবশ্যক");
      return;
    }
    if (financed <= 0) {
      toast.error("ডাউন পেমেন্ট পুরো দাম কভার করে ফেলেছে");
      return;
    }
    setSaving(true);
    const res = await reviewInstallmentApplication(data.applicationCode, "approve", {
      cashPrice: cp,
      extraCharge: ec,
      downPayment: dp,
      months: m,
      startDate,
      serialNumber: serialNumber || undefined,
      adminNotes: adminNotes || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success(res.message);
      if (res.planCode) {
        router.push(`/installments/${res.planCode}`);
      } else {
        router.push("/installments/applications");
      }
      router.refresh();
    } else {
      toast.error(res.message || "ত্রুটি হয়েছে");
    }
  };

  const handleReject = async () => {
    setSaving(true);
    const res = await reviewInstallmentApplication(data.applicationCode, "reject", {
      rejectReason: rejectReason || undefined,
      adminNotes: adminNotes || undefined,
    });
    setSaving(false);
    if (res.success) {
      toast.success(res.message);
      router.push("/installments/applications");
      router.refresh();
    } else {
      toast.error(res.message || "ত্রুটি হয়েছে");
    }
  };

  const Field = ({ label, value }: { label: string; value: string | null | undefined }) =>
    value ? (
      <p className="text-sm text-gray-600">
        <span className="text-gray-400">{label}:</span> <b>{value}</b>
      </p>
    ) : null;

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/installments/applications" className="p-2 rounded-full hover:bg-gray-100 shrink-0"><ArrowLeft size={20} /></Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-gray-900 truncate">{data.customerName}</h1>
              <span className={clsx("text-[10px] font-bold uppercase px-2 py-1 rounded-full border", sm.cls)}>{sm.label}</span>
            </div>
            <p className="text-xs text-gray-500 font-mono">{data.applicationCode} · {data.customerPhone}</p>
          </div>
        </div>
        {isPending && (
          <div className="flex gap-2">
            <button onClick={() => setShowApprove(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
              <CheckCircle2 size={15} /> অনুমোদন
            </button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100">
              <Ban size={15} /> প্রত্যাখ্যান
            </button>
          </div>
        )}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-2"><CreditCard size={16} className="text-[#0b3d91]" /> পণ্যের তথ্য</p>
          <Field label="মডেল" value={data.productModel} />
          <Field label="ধরন" value={data.productType} />
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-2"><User size={16} className="text-[#0b3d91]" /> গ্রাহক</p>
          <Field label="নাম" value={data.customerName} />
          <Field label="ফোন" value={data.customerPhone} />
          <Field label="ঠিকানা" value={data.customerAddress} />
        </div>
      </div>

      {/* Guarantor */}
      {(data.guarantorName || data.guarantorPhone) && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-2"><ShieldCheck size={16} className="text-[#0b3d91]" /> জামিনদার</p>
          <Field label="নাম" value={data.guarantorName} />
          <Field label="ফোন" value={data.guarantorPhone} />
          <Field label="ঠিকানা" value={data.guarantorAddress} />
        </div>
      )}

      {data.notes && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="text-sm font-black text-gray-900 mb-1">গ্রাহকের নোট</p>
          <p className="text-sm text-gray-600">{data.notes}</p>
        </div>
      )}

      {/* KYC images */}
      <div className="rounded-lg bg-white border border-gray-200 p-3.5">
        <p className="flex items-center gap-2 text-sm font-black text-gray-900 mb-3"><Camera size={16} className="text-[#0b3d91]" /> ডকুমেন্ট</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <ImgCard src={urls.photo} label="ছবি" />
          <ImgCard src={urls.nidFront} label="NID সামনে" />
          <ImgCard src={urls.nidBack} label="NID পিছনে" />
          <ImgCard src={urls.signature} label="স্বাক্ষর" />
          <ImgCard src={urls.guarantorNidFront} label="জামিনদার NID সামনে" />
          <ImgCard src={urls.guarantorNidBack} label="জামিনদার NID পিছনে" />
        </div>
      </div>

      {data.rejectReason && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3.5">
          <p className="text-sm font-bold text-red-700 mb-1">প্রত্যাখ্যানের কারণ</p>
          <p className="text-sm text-red-600">{data.rejectReason}</p>
        </div>
      )}
      {data.adminNotes && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3.5">
          <p className="text-sm font-bold text-blue-700 mb-1">অ্যাডমিন নোট</p>
          <p className="text-sm text-blue-600">{data.adminNotes}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">আবেদনের তারিখ: {formatDate(data.createdAt)}</p>

      {/* Approve modal */}
      {showApprove && (
        <Modal isVisible title="কিস্তি অনুমোদন — দাম ও মেয়াদ" onClose={() => setShowApprove(false)}>
          <div className="space-y-3 max-w-md">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-gray-500">ক্যাশ দাম *</label>
                <input type="number" min="0" step="0.01" value={cashPrice} onChange={(e) => setCashPrice(e.target.value)} className="__input" placeholder="0" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">অতিরিক্ত চার্জ</label>
                <input type="number" min="0" step="0.01" value={extraCharge} onChange={(e) => setExtraCharge(e.target.value)} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">ডাউন পেমেন্ট</label>
                <input type="number" min="0" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">মেয়াদ (মাস) *</label>
                <input type="number" min="1" max="120" value={months} onChange={(e) => setMonths(e.target.value)} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">শুরুর তারিখ *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">সিরিয়াল নম্বর</label>
                <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
            </div>

            {/* Live preview */}
            {cp > 0 && financed > 0 && (
              <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm space-y-1">
                <p><span className="text-gray-500">মোট:</span> <b>৳{total.toLocaleString()}</b></p>
                <p><span className="text-gray-500">কিস্তিতে ফাইন্যান্স:</span> <b>৳{financed.toLocaleString()}</b></p>
                <p><span className="text-gray-500">মাসিক কিস্তি:</span> <b className="text-[#0b3d91]">৳{monthly.toLocaleString()}</b> × {m} মাস</p>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-500">অ্যাডমিন নোট (ঐচ্ছিক)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="__input resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowApprove(false)} className="px-4 py-2 rounded-md hover:bg-gray-100">বাতিল</button>
              <button disabled={saving} onClick={handleApprove} className="__btn flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "সেভ হচ্ছে..." : "অনুমোদন করুন"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject modal */}
      {showReject && (
        <Modal isVisible title="আবেদন প্রত্যাখ্যান" onClose={() => setShowReject(false)}>
          <div className="space-y-3 max-w-sm">
            <div>
              <label className="text-xs font-semibold text-gray-500">প্রত্যাখ্যানের কারণ</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} className="__input resize-none" placeholder="কারণ লিখুন..." />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500">অ্যাডমিন নোট (ঐচ্ছিক)</label>
              <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="__input resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowReject(false)} className="px-4 py-2 rounded-md hover:bg-gray-100">বাতিল</button>
              <button disabled={saving} onClick={handleReject} className="px-4 py-2 rounded-md bg-red-600 text-white font-bold text-sm hover:bg-red-700 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "সেভ হচ্ছে..." : "প্রত্যাখ্যান করুন"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

"use client";

import { reviewInstallmentApplication, updateApplicationTrackingStep } from "@/actions/installmentActions";
import { Modal } from "@/components/ui";
import { installmentChargePercent, installmentTermOptions } from "@/constants";
import { formatDate, toBanglaNumber } from "@/utils";
import clsx from "clsx";
import {
  ArrowLeft,
  Ban,
  Camera,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Home,
  Loader2,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const PRODUCT_LABELS: Record<string, string> = {
  fridge: "ফ্রিজ", ac: "এসি", tv: "টিভি", oven: "ওভেন",
  washing_machine: "ওয়াশিং মেশিন", mobile: "মোবাইল",
  ips: "আই পি এস", battery: "ব্যাটারি", ips_package: "আই পি এস প্যাকেজ",
  stabilizer: "স্ট্যাবিলাইজার", blender: "ব্লেন্ডার", others: "অন্যান্য",
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  under_review: { label: "পর্যালোচনায়", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  approved: { label: "অনুমোদিত", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-700 border-gray-300" },
  reapply: { label: "পুনরায় আবেদন", cls: "bg-orange-50 text-orange-700 border-orange-200" },
};

function ImgCard({ src, label, aspect = "nid" }: { src: string | null; label: string; aspect?: "passport" | "nid" | "signature" }) {
  const [open, setOpen] = useState(false);
  if (!src) return null;
  const h = aspect === "passport" ? "h-40" : aspect === "signature" ? "h-24" : "h-28";
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-lg border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={label} className={clsx("w-full object-cover", h)} />
        <span className="text-[11px] font-bold text-gray-600 px-2 py-1.5 text-center w-full bg-white border-t border-gray-100">{label}</span>
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

const TRACKING_STEPS = [
  { key: "pending", label: "আবেদন গৃহীত" },
  { key: "processing", label: "প্রক্রিয়াধীন" },
  { key: "nid_verify", label: "এনআইডি যাচাই" },
  { key: "address_verify", label: "ঠিকানা যাচাই" },
  { key: "guarantor_verify", label: "জামিনদার যাচাই" },
  { key: "bank_check_verify", label: "ব্যাংক চেক যাচাই" },
  { key: "documents_verified", label: "কাগজপত্র যাচাই শেষ" },
  { key: "approved", label: "অনুমোদিত" },
  { key: "ready_for_delivery", label: "পণ্য বুঝিয়ে দিতে প্রস্তুত" },
];

export default function InstallmentApplicationReview({ data }: { data: any }) {
  const router = useRouter();
  const sm = STATUS_META[data.status] || STATUS_META.pending;
  const urls = data.urls || {};
  const isPending = data.status === "pending" || data.status === "under_review" || data.status === "reapply";

  // Approve form state
  const [showApprove, setShowApprove] = useState(false);
  const [cashPrice, setCashPrice] = useState("");
  const [extraCharge, setExtraCharge] = useState("0");
  const [downPayment, setDownPayment] = useState("0");
  // Prefill from the customer's requested term when it matches an allowed option.
  const [months, setMonths] = useState(() => {
    const req = Number(data.desiredMonths);
    return installmentTermOptions.some((t) => t.months === req) ? String(req) : "12";
  });
  // When true, extraCharge auto-follows the term's fixed % (months × 2% of cash price).
  // Disabled the moment the admin edits the charge by hand.
  const [autoCharge, setAutoCharge] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [serialNumber, setSerialNumber] = useState("");
  const [vaWatt, setVaWatt] = useState("");
  const [volt, setVolt] = useState("");
  const [displayType, setDisplayType] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // Reject state
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Tracking step
  const [trackingStep, setTrackingStep] = useState(data.trackingStep || "pending");
  const [trackingSaving, setTrackingSaving] = useState(false);

  const handleTrackingUpdate = async (step: string) => {
    setTrackingStep(step);
    setTrackingSaving(true);
    const res = await updateApplicationTrackingStep(data.applicationCode, step);
    setTrackingSaving(false);
    if (res.success) {
      toast.success(res.message);
      router.refresh();
    } else {
      toast.error(res.message);
      setTrackingStep(data.trackingStep || "pending");
    }
  };

  const cp = Number(cashPrice) || 0;
  const ec = Number(extraCharge) || 0;
  const dp = Number(downPayment) || 0;
  const m = Number(months) || 1;
  const total = cp + ec;
  const financed = total - dp;
  const monthly = financed > 0 ? Math.round((financed / m) * 100) / 100 : 0;
  const chargePercent = installmentChargePercent(m);

  // Keep the extra charge in sync with the selected term (2%/month of cash price),
  // unless the admin has manually overridden it.
  useEffect(() => {
    if (!autoCharge) return;
    const auto = Math.round(cp * (chargePercent / 100) * 100) / 100;
    setExtraCharge(String(auto));
  }, [cp, chargePercent, autoCharge]);

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
      vaWatt: vaWatt || undefined,
      volt: volt || undefined,
      displayType: displayType || undefined,
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

  const handleStatusAction = async (action: "cancel" | "reapply") => {
    const msg = action === "cancel" ? "আবেদন বাতিল করতে চান?" : "পুনরায় আবেদনের সুযোগ দিতে চান?";
    if (!confirm(msg)) return;
    setSaving(true);
    const res = await reviewInstallmentApplication(data.applicationCode, action);
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
      <p className="text-sm text-[#16213a]">
        <span className="text-[#0a2f70] font-semibold">{label}:</span> <b>{value}</b>
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
            <p className="text-xs text-[#3d4f72] font-mono flex items-center gap-1.5">{data.applicationCode} · <a href={`tel:${data.customerPhone}`} className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700"><Phone size={12} />{data.customerPhone}</a></p>
          </div>
        </div>
        {isPending && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowApprove(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100">
              <CheckCircle2 size={15} /> অনুমোদন
            </button>
            <button onClick={() => setShowReject(true)} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100">
              <Ban size={15} /> প্রত্যাখ্যান
            </button>
            <button onClick={() => handleStatusAction("cancel")} disabled={saving} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-gray-300 bg-gray-50 text-gray-700 text-xs font-bold hover:bg-gray-100">
              <Ban size={15} /> বাতিল
            </button>
            <button onClick={() => handleStatusAction("reapply")} disabled={saving} className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-orange-200 bg-orange-50 text-orange-700 text-xs font-bold hover:bg-orange-100">
              <RefreshCw size={15} /> পুনরায় আবেদন
            </button>
          </div>
        )}
      </div>

      {/* Tracking step */}
      {isPending && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5 flex items-center gap-3 flex-wrap">
          <p className="text-sm font-black text-[#0a2f70] flex items-center gap-2"><ClipboardList size={16} className="text-[#0b3d91]" /> ট্র্যাকিং স্টেপ:</p>
          <select
            value={trackingStep}
            onChange={(e) => handleTrackingUpdate(e.target.value)}
            disabled={trackingSaving}
            className="__input w-auto min-w-[200px] text-sm font-bold"
          >
            {TRACKING_STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          {trackingSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
      )}

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-[#0a2f70] mb-2"><CreditCard size={16} className="text-[#0b3d91]" /> পণ্যের তথ্য</p>
          <Field label="মডেল" value={data.productModel} />
          <Field label="ধরন" value={data.productType ? (PRODUCT_LABELS[data.productType] || data.productType) : undefined} />
          {data.productType === "others" && <Field label="অন্যান্য পণ্য" value={data.productTypeOther} />}
          <Field label="ব্র্যান্ড" value={data.productBrand} />
          <Field label="স্পেসিফিকেশন" value={data.productSpec} />
          <Field label="আবেদিত মেয়াদ" value={data.desiredMonths ? `${data.desiredMonths} মাস` : undefined} />
          <Field label="আবেদিত ডাউন পেমেন্ট" value={data.desiredDownPayment ? `৳${Number(data.desiredDownPayment).toLocaleString()}` : undefined} />
        </div>
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-[#0a2f70] mb-2"><User size={16} className="text-[#0b3d91]" /> গ্রাহক</p>
          <Field label="নাম" value={data.customerName} />
          {data.customerPhone && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-gray-400">ফোন:</span>
              <a href={`tel:${data.customerPhone}`} className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700"><Phone size={13} />{data.customerPhone}</a>
            </p>
          )}
          <Field label="ঠিকানা" value={data.customerAddress} />
          <Field label="পিতার নাম" value={data.fatherName} />
          <Field label="মাতার নাম" value={data.motherName} />
        </div>
      </div>

      {/* Addresses */}
      {(data.currentAddress || data.permanentAddress) && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-[#0a2f70] mb-2"><Home size={16} className="text-[#0b3d91]" /> ঠিকানা বিবরণ</p>
          <Field label="বর্তমান ঠিকানা" value={data.currentAddress} />
          <Field label="স্থায়ী ঠিকানা" value={data.permanentAddress} />
          {data.isRenting && (
            <>
              <p className="text-xs font-bold text-amber-600 mt-1">ভাড়াটিয়া</p>
              <Field label="বাড়ির মালিকের নাম" value={data.landlordName} />
              {data.landlordPhone && (
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="text-gray-400">বাড়ির মালিকের ফোন:</span>
                  <a href={`tel:${data.landlordPhone}`} className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700"><Phone size={13} />{data.landlordPhone}</a>
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Guarantor */}
      {(data.guarantorName || data.guarantorPhone) && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-[#0a2f70] mb-2"><ShieldCheck size={16} className="text-[#0b3d91]" /> জামিনদার</p>
          <Field label="নাম" value={data.guarantorName} />
          {data.guarantorPhone && (
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-gray-400">ফোন:</span>
              <a href={`tel:${data.guarantorPhone}`} className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:text-blue-700"><Phone size={13} />{data.guarantorPhone}</a>
            </p>
          )}
          <Field label="ঠিকানা" value={data.guarantorAddress} />
        </div>
      )}

      {data.notes && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="text-sm font-black text-[#0a2f70] mb-1">গ্রাহকের নোট</p>
          <p className="text-sm text-[#16213a]">{data.notes}</p>
        </div>
      )}

      {/* KYC images */}
      <div className="rounded-lg bg-white border border-gray-200 p-3.5">
        <p className="flex items-center gap-2 text-sm font-black text-[#0a2f70] mb-3"><Camera size={16} className="text-[#0b3d91]" /> আবেদনকারীর ডকুমেন্ট</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          <ImgCard src={urls.photo} label="ছবি" aspect="passport" />
          <ImgCard src={urls.nidFront} label="NID সামনে" aspect="nid" />
          <ImgCard src={urls.nidBack} label="NID পিছনে" aspect="nid" />
          <ImgCard src={urls.signature} label="স্বাক্ষর" aspect="signature" />
          <ImgCard src={urls.bankCheck} label="ব্যাংক চেক" aspect="nid" />
        </div>
      </div>

      {/* Guarantor images */}
      {(urls.guarantorPhoto || urls.guarantorSignature || urls.guarantorNidFront || urls.guarantorNidBack) && (
        <div className="rounded-lg bg-white border border-gray-200 p-3.5">
          <p className="flex items-center gap-2 text-sm font-black text-[#0a2f70] mb-3"><ShieldCheck size={16} className="text-[#0b3d91]" /> জামিনদারের ডকুমেন্ট</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <ImgCard src={urls.guarantorPhoto} label="জামিনদার ছবি" aspect="passport" />
            <ImgCard src={urls.guarantorSignature} label="জামিনদার স্বাক্ষর" aspect="signature" />
            <ImgCard src={urls.guarantorNidFront} label="জামিনদার NID সামনে" aspect="nid" />
            <ImgCard src={urls.guarantorNidBack} label="জামিনদার NID পিছনে" aspect="nid" />
          </div>
        </div>
      )}

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

      <p className="text-xs text-[#3d4f72]">আবেদনের তারিখ: {formatDate(data.createdAt)}</p>

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
                <label className="text-xs font-semibold text-gray-500">মেয়াদ *</label>
                <select value={months} onChange={(e) => setMonths(e.target.value)} className="__input">
                  {installmentTermOptions.map((t) => (
                    <option key={t.months} value={t.months}>
                      {toBanglaNumber(t.months)} মাস ({toBanglaNumber(t.chargePercent)}%)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  অতিরিক্ত চার্জ {autoCharge && <span className="text-[10px] text-[#0b3d91]">({toBanglaNumber(chargePercent)}% অটো)</span>}
                </label>
                <input type="number" min="0" step="0.01" value={extraCharge} onChange={(e) => { setAutoCharge(false); setExtraCharge(e.target.value); }} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">ডাউন পেমেন্ট</label>
                <input type="number" min="0" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">শুরুর তারিখ *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="__input" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">সিরিয়াল নম্বর</label>
                <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">VA / ওয়াট</label>
                <input value={vaWatt} onChange={(e) => setVaWatt(e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">ভোল্ট</label>
                <input value={volt} onChange={(e) => setVolt(e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">ডিসপ্লে</label>
                <input value={displayType} onChange={(e) => setDisplayType(e.target.value)} className="__input" placeholder="ঐচ্ছিক" />
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

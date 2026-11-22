"use client";

import { Modal } from "@/components/ui";
import { formatDate } from "@/utils";
import clsx from "clsx";
import { CheckCircle2, ChevronRight, CreditCard, History, Wallet } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { bdt, isPlanComplete, PlanHeader, PlanHeroCard } from "./CustomerInstallmentShared";

// Application approval-journey steps (same order as the apply tracking page),
// shown as the plan's "ট্র্যাকিং" — NOT the payment schedule.
const APP_STEPS: { key: string; label: string }[] = [
  { key: "pending", label: "পেন্ডিং আছে" },
  { key: "processing", label: "প্রসেসিং হচ্ছে" },
  { key: "nid_verify", label: "এনআইডি ভেরিফাই" },
  { key: "address_verify", label: "ঠিকানা যাচাই" },
  { key: "guarantor_verify", label: "জামিনদার ভেরিফাই" },
  { key: "bank_check_verify", label: "ব্যাংক চেক ভেরিফাই" },
  { key: "documents_verified", label: "সকল কাগজপত্র যাচাই সম্পন্ন" },
  { key: "approved", label: "কিস্তির জন্য অনুমোদিত" },
  { key: "ready_for_delivery", label: "পণ্য হস্তান্তরের জন্য প্রস্তুত" },
];

/**
 * Customer plan page 1: header + hero, a call-to-action into the payment page,
 * the submitted photos/documents and the application tracking. Everything about
 * paying (figures, downloads, Pay Now, schedule, history) lives on page 2 —
 * CustomerInstallmentPayment at /customer/installments/[planCode]/payment.
 */
export default function CustomerInstallmentDetail({ data }: { data: any }) {
  const { plan, nextDue, productImageUrl, documents } = data;
  const [zoomImg, setZoomImg] = useState<{ url: string; label: string } | null>(null);
  const completed = isPlanComplete(plan);
  const hasDue = plan.status === "active" && !!nextDue;

  // Submitted KYC images for THIS installment (customer + guarantor), signed URLs
  // from the originating application. Only cards with an actual image are shown.
  const docItems: { url: string | null; label: string }[] = documents
    ? [
        { url: documents.customerPhoto, label: "গ্রাহকের ছবি" },
        { url: documents.customerNidFront, label: "গ্রাহকের NID (সামনে)" },
        { url: documents.customerNidBack, label: "গ্রাহকের NID (পেছনে)" },
        { url: documents.guarantorPhoto, label: "জামিনদারের ছবি" },
        { url: documents.guarantorNidFront, label: "জামিনদারের NID (সামনে)" },
        { url: documents.guarantorNidBack, label: "জামিনদারের NID (পেছনে)" },
      ]
    : [];
  const shownDocs = docItems.filter((d) => d.url);

  // Application approval-journey tracking from the originating application
  // (dated steps), shown as the plan's "ট্র্যাকিং" — NOT the payment schedule.
  const application = data.application;
  const appTracking: { step: string; createdAt: any }[] = data.appTracking || [];
  const stepDates: Record<string, string> = {};
  for (const t of appTracking) {
    if (!stepDates[t.step]) stepDates[t.step] = t.createdAt;
  }
  const currentStepIdx = application ? APP_STEPS.findIndex((s) => s.key === application.trackingStep) : -1;
  // An approved plan's journey is complete at least up to "approved".
  const lastDoneIdx = currentStepIdx >= 0 ? currentStepIdx : APP_STEPS.length - 1;

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
      <PlanHeader plan={plan} backHref="/customer/installments" />
      <PlanHeroCard plan={plan} productImageUrl={productImageUrl} />

      {/* Call to action — opens the payment page (figures, Pay Now, schedule, receipts) */}
      <Link
        href={`/customer/installments/${plan.planCode}/payment`}
        className={clsx(
          "group relative overflow-hidden rounded-xl text-white p-3.5 flex flex-col gap-3 active:scale-[0.99] transition",
          completed
            ? "bg-[linear-gradient(110deg,#0d7a39_0%,#1a9c4b_55%,#34c76a_100%)] shadow-[0_10px_26px_rgba(23,138,66,0.3)]"
            : "bg-[linear-gradient(110deg,#0a2f70_0%,#1259c9_55%,#1f7cf0_100%)] shadow-[0_10px_26px_rgba(11,61,145,0.3)]",
        )}
      >
        <span className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-white/10" />
        <span className="pointer-events-none absolute -right-2 top-10 size-16 rounded-full bg-white/10" />
        <span className="relative flex items-center gap-3">
          <span className="size-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            {completed ? <CheckCircle2 size={24} /> : <Wallet size={24} />}
          </span>
          <span className="flex flex-col min-w-0 flex-1 leading-tight gap-1">
            <span className="text-[16px] font-black leading-snug">
              {completed ? "কিস্তি সম্পূর্ণ পরিশোধিত" : "মাসিক কিস্তির টাকা পরিশোধ করুন"}
            </span>
            <span className="text-[11.5px] font-semibold text-white/85">
              {completed
                ? "সব কিস্তি পরিশোধ হয়েছে — রসিদ ও সময়সূচি দেখুন"
                : hasDue
                  ? `পরবর্তী কিস্তি (#${nextDue.installmentNo}) — ${formatDate(nextDue.dueDate)}`
                  : "কিস্তির হিসাব, সময়সূচি ও রসিদ দেখুন"}
            </span>
          </span>
        </span>
        <span className="relative flex items-center justify-between gap-3 pt-3 border-t border-white/20">
          <span className="flex flex-col leading-tight">
            <span className="text-[10.5px] font-semibold text-white/75">{completed ? "অবস্থা" : hasDue ? "এই কিস্তির পরিমাণ" : "মাসিক কিস্তি"}</span>
            <span className="text-[22px] font-black leading-tight">{completed ? "পরিশোধিত ✓" : bdt(hasDue ? nextDue.amount : plan.monthlyAmount)}</span>
          </span>
          <span className="shrink-0 h-10 px-4 rounded-lg bg-white text-[#0b3d91] text-[13px] font-extrabold inline-flex items-center gap-1 shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
            {hasDue ? "পরিশোধ করুন" : "বিস্তারিত দেখুন"}
            <ChevronRight size={16} className="transition group-active:translate-x-0.5" />
          </span>
        </span>
      </Link>

      {/* Submitted photos & documents for THIS installment (customer + guarantor) */}
      {shownDocs.length > 0 && (
        <div className="rounded-xl bg-white border border-[#cfe0fb] p-3 shadow-[0_6px_18px_rgba(11,61,145,0.07)]">
          <p className="text-[14px] font-extrabold mb-2.5 flex items-center gap-2 text-[#0b3d91]">
            <CreditCard size={18} /> ছবি ও ডকুমেন্ট
          </p>
          <div className="grid grid-cols-3 gap-2">
            {shownDocs.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setZoomImg({ url: d.url!, label: d.label })}
                className="flex flex-col gap-1 text-left"
              >
                <span className="relative block w-full aspect-square rounded-lg overflow-hidden border-2 border-[#cfe0fb] bg-[#f3f8ff]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.url!} alt={d.label} className="w-full h-full object-cover" />
                </span>
                <span className="text-[10.5px] font-bold text-[#3d4f72] leading-tight">{d.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tracking — the application approval journey (dated), not payments */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="text-[14px] font-extrabold mb-3 flex items-center gap-2">
          <History size={18} className="text-[#0b3d91]" /> আবেদনের ট্র্যাকিং
        </p>
        {application ? (
          <div className="relative pl-6">
            {APP_STEPS.map((step, i) => {
              const done = i <= lastDoneIdx;
              const isLast = i === APP_STEPS.length - 1;
              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  {!isLast && <div className={clsx("absolute left-[-14px] top-[22px] w-[2.5px] h-[calc(100%-6px)]", done ? "bg-[#1a9c4b]" : "bg-[#dfe6f2]")} />}
                  <div className={clsx("absolute left-[-22px] top-[2px] size-[18px] rounded-full flex items-center justify-center border-2", done ? "bg-[#1a9c4b] border-[#1a9c4b]" : "bg-white border-[#b0bdd0]")}>
                    {done ? <CheckCircle2 size={11} className="text-white" strokeWidth={3} /> : <span className="size-[6px] rounded-full bg-[#b0bdd0]" />}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={clsx("text-[13.5px] font-extrabold leading-tight", done ? "text-[#0f1729]" : "text-[#7b8aa3]")}>{step.label}</p>
                    <span className={clsx("shrink-0 text-[9.5px] font-extrabold px-2 py-0.5 rounded-full", done ? "bg-[#e9f9ef] text-[#178a42]" : "bg-[#e8f1ff] text-[#1b6fd6]")}>
                      {done ? "সম্পন্ন" : "মুলতুবি"}
                    </span>
                  </div>
                  {stepDates[step.key] && (
                    <p className="text-[11px] font-bold text-[#178a42] mt-0.5">
                      {new Date(stepDates[step.key]).toLocaleString("bn-BD", { dateStyle: "medium" })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[12px] text-[#5b6784] text-center py-3">এই প্ল্যানের জন্য আবেদনের ট্র্যাকিং পাওয়া যায়নি।</p>
        )}
      </div>

      {/* Full-size document viewer */}
      {zoomImg && (
        <Modal isVisible title={zoomImg.label} width="600" onClose={() => setZoomImg(null)}>
          <div className="flex items-center justify-center bg-[#0f1729] rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomImg.url} alt={zoomImg.label} className="w-full max-h-[70vh] object-contain" />
          </div>
        </Modal>
      )}
    </div>
  );
}

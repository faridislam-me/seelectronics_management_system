"use client";

import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, Check, Circle, ClipboardList } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { key: "pending", label: "আবেদন গৃহীত", desc: "আপনার আবেদন জমা হয়েছে" },
  { key: "processing", label: "প্রক্রিয়াধীন", desc: "আবেদন পর্যালোচনা শুরু হয়েছে" },
  { key: "nid_verify", label: "এনআইডি যাচাই", desc: "জাতীয় পরিচয়পত্র যাচাই করা হচ্ছে" },
  { key: "address_verify", label: "ঠিকানা যাচাই", desc: "বর্তমান ও স্থায়ী ঠিকানা যাচাই" },
  { key: "guarantor_verify", label: "জামিনদার যাচাই", desc: "জামিনদারের তথ্য যাচাই করা হচ্ছে" },
  { key: "bank_check_verify", label: "ব্যাংক চেক যাচাই", desc: "ব্যাংক একাউন্ট ও চেক যাচাই" },
  { key: "documents_verified", label: "কাগজপত্র যাচাই শেষ", desc: "সকল ডকুমেন্ট সফলভাবে যাচাই হয়েছে" },
  { key: "approved", label: "অনুমোদিত", desc: "কিস্তির জন্য অনুমোদিত হয়েছে" },
  { key: "ready_for_delivery", label: "পণ্য বুঝিয়ে দিতে প্রস্তুত", desc: "অফিস থেকে পণ্যটি নিয়ে যান" },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700" },
  under_review: { label: "পর্যালোচনাধীন", cls: "bg-blue-50 text-blue-700" },
  approved: { label: "অনুমোদিত", cls: "bg-[#e9f9ef] text-[#178a42]" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-[#ffe9ec] text-[#c81f38]" },
};

export default function ApplicationTrackingClient({ app }: { app: any }) {
  const currentIdx = STEPS.findIndex((s) => s.key === app.trackingStep);
  const st = STATUS_LABEL[app.status] || STATUS_LABEL.pending;

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/installments" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[16px] font-extrabold truncate">আবেদন ট্র্যাকিং</span>
          <span className="text-[11px] font-bold text-[#5b6784] font-mono">{app.applicationCode}</span>
        </span>
        <span className={clsx("shrink-0 text-[10px] font-extrabold uppercase px-2 py-1 rounded-full", st.cls)}>{st.label}</span>
      </div>

      {/* Product info */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="text-[12px] font-semibold text-[#5b6784]">পণ্য</p>
        <p className="text-[15px] font-extrabold">{app.productModel}</p>
        <p className="text-[11px] text-[#5b6784] mt-0.5">আবেদনের তারিখ: {formatDate(app.createdAt)}</p>
      </div>

      {/* Rejected message */}
      {app.status === "rejected" && (
        <div className="rounded-md bg-[#ffe9ec] border border-[#f7c3ca] p-3">
          <p className="text-[13px] font-extrabold text-[#c81f38]">আবেদন প্রত্যাখ্যাত হয়েছে</p>
          {app.rejectReason && <p className="text-[12px] text-[#c81f38] mt-1">{app.rejectReason}</p>}
        </div>
      )}

      {/* Tracking timeline */}
      {app.status !== "rejected" && (
        <div className="rounded-md bg-white border border-[#dfe6f2] p-3 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <p className="text-[14px] font-extrabold mb-3 flex items-center gap-2">
            <ClipboardList size={16} className="text-[#0b3d91]" /> আবেদনের অবস্থা
          </p>
          <div className="relative pl-5">
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={step.key} className="relative pb-5 last:pb-0">
                  {/* Vertical line */}
                  {!isLast && (
                    <div className={clsx("absolute left-[-13px] top-[22px] w-[2px] h-[calc(100%-6px)]", done && !isCurrent ? "bg-[#1a9c4b]" : "bg-[#dfe6f2]")} />
                  )}
                  {/* Dot */}
                  <div className={clsx("absolute left-[-20px] top-[3px] size-[16px] rounded-full flex items-center justify-center border-2", done ? "bg-[#1a9c4b] border-[#1a9c4b]" : "bg-white border-[#c9d3e6]")}>
                    {done ? <Check size={10} className="text-white" /> : <Circle size={6} className="text-[#c9d3e6]" />}
                  </div>
                  {/* Content */}
                  <div className={clsx("min-w-0", isCurrent && "ml-1")}>
                    <p className={clsx("text-[13px] font-extrabold leading-tight", done ? "text-[#16213a]" : "text-[#9aa5b8]")}>
                      {step.label}
                      {isCurrent && <span className="ml-1.5 text-[10px] font-bold text-[#1f7cf0] bg-[#e8f1ff] px-1.5 py-0.5 rounded-full">বর্তমান</span>}
                    </p>
                    <p className={clsx("text-[11px] mt-0.5", done ? "text-[#5b6784]" : "text-[#c9d3e6]")}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Approved → plan link */}
      {app.status === "approved" && app.planId && (
        <Link
          href="/customer/installments"
          className="rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white p-3 text-center text-[14px] font-extrabold shadow-[0_8px_22px_rgba(11,61,145,0.25)]"
        >
          কিস্তি প্ল্যান দেখুন
        </Link>
      )}

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        আবেদন সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — 09649355555
      </p>
    </div>
  );
}

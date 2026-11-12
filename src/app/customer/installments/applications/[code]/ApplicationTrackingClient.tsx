"use client";

import { formatDate } from "@/utils";
import clsx from "clsx";
import { ArrowLeft, Ban, Check, Circle, ClipboardList, RefreshCw, User } from "lucide-react";
import Link from "next/link";

const PRODUCT_LABELS: Record<string, string> = {
  fridge: "ফ্রিজ", ac: "এসি", tv: "টিভি", oven: "ওভেন",
  washing_machine: "ওয়াশিং মেশিন", mobile: "মোবাইল",
  ips: "আই পি এস", battery: "ব্যাটারি", ips_package: "আই পি এস প্যাকেজ",
  stabilizer: "স্ট্যাবিলাইজার", blender: "ব্লেন্ডার", others: "অন্যান্য",
};

const STEPS = [
  { key: "pending", label: "পেন্ডিং আছে", desc: "আপনার কিস্তির আবেদনটি সফলভাবে জমা হয়েছে। পর্যালোচনার জন্য এটি অপেক্ষমাণ রয়েছে।" },
  { key: "processing", label: "প্রসেসিং হচ্ছে", desc: "আপনার আবেদনটি আমাদের টিম যাচাই-বাছাই শুরু করেছে।" },
  { key: "nid_verify", label: "এনআইডি ভেরিফাই", desc: "আপনার জাতীয় পরিচয়পত্র (NID) সংক্রান্ত তথ্য যাচাই করা হচ্ছে।" },
  { key: "address_verify", label: "ঠিকানা যাচাই", desc: "আপনার দেওয়া বর্তমান ও স্থায়ী ঠিকানা যাচাই কার্যক্রম চলছে।" },
  { key: "guarantor_verify", label: "জামিনদার ভেরিফাই", desc: "আপনার জামিনদারের (Guarantor) দেওয়া তথ্য ও পরিচয় যাচাই করা হচ্ছে।" },
  { key: "bank_check_verify", label: "ব্যাংক অ্যাকাউন্ট চেক ভেরিফাই", desc: "আপনার ব্যাংক চেক অ্যাকাউন্ট সংক্রান্ত তথ্য পরীক্ষা করা হচ্ছে।" },
  { key: "documents_verified", label: "সকল কাগজপত্র যাচাই সম্পন্ন", desc: "আপনার জমা দেওয়া সকল প্রয়োজনীয় কাগজপত্র সফলভাবে যাচাই করা হয়েছে।" },
  { key: "approved", label: "কিস্তির জন্য অনুমোদিত", desc: "অভিনন্দন! আপনার কিস্তির আবেদনটি চূড়ান্তভাবে অনুমোদন করা হয়েছে। এস ই ইলেকট্রনিকস অফিসে যোগাযোগ করুন।" },
  { key: "ready_for_delivery", label: "পণ্য হস্তান্তরের জন্য প্রস্তুত", desc: "আপনার কিস্তির পণ্যটি আমরা দিতে প্রস্তুত। আপনি এখন নির্দিষ্ট সময়ে শোরুম থেকে ডেলিভারি নিতে ডাউন পেমেন্ট দিয়ে পণ্যটি গ্রহণ করতে পারেন।" },
];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "অপেক্ষমান", cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  under_review: { label: "পর্যালোচনাধীন", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
  approved: { label: "অনুমোদিত", cls: "bg-[#e9f9ef] text-[#178a42] border border-[#b0e4c4]" },
  rejected: { label: "প্রত্যাখ্যাত", cls: "bg-[#ffe9ec] text-[#c81f38] border border-[#f7c3ca]" },
  cancelled: { label: "বাতিল", cls: "bg-gray-100 text-gray-700 border border-gray-300" },
  reapply: { label: "পুনরায় আবেদন", cls: "bg-orange-50 text-orange-700 border border-orange-200" },
};

export default function ApplicationTrackingClient({ app }: { app: any }) {
  const currentIdx = STEPS.findIndex((s) => s.key === app.trackingStep);
  const st = STATUS_LABEL[app.status] || STATUS_LABEL.pending;
  const isTerminal = app.status === "rejected" || app.status === "cancelled" || app.status === "reapply";

  // Earliest recorded date per stage, so each completed step shows WHEN it
  // happened. Older applications may have no history rows (dates simply hidden).
  const stepDates: Record<string, string> = {};
  for (const t of (app.tracking || []) as { step: string; createdAt: string }[]) {
    if (!stepDates[t.step]) stepDates[t.step] = t.createdAt;
  }

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-4 text-[#0f1729]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/installments" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight min-w-0 flex-1">
          <span className="text-[17px] font-extrabold truncate">আবেদন ট্র্যাকিং</span>
          <span className="text-[12px] font-bold text-[#3d4f72] font-mono">{app.applicationCode}</span>
        </span>
        <span className={clsx("shrink-0 text-[11px] font-extrabold uppercase px-2.5 py-1 rounded-full", st.cls)}>{st.label}</span>
      </div>

      {/* Product info */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex items-center gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#3d4f72]">{PRODUCT_LABELS[app.productType] || app.productTypeOther || "পণ্য"}{app.productSpec ? ` · ${app.productSpec}` : ""}</p>
          <p className="text-[17px] font-extrabold">{app.productBrand ? `${app.productBrand} ` : ""}{app.productModel}</p>
          <p className="text-[12px] text-[#3d4f72] mt-0.5">আবেদনের তারিখ: {formatDate(app.createdAt)}</p>
        </div>
        {app.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={app.photoUrl} alt="আবেদনকারী" className="size-20 rounded-md object-cover border border-[#dfe6f2] shrink-0" />
        ) : (
          <span className="size-20 rounded-md bg-[#f5f7fb] border border-[#dfe6f2] flex items-center justify-center shrink-0">
            <User size={32} className="text-[#b0bdd0]" />
          </span>
        )}
      </div>

      {/* Rejected message */}
      {app.status === "rejected" && (
        <div className="rounded-md bg-[#ffe9ec] border border-[#f7c3ca] p-3.5">
          <p className="text-[14px] font-extrabold text-[#c81f38]">আবেদন প্রত্যাখ্যাত হয়েছে</p>
          {app.rejectReason && <p className="text-[13px] text-[#c81f38] mt-1">{app.rejectReason}</p>}
        </div>
      )}

      {/* Cancelled message */}
      {app.status === "cancelled" && (
        <div className="rounded-md bg-gray-50 border border-gray-300 p-3.5">
          <p className="text-[14px] font-extrabold text-gray-800 flex items-center gap-2">
            <Ban size={16} className="text-gray-600" /> ক্যান্সেল করা হয়েছে
          </p>
          <p className="text-[13px] text-gray-700 mt-1.5 leading-relaxed">
            কাগজপত্রে অসঙ্গতি, ভুল তথ্য বা শর্ত পূরণ না হওয়ায় আপনার কিস্তির আবেদনটি বাতিল করা হয়েছে।
          </p>
          <p className="text-[12px] text-[#c81f38] font-bold mt-2">আবেদন বাতিল হওয়ায় পুনরায় আবেদন করা সম্ভব নয়।</p>
        </div>
      )}

      {/* Reapply message */}
      {app.status === "reapply" && (
        <div className="rounded-md bg-orange-50 border border-orange-200 p-3.5">
          <p className="text-[14px] font-extrabold text-orange-800 flex items-center gap-2">
            <RefreshCw size={16} className="text-orange-600" /> পুনরায় আবেদন করুন
          </p>
          <p className="text-[13px] text-orange-700 mt-1.5 leading-relaxed">
            নতুন করে আবেদন করার সুযোগ রয়েছে। ত্রুটি সংশোধন করে বা সঠিক তথ্য দিয়ে আপনি চাইলে আপনার কিস্তির জন্য পুনরায় নতুন করে আবেদন করতে পারেন।
          </p>
          <Link
            href="/customer/installments/apply"
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-[linear-gradient(105deg,#0a2f70,#1f7cf0)] text-white px-4 py-2.5 text-[13px] font-extrabold shadow-[0_6px_18px_rgba(11,61,145,0.25)]"
          >
            <RefreshCw size={14} /> নতুন আবেদন করুন
          </Link>
        </div>
      )}

      {/* Tracking timeline */}
      {!isTerminal && (
        <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
          <p className="text-[15px] font-extrabold mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-[#0b3d91]" /> আবেদনের অবস্থা
          </p>
          <div className="relative pl-6">
            {STEPS.map((step, i) => {
              const done = i <= currentIdx;
              const isCurrent = i === currentIdx;
              const isLast = i === STEPS.length - 1;
              return (
                <div key={step.key} className="relative pb-6 last:pb-0">
                  {/* Vertical line */}
                  {!isLast && (
                    <div className={clsx("absolute left-[-14px] top-[24px] w-[2.5px] h-[calc(100%-8px)]", done && !isCurrent ? "bg-[#1a9c4b]" : "bg-[#dfe6f2]")} />
                  )}
                  {/* Dot */}
                  <div className={clsx(
                    "absolute left-[-22px] top-[3px] size-[18px] rounded-full flex items-center justify-center border-2",
                    done ? "bg-[#1a9c4b] border-[#1a9c4b]" : "bg-white border-[#b0bdd0]",
                    isCurrent && "animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(26,156,75,0.5)]",
                  )}>
                    {done ? <Check size={11} className="text-white" strokeWidth={3} /> : <Circle size={7} className="text-[#b0bdd0]" />}
                  </div>
                  {/* Content */}
                  <div className={clsx("min-w-0", isCurrent && "ml-1")}>
                    <p className={clsx("text-[14px] font-extrabold leading-tight", done ? "text-[#0f1729]" : "text-[#7b8aa3]")}>
                      {step.label}
                      {isCurrent && <span className="ml-1.5 text-[10px] font-bold text-[#1f7cf0] bg-[#e8f1ff] px-1.5 py-0.5 rounded-full align-middle">বর্তমান</span>}
                    </p>
                    {stepDates[step.key] && (
                      <p className="text-[11px] font-bold text-[#178a42] mt-0.5">
                        {new Date(stepDates[step.key]).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    )}
                    <p className={clsx("text-[12.5px] mt-0.5 leading-relaxed", done ? "text-[#3d4f72]" : "text-[#b0bdd0]")}>{step.desc}</p>
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

      <p className="text-[12px] text-center text-[#3d4f72] px-4">
        আবেদন সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — <a href="tel:09649355555" className="font-bold text-[#1f5fc9]">09649355555</a>
      </p>
    </div>
  );
}

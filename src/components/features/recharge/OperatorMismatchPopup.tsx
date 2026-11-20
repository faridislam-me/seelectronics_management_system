"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Popup shown on the customer and staff recharge screens when the entered
 * number's operator does not match the SELECTED operator tab (e.g. Grameenphone
 * selected but a 019/Banglalink number entered). Blocks the purchase and tells
 * the user to pick the correct operator. Mirrors the ApiUnavailablePopup style.
 */
export default function OperatorMismatchPopup({
  message,
  onClose,
}: {
  message?: string;
  onClose: () => void;
}) {
  const text =
    message ||
    "নাম্বারটি নির্বাচিত অপারেটরের সাথে মিলছে না — সঠিক অপারেটর নির্বাচন করুন।";
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className="size-16 rounded-full bg-[#fdeaed] flex items-center justify-center">
          <AlertTriangle size={34} className="text-[#c81f38]" />
        </span>
        <p className="text-[18px] font-extrabold text-[#c81f38]">অপারেটর মিলছে না</p>
        <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">{text}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center"
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
}

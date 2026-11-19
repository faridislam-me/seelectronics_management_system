"use client";

import { AlertTriangle, Phone } from "lucide-react";

/**
 * Popup shown on the customer and staff recharge screens when OUR SuccessTopup
 * reseller API balance is empty/insufficient, so a recharge or drive cannot be
 * fulfilled. Triggered when a recharge action returns the structured
 * `code: "API_BALANCE_EMPTY"` result. A full modal (not a toast) telling the
 * user the service is temporarily unavailable and to contact the admin — the
 * admin is also SMS-notified server-side so they can refill the API balance.
 */
export default function ApiUnavailablePopup({
  message,
  onClose,
}: {
  message?: string;
  onClose: () => void;
}) {
  const text =
    message ||
    "এই মুহূর্তে সেবাটি সাময়িকভাবে বন্ধ আছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।";
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className="size-16 rounded-full bg-[#fff4e5] flex items-center justify-center">
          <AlertTriangle size={34} className="text-[#e67e22]" />
        </span>
        <p className="text-[18px] font-extrabold text-[#e67e22]">সেবা সাময়িকভাবে বন্ধ</p>
        <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">{text}</p>
        <a
          href="tel:09649355555"
          className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold inline-flex items-center justify-center gap-1.5 shadow-[0_6px_18px_rgba(11,61,145,0.3)]"
        >
          <Phone size={15} /> অ্যাডমিনের সাথে যোগাযোগ
        </a>
        <button
          type="button"
          onClick={onClose}
          className="w-full h-11 rounded-md text-[13px] font-extrabold border bg-white text-[#45506b] border-[#dfe6f2]"
        >
          ঠিক আছে
        </button>
      </div>
    </div>
  );
}

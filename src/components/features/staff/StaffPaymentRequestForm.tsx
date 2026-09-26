"use client";

import { requestPayment } from "@/actions/paymentRequestActions";
import { Check, FileText, Pencil, Send, X } from "lucide-react";
import { useActionState, useState } from "react";
import { toast } from "react-toastify";

interface StaffPaymentRequestFormProps {
  staffId: string;
}

export function StaffPaymentRequestForm({ staffId }: StaffPaymentRequestFormProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [, formAction, isPending] = useActionState(
    async (_prev: any, formData: FormData) => {
      const res = await requestPayment(_prev, formData);
      if (res?.success) setShowSuccess(true);
      else if (res?.success === false) toast.error(res.message);
      return res ?? _prev;
    },
    undefined,
  );

  const inputCls = "w-full h-12 rounded-md border border-[#dfe6f2] bg-white text-[14px] text-[#16213a] placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0] transition-all";

  return (
    <form action={formAction} className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-3 shadow-[0_4px_18px_rgba(11,61,145,0.06)]">
      <input type="hidden" name="staffId" value={staffId} />

      <div className="flex items-center gap-2">
        <span className="size-8 rounded-md bg-[#e8f1ff] text-[#1f7cf0] flex items-center justify-center"><FileText size={17} /></span>
        <span className="text-[15px] font-extrabold text-[#16213a]">Enter Transaction Details</span>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-[#3d4a63]">Amount (৳)</span>
        <span className="relative block">
          <span className="absolute left-0 top-0 h-12 w-11 rounded-l-md border-r border-[#dfe6f2] bg-[#f5f7fb] text-[#5b6784] flex items-center justify-center text-base font-bold">৳</span>
          <input type="number" name="amount" min="1" inputMode="numeric" required placeholder="Enter amount" className={`${inputCls} pl-14 pr-3`} />
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-[#3d4a63]">Note (Optional)</span>
        <span className="relative block">
          <span className="absolute left-0 top-0 h-12 w-11 rounded-l-md border-r border-[#dfe6f2] bg-[#f5f7fb] text-[#5b6784] flex items-center justify-center"><Pencil size={16} /></span>
          <input type="text" name="description" placeholder="Add a note (optional)" className={`${inputCls} pl-14 pr-3`} />
        </span>
      </label>

      <button type="submit" disabled={isPending} className="mt-1 h-12 w-full rounded-md bg-[#1f7cf0] hover:bg-[#1668d0] text-white font-extrabold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-[0_8px_20px_rgba(31,124,240,0.35)]">
        <Send size={18} strokeWidth={2.3} />
        {isPending ? "Sending..." : "Request Payment"}
      </button>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-md p-6 w-full max-w-sm text-center shadow-xl animate-in zoom-in duration-200 relative">
            <button type="button" onClick={() => setShowSuccess(false)} aria-label="Close" className="absolute top-3 right-3 text-[#9aa4b8] hover:text-[#16213a] transition-colors"><X size={18} /></button>
            <div className="size-20 mx-auto rounded-full bg-[#e9f9ef] flex items-center justify-center mb-4">
              <span className="size-11 rounded-full bg-[#1a9c4b] text-white flex items-center justify-center"><Check size={24} strokeWidth={3} /></span>
            </div>
            <h2 className="text-[20px] font-extrabold text-[#16213a] mb-2">অনুরোধ সফল হয়েছে!</h2>
            <p className="text-[13px] font-medium text-[#5b6784] mb-6 leading-relaxed">আপনার ক্যাশ আউট অনুরোধটি সফলভাবে জমা হয়েছে। আমাদের টিম দ্রুত পেমেন্টটি প্রসেস করবে।</p>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => { setShowSuccess(false); window.location.href = "/staff/payment/payment-history"; }} className="flex-1 h-11 rounded-md font-bold text-sm bg-[#1f7cf0] text-white active:scale-[0.98]">ইতিহাস দেখুন</button>
              <button type="button" onClick={() => setShowSuccess(false)} className="flex-1 h-11 rounded-md font-bold text-sm border-2 border-[#bcd4fb] text-[#1f7cf0] bg-white active:scale-[0.98]">বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

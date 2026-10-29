"use client";

import { sendSellerDueVoiceAndSms } from "@/actions";
import { PhoneCall } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

/**
 * Admin button: send the seller a due-collection reminder (SMS always, plus a
 * voice call when a `seller_due` MRAM broadcast is configured). Does not change
 * anything on the account.
 */
export default function SellerDueReminderButton({ sellerId }: { sellerId: string }) {
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!window.confirm("এই সেলারকে বকেয়ার জন্য ভয়েস কল ও SMS পাঠানো হবে?")) return;
    setSending(true);
    const res = await sendSellerDueVoiceAndSms(sellerId);
    setSending(false);
    toast(res.message, { type: res.success ? "success" : "error" });
  };

  return (
    <button
      type="button"
      onClick={send}
      disabled={sending}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-amber-500 text-white text-[12.5px] font-extrabold disabled:opacity-60"
    >
      <PhoneCall size={15} />
      {sending ? "পাঠানো হচ্ছে..." : "বকেয়া আদায়ে কল/SMS"}
    </button>
  );
}

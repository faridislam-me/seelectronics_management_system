"use client";

import { recordSellerDuePayment, type SellerPayTargetType } from "@/actions";
import { HandCoins } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const METHODS: { key: string; label: string }[] = [
  { key: "cash", label: "ক্যাশ" },
  { key: "bkash", label: "বিকাশ" },
  { key: "nagad", label: "নগদ" },
  { key: "rocket", label: "রকেট" },
  { key: "bank", label: "ব্যাংক" },
];

/**
 * Admin-facing button + modal to receive a seller's due directly (e.g. the seller
 * handed over cash) and deduct it from the due on the spot. Unlike the seller's own
 * request, this is applied immediately (no approval step) via recordSellerDuePayment.
 */
export default function SellerCollectButton({
  sellerId,
  targetType,
  targetRef,
  label,
  due,
  size = "sm",
  onDone,
}: {
  sellerId: string;
  targetType: SellerPayTargetType;
  targetRef: string;
  label: string;
  due: number;
  size?: "sm" | "md";
  onDone?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState<string>(String(Math.round(due)));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("সঠিক পরিমাণ দিন");
    if (amt > due + 0.01) return toast.error(`সর্বোচ্চ ৳${Math.round(due).toLocaleString()} বাকি আছে`);
    setSaving(true);
    const res = await recordSellerDuePayment({
      sellerId,
      targetType,
      targetRef,
      amount: amt,
      paymentMethod: method,
      note: note.trim() || undefined,
    });
    setSaving(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) {
      setOpen(false);
      onDone?.();
      router.refresh();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => { setAmount(String(Math.round(due))); setOpen(true); }}
        className={
          size === "md"
            ? "inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-emerald-600 text-white text-[12.5px] font-extrabold"
            : "inline-flex items-center gap-1 h-7 px-2 rounded-md bg-emerald-600 text-white text-[11px] font-extrabold"
        }
      >
        <HandCoins size={size === "md" ? 15 : 12} />
        আদায় করুন
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[130] bg-black/40 flex items-end sm:items-center justify-center p-2"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-md bg-white p-3.5 flex flex-col gap-2.5 shadow-xl max-h-[92vh] overflow-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold text-[#16213a]">বকেয়া আদায় (গ্রহণ)</span>
              <button type="button" onClick={() => !saving && setOpen(false)} className="text-[#9aa4b8] text-xl leading-none px-1">×</button>
            </div>

            <div className="rounded-md bg-[#f1faf4] border border-[#cdecd9] px-3 py-2 text-[12.5px] text-[#20503a]">
              <div className="font-bold">{label}</div>
              <div className="text-[#b8620b] font-extrabold mt-0.5">বাকি ৳{Math.round(due).toLocaleString()}</div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#5b6784] mb-1">মাধ্যম</label>
              <div className="grid grid-cols-5 gap-1.5">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={
                      "h-9 rounded-md border text-[12px] font-extrabold " +
                      (method === m.key
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-[#2b3445] border-[#e3e8f1]")
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#5b6784] mb-1">পরিমাণ (৳)</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                inputMode="decimal"
                className="w-full h-10 px-3 rounded-md border border-[#e3e8f1] text-sm outline-none"
                placeholder="পরিমাণ"
              />
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#5b6784] mb-1">নোট (ঐচ্ছিক)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-[#e3e8f1] text-sm outline-none"
                placeholder="কোনো মন্তব্য"
              />
            </div>

            <p className="text-[11.5px] text-[#6b7690] leading-snug">
              গ্রহণ করলে টাকাটি সঙ্গে সঙ্গে সেলারের বকেয়া থেকে বাদ যাবে এবং পেমেন্ট হিস্ট্রিতে জমা হবে।
            </p>

            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="h-11 rounded-md bg-emerald-600 text-white text-[14px] font-extrabold disabled:opacity-60"
            >
              {saving ? "গ্রহণ হচ্ছে..." : "গ্রহণ করুন"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

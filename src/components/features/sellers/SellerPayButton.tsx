"use client";

import { requestSellerPayment, type SellerPayTargetType } from "@/actions";
import { Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";

const METHODS: { key: string; label: string; wallet: boolean }[] = [
  { key: "bkash", label: "বিকাশ", wallet: true },
  { key: "nagad", label: "নগদ", wallet: true },
  { key: "rocket", label: "রকেট", wallet: true },
  { key: "bank", label: "ব্যাংক", wallet: true },
  { key: "cash", label: "ক্যাশ", wallet: false },
];

/**
 * Seller-facing button + modal to pay off one due (a stock purchase or a service
 * charge). The seller sends the money through their chosen method and submits the
 * sender / transaction details; the admin approves it before the due is reduced.
 */
export default function SellerPayButton({
  targetType,
  targetRef,
  label,
  due,
  size = "sm",
}: {
  targetType: SellerPayTargetType;
  targetRef: string;
  label: string;
  due: number;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("bkash");
  const [amount, setAmount] = useState<string>(String(Math.round(due)));
  const [senderNumber, setSenderNumber] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const walletMethod = METHODS.find((m) => m.key === method)?.wallet ?? false;

  const submit = async () => {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error("সঠিক পরিমাণ দিন");
    if (amt > due + 0.01) return toast.error(`সর্বোচ্চ ৳${Math.round(due).toLocaleString()} বাকি আছে`);
    setSaving(true);
    const res = await requestSellerPayment({
      targetType,
      targetRef,
      amount: amt,
      paymentMethod: method,
      senderNumber: senderNumber.trim() || undefined,
      transactionId: transactionId.trim() || undefined,
      note: note.trim() || undefined,
    });
    setSaving(false);
    toast(res.message, { type: res.success ? "success" : "error" });
    if (res.success) {
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          size === "md"
            ? "inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-[#1f7cf0] text-white text-[12.5px] font-extrabold"
            : "inline-flex items-center gap-1 h-7 px-2 rounded-md bg-[#1f7cf0] text-white text-[11px] font-extrabold"
        }
      >
        <Wallet size={size === "md" ? 15 : 12} />
        পরিশোধ করুন
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] bg-black/40 flex items-end sm:items-center justify-center p-2"
          onClick={() => !saving && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[440px] rounded-md bg-white p-3.5 flex flex-col gap-2.5 shadow-xl max-h-[92vh] overflow-auto"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-extrabold text-[#16213a]">বকেয়া পরিশোধ</span>
              <button type="button" onClick={() => !saving && setOpen(false)} className="text-[#9aa4b8] text-xl leading-none px-1">×</button>
            </div>

            <div className="rounded-md bg-[#f5f8fd] border border-[#e3ebf7] px-3 py-2 text-[12.5px] text-[#2b3445]">
              <div className="font-bold">{label}</div>
              <div className="text-[#b8620b] font-extrabold mt-0.5">বাকি ৳{Math.round(due).toLocaleString()}</div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#5b6784] mb-1">পেমেন্ট মাধ্যম</label>
              <div className="grid grid-cols-5 gap-1.5">
                {METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMethod(m.key)}
                    className={
                      "h-9 rounded-md border text-[12px] font-extrabold " +
                      (method === m.key
                        ? "bg-[#1f7cf0] text-white border-[#1f7cf0]"
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

            {walletMethod && (
              <>
                <div>
                  <label className="block text-[12px] font-bold text-[#5b6784] mb-1">যে নম্বর/একাউন্ট থেকে পাঠিয়েছেন</label>
                  <input
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-[#e3e8f1] text-sm outline-none"
                    placeholder="যেমন: 01XXXXXXXXX / ব্যাংক একাউন্ট"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#5b6784] mb-1">ট্রানজেকশন আইডি (TrxID)</label>
                  <input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-[#e3e8f1] text-sm outline-none"
                    placeholder="যেমন: 9AB7C2D1"
                  />
                </div>
              </>
            )}

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
              পেমেন্ট জমা দেওয়ার পর এডমিন যাচাই করে অনুমোদন দিলে এটি আপনার বকেয়া থেকে বাদ যাবে।
            </p>

            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="h-11 rounded-md bg-[#1f7cf0] text-white text-[14px] font-extrabold disabled:opacity-60"
            >
              {saving ? "জমা হচ্ছে..." : "পেমেন্ট জমা দিন"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

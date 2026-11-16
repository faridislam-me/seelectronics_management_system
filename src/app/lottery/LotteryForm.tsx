"use client";

import { submitLotteryEntry } from "@/actions/lotteryActions";
import { CheckCircle2, Gift, Loader2, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

export default function LotteryForm() {
  const [cardCode, setCardCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!cardCode.trim()) return toast.error("কার্ড নম্বর দিন");
    if (!name.trim()) return toast.error("আপনার নাম দিন");
    if (!/^01\d{9}$/.test(phone.trim())) return toast.error("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
    if (!address.trim()) return toast.error("আপনার ঠিকানা দিন");
    setSubmitting(true);
    const res = await submitLotteryEntry({ cardCode, name, phone, address });
    setSubmitting(false);
    if (res.success) setDone(true);
    else toast.error(res.message || "জমা দেওয়া যায়নি");
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] flex flex-col items-center px-3 py-6 text-[#16213a]">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Brand header */}
        <div className="rounded-2xl bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-5 text-center shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <div className="mx-auto size-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-2">
            <Gift size={30} />
          </div>
          <h1 className="text-[22px] font-extrabold leading-tight">SE Electronics লটারি</h1>
          <p className="text-[12.5px] text-white/85 mt-1">
            স্ক্র্যাচ কার্ডের নম্বর ও আপনার তথ্য দিয়ে লটারিতে অংশ নিন
          </p>
        </div>

        {done ? (
          <div className="rounded-2xl bg-white border border-[#dfe6f2] p-6 flex flex-col items-center text-center gap-3 shadow-sm">
            <span className="size-16 rounded-full bg-[#e8fbef] flex items-center justify-center">
              <CheckCircle2 size={40} className="text-[#22c55e]" />
            </span>
            <p className="text-[18px] font-extrabold text-[#0b3d91]">এন্ট্রি জমা হয়েছে!</p>
            <p className="text-[13px] font-semibold text-[#5b6784] leading-relaxed">
              ধন্যবাদ {name.trim()}। আপনার লটারি এন্ট্রি সফলভাবে জমা হয়েছে। ড্র শেষে বিজয়ীদের
              মোবাইলে SMS-এ জানানো হবে।
            </p>
            <button
              type="button"
              onClick={() => {
                setDone(false);
                setCardCode("");
                setName("");
                setPhone("");
                setAddress("");
              }}
              className="mt-1 h-11 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold"
            >
              আরেকটি কার্ড জমা দিন
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-[#dfe6f2] p-4 flex flex-col gap-3 shadow-sm">
            <Field label="স্ক্র্যাচ কার্ডের নম্বর" required icon>
              <input
                value={cardCode}
                onChange={(e) => setCardCode(e.target.value.toUpperCase())}
                placeholder="কার্ডের নম্বর লিখুন"
                className="w-full h-12 rounded-md border border-[#dfe6f2] px-3 text-[16px] font-extrabold tracking-wider uppercase bg-white focus:border-[#0b3d91] focus:outline-none"
              />
            </Field>
            <Field label="আপনার নাম" required>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="পুরো নাম"
                className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
              />
            </Field>
            <Field label="মোবাইল নম্বর" required>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                inputMode="numeric"
                className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
              />
            </Field>
            <Field label="ঠিকানা" required>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="আপনার ঠিকানা"
                rows={2}
                className="w-full rounded-md border border-[#dfe6f2] px-3 py-2 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none resize-none"
              />
            </Field>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full h-12 rounded-md bg-[#0b3d91] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-5 animate-spin" /> : <Ticket size={18} />}
              {submitting ? "জমা হচ্ছে..." : "লটারিতে অংশ নিন"}
            </button>
            <p className="text-[11px] text-center text-[#5b6784]">
              প্রতিটি কার্ড একবারই ব্যবহার করা যাবে।
            </p>
          </div>
        )}

        <p className="text-center text-[11px] text-[#5b6784] font-semibold">
          SE Electronics — Always With You
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-bold text-[#3d4f72] inline-flex items-center gap-1">
        {icon && <Ticket size={13} className="text-[#0b3d91]" />}
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

"use client";

import { getMyDriveInfo, submitDriveKyc } from "@/actions/driveBalanceActions";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, IdCard, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function DriveKycFormPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [nid, setNid] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // If the customer already has a pending/approved KYC, steer them back so they
  // don't submit a duplicate (the server blocks it anyway, but this is kinder).
  useEffect(() => {
    getMyDriveInfo().then((res) => {
      if (res.success && "data" in res && res.data) {
        const { kycStatus, kyc } = res.data;
        if (kycStatus === "approved" || (kycStatus === "pending" && kyc)) {
          router.replace("/customer/referral/recharge/drive");
          return;
        }
        if (kyc && kycStatus === "rejected") {
          // Pre-fill from the last attempt to make re-submission easier.
          setFullName(kyc.fullName || "");
          setNid(kyc.nid || "");
          setAddress(kyc.address || "");
        }
      }
      setChecking(false);
    });
  }, [router]);

  const handleSubmit = async () => {
    if (!fullName.trim()) return toast.error("নাম দিন");
    if (!nid.trim()) return toast.error("এনআইডি নম্বর দিন");
    if (!address.trim()) return toast.error("ঠিকানা দিন");

    setLoading(true);
    // Document upload is optional; this build submits no documents (empty array).
    const res = await submitDriveKyc({
      fullName: fullName.trim(),
      nid: nid.trim(),
      address: address.trim(),
      note: note.trim() || undefined,
      documents: [],
    });
    setLoading(false);

    if (res.success) {
      toast.success(res.message || "KYC জমা হয়েছে");
      router.push("/customer/referral/recharge/drive");
    } else {
      toast.error(res.message || "জমা দেওয়া যায়নি");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-[#0b3d91]" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/customer/referral/recharge/drive"
          className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight flex-1">
          <span className="text-[16px] font-extrabold">ড্রাইভ KYC</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">
            ড্রাইভ ব্যালেন্স আনলক করতে পরিচয় যাচাই করুন
          </span>
        </span>
      </div>

      {/* Info banner */}
      <div className="rounded-md bg-[#e8f1ff] border border-[#0b3d91]/15 p-3 flex items-start gap-2.5">
        <span className="size-9 rounded-md bg-[#0b3d91] text-white flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </span>
        <p className="text-[11.5px] font-semibold text-[#2c3e63] leading-snug">
          আপনার তথ্য যাচাইয়ের পর অ্যাডমিন ড্রাইভ ব্যালেন্স অনুমোদন করবেন। অনুমোদনের
          পরই আপনি ড্রাইভ প্যাক কিনতে পারবেন।
        </p>
      </div>

      {/* Form */}
      <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
        <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#0b3d91]">
          <IdCard size={16} /> পরিচয় তথ্য
        </p>

        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">নাম *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="এনআইডি অনুযায়ী পূর্ণ নাম"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">এনআইডি নম্বর *</label>
          <input
            value={nid}
            onChange={(e) => setNid(e.target.value)}
            placeholder="জাতীয় পরিচয়পত্র নম্বর"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">ঠিকানা *</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            placeholder="বর্তমান ঠিকানা"
            className="w-full rounded-md border border-[#dfe6f2] px-3 py-2 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">নোট (ঐচ্ছিক)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="অতিরিক্ত তথ্য থাকলে লিখুন"
            className="w-full rounded-md border border-[#dfe6f2] px-3 py-2 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={clsx(
            "w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60",
          )}
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : <CheckCircle2 size={18} />}
          {loading ? "জমা হচ্ছে..." : "KYC জমা দিন"}
        </button>
      </div>

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        জমা দেওয়ার পর আপনার অনুরোধটি রিভিউ এর জন্য পাঠানো হবে।
      </p>
    </>
  );
}

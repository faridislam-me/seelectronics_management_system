"use client";

import { getMyDriveInfo, submitDriveKyc } from "@/actions/driveBalanceActions";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2, IdCard, ImagePlus, Loader2, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type DocSlot = "photo" | "nidFront" | "nidBack";

export default function DriveKycFormPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [nid, setNid] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<Record<DocSlot, File | null>>({
    photo: null,
    nidFront: null,
    nidBack: null,
  });
  const [previews, setPreviews] = useState<Record<DocSlot, string>>({
    photo: "",
    nidFront: "",
    nidBack: "",
  });
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  // After a successful submit we show a notice popup (client-requested) telling
  // the customer their payment will be verified and the balance credited.
  const [submitted, setSubmitted] = useState(false);

  const pickFile = (slot: DocSlot, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("ছবি ফাইল দিন");
      return;
    }
    setFiles((p) => ({ ...p, [slot]: file }));
    setPreviews((p) => {
      if (p[slot]) URL.revokeObjectURL(p[slot]);
      return { ...p, [slot]: URL.createObjectURL(file) };
    });
  };

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
    if (!files.photo) return toast.error("আপনার ছবি দিন");
    if (!files.nidFront) return toast.error("NID সামনের ছবি দিন");
    if (!files.nidBack) return toast.error("NID পিছনের ছবি দিন");

    setLoading(true);
    const fd = new FormData();
    fd.set("fullName", fullName.trim());
    fd.set("nid", nid.trim());
    fd.set("address", address.trim());
    if (note.trim()) fd.set("note", note.trim());
    fd.set("photo", files.photo);
    fd.set("nidFront", files.nidFront);
    fd.set("nidBack", files.nidBack);

    const res = await submitDriveKyc(fd);
    setLoading(false);

    if (res.success) {
      setSubmitted(true);
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

        <div className="border-t border-dashed border-[#dfe6f2] pt-2.5">
          <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#0b3d91] mb-2">
            <ImagePlus size={16} /> ডকুমেন্ট (ছবি) *
          </p>
          <div className="grid grid-cols-3 gap-2">
            <DocUpload
              slot="photo"
              label="আপনার ছবি"
              icon={<UserRound size={18} />}
              preview={previews.photo}
              onPick={pickFile}
            />
            <DocUpload
              slot="nidFront"
              label="NID সামনে"
              icon={<IdCard size={18} />}
              preview={previews.nidFront}
              onPick={pickFile}
            />
            <DocUpload
              slot="nidBack"
              label="NID পিছনে"
              icon={<IdCard size={18} />}
              preview={previews.nidBack}
              onPick={pickFile}
            />
          </div>
          <p className="text-[10.5px] text-[#5b6784] mt-1.5">
            পরিষ্কার ছবি দিন — তথ্য যাচাইয়ের জন্য প্রয়োজন।
          </p>
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

      {/* Submission notice popup */}
      {submitted && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-5">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 flex flex-col items-center text-center gap-3 shadow-2xl">
            <span className="size-16 rounded-full bg-[#e9f9ef] flex items-center justify-center">
              <CheckCircle2 size={36} className="text-[#178a42]" />
            </span>
            <p className="text-[17px] font-extrabold text-[#0f1729]">KYC জমা হয়েছে</p>
            <p className="text-[12.5px] font-semibold leading-relaxed text-[#45506b]">
              আপনার তথ্য ও পেমেন্ট যাচাই করে অ্যাডমিন আপনার ড্রাইভ ব্যালেন্সে টাকা যোগ করে দেবেন।
              অনুমোদনের পরই আপনি ড্রাইভ প্যাক কিনতে পারবেন।
            </p>
            <button
              type="button"
              onClick={() => router.push("/customer/referral/recharge/drive")}
              className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center shadow-[0_6px_18px_rgba(11,61,145,0.3)] mt-1"
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function DocUpload({
  slot,
  label,
  icon,
  preview,
  onPick,
}: {
  slot: DocSlot;
  label: string;
  icon: React.ReactNode;
  preview: string;
  onPick: (slot: DocSlot, file: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <button
      type="button"
      onClick={() => ref.current?.click()}
      className={clsx(
        "relative aspect-square rounded-md border overflow-hidden flex flex-col items-center justify-center gap-1 text-center transition",
        preview ? "border-[#0b3d91]" : "border-dashed border-[#c3d0e8] bg-[#f6f9ff] hover:border-[#0b3d91]",
      )}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={label} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <>
          <span className="text-[#0b3d91]">{icon}</span>
          <span className="text-[10px] font-bold text-[#5b6784] leading-tight px-1">{label}</span>
        </>
      )}
      {preview && (
        <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[9px] font-bold py-0.5">
          {label}
        </span>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onPick(slot, e.target.files?.[0] || null)}
      />
    </button>
  );
}

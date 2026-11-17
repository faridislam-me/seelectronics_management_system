"use client";

import { submitLotteryEntry } from "@/actions/lotteryActions";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gift,
  Loader2,
  MapPin,
  Phone,
  Ticket,
  Trophy,
  Upload,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

type PublicCampaign = {
  id: string;
  name: string;
  drawDate: string | Date | null;
  shopAddress: string | null;
  shopMobile: string | null;
  prizeFirst: string | null;
  prizeSecond: string | null;
  prizeThird: string | null;
  topBannerUrl: string | null;
  banners: string[];
} | null;

const fmtDate = (d: string | Date | null) =>
  d
    ? new Date(d).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })
    : null;

export default function LotteryForm({
  campaign,
  prefillCode = "",
}: {
  campaign: PublicCampaign;
  prefillCode?: string;
}) {
  const [cardCode, setCardCode] = useState(prefillCode);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setPhoto(f);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  };

  const reset = () => {
    setDone(false);
    setCardCode(prefillCode);
    setName("");
    setPhone("");
    setCustomerId("");
    setAddress("");
    setPhoto(null);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (!cardCode.trim()) return toast.error("লটারি নাম্বার দিন");
    if (!name.trim()) return toast.error("আপনার নাম দিন");
    if (!/^01\d{9}$/.test(phone.trim())) return toast.error("সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)");
    if (!address.trim()) return toast.error("আপনার ঠিকানা দিন");
    if (!photo) return toast.error("আপনার একটি ছবি যুক্ত করুন");

    setSubmitting(true);
    const fd = new FormData();
    fd.append("cardCode", cardCode.trim());
    fd.append("name", name.trim());
    fd.append("phone", phone.trim());
    fd.append("customerId", customerId.trim());
    fd.append("address", address.trim());
    if (photo) fd.append("photo", photo);
    const res = await submitLotteryEntry(fd);
    setSubmitting(false);
    if (res.success) setDone(true);
    else toast.error(res.message || "জমা দেওয়া যায়নি");
  };

  const prizes = [
    { label: "১ম পুরুষ্কার", value: campaign?.prizeFirst, tone: "from-amber-400 to-amber-600" },
    { label: "২য় পুরুষ্কার", value: campaign?.prizeSecond, tone: "from-slate-300 to-slate-500" },
    { label: "৩য় পুরুষ্কার", value: campaign?.prizeThird, tone: "from-orange-400 to-orange-600" },
  ].filter((p) => p.value);

  const drawDate = fmtDate(campaign?.drawDate ?? null);

  return (
    <div className="min-h-screen bg-[#eef3fb] flex flex-col items-center px-3 py-6 text-[#16213a]">
      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Top banner */}
        {campaign?.topBannerUrl && (
          <div className="relative w-full aspect-[16/7] rounded-2xl overflow-hidden shadow-[0_10px_30px_rgba(10,47,112,0.25)] border border-[#dfe6f2] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={campaign.topBannerUrl}
              alt="banner"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        )}

        {/* Brand header */}
        <div className="rounded-2xl bg-[linear-gradient(105deg,#0a2f70_0%,#1259c9_60%,#1f7cf0_100%)] text-white p-5 text-center shadow-[0_10px_30px_rgba(10,47,112,0.35)]">
          <div className="mx-auto size-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center mb-2">
            <Gift size={30} />
          </div>
          <h1 className="text-[22px] font-extrabold leading-tight">
            {campaign?.name?.trim() || "SE Electronics লটারি"}
          </h1>
          <p className="text-[12.5px] text-white/85 mt-1">
            স্ক্র্যাচ কার্ডের লটারি নাম্বার ও আপনার তথ্য দিয়ে লটারিতে অংশ নিন
          </p>
        </div>

        {/* Banner slider */}
        {campaign?.banners && campaign.banners.length > 0 && (
          <BannerSlider images={campaign.banners} />
        )}

        {/* Campaign info */}
        {(drawDate || campaign?.shopAddress || campaign?.shopMobile) && (
          <div className="rounded-2xl bg-white border border-[#dfe6f2] p-4 flex flex-col gap-2.5 shadow-sm">
            {drawDate && (
              <InfoRow icon={CalendarDays} label="ড্র-র তারিখ" value={drawDate} />
            )}
            {campaign?.shopAddress && (
              <InfoRow icon={MapPin} label="দোকানের ঠিকানা" value={campaign.shopAddress} />
            )}
            {campaign?.shopMobile && (
              <InfoRow icon={Phone} label="মোবাইল" value={campaign.shopMobile} href={`tel:${campaign.shopMobile}`} />
            )}
          </div>
        )}

        {/* Prizes */}
        {prizes.length > 0 && (
          <div className="rounded-2xl bg-white border border-[#dfe6f2] p-4 flex flex-col gap-3 shadow-sm">
            <p className="text-[13px] font-extrabold text-[#0b3d91] inline-flex items-center gap-1.5">
              <Trophy size={16} className="text-amber-500" /> পুরষ্কার সমূহ
            </p>
            <div className="flex flex-col gap-2">
              {prizes.map((p) => (
                <div
                  key={p.label}
                  className="flex items-center gap-3 rounded-xl border border-[#eef2f9] bg-[#f8fafd] px-3 py-2.5"
                >
                  <span
                    className={`shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-gradient-to-br ${p.tone} text-white`}
                  >
                    <Trophy size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#5b6784]">{p.label}</p>
                    <p className="text-[14px] font-extrabold text-[#16213a] leading-snug break-words">
                      {p.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entry form */}
        <div className="rounded-2xl bg-white border border-[#dfe6f2] p-4 flex flex-col gap-3 shadow-sm">
          <Field label="লটারি নাম্বার" required icon>
            <input
              value={cardCode}
              onChange={(e) => setCardCode(e.target.value.toUpperCase())}
              placeholder="কার্ডের লটারি নাম্বার"
              className="w-full h-12 rounded-md border border-[#dfe6f2] px-3 text-[16px] font-extrabold tracking-wider uppercase bg-white focus:border-[#0b3d91] focus:outline-none"
            />
          </Field>
          <Field label="নাম" required>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="পুরো নাম"
              className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
            />
          </Field>
          <Field label="নাম্বার" required>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              inputMode="numeric"
              className="w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
            />
          </Field>
          <Field label="কাস্টমার আইডি">
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="থাকলে দিন (ঐচ্ছিক)"
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
          <Field label="আপনার ছবি" required>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={onPhoto}
              className="hidden"
              id="lottery-photo"
            />
            <label
              htmlFor="lottery-photo"
              className="flex items-center gap-3 rounded-md border border-dashed border-[#9fb6e0] bg-[#f6f9fe] px-3 py-3 cursor-pointer active:bg-[#eef3fb]"
            >
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="preview"
                  className="size-14 rounded-md object-cover border border-[#dfe6f2]"
                />
              ) : (
                <span className="size-14 rounded-md bg-[#e6eefb] flex items-center justify-center text-[#0b3d91]">
                  <Upload size={22} />
                </span>
              )}
              <span className="text-[13px] font-bold text-[#3d4f72]">
                {photo ? "ছবি পরিবর্তন করুন" : "ছবি তুলুন বা নির্বাচন করুন"}
              </span>
            </label>
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

        <p className="text-center text-[11px] text-[#5b6784] font-semibold">
          SE Electronics — Always With You
        </p>
      </div>

      {/* Success popup */}
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col items-center text-center gap-3 shadow-2xl">
            <span className="size-16 rounded-full bg-[#e8fbef] flex items-center justify-center">
              <CheckCircle2 size={40} className="text-[#22c55e]" />
            </span>
            <p className="text-[19px] font-extrabold text-[#0b3d91]">এন্ট্রি জমা হয়েছে!</p>
            <p className="text-[13px] font-semibold text-[#5b6784] leading-relaxed">
              ধন্যবাদ {name.trim()}। আপনার লটারি এন্ট্রি সফলভাবে জমা হয়েছে। ড্র শেষে বিজয়ীদের
              মোবাইলে SMS-এ জানানো হবে।
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-1 h-11 px-5 rounded-md bg-[#0b3d91] text-white text-[13px] font-extrabold"
            >
              আরেকটি কার্ড জমা দিন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BannerSlider({ images }: { images: string[] }) {
  const [i, setI] = useState(0);
  const n = images.length;

  useEffect(() => {
    if (n <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 4000);
    return () => clearInterval(t);
  }, [n]);

  const go = (d: number) => setI((p) => (p + d + n) % n);

  return (
    <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-[#dfe6f2] bg-white shadow-sm">
      {images.map((src, idx) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt={`slide ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {n > 1 && (
        <>
          <button
            type="button"
            aria-label="prev"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="next"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur-sm"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((src, idx) => (
              <button
                key={src}
                type="button"
                aria-label={`go to slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-5 bg-white" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 mt-0.5 size-7 rounded-full bg-[#eef3fb] text-[#0b3d91] flex items-center justify-center">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[#5b6784]">{label}</p>
        <p className="text-[14px] font-extrabold text-[#16213a] leading-snug break-words">{value}</p>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {body}
    </a>
  ) : (
    body
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

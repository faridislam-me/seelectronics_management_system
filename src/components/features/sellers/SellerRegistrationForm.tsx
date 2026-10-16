"use client";

import { createSeller, getSellerMediaUrls, updateSeller } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import { Spinner } from "@/components/ui";
import { sellerAgreementText, sellerBusinessTypes } from "@/constants";
import { SellersType } from "@/types";
import clsx from "clsx";
import { Briefcase, Building2, Calendar, ChevronDown, FileBadge, IdCard, LucideIcon, Mail, Map as MapIcon, MapPin, Phone, Send, Store, UploadCloud, User, X } from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

// Same look as the online service form (GetServiceForm): numbered section
// cards, 40px boxes with the icon inside, compact dashed photo tiles.

function SectionCard({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
        <span className="size-7 rounded-full bg-[#0b3d91] text-white text-[13px] font-extrabold flex items-center justify-center">{n}</span>
        <span className="text-[15px] font-extrabold text-[#0b3d91]">{title}</span>
      </div>
      <div className="p-2.5 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

const boxCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white pl-9 pr-2.5 text-[14px] font-semibold text-[#16213a] placeholder:font-medium placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";
const Label = ({ text, req }: { text: string; req?: boolean }) => <span className="text-[12.5px] font-bold text-[#16213a]">{text} {req && <span className="text-[#e0243f]">*</span>}</span>;

function Field({ icon: Icon, label, req = true, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <Label text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <input {...props} required={req} className={boxCls} />
      </span>
    </label>
  );
}

function SelectField({ icon: Icon, label, req = true, options, placeholder = true, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean; options: readonly { value: string; label: string }[]; placeholder?: boolean } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <Label text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <select {...props} required={req} className={clsx(boxCls, "appearance-none pr-7")}>
          {placeholder && <option value="">নির্বাচন করুন</option>}
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5b6784] pointer-events-none" />
      </span>
    </label>
  );
}

function UploadBox({ name, label, req = true, src }: { name: string; label: string; req?: boolean; src?: string }) {
  const [preview, setPreview] = useState<string | null>(src || null);
  const ref = useRef<HTMLInputElement | null>(null);
  const maxMb = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB || 2);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setPreview(src || null);
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`ফাইল ${maxMb} MB-এর বেশি হতে পারবে না!`);
      e.target.value = "";
      return setPreview(src || null);
    }
    setPreview(URL.createObjectURL(file));
  };
  return (
    <div className={clsx("relative h-[100px] rounded-md border border-dashed overflow-hidden", preview ? "border-[#1f7cf0]" : "border-[#b9cdee] bg-[#f7faff]")}>
      {preview ? (
        <>
          <Image src={preview} alt={label} fill className="object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] font-bold text-center py-0.5 truncate px-1">{label}</span>
          <button type="button" aria-label="Remove" onClick={() => { setPreview(null); if (ref.current) ref.current.value = ""; }} className="absolute top-1 right-1 z-20 size-6 rounded-md bg-black/55 text-white flex items-center justify-center"><X size={14} /></button>
        </>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
          <UploadCloud size={22} className="text-[#1f5fc9]" />
          <span className="text-[11px] font-bold text-[#16213a] leading-tight">{label} {req && <span className="text-[#e0243f]">*</span>}</span>
          <span className="text-[9px] font-medium text-[#5b6784] leading-tight">(JPG, PNG বা WebP - Max {maxMb}MB)</span>
        </span>
      )}
      <input ref={ref} type="file" name={name} accept="image/png, image/jpeg, image/webp" required={req && !preview} onChange={onChange} className={clsx("absolute inset-0 opacity-0 cursor-pointer", preview ? "z-10" : "z-20")} />
    </div>
  );
}

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function SellerRegistrationForm({
  mode,
  sellerData,
  token,
  onComplete,
}: {
  mode: "create" | "update";
  sellerData?: SellersType;
  token?: string;
  onComplete?: (info: { name: string; sellerId?: string }) => void;
}) {
  const [selectedDistrict, setSelectedDistrict] = useState(sellerData?.shopDistrict || "");
  const [docs, setDocs] = useState<Record<string, string> | null>(null);
  const [createResponse, createAction, isCreating] = useActionState(createSeller, undefined);
  const [updateResponse, updateAction, isUpdating] = useActionState(
    (_prev: unknown, formData: FormData) => updateSeller(sellerData!.sellerId, formData),
    undefined,
  );
  const districts = Object.keys(geoData).map((d) => ({ value: d, label: cap(d) }));
  const thanas = (geoData[selectedDistrict as keyof typeof geoData] || []).map((t: string) => ({ value: t, label: cap(t) }));
  const required = mode === "create";

  const loadDocs = async (e: React.ToggleEvent<HTMLDetailsElement>) => {
    if (!e.currentTarget.open || docs || !sellerData) return;
    const keys = [
      sellerData.tradeLicensePhotoKey,
      sellerData.shopFrontPhotoKey,
      sellerData.shopInsidePhotoKey || "",
      sellerData.nidFrontPhotoKey,
      sellerData.nidBackPhotoKey,
    ];
    const res = await getSellerMediaUrls(keys.filter(Boolean));
    if (!res.success) return toast.error(res.message);
    const urls = res.data!;
    let i = 0;
    setDocs({
      tradeLicensePhoto: urls[i++],
      shopFrontPhoto: urls[i++],
      shopInsidePhoto: sellerData.shopInsidePhotoKey ? urls[i++] : "",
      nidFrontPhoto: urls[i++],
      nidBackPhoto: urls[i++],
    });
  };

  useEffect(() => {
    if (isCreating || !createResponse) return;
    toast(createResponse.message, { type: createResponse.success ? "success" : "error" });
    if (createResponse.success) {
      const data = createResponse.data as { name?: string; sellerId?: string } | undefined;
      onComplete?.({ name: data?.name || "", sellerId: data?.sellerId });
    }
  }, [isCreating]);

  useEffect(() => {
    if (isUpdating || !updateResponse) return;
    toast(updateResponse.message, { type: updateResponse.success ? "success" : "error" });
    if (updateResponse.success) onComplete?.({ name: sellerData?.ownerName || "" });
  }, [isUpdating, updateResponse]);

  return (
    <form action={mode === "create" ? createAction : updateAction} className="flex flex-col gap-2.5 text-[#16213a]">
      {token && <input type="hidden" name="token" value={token} />}

      <SectionCard n={1} title="দোকানের তথ্য">
        <Field icon={Store} label="দোকানের নাম" name="shopName" placeholder="ট্রেড লাইসেন্স অনুযায়ী নাম" defaultValue={sellerData?.shopName || ""} req={required} />
        <div className="grid grid-cols-2 gap-2">
          <SelectField icon={Briefcase} label="ব্যবসার ধরন" name="businessType" defaultValue={sellerData?.businessType || "retail"} options={sellerBusinessTypes} placeholder={false} req={required} />
          <Field icon={Calendar} label="ব্যবসার বয়স (বছর)" name="businessYears" type="number" inputMode="numeric" placeholder="যেমন: ৫" defaultValue={(sellerData?.businessYears ?? "") as string} req={false} />
        </div>
        <Field icon={FileBadge} label="ট্রেড লাইসেন্স নং" name="tradeLicenseNumber" placeholder="ট্রেড লাইসেন্স নাম্বার লিখুন" defaultValue={sellerData?.tradeLicenseNumber || ""} req={required} />
        <Field icon={MapPin} label="দোকানের ঠিকানা" name="shopStreetAddress" placeholder="মার্কেট / রোড / এলাকা লিখুন" defaultValue={sellerData?.shopStreetAddress || ""} req={required} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <SelectField icon={MapIcon} label="জেলা" name="shopDistrict" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} options={districts} />
          <SelectField icon={Building2} label="থানা" name="shopPoliceStation" defaultValue={sellerData?.shopPoliceStation || ""} options={thanas} req={false} />
          <Field icon={Mail} label="পোস্ট অফিস" name="shopPostOffice" placeholder="পোস্ট অফিস" defaultValue={sellerData?.shopPostOffice || ""} req={false} className="col-span-2 sm:col-span-1" />
        </div>
      </SectionCard>

      <SectionCard n={2} title="মালিকের তথ্য">
        <Field icon={User} label="মালিকের নাম" name="ownerName" placeholder="NID অনুযায়ী পুরো নাম" defaultValue={sellerData?.ownerName || ""} req={required} />
        <div className="grid grid-cols-2 gap-2">
          <Field icon={Phone} label="মোবাইল নাম্বার" name="phone" type="tel" inputMode="numeric" placeholder="01XXXXXXXXX" defaultValue={sellerData?.phone || ""} req={required} />
          <Field icon={IdCard} label="NID নাম্বার" name="nidNumber" inputMode="numeric" placeholder="NID নাম্বার" defaultValue={sellerData?.nidNumber || ""} req={required} />
        </div>
      </SectionCard>

      <SectionCard n={3} title="ডকুমেন্ট ও ছবি">
        {mode === "update" ? (
          <details onToggle={loadDocs}>
            <summary className="cursor-pointer text-sm font-bold text-[#1f7cf0]">Profile and document images</summary>
            {docs ? (
              <div className="grid grid-cols-3 gap-2 mt-2.5">
                <UploadBox src={sellerData?.ownerPhotoUrl || undefined} label="মালিকের ছবি" name="ownerPhoto" req={false} />
                <UploadBox src={docs.tradeLicensePhoto} label="ট্রেড লাইসেন্স" name="tradeLicensePhoto" req={false} />
                <UploadBox src={docs.shopFrontPhoto} label="দোকানের ছবি (সামনে)" name="shopFrontPhoto" req={false} />
                <UploadBox src={docs.shopInsidePhoto || undefined} label="দোকানের ছবি (ভেতরে)" name="shopInsidePhoto" req={false} />
                <UploadBox src={docs.nidFrontPhoto} label="NID সামনের দিক" name="nidFrontPhoto" req={false} />
                <UploadBox src={docs.nidBackPhoto} label="NID পেছনের দিক" name="nidBackPhoto" req={false} />
              </div>
            ) : (
              <div className="__center text-gray-400 h-32"><Spinner /></div>
            )}
          </details>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <UploadBox label="মালিকের ছবি" name="ownerPhoto" />
            <UploadBox label="ট্রেড লাইসেন্স" name="tradeLicensePhoto" />
            <UploadBox label="দোকানের ছবি (সামনে)" name="shopFrontPhoto" />
            <UploadBox label="দোকানের ছবি (ভেতরে) ঐচ্ছিক" name="shopInsidePhoto" req={false} />
            <UploadBox label="NID সামনের দিক" name="nidFrontPhoto" />
            <UploadBox label="NID পেছনের দিক" name="nidBackPhoto" />
          </div>
        )}
      </SectionCard>

      {token ? (
        <label className="rounded-md bg-[#fff6e3] border border-[#f5dfa0] p-2.5 flex items-start gap-3 cursor-pointer select-none">
          <input value="true" type="checkbox" name="agreed" className="size-5 mt-0.5 shrink-0 accent-[#0b3d91]" required />
          <span className="text-[12.5px] font-semibold text-[#5a4300] whitespace-pre-line leading-snug">{sellerAgreementText.trim()}</span>
        </label>
      ) : (
        mode === "create" && (
          <label className="text-start select-none flex items-center text-[#54595f] text-sm">
            <input value="true" type="checkbox" name="sendConfirmationSMS" className="size-4 mr-2" />
            Send confirmation SMS (Seller ID)
          </label>
        )
      )}

      {token ? (
        <button disabled={isCreating} className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all">
          <Send size={18} />{isCreating ? "Submitting..." : "আবেদন জমা দিন"}
        </button>
      ) : (
        <button disabled={isCreating || isUpdating} className="__btn">
          {mode === "create" ? (isCreating ? "Submitting..." : "Add Seller") : isUpdating ? "Updating..." : "Update"}
        </button>
      )}
    </form>
  );
}

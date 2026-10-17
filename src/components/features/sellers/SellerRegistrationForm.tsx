"use client";

import { createSeller, getSellerMediaUrls, updateSeller } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import { Spinner } from "@/components/ui";
import { Field, SectionCard, SelectField, UploadBox } from "@/components/ui/ServiceFormKit";
import { sellerAgreementText, sellerBusinessTypes } from "@/constants";
import { SellersType } from "@/types";
import { Briefcase, Building2, CalendarClock, FileBadge, IdCard, Mail, Map as MapIcon, MapPin, Phone, Send, Store, User } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const districts = Object.keys(geoData);
  const thanas = geoData[selectedDistrict as keyof typeof geoData] || [];
  const required = mode === "create";

  // Edit mode: fetch the already uploaded images so each tile shows a preview.
  useEffect(() => {
    if (mode !== "update" || !sellerData) return;
    const keys = [
      sellerData.tradeLicensePhotoKey,
      sellerData.shopFrontPhotoKey,
      sellerData.shopInsidePhotoKey || "",
      sellerData.nidFrontPhotoKey,
      sellerData.nidBackPhotoKey,
    ];
    getSellerMediaUrls(keys.filter(Boolean)).then((res) => {
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
    });
  }, [mode, sellerData?.sellerId]);

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

  const photos: { name: string; label: string; req: boolean; src?: string | null }[] = [
    { name: "ownerPhoto", label: "মালিকের ছবি", req: true, src: sellerData?.ownerPhotoUrl },
    { name: "tradeLicensePhoto", label: "ট্রেড লাইসেন্স", req: true, src: docs?.tradeLicensePhoto },
    { name: "shopFrontPhoto", label: "দোকানের ছবি (সামনে)", req: true, src: docs?.shopFrontPhoto },
    { name: "shopInsidePhoto", label: "দোকানের ছবি (ভেতরে)", req: false, src: docs?.shopInsidePhoto },
    { name: "nidFrontPhoto", label: "NID সামনের দিক", req: true, src: docs?.nidFrontPhoto },
    { name: "nidBackPhoto", label: "NID পেছনের দিক", req: true, src: docs?.nidBackPhoto },
  ];

  return (
    <form action={mode === "create" ? createAction : updateAction} className="flex flex-col gap-2.5">
      {token && <input type="hidden" name="token" value={token} />}

      <SectionCard n={1} title="দোকানের তথ্য" hint="ট্রেড লাইসেন্স অনুযায়ী দোকানের নাম ও ঠিকানা দিন">
        <div className="grid grid-cols-2 gap-2.5">
          <Field icon={Store} label="দোকানের নাম" name="shopName" defaultValue={sellerData?.shopName || ""} req={required} placeholder="দোকানের নাম লিখুন" className="col-span-2 sm:col-span-1" />
          <SelectField className="col-span-2 sm:col-span-1" icon={Briefcase} label="ব্যবসার ধরন" name="businessType" defaultValue={sellerData?.businessType || "retail"} req={required} options={sellerBusinessTypes} placeholder={null} />
          <Field icon={FileBadge} label="ট্রেড লাইসেন্স নং" name="tradeLicenseNumber" defaultValue={sellerData?.tradeLicenseNumber || ""} req={required} placeholder="লাইসেন্স নাম্বার" />
          <Field icon={CalendarClock} label="ব্যবসার বয়স (বছর)" name="businessYears" type="number" inputMode="numeric" min={0} defaultValue={(sellerData?.businessYears ?? "") as string} req={false} placeholder="যেমন: 5" />
        </div>
        <Field icon={MapPin} label="দোকানের ঠিকানা" name="shopStreetAddress" defaultValue={sellerData?.shopStreetAddress || ""} req={required} placeholder="বাজার / রাস্তা / এলাকা" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <SelectField icon={MapIcon} label="জেলা" name="shopDistrict" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} req options={districts} format={cap} />
          <SelectField icon={Building2} label="থানা" name="shopPoliceStation" defaultValue={sellerData?.shopPoliceStation || ""} req={false} options={thanas} format={cap} />
          <Field icon={Mail} label="পোস্ট অফিস" name="shopPostOffice" defaultValue={sellerData?.shopPostOffice || ""} req={false} placeholder="পোস্ট অফিস" className="col-span-2 sm:col-span-1" />
        </div>
      </SectionCard>

      <SectionCard n={2} title="মালিকের তথ্য" hint="NID অনুযায়ী নাম ও নাম্বার দিন">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <Field icon={User} label="মালিকের নাম" name="ownerName" defaultValue={sellerData?.ownerName || ""} req={required} placeholder="পূর্ণ নাম" className="col-span-2 sm:col-span-1" />
          <Field icon={Phone} label="মোবাইল নাম্বার" name="phone" type="tel" inputMode="tel" defaultValue={sellerData?.phone || ""} req={required} placeholder="01XXXXXXXXX" />
          <Field icon={IdCard} label="NID নাম্বার" name="nidNumber" inputMode="numeric" defaultValue={sellerData?.nidNumber || ""} req={required} placeholder="NID নাম্বার" />
        </div>
      </SectionCard>

      <SectionCard n={3} title="ছবি ও ডকুমেন্ট" hint={mode === "update" ? "নতুন ছবি দিলে পুরনোটা বদলে যাবে" : "স্পষ্ট ও পড়ার উপযোগী ছবি আপলোড করুন"}>
        {mode === "update" && !docs ? (
          <div className="flex items-center justify-center text-gray-400 h-[100px]"><Spinner /></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {photos.map((p) => (
              <UploadBox key={p.name} name={p.name} label={p.label} req={mode === "create" && p.req} initialSrc={p.src} />
            ))}
          </div>
        )}
      </SectionCard>

      {token ? (
        <label className="text-start text-[#3d4a63] text-[13px] flex gap-2.5 select-none bg-[#fff6e3] border border-[#f5dfa0] rounded-md p-2.5">
          <input value="true" type="checkbox" name="agreed" className="size-5 mt-0.5 shrink-0 accent-[#0b3d91]" required />
          <span className="whitespace-pre-line leading-relaxed">{sellerAgreementText.trim()}</span>
        </label>
      ) : (
        mode === "create" && (
          <label className="text-start select-none flex items-center gap-2 text-[#3d4a63] text-[13px] font-semibold">
            <input value="true" type="checkbox" name="sendConfirmationSMS" className="size-4 accent-[#0b3d91]" />
            Send confirmation SMS (Seller ID)
          </label>
        )
      )}

      <button disabled={isCreating || isUpdating} className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-40 active:scale-[0.98] transition-all">
        <Send size={18} />
        {mode === "create" ? (isCreating ? "Submitting..." : token ? "আবেদন জমা দিন" : "Add Seller") : isUpdating ? "Updating..." : "Update"}
      </button>
    </form>
  );
}

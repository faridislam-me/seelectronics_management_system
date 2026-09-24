"use client";

import { createSeller, getSellerMediaUrls, updateSeller } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import { InputField, Spinner } from "@/components/ui";
import { sellerAgreementText, sellerBusinessTypes } from "@/constants";
import { SellersType } from "@/types";
import { FileBadge, Images, LucideIcon, Store, User } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

function Section({ icon: Icon, title, hint, children }: { icon: LucideIcon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-[#e3e8f1] bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-[#f5f8fd] border-b border-[#e3e8f1]">
        <span className="size-9 rounded-xl bg-[#1f7cf0] text-white flex items-center justify-center shrink-0"><Icon size={18} /></span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-extrabold text-[#16213a]">{title}</span>
          {hint && <span className="text-[11px] font-semibold text-[#6b7690]">{hint}</span>}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

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

  const selectCls = "w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-md text-sm sm:text-base transition-all focus:ring-1 focus:ring-brand focus:border-brand outline-none";
  const Label = ({ text, req }: { text: string; req?: boolean }) => (
    <span className="text-sm font-medium text-gray-700">{text} {req && <span className="text-red-500 text-lg">*</span>}</span>
  );

  return (
    <form action={mode === "create" ? createAction : updateAction} className="flex flex-col gap-5">
      {token && <input type="hidden" name="token" value={token} />}

      <Section icon={Store} title="দোকানের তথ্য" hint="ট্রেড লাইসেন্স অনুযায়ী দোকানের নাম ও ঠিকানা দিন">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="দোকানের নাম" name="shopName" defaultValue={sellerData?.shopName || ""} required={required} />
          <div className="flex-1 text-start">
            <label className="flex flex-col gap-1.5">
              <Label text="ব্যবসার ধরন" req={required} />
              <select name="businessType" defaultValue={sellerData?.businessType || "retail"} className={selectCls}>
                {sellerBusinessTypes.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </label>
          </div>
          <InputField label="ট্রেড লাইসেন্স নং" name="tradeLicenseNumber" defaultValue={sellerData?.tradeLicenseNumber || ""} required={required} />
          <InputField label="ব্যবসার বয়স (বছর)" name="businessYears" type="number" defaultValue={(sellerData?.businessYears ?? "") as string} required={false} />
        </div>
        <InputField label="দোকানের ঠিকানা" name="shopStreetAddress" defaultValue={sellerData?.shopStreetAddress || ""} required={required} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex-1 text-start">
            <label className="flex flex-col gap-1.5">
              <Label text="জেলা" req={required} />
              <select required name="shopDistrict" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className={selectCls}>
                <option value="">নির্বাচন করুন</option>
                {districts.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
              </select>
            </label>
          </div>
          <div className="flex-1 text-start">
            <label className="flex flex-col gap-1.5">
              <Label text="থানা" />
              <select name="shopPoliceStation" defaultValue={sellerData?.shopPoliceStation || ""} className={selectCls}>
                <option value="">নির্বাচন করুন</option>
                {thanas.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </label>
          </div>
          <InputField label="পোস্ট অফিস" name="shopPostOffice" defaultValue={sellerData?.shopPostOffice || ""} required={false} />
        </div>
      </Section>

      <Section icon={User} title="মালিকের তথ্য" hint="NID অনুযায়ী নাম ও নাম্বার দিন">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InputField label="মালিকের নাম" name="ownerName" defaultValue={sellerData?.ownerName || ""} required={required} />
          <InputField label="মোবাইল নাম্বার" name="phone" type="tel" defaultValue={sellerData?.phone || ""} required={required} />
          <InputField label="NID নাম্বার" name="nidNumber" defaultValue={sellerData?.nidNumber || ""} required={required} />
        </div>
      </Section>

      <Section icon={mode === "update" ? Images : FileBadge} title="ডকুমেন্ট ও ছবি" hint="স্পষ্ট ও পড়ার উপযোগী ছবি আপলোড করুন">
        {mode === "update" ? (
          <details onToggle={loadDocs}>
            <summary className="cursor-pointer text-sm font-bold text-[#1f7cf0]">Profile and document images</summary>
            {docs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                <InputField src={sellerData?.ownerPhotoUrl || undefined} label="মালিকের ছবি" name="ownerPhoto" type="file" required={false} />
                <InputField src={docs.tradeLicensePhoto} label="ট্রেড লাইসেন্স" name="tradeLicensePhoto" type="file" required={false} />
                <InputField src={docs.shopFrontPhoto} label="দোকানের ছবি (সামনে)" name="shopFrontPhoto" type="file" required={false} />
                <InputField src={docs.shopInsidePhoto || undefined} label="দোকানের ছবি (ভেতরে)" name="shopInsidePhoto" type="file" required={false} />
                <InputField src={docs.nidFrontPhoto} label="NID সামনের দিক" name="nidFrontPhoto" type="file" required={false} />
                <InputField src={docs.nidBackPhoto} label="NID পেছনের দিক" name="nidBackPhoto" type="file" required={false} />
              </div>
            ) : (
              <div className="__center text-gray-400 h-32"><Spinner /></div>
            )}
          </details>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <InputField label="মালিকের ছবি" name="ownerPhoto" type="file" required />
            <InputField label="ট্রেড লাইসেন্স" name="tradeLicensePhoto" type="file" required />
            <InputField label="দোকানের ছবি (সামনে)" name="shopFrontPhoto" type="file" required />
            <InputField label="দোকানের ছবি (ভেতরে)" placeholder="ঐচ্ছিক" name="shopInsidePhoto" type="file" required={false} />
            <InputField label="NID সামনের দিক" name="nidFrontPhoto" type="file" required />
            <InputField label="NID পেছনের দিক" name="nidBackPhoto" type="file" required />
          </div>
        )}
      </Section>

      {token ? (
        <label className="text-start text-[#54595f] text-sm flex gap-3 select-none bg-[#fff6e3] border border-[#f5dfa0] rounded-[16px] p-4">
          <input value="true" type="checkbox" name="agreed" className="size-4 mt-1 shrink-0 accent-[#1f7cf0]" required />
          <span className="whitespace-pre-line leading-relaxed">{sellerAgreementText.trim()}</span>
        </label>
      ) : (
        mode === "create" && (
          <label className="text-start select-none flex items-center text-[#54595f] text-sm">
            <input value="true" type="checkbox" name="sendConfirmationSMS" className="size-4 mr-2" />
            Send confirmation SMS (Seller ID)
          </label>
        )
      )}

      <button disabled={isCreating || isUpdating} className={token ? "w-full h-14 rounded-full bg-[#0b3d91] bg-[linear-gradient(110deg,#0a2f70_0%,#1b5fd0_100%)] text-white font-extrabold text-base tracking-wide shadow-[0_10px_30px_rgba(10,47,112,0.35)] disabled:opacity-50 active:scale-[0.98] transition-all" : "__btn"}>
        {mode === "create" ? (isCreating ? "Submitting..." : token ? "আবেদন জমা দিন" : "Add Seller") : isUpdating ? "Updating..." : "Update"}
      </button>
    </form>
  );
}

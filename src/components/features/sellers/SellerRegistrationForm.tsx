"use client";

import { createSeller, getSellerMediaUrls, updateSeller } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import { InputField, Spinner } from "@/components/ui";
import { sellerAgreementText, sellerBusinessTypes } from "@/constants";
import { SellersType } from "@/types";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";

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
  const [paymentPreference, setPaymentPreference] = useState(sellerData?.paymentPreference || "bank");
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
    if (!isCreating && createResponse) {
      if (createResponse.success) onComplete?.({ name: createResponse.data?.name ?? "", sellerId: createResponse.data?.sellerId });
      else toast.error(createResponse.message);
    }
  }, [isCreating]);

  useEffect(() => {
    if (isUpdating || !updateResponse) return;
    toast(updateResponse.message, { type: updateResponse.success ? "success" : "error" });
    if (updateResponse.success) onComplete?.({ name: sellerData?.ownerName || "" });
  }, [isUpdating, updateResponse]);

  const selectCls = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-md text-sm transition-all focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none";

  return (
    <form action={mode === "create" ? createAction : updateAction} className="flex flex-col gap-6">
      {token && <input type="hidden" name="token" value={token} />}

      <div className="font-semibold p-1 bg-blue-100 rounded-md px-3">দোকানের তথ্য</div>
      <div className="flex flex-col sm:flex-row gap-4">
        <InputField label="দোকানের নাম" name="shopName" defaultValue={sellerData?.shopName || ""} required={required} />
        <div className="flex-1 text-start">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">ব্যবসার ধরন {required && <span className="text-red-500 text-lg">*</span>}</span>
            <select name="businessType" defaultValue={sellerData?.businessType || "retail"} className={selectCls}>
              {sellerBusinessTypes.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <InputField label="ট্রেড লাইসেন্স নং" name="tradeLicenseNumber" defaultValue={sellerData?.tradeLicenseNumber || ""} required={required} />
        <InputField label="ব্যবসার বয়স (বছর)" name="businessYears" type="number" defaultValue={(sellerData?.businessYears ?? "") as string} required={false} />
      </div>
      <InputField label="দোকানের ঠিকানা" name="shopStreetAddress" defaultValue={sellerData?.shopStreetAddress || ""} required={required} />
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 text-start">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">জেলা {required && <span className="text-red-500 text-lg">*</span>}</span>
            <select required name="shopDistrict" value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} className={selectCls}>
              <option value="">নির্বাচন করুন</option>
              {districts.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
            </select>
          </label>
        </div>
        <div className="flex-1 text-start">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">থানা</span>
            <select name="shopPoliceStation" defaultValue={sellerData?.shopPoliceStation || ""} className={selectCls}>
              <option value="">নির্বাচন করুন</option>
              {thanas.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </label>
        </div>
        <InputField label="পোস্ট অফিস" name="shopPostOffice" defaultValue={sellerData?.shopPostOffice || ""} required={false} />
      </div>

      <div className="font-semibold p-1 bg-blue-100 rounded-md px-3">মালিকের তথ্য</div>
      <div className="flex flex-col sm:flex-row gap-4">
        <InputField label="মালিকের নাম" name="ownerName" defaultValue={sellerData?.ownerName || ""} required={required} />
        <InputField label="মোবাইল নাম্বার" name="phone" type="tel" defaultValue={sellerData?.phone || ""} required={required} />
        <InputField label="NID নাম্বার" name="nidNumber" defaultValue={sellerData?.nidNumber || ""} required={required} />
      </div>

      <div className="font-semibold p-1 bg-blue-100 rounded-md px-3">পেমেন্ট মাধ্যম</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex-1 text-start">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">পেমেন্ট কিভাবে নিতে ইচ্ছুক? <span className="text-red-500 text-lg">*</span></span>
            <select value={paymentPreference} onChange={(e) => setPaymentPreference(e.target.value as typeof paymentPreference)} name="paymentPreference" className={selectCls}>
              <option value="bank">ব্যাংক</option>
              <option value="bkash">বিকাশ</option>
              <option value="nagad">নগদ</option>
              <option value="rocket">রকেট</option>
              <option value="cash">ক্যাশ</option>
            </select>
          </label>
        </div>
        {paymentPreference !== "bank" && paymentPreference !== "cash" && (
          <InputField label={`${paymentPreference === "bkash" ? "বিকাশ" : paymentPreference === "nagad" ? "নগদ" : "রকেট"} নাম্বার`} name="walletNumber" type="tel" defaultValue={sellerData?.walletNumber || ""} required={required} />
        )}
      </div>
      {paymentPreference === "bank" && (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <InputField label="ব্যাংক নাম" name="bankName" defaultValue={sellerData?.bankInfo?.bankName || ""} required={required} />
            <InputField label="একাউন্ট নাম" name="accountHolderName" defaultValue={sellerData?.bankInfo?.accountHolderName || ""} required={required} />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <InputField label="একাউন্ট নাম্বার" name="accountNumber" type="tel" defaultValue={sellerData?.bankInfo?.accountNumber || ""} required={required} />
            <InputField label="শাখা" name="branchName" defaultValue={sellerData?.bankInfo?.branchName || ""} required={required} />
          </div>
        </>
      )}

      <div className="font-semibold p-1 bg-blue-100 rounded-md px-3">ডকুমেন্ট ও ছবি</div>
      {mode === "update" ? (
        <details onToggle={loadDocs}>
          <summary className="cursor-pointer">Profile and document images</summary>
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

      {token ? (
        <label className="text-start text-[#54595f] text-sm flex gap-3 select-none bg-amber-50 border border-amber-200 rounded-md p-4">
          <input value="true" type="checkbox" name="agreed" className="size-4 mt-1 shrink-0" required />
          <span className="whitespace-pre-line">{sellerAgreementText.trim()}</span>
        </label>
      ) : (
        mode === "create" && (
          <label className="text-start select-none flex items-center text-[#54595f] text-sm">
            <input value="true" type="checkbox" name="sendConfirmationSMS" className="size-4 mr-2" />
            Send confirmation SMS (Seller ID)
          </label>
        )
      )}

      <button disabled={isCreating || isUpdating} className="__btn">
        {mode === "create" ? (isCreating ? "Submitting..." : token ? "আবেদন জমা দিন" : "Add Seller") : isUpdating ? "Updating..." : "Update"}
      </button>
    </form>
  );
}

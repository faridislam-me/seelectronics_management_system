"use client";

import { submitComplaint } from "@/actions/complaintActions";
import { useActionState, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Download,
  CheckCircle2,
  CloudUpload,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/utils";

export default function FormalComplainForm({
  customerId,
  staffs,
  customer,
}: {
  customerId: string;
  staffs: any[];
  customer: any;
}) {
  const [state, action, isPending] = useActionState(submitComplaint, undefined);
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message);
        if (state.data) {
          setComplaintId(state.data as string);
        }
      } else {
        toast.error(state.message);
      }
    }
  }, [state]);

  if (state?.success && complaintId) {
    return (
      <div className="relative mx-auto max-w-[440px] px-1 pt-2 pb-4">
        <div className="rounded-[18px] bg-white border border-[#dfe8f7] shadow-[0_12px_32px_rgba(11,61,145,0.10)] overflow-hidden">
          <div className="relative h-[150px] bg-[linear-gradient(180deg,#e3edff_0%,#f3f7ff_100%)] flex items-end justify-center overflow-hidden">
            <span aria-hidden className="absolute -left-10 top-8 w-56 h-24 rounded-[50%] bg-white/60" />
            <span aria-hidden className="absolute -right-12 top-2 w-48 h-28 rounded-[50%] bg-[#d6e5fd]/70" />
            <div className="relative mb-3 flex flex-col items-center">
              <div className="relative size-[96px] flex items-center justify-center">
                {["-left-7 top-5 rotate-[35deg]", "-left-9 top-[42px]", "-left-7 bottom-4 -rotate-[35deg]", "-right-7 top-5 -rotate-[35deg]", "-right-9 top-[42px]", "-right-7 bottom-4 rotate-[35deg]"].map((c) => (
                  <span key={c} className={`absolute h-1.5 w-5 rounded-full bg-[#22c55e] ${c}`} />
                ))}
                <span className="absolute inset-0 rounded-full bg-gradient-to-b from-[#34d36b] to-[#16a34a] shadow-[0_8px_20px_rgba(22,163,74,0.35)]" />
                <span className="absolute inset-[11px] rounded-full bg-white" />
                <CheckCircle2 size={44} strokeWidth={2.6} className="relative text-[#16a34a]" />
              </div>
              <span className="-mt-1 h-4 w-36 rounded-[50%] bg-[linear-gradient(180deg,#e8f1ff,#a9c8f5)] shadow-[0_6px_14px_rgba(31,124,240,0.25)]" />
            </div>
          </div>

          <div className="px-3 pt-3 pb-4 flex flex-col gap-3">
            <div className="rounded-md border border-[#bfe8cd] bg-[#f0fbf4] p-3 flex flex-col gap-1.5 text-center">
              <h2 className="text-[clamp(18px,5.4vw,22px)] font-extrabold text-[#0b2a66]">অভিযোগ দাখিল হয়েছে!</h2>
              <p className="text-[13px] leading-relaxed text-[#3d4a63]">
                আপনার অভিযোগ ট্র্যাকিং নম্বর{" "}
                <span className="font-mono font-extrabold text-[#0b3d91] bg-white border border-[#cfe0fb] px-2 py-0.5 rounded-md">{complaintId}</span>
                {" "}দিয়ে আনুষ্ঠানিকভাবে নথিভুক্ত করা হয়েছে। ম্যানেজমেন্ট শীঘ্রই এটি পর্যালোচনা করবে।
              </p>
            </div>

            <Link href={`/customer/complain/doc/${complaintId}`} className="h-11 rounded-md border-2 border-[#bcd4fb] bg-white text-[#0b3d91] text-[14px] font-extrabold inline-flex items-center justify-center gap-2">
              <ExternalLink size={18} />
              নথি দেখুন
            </Link>
            <Link href={`/customer/complain`} className="h-12 rounded-full bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(31,124,240,0.35)]">
              ড্যাশবোর্ডে ফিরুন
              <ArrowRight size={18} />
            </Link>

            <div className="flex items-center justify-center gap-3 pt-1">
              <span className="h-px w-10 bg-[#b9cdee]" />
              <span className="flex flex-col items-center leading-tight"><span className="text-[13px] font-extrabold tracking-[0.18em] text-[#0b2a66]">SE ELECTRONICS</span><span className="text-[11px] text-[#1f5fc9]">Smart Solution &nbsp;Better Life</span></span>
              <span className="h-px w-10 bg-[#b9cdee]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleBlur = () => {
    if (!serviceId.trim()) {
      setError("সার্ভিস আইডি দেওয়া আবশ্যক");
    } else {
      setError("");
    }};
  return (
    <form
      action={action}
      className="bg-white shadow-xl rounded-md border border-gray-200 p-3 sm:p-12 flex flex-col w-full font-serif md:font-sans relative"
    >
      <input type="hidden" name="customerId" value={customerId} />

      <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-gray-900 mb-2">
          সেবার মান সংক্রান্ত আনুষ্ঠানিক অভিযোগ ফর্ম
        </h1>
      </div>

      <div className="mb-8 space-y-1 text-sm text-gray-800">
        <p className="font-bold">বরাবর</p>
        <p className="font-bold">
          প্রশাসন প্রধান / সেবার মান কর্মকর্তা
        </p>
        <p className="font-bold">এসই ইলেকট্রনিক্স প্রধান কার্যালয়</p>
        <p className="mt-4">
          <span className="font-bold">বিষয়:</span> আনুষ্ঠানিক অভিযোগ দাখিল।
        </p>
        <p className="mt-4 text-justify leading-relaxed">
          জনাব,
          <br />
          সবিনয় নিবেদন এই যে, নিম্নে উল্লিখিত বিষয়ে আমি একটি আনুষ্ঠানিক অভিযোগ দাখিল করতে চাই। অনুগ্রহপূর্বক প্রদত্ত তথ্যাদি পর্যালোচনা করার জন্য বিনীত অনুরোধ জানাচ্ছি।
        </p>
      </div>

      {/* Complainee's Information Section */}
      <fieldset className="border border-gray-300 rounded-md p-2 mb-8 bg-gray-50/50">
        <legend className="text-lg font-bold text-gray-800 px-3 uppercase tracking-wider bg-white border border-gray-300 rounded-md py-1">
          গ্রাহকের তথ্য
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              গ্রাহকের নাম
            </label>
            <div className="w-full bg-white border border-gray-200 p-2.5 rounded-md text-gray-900 shadow-sm font-medium">
              {customer?.name || "তথ্য নেই"}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
             মোবাইল নম্বর
            </label>
            <div className="w-full bg-white border border-gray-200 p-2.5 rounded-md text-gray-900 shadow-sm font-mono">
              {customer?.phone || "তথ্য নেই"}
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
           নিবন্ধিত ঠিকানা
            </label>
            <div className="w-full bg-white border border-gray-200 p-2.5 rounded-md text-gray-900 shadow-sm font-medium">
              {customer?.address || "তথ্য নেই"}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              গ্রাহক আইডি
            </label>
            <div className="w-full bg-white border border-gray-200 p-2.5 rounded-md text-gray-900 shadow-sm font-mono">
              {customerId}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
               নিবন্ধনের তারিখ
            </label>
            <div className="w-full bg-white border border-gray-200 p-2.5 rounded-md text-gray-900 shadow-sm font-medium">
              {customer?.createdAt ? formatDate(customer.createdAt) : "N/A"}
            </div>
          </div>
        </div>
        <p className="text-sm text-rose-500 mt-4 font-semibold italic">
          * আপনার তথ্য পরিবর্তন করতে চাইলে আপনার প্রোফাইলে যান।
        </p>
      </fieldset>

      {/* Complaint Details Section */}
      <fieldset className="border border-emerald-300 rounded-md p-2 mb-8 bg-emerald-50/30">
        <legend className="text-lg font-bold text-emerald-800 px-3 uppercase tracking-wider bg-white border border-emerald-300 rounded-md py-1">
          অভিযোগের বিবরণ
        </legend>

        <div className="space-y-6 pt-2">
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-md">
            <p className="text-sm font-semibold text-emerald-800 mb-3">
              নিচের অপশন থেকে অভিযুক্ত স্টাফ / সদস্য নির্বাচন করুন{" "}
              <span className="text-rose-500">*</span>
            </p>
            <select
              name="staffId"
              required
              className="w-full p-3 bg-white border border-emerald-200 rounded-md outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-gray-800 shadow-sm"
            >
              <option value="">-- অভিযুক্ত স্টাফ বেছে নিন --</option>
              {staffs.map((staff) => (
                <option key={staff.staffId} value={staff.staffId}>
                  {staff.name} - {staff.role.toUpperCase()} (ID: {staff.staffId}
                  )
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              
      <label className="text-sm font-bold text-gray-700">
        সার্ভিস আইডি 
          <span className="text-red-500">(আবশ্যক)</span> 
      </label>

      <input
        type="text"
        name="serviceId"
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
        onBlur={handleBlur}
        placeholder="e.g. SRV-1234..."
        className={`w-full p-2.5 bg-white border rounded-md outline-none transition-all text-gray-900 shadow-sm ${
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-400"
            : "border-gray-300 focus:ring-2 focus:ring-emerald-500"
        }`}
        required
      />

      {error && (
        <p className="text-red-500 text-sm mt-1">
          {error}
        </p>
      )}
          </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">
                অভিযোগের বিষয় <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="subject"
                required
                placeholder="মূল সমস্যাটি লিখুন..."
                className="w-full p-2.5 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-gray-700">
              অভিযোগের বিস্তারিত (বাংলায় লিখুন...)<span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              required
              placeholder="ঘটনার বিস্তারিত বিবরণ, তারিখ এবং কী ঘটেছে তা বাংলায় লিখুন..."
              rows={6}
              className="w-full p-3 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 resize-y shadow-sm"
            ></textarea>
          </div>

          {/* Upload Evidence */}
          <label className="border border-dashed border-gray-300 rounded-md p-2 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group">
            <input
              type="file"
              name="evidence"
              accept="image/*"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
            <CloudUpload
              size={32}
              className={`transition-colors mb-2 ${selectedFile ? "text-emerald-500" : "text-gray-400 group-hover:text-emerald-500"}`}
            />
            <p className="text-sm font-bold text-gray-700">
              {selectedFile ? selectedFile.name : "প্রমাণ আপলোড করুন"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {selectedFile
                ? "ফাইল নির্বাচিত হয়েছে"
                : "(স্ক্রিনশট বা ছবি আপলোড করতে এখানে ক্লিক করুন, সর্বোচ্চ: ৫ MB)"}
            </p>
          </label>
        </div>
      </fieldset>

      <p className="text-sm text-gray-700 italic mb-8 border-l-4 border-gray-300 pl-3">
        এ বিষয়ে যথাযথ ব্যবস্থা গ্রহণের জন্য বিনীত অনুরোধ জানাচ্ছি।
      </p>

      <div className="flex flex-col gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-brand hover:bg-brand/90 text-white font-bold py-4 rounded-md shadow-md transition-all active:scale-[0.99] disabled:bg-gray-400 disabled:cursor-not-allowed uppercase tracking-wide text-sm"
        >
          {isPending
            ? "আবেদন দাখিল হচ্ছে..." : "আনুষ্ঠানিক আবেদন দাখিল করুন"}
        </button>
        <div className="text-center">
          <button
            type="button"
            className="text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-wider underline underline-offset-4"
          >
             আবেদনটি প্রিভিউ করুন
          </button>
        </div>
      </div>
    </form>
  );
}

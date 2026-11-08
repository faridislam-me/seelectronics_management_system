"use client";

import { submitInstallmentApplication } from "@/actions/installmentActions";
import { ArrowLeft, Camera, CreditCard, FileText, Loader2, Upload, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

const PRODUCT_TYPES = [
  { value: "", label: "নির্বাচন করুন (ঐচ্ছিক)" },
  { value: "ips", label: "IPS" },
  { value: "battery", label: "Battery" },
  { value: "stabilizer", label: "Stabilizer" },
  { value: "others", label: "Others" },
];

function FileInput({
  id,
  label,
  required,
  accept,
  onChange,
  preview,
}: {
  id: string;
  label: string;
  required?: boolean;
  accept?: string;
  onChange: (f: File | null) => void;
  preview: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        ref={ref}
        type="file"
        id={id}
        accept={accept || "image/*"}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] || null;
          onChange(f);
        }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full rounded-md border border-dashed border-[#c9d3e6] bg-white p-3 flex flex-col items-center gap-1.5 text-center hover:bg-[#f5f7fb] transition-colors"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-20 rounded object-contain" />
        ) : (
          <>
            <Upload size={20} className="text-[#5b6784]" />
            <span className="text-[11px] font-semibold text-[#5b6784]">ছবি আপলোড করুন</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function InstallmentApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [productModel, setProductModel] = useState("");
  const [productType, setProductType] = useState("");
  const [notes, setNotes] = useState("");
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");

  // Files
  const [photo, setPhoto] = useState<File | null>(null);
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [gNidFront, setGNidFront] = useState<File | null>(null);
  const [gNidBack, setGNidBack] = useState<File | null>(null);

  // Previews
  const preview = (f: File | null) => (f ? URL.createObjectURL(f) : null);

  const handleSubmit = async () => {
    if (!productModel.trim()) {
      toast.error("পণ্যের মডেল আবশ্যক");
      return;
    }
    if (!photo || !nidFront || !nidBack) {
      toast.error("ছবি, NID সামনে ও পিছনে আবশ্যক");
      return;
    }

    setLoading(true);
    const fd = new FormData();
    fd.append("productModel", productModel.trim());
    if (productType) fd.append("productType", productType);
    if (notes.trim()) fd.append("notes", notes.trim());
    fd.append("photo", photo);
    fd.append("nidFront", nidFront);
    fd.append("nidBack", nidBack);
    if (signature) fd.append("signature", signature);
    if (guarantorName.trim()) fd.append("guarantorName", guarantorName.trim());
    if (guarantorPhone.trim()) fd.append("guarantorPhone", guarantorPhone.trim());
    if (guarantorAddress.trim()) fd.append("guarantorAddress", guarantorAddress.trim());
    if (gNidFront) fd.append("guarantorNidFront", gNidFront);
    if (gNidBack) fd.append("guarantorNidBack", gNidBack);

    const res = await submitInstallmentApplication(fd);
    setLoading(false);

    if (res.success) {
      toast.success(res.message || "আবেদন জমা হয়েছে");
      router.push("/customer/installments");
      router.refresh();
    } else {
      toast.error(res.message || "আবেদন জমা দেওয়া যায়নি");
    }
  };

  const Section = ({ icon: Icon, title, children }: { icon: typeof CreditCard; title: string; children: React.ReactNode }) => (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-3 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#0b3d91]">
        <Icon size={16} /> {title}
      </p>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5 px-2 pt-2 pb-2 text-[#16213a]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Link href="/customer/installments" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
          <ArrowLeft size={18} />
        </Link>
        <span className="flex flex-col leading-tight">
          <span className="text-[16px] font-extrabold">কিস্তির আবেদন</span>
          <span className="text-[11px] font-semibold text-[#5b6784]">তথ্য ও ডকুমেন্ট জমা দিন</span>
        </span>
      </div>

      {/* Product info */}
      <Section icon={CreditCard} title="পণ্যের তথ্য">
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">
            পণ্যের মডেল <span className="text-red-500">*</span>
          </label>
          <input
            value={productModel}
            onChange={(e) => setProductModel(e.target.value)}
            placeholder="যেমন: Luminous Eco Volt 1050"
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-bold text-[#5b6784] mb-1 block">পণ্যের ধরন</label>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </Section>

      {/* KYC documents */}
      <Section icon={Camera} title="আপনার ডকুমেন্ট">
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="photo" label="পাসপোর্ট সাইজ ছবি" required onChange={setPhoto} preview={preview(photo)} />
          <FileInput id="signature" label="স্বাক্ষর" onChange={setSignature} preview={preview(signature)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="nidFront" label="NID সামনে" required onChange={setNidFront} preview={preview(nidFront)} />
          <FileInput id="nidBack" label="NID পিছনে" required onChange={setNidBack} preview={preview(nidBack)} />
        </div>
      </Section>

      {/* Guarantor */}
      <Section icon={User} title="জামিনদারের তথ্য (ঐচ্ছিক)">
        <input
          value={guarantorName}
          onChange={(e) => setGuarantorName(e.target.value)}
          placeholder="জামিনদারের নাম"
          className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
        />
        <input
          value={guarantorPhone}
          onChange={(e) => setGuarantorPhone(e.target.value)}
          placeholder="জামিনদারের মোবাইল নম্বর"
          className="w-full h-10 rounded-md border border-[#dfe6f2] px-3 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none"
        />
        <textarea
          value={guarantorAddress}
          onChange={(e) => setGuarantorAddress(e.target.value)}
          placeholder="জামিনদারের ঠিকানা"
          rows={2}
          className="w-full rounded-md border border-[#dfe6f2] px-3 py-2 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none resize-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="gNidFront" label="জামিনদার NID সামনে" onChange={setGNidFront} preview={preview(gNidFront)} />
          <FileInput id="gNidBack" label="জামিনদার NID পিছনে" onChange={setGNidBack} preview={preview(gNidBack)} />
        </div>
      </Section>

      {/* Notes */}
      <Section icon={FileText} title="অতিরিক্ত তথ্য (ঐচ্ছিক)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="আপনার অনুরোধ বা মন্তব্য..."
          rows={3}
          className="w-full rounded-md border border-[#dfe6f2] px-3 py-2 text-[13px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none resize-none"
        />
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <CreditCard size={18} />}
        {loading ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
      </button>

      <p className="text-[11px] text-center text-[#5b6784] px-4">
        আবেদন জমা দেওয়ার পর অ্যাডমিন পর্যালোচনা করে অনুমোদন দিবেন।
      </p>
    </div>
  );
}

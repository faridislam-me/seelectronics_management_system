"use client";

import { submitInstallmentApplication } from "@/actions/installmentActions";
import {
  ArrowLeft,
  Camera,
  CheckSquare,
  CreditCard,
  FileText,
  Home,
  Loader2,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

const PRODUCT_TYPES = [
  { value: "", label: "নির্বাচন করুন *" },
  { value: "fridge", label: "ফ্রিজ" },
  { value: "ac", label: "এসি / এয়ারকন্ডিশন" },
  { value: "tv", label: "টিভি" },
  { value: "oven", label: "ওভেন" },
  { value: "washing_machine", label: "ওয়াশিং মেশিন" },
  { value: "mobile", label: "মোবাইল" },
  { value: "ips", label: "আই পি এস" },
  { value: "battery", label: "ব্যাটারি" },
  { value: "ips_package", label: "আই পি এস প্যাকেজ" },
  { value: "stabilizer", label: "স্ট্যাবিলাইজার" },
  { value: "blender", label: "ব্লেন্ডার" },
  { value: "others", label: "অন্যান্য" },
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
      <label className="text-[13px] font-bold text-[#3d4f72] mb-1 block">
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
            <Upload size={22} className="text-[#3d4f72]" />
            <span className="text-[13px] font-semibold text-[#3d4f72]">ছবি আপলোড করুন</span>
          </>
        )}
      </button>
    </div>
  );
}

async function compressFileClient(file: File, maxW = 1200, quality = 0.7): Promise<File> {
  if (file.size < 200_000) return file;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.getContext("2d")!.drawImage(img, 0, 0, w, h);
      c.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality,
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

const inputCls =
  "w-full h-11 rounded-md border border-[#dfe6f2] px-3 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none text-[#16213a]";
const textareaCls =
  "w-full rounded-md border border-[#dfe6f2] px-3 py-2.5 text-[14px] font-semibold bg-white focus:border-[#0b3d91] focus:outline-none resize-none text-[#16213a]";
const labelCls = "text-[13px] font-bold text-[#3d4f72] mb-1 block";

function Section({ icon: Icon, title, children }: { icon: typeof CreditCard; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 flex flex-col gap-2.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <p className="flex items-center gap-2 text-[15px] font-extrabold text-[#0b3d91]">
        <Icon size={18} /> {title}
      </p>
      {children}
    </div>
  );
}

export default function InstallmentApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Personal info
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [isRenting, setIsRenting] = useState(false);
  const [landlordName, setLandlordName] = useState("");
  const [landlordPhone, setLandlordPhone] = useState("");

  // Product
  const [productType, setProductType] = useState("");
  const [productTypeOther, setProductTypeOther] = useState("");
  const [productModel, setProductModel] = useState("");
  const [desiredMonths, setDesiredMonths] = useState("");
  const [desiredDownPayment, setDesiredDownPayment] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // Guarantor
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");

  // Terms
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Files
  const [photo, setPhoto] = useState<File | null>(null);
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);
  const [bankCheck, setBankCheck] = useState<File | null>(null);
  const [gPhoto, setGPhoto] = useState<File | null>(null);
  const [gSignature, setGSignature] = useState<File | null>(null);
  const [gNidFront, setGNidFront] = useState<File | null>(null);
  const [gNidBack, setGNidBack] = useState<File | null>(null);

  // Previews
  const preview = (f: File | null) => (f ? URL.createObjectURL(f) : null);

  const handleSubmit = async () => {
    if (!productType) {
      toast.error("পণ্যের ধরন নির্বাচন করুন");
      return;
    }
    if (productType === "others" && !productTypeOther.trim()) {
      toast.error("পণ্যের ধরন লিখুন");
      return;
    }
    if (!productModel.trim()) {
      toast.error("পণ্যের মডেল আবশ্যক");
      return;
    }
    if (!photo || !nidFront || !nidBack) {
      toast.error("ছবি, NID সামনে ও পিছনে আবশ্যক");
      return;
    }
    if (!termsAccepted) {
      toast.error("শর্তাবলীতে সম্মতি দিন");
      return;
    }

    setLoading(true);
    try {
    const fd = new FormData();

    // Personal info
    if (fatherName.trim()) fd.append("fatherName", fatherName.trim());
    if (motherName.trim()) fd.append("motherName", motherName.trim());
    if (currentAddress.trim()) fd.append("currentAddress", currentAddress.trim());
    if (permanentAddress.trim()) fd.append("permanentAddress", permanentAddress.trim());
    fd.append("isRenting", String(isRenting));
    if (isRenting && landlordName.trim()) fd.append("landlordName", landlordName.trim());
    if (isRenting && landlordPhone.trim()) fd.append("landlordPhone", landlordPhone.trim());

    // Product
    fd.append("productType", productType);
    if (productType === "others" && productTypeOther.trim()) fd.append("productTypeOther", productTypeOther.trim());
    fd.append("productModel", productModel.trim());
    if (desiredMonths) fd.append("desiredMonths", desiredMonths);
    if (desiredDownPayment) fd.append("desiredDownPayment", desiredDownPayment);

    // Notes
    if (notes.trim()) fd.append("notes", notes.trim());

    // Compress images client-side (phone cameras produce 3-8MB each; Vercel has 4.5MB body limit)
    const [cPhoto, cNidF, cNidB, cSig, cBank, cGP, cGS, cGNF, cGNB] = await Promise.all([
      compressFileClient(photo, 800, 0.75),
      compressFileClient(nidFront, 1200, 0.7),
      compressFileClient(nidBack, 1200, 0.7),
      signature ? compressFileClient(signature, 800, 0.7) : null,
      bankCheck ? compressFileClient(bankCheck, 1200, 0.7) : null,
      gPhoto ? compressFileClient(gPhoto, 800, 0.75) : null,
      gSignature ? compressFileClient(gSignature, 800, 0.7) : null,
      gNidFront ? compressFileClient(gNidFront, 1200, 0.7) : null,
      gNidBack ? compressFileClient(gNidBack, 1200, 0.7) : null,
    ]);

    // KYC files
    fd.append("photo", cPhoto);
    fd.append("nidFront", cNidF);
    fd.append("nidBack", cNidB);
    if (cSig) fd.append("signature", cSig);
    if (cBank) fd.append("bankCheck", cBank);

    // Guarantor
    if (guarantorName.trim()) fd.append("guarantorName", guarantorName.trim());
    if (guarantorPhone.trim()) fd.append("guarantorPhone", guarantorPhone.trim());
    if (guarantorAddress.trim()) fd.append("guarantorAddress", guarantorAddress.trim());
    if (cGP) fd.append("guarantorPhoto", cGP);
    if (cGS) fd.append("guarantorSignature", cGS);
    if (cGNF) fd.append("guarantorNidFront", cGNF);
    if (cGNB) fd.append("guarantorNidBack", cGNB);

    // Terms
    fd.append("termsAccepted", "true");

    const res = await submitInstallmentApplication(fd);
    setLoading(false);

    if (res.success) {
      toast.success(res.message || "আবেদন জমা হয়েছে");
      router.push("/customer/installments");
      router.refresh();
    } else {
      toast.error(res.message || "আবেদন জমা দেওয়া যায়নি");
    }
    } catch {
      setLoading(false);
      toast.error("আবেদন জমা দেওয়া যায়নি। আবার চেষ্টা করুন।");
    }
  };

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

      {/* Personal info */}
      <Section icon={User} title="ব্যক্তিগত তথ্য">
        <div>
          <label className={labelCls}>পিতার নাম</label>
          <input value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="পিতার নাম" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>মাতার নাম</label>
          <input value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="মাতার নাম" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>বর্তমান ঠিকানা</label>
          <textarea value={currentAddress} onChange={(e) => setCurrentAddress(e.target.value)} placeholder="বর্তমান ঠিকানা" rows={2} className={textareaCls} />
        </div>
        <div>
          <label className={labelCls}>স্থায়ী ঠিকানা</label>
          <textarea value={permanentAddress} onChange={(e) => setPermanentAddress(e.target.value)} placeholder="স্থায়ী ঠিকানা" rows={2} className={textareaCls} />
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={isRenting} onChange={(e) => setIsRenting(e.target.checked)} className="size-4 rounded accent-[#0b3d91]" />
          <span className="text-[12px] font-bold text-[#5b6784]">ভাড়াটিয়া</span>
        </label>
        {isRenting && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>বাড়ির মালিকের নাম</label>
              <input value={landlordName} onChange={(e) => setLandlordName(e.target.value)} placeholder="মালিকের নাম" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>বাড়ির মালিকের ফোন</label>
              <input value={landlordPhone} onChange={(e) => setLandlordPhone(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} />
            </div>
          </div>
        )}
      </Section>

      {/* Product info */}
      <Section icon={CreditCard} title="পণ্য ও কিস্তির তথ্য">
        <div>
          <label className={labelCls}>পণ্যের ধরন <span className="text-red-500">*</span></label>
          <select value={productType} onChange={(e) => setProductType(e.target.value)} className={inputCls}>
            {PRODUCT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        {productType === "others" && (
          <div>
            <label className={labelCls}>পণ্যের ধরন লিখুন <span className="text-red-500">*</span></label>
            <input value={productTypeOther} onChange={(e) => setProductTypeOther(e.target.value)} placeholder="পণ্যের নাম লিখুন" className={inputCls} />
          </div>
        )}
        <div>
          <label className={labelCls}>পণ্যের মডেল <span className="text-red-500">*</span></label>
          <input value={productModel} onChange={(e) => setProductModel(e.target.value)} placeholder="যেমন: Luminous Eco Volt 1050" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>কিস্তির মেয়াদ (মাস)</label>
            <input type="number" min="1" value={desiredMonths} onChange={(e) => setDesiredMonths(e.target.value)} placeholder="কত মাস?" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>ডাউন পেমেন্ট (৳)</label>
            <input type="number" min="0" value={desiredDownPayment} onChange={(e) => setDesiredDownPayment(e.target.value)} placeholder="৳ পরিমাণ" className={inputCls} />
          </div>
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
        <FileInput id="bankCheck" label="ব্যাংক চেক-এর ছবি" onChange={setBankCheck} preview={preview(bankCheck)} />
      </Section>

      {/* Guarantor */}
      <Section icon={Home} title="জামিনদারের তথ্য (ঐচ্ছিক)">
        <input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} placeholder="জামিনদারের নাম" className={inputCls} />
        <input value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} placeholder="জামিনদারের মোবাইল নম্বর" className={inputCls} />
        <textarea value={guarantorAddress} onChange={(e) => setGuarantorAddress(e.target.value)} placeholder="জামিনদারের ঠিকানা" rows={2} className={textareaCls} />
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="gPhoto" label="জামিনদারের ছবি" onChange={setGPhoto} preview={preview(gPhoto)} />
          <FileInput id="gSignature" label="জামিনদারের স্বাক্ষর" onChange={setGSignature} preview={preview(gSignature)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="gNidFront" label="জামিনদার NID সামনে" onChange={setGNidFront} preview={preview(gNidFront)} />
          <FileInput id="gNidBack" label="জামিনদার NID পিছনে" onChange={setGNidBack} preview={preview(gNidBack)} />
        </div>
      </Section>

      {/* Notes */}
      <Section icon={FileText} title="অতিরিক্ত তথ্য (ঐচ্ছিক)">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="আপনার অনুরোধ বা মন্তব্য..." rows={3} className={textareaCls} />
      </Section>

      {/* Terms & Conditions */}
      <Section icon={CheckSquare} title="শর্তাবলী">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="size-5 mt-0.5 shrink-0 rounded accent-[#0b3d91]"
          />
          <span className="text-[14px] font-semibold text-[#3d4f72] leading-relaxed">
            আমি <a href="/customer/installments/terms" target="_blank" className="text-[#0b3d91] font-extrabold underline underline-offset-2" onClick={(e) => e.stopPropagation()}>SE Electronics-এর কিস্তির শর্তাবলী</a> পড়েছি এবং সম্মতি দিচ্ছি। <span className="text-red-500">*</span>
          </span>
        </label>
      </Section>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-12 rounded-md bg-[#0b3d91] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-60"
      >
        {loading ? <Loader2 className="size-5 animate-spin" /> : <CreditCard size={18} />}
        {loading ? "জমা হচ্ছে..." : "আবেদন জমা দিন"}
      </button>

      <p className="text-[12px] text-center text-[#3d4f72] px-4">
        আবেদন জমা দেওয়ার পর অ্যাডমিন পর্যালোচনা করে অনুমোদন দিবেন।
      </p>
    </div>
  );
}

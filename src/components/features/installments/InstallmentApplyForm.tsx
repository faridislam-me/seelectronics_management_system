"use client";

import { submitInstallmentApplication } from "@/actions/installmentActions";
import { Modal } from "@/components/ui";
import { installmentTermOptions } from "@/constants";
import { toBanglaNumber } from "@/utils";
import {
  ArrowLeft,
  Camera,
  Check,
  CheckSquare,
  CreditCard,
  Eraser,
  FileText,
  Home,
  Loader2,
  PenLine,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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

// Terms & Conditions shown on the gate screen before the apply form (9 points).
const INSTALLMENT_TERMS = [
  { num: "১", title: "বয়স ও নাগরিকত্ব", body: "আবেদনকারীকে অবশ্যই বাংলাদেশের নাগরিক হতে হবে এবং বয়স কমপক্ষে ১৮ বছর হতে হবে।" },
  { num: "২", title: "সঠিক তথ্য প্রদান", body: "ফরম পূরণের সময় নিজের জাতীয় পরিচয়পত্র (NID), সচল মোবাইল নম্বর এবং সঠিক বর্তমান ঠিকানা প্রদান করতে হবে।" },
  { num: "৩", title: "প্রয়োজনীয় কাগজপত্র", body: "যাচাইয়ের জন্য ক্রেতা ও জামিনদারের NID কার্ডের ফটোকপি এবং পাসপোর্ট সাইজ ছবি প্রস্তুত রাখতে হবে।" },
  { num: "৪", title: "ডাউন পেমেন্ট", body: "পছন্দকৃত এসি, ফ্রিজ, ওয়াশিং মেশিন বা অন্যান্য পণ্যের ধরন অনুযায়ী নির্ধারিত ডাউন পেমেন্ট পরিশোধ সাপেক্ষে কিস্তি সুবিধা কার্যকর হবে।" },
  { num: "৫", title: "কিস্তি পরিশোধের নিয়ম", body: "প্রতি মাসের নির্দিষ্ট সময়ের মধ্যে নির্ধারিত কিস্তির টাকা নিয়মিত পরিশোধ করতে হবে।" },
  { num: "৬", title: "ওয়ারেন্টি সুবিধা", body: "প্রতিটি পণ্যের সাথে প্রস্তুতকারক কোম্পানির অফিশিয়াল ওয়ারেন্টি বা সার্ভিস ওয়ারেন্টি প্রদান করা হবে।" },
  { num: "৭", title: "ডেলিভারি ও ইনস্টলেশন", body: "আবেদন অনুমোদিত হওয়ার পর কোম্পানির পক্ষ থেকে নির্দিষ্ট ঠিকানায় পণ্য পৌঁছে দেওয়া হবে এবং বড় পণ্যের ক্ষেত্রে ইনস্টলেশনে সহায়তা করা হবে।" },
  { num: "৮", title: "বিলম্ব ফি ও সতর্কতা", body: "নির্ধারিত সময়ের মধ্যে কিস্তি পরিশোধে ব্যর্থ হলে কোম্পানির নিয়ম অনুযায়ী নির্দিষ্ট জরিমানা বা বিলম্ব ফি প্রযোজ্য হতে পারে।" },
  { num: "৯", title: "রিকাভারি ও আইনগত ব্যবস্থা", body: "কিস্তি পরিশোধে দেরি, অবহেলা বা কিস্তি প্রদান না করলে এস ই ইলেকট্রনিকস প্রথম নোটিশ দিয়ে কিস্তিতে নেওয়া পণ্যটি রিকাভারি করে নিয়ে যাবে অথবা আপনার বিরুদ্ধে আইনগত ব্যবস্থা গ্রহণ করবে।" },
] as const;

const PRODUCT_SPECS: Record<string, { label: string; options: { value: string; label: string }[] }> = {
  tv: {
    label: "স্ক্রিন সাইজ (ইঞ্চি)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "24", label: '24"' }, { value: "32", label: '32"' },
      { value: "40", label: '40"' }, { value: "43", label: '43"' },
      { value: "50", label: '50"' }, { value: "55", label: '55"' },
      { value: "65", label: '65"' }, { value: "75", label: '75"' },
    ],
  },
  ac: {
    label: "ক্যাপাসিটি (টন)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "1 Ton", label: "১ টন" }, { value: "1.5 Ton", label: "১.৫ টন" },
      { value: "2 Ton", label: "২ টন" }, { value: "2.5 Ton", label: "২.৫ টন" },
    ],
  },
  fridge: {
    label: "ক্যাপাসিটি (লিটার)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "180L", label: "১৮০ লিটার" }, { value: "200L", label: "২০০ লিটার" },
      { value: "220L", label: "২২০ লিটার" }, { value: "250L", label: "২৫০ লিটার" },
      { value: "280L", label: "২৮০ লিটার" }, { value: "300L", label: "৩০০ লিটার" },
      { value: "350L", label: "৩৫০ লিটার" }, { value: "400L", label: "৪০০ লিটার" },
      { value: "500L", label: "৫০০ লিটার" },
    ],
  },
  oven: {
    label: "ক্যাপাসিটি (লিটার)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "20L", label: "২০ লিটার" }, { value: "23L", label: "২৩ লিটার" },
      { value: "25L", label: "২৫ লিটার" }, { value: "28L", label: "২৮ লিটার" },
      { value: "30L", label: "৩০ লিটার" }, { value: "32L", label: "৩২ লিটার" },
    ],
  },
  washing_machine: {
    label: "ক্যাপাসিটি (কেজি)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "6kg", label: "৬ কেজি" }, { value: "7kg", label: "৭ কেজি" },
      { value: "8kg", label: "৮ কেজি" }, { value: "9kg", label: "৯ কেজি" },
      { value: "10kg", label: "১০ কেজি" }, { value: "12kg", label: "১২ কেজি" },
    ],
  },
  mobile: {
    label: "স্টোরেজ / RAM",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "2/32GB", label: "2/32 GB" }, { value: "3/32GB", label: "3/32 GB" },
      { value: "4/64GB", label: "4/64 GB" }, { value: "4/128GB", label: "4/128 GB" },
      { value: "6/128GB", label: "6/128 GB" }, { value: "8/128GB", label: "8/128 GB" },
      { value: "8/256GB", label: "8/256 GB" }, { value: "12/256GB", label: "12/256 GB" },
    ],
  },
  ips: {
    label: "ক্যাপাসিটি (VA)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "600VA", label: "৬০০ VA" }, { value: "800VA", label: "৮০০ VA" },
      { value: "1000VA", label: "১০০০ VA" }, { value: "1200VA", label: "১২০০ VA" },
      { value: "1500VA", label: "১৫০০ VA" }, { value: "2000VA", label: "২০০০ VA" },
    ],
  },
  battery: {
    label: "ক্যাপাসিটি (Ah)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "100Ah", label: "১০০ Ah" }, { value: "130Ah", label: "১৩০ Ah" },
      { value: "150Ah", label: "১৫০ Ah" }, { value: "180Ah", label: "১৮০ Ah" },
      { value: "200Ah", label: "২০০ Ah" },
    ],
  },
  ips_package: {
    label: "প্যাকেজ সাইজ (VA)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "600VA", label: "৬০০ VA" }, { value: "800VA", label: "৮০০ VA" },
      { value: "1000VA", label: "১০০০ VA" }, { value: "1200VA", label: "১২০০ VA" },
      { value: "1500VA", label: "১৫০০ VA" }, { value: "2000VA", label: "২০০০ VA" },
    ],
  },
  stabilizer: {
    label: "ক্যাপাসিটি (VA)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "1000VA", label: "১০০০ VA" }, { value: "1500VA", label: "১৫০০ VA" },
      { value: "2000VA", label: "২০০০ VA" }, { value: "3000VA", label: "৩০০০ VA" },
      { value: "5000VA", label: "৫০০০ VA" },
    ],
  },
  blender: {
    label: "পাওয়ার (ওয়াট)",
    options: [
      { value: "", label: "নির্বাচন করুন" },
      { value: "250W", label: "২৫০ ওয়াট" }, { value: "350W", label: "৩৫০ ওয়াট" },
      { value: "500W", label: "৫০০ ওয়াট" }, { value: "750W", label: "৭৫০ ওয়াট" },
      { value: "1000W", label: "১০০০ ওয়াট" },
    ],
  },
};

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
            <Upload size={22} className="text-[#b0bdd0]" />
            <span className="text-[13px] font-semibold text-[#b0bdd0]">ছবি আপলোড করুন</span>
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Signature capture. The inline box is just a preview/trigger; tapping it opens
 * a large modal where the user can sign comfortably. "OK" saves the drawing,
 * which then appears in the inline box. Saved value stays a PNG Blob (unchanged
 * contract) so the form submits it exactly as before.
 */
function SignaturePad({ label, onSignature }: { label: string; onSignature: (blob: Blob | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const prepareCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    drawingRef.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const pos = getPos(e);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16213a";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDraw = () => {
    drawingRef.current = false;
  };

  const clearCanvas = () => {
    prepareCanvas();
    setHasDrawn(false);
  };

  const removeSignature = () => {
    setPreviewUrl(null);
    setHasDrawn(false);
    onSignature(null);
  };

  const confirm = () => {
    const canvas = canvasRef.current!;
    if (!hasDrawn) {
      setOpen(false);
      return;
    }
    canvas.toBlob((blob) => onSignature(blob), "image/png");
    setPreviewUrl(canvas.toDataURL("image/png"));
    setOpen(false);
  };

  // (Re)initialise the modal canvas whenever it opens.
  useEffect(() => {
    if (open) {
      // Defer so the canvas element is mounted inside the modal.
      requestAnimationFrame(() => {
        prepareCanvas();
        setHasDrawn(false);
      });
    }
  }, [open]);

  return (
    <div>
      <label className="text-[13px] font-bold text-[#3d4f72] mb-1 flex items-center gap-1.5">
        <PenLine size={14} /> {label}
      </label>
      <div className="relative rounded-md border border-[#c9d3e6] bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full h-[100px] flex items-center justify-center bg-white hover:bg-[#f5f7fb] transition-colors"
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={label} className="h-[88px] object-contain" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-[#b0bdd0]">
              <PenLine size={22} />
              <span className="text-[13px] font-semibold">স্বাক্ষর করতে ট্যাপ করুন</span>
            </span>
          )}
        </button>
        {previewUrl && (
          <button
            type="button"
            onClick={removeSignature}
            className="absolute top-1.5 right-1.5 size-7 rounded-full bg-white/90 border border-[#dfe6f2] flex items-center justify-center text-[#3d4f72] hover:bg-red-50 hover:text-red-600"
          >
            <Eraser size={14} />
          </button>
        )}
      </div>

      {open && (
        <Modal isVisible title={label} width="600" onClose={() => setOpen(false)}>
          <div className="flex flex-col gap-3 text-[#16213a]">
            <p className="text-[13px] font-semibold text-[#5b6784]">নিচের বক্সে আঙুল বা মাউস দিয়ে স্বাক্ষর করুন।</p>
            <div className="rounded-md border-2 border-dashed border-[#c9d3e6] bg-white overflow-hidden">
              <canvas
                ref={canvasRef}
                width={600}
                height={320}
                className="w-full h-[260px] touch-none cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="flex-1 h-11 rounded-md border border-[#dfe6f2] text-[#5b6784] text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5"
              >
                <Eraser size={16} /> মুছুন
              </button>
              <button
                type="button"
                onClick={confirm}
                className="flex-[2] h-11 rounded-md bg-[#0b3d91] text-white text-[14px] font-extrabold inline-flex items-center justify-center gap-1.5"
              >
                <Check size={18} /> ঠিক আছে
              </button>
            </div>
          </div>
        </Modal>
      )}
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
  const [productBrand, setProductBrand] = useState("");
  const [productSpec, setProductSpec] = useState("");
  const [productModel, setProductModel] = useState("");
  const [desiredMonths, setDesiredMonths] = useState("");
  const [desiredDownPayment, setDesiredDownPayment] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  // Guarantor
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorAddress, setGuarantorAddress] = useState("");

  // Terms — the customer must read & agree on the gate screen before the form shows.
  const [agreed, setAgreed] = useState(false);
  // Gate consent checkbox — must be ticked before the "সম্মত আছি" button works.
  const [gateChecked, setGateChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Files
  const [photo, setPhoto] = useState<File | null>(null);
  const [nidFront, setNidFront] = useState<File | null>(null);
  const [nidBack, setNidBack] = useState<File | null>(null);
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);
  const [bankCheck, setBankCheck] = useState<File | null>(null);
  const [gPhoto, setGPhoto] = useState<File | null>(null);
  const [gSignatureBlob, setGSignatureBlob] = useState<Blob | null>(null);
  const [gNidFront, setGNidFront] = useState<File | null>(null);
  const [gNidBack, setGNidBack] = useState<File | null>(null);

  // Previews
  const preview = (f: File | null) => (f ? URL.createObjectURL(f) : null);

  const specConfig = PRODUCT_SPECS[productType];

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
    if (productBrand.trim()) fd.append("productBrand", productBrand.trim());
    if (productSpec) fd.append("productSpec", productSpec);
    fd.append("productModel", productModel.trim());
    if (desiredMonths) fd.append("desiredMonths", desiredMonths);
    if (desiredDownPayment) fd.append("desiredDownPayment", desiredDownPayment);

    // Notes
    if (notes.trim()) fd.append("notes", notes.trim());

    // Compress images client-side (phone cameras produce 3-8MB each; Vercel has 4.5MB body limit)
    const [cPhoto, cNidF, cNidB, cBank, cGP, cGNF, cGNB] = await Promise.all([
      compressFileClient(photo, 800, 0.75),
      compressFileClient(nidFront, 1200, 0.7),
      compressFileClient(nidBack, 1200, 0.7),
      bankCheck ? compressFileClient(bankCheck, 1200, 0.7) : null,
      gPhoto ? compressFileClient(gPhoto, 800, 0.75) : null,
      gNidFront ? compressFileClient(gNidFront, 1200, 0.7) : null,
      gNidBack ? compressFileClient(gNidBack, 1200, 0.7) : null,
    ]);

    // KYC files
    fd.append("photo", cPhoto);
    fd.append("nidFront", cNidF);
    fd.append("nidBack", cNidB);
    if (signatureBlob) fd.append("signature", new File([signatureBlob], "signature.png", { type: "image/png" }));
    if (cBank) fd.append("bankCheck", cBank);

    // Guarantor
    if (guarantorName.trim()) fd.append("guarantorName", guarantorName.trim());
    if (guarantorPhone.trim()) fd.append("guarantorPhone", guarantorPhone.trim());
    if (guarantorAddress.trim()) fd.append("guarantorAddress", guarantorAddress.trim());
    if (cGP) fd.append("guarantorPhoto", cGP);
    if (gSignatureBlob) fd.append("guarantorSignature", new File([gSignatureBlob], "guarantor-signature.png", { type: "image/png" }));
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

  // Terms & Conditions gate — shown first; agreeing reveals the apply form.
  if (!agreed) {
    return (
      <div className="flex flex-col gap-2.5 px-2 pt-2 pb-6 text-[#16213a]">
        {/* Header */}
        <div className="flex items-center gap-2.5">
          <Link href="/customer/installments" className="size-9 rounded-md bg-white border border-[#dfe6f2] flex items-center justify-center shrink-0">
            <ArrowLeft size={18} />
          </Link>
          <span className="flex flex-col leading-tight min-w-0 flex-1">
            <span className="text-[16px] font-extrabold truncate">কিস্তির শর্তাবলী</span>
            <span className="text-[11px] font-semibold text-[#5b6784]">আবেদনের আগে পড়ুন ও সম্মতি দিন</span>
          </span>
          <ShieldCheck size={22} className="text-[#0b3d91] shrink-0" />
        </div>

        {/* Intro */}
        <div className="rounded-md bg-white border border-[#dfe6f2] p-3.5 shadow-[0_4px_14px_rgba(11,61,145,0.06)] flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[#0b3d91]">
            <FileText size={20} />
            <h2 className="text-[17px] font-extrabold">কিস্তিতে পণ্য ক্রয়ের শর্তাবলী ও নির্দেশিকা</h2>
          </div>
          <p className="text-[15px] leading-relaxed text-[#3a4660]">
            প্রিয় গ্রাহক, সহজে এবং সাশ্রয়ী মূল্যে কিস্তিতে আপনার পছন্দের এসি, ফ্রিজ, ওয়াশিং মেশিন, আইপিএস, ব্যাটারি, টিভি, ওভেন, মোবাইল বা স্টেবিলাইজার ক্রয়ের জন্য আবেদন করতে আপনাকে স্বাগতম। আবেদন প্রক্রিয়া দ্রুত ও সফলভাবে সম্পন্ন করতে নিচের শর্তাবলী ও নির্দেশিকাগুলো মনোযোগ সহকারে পড়ার অনুরোধ করা হচ্ছে।
          </p>

          <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-[#3a4660]">
            {INSTALLMENT_TERMS.map((t) => (
              <div key={t.num} className="flex gap-2.5">
                <span className="shrink-0 size-6 rounded-full bg-[#e8f1ff] text-[#0b3d91] text-[13px] font-extrabold flex items-center justify-center">{t.num}</span>
                <p><b className="text-[#16213a]">{t.title}:</b> {t.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-md bg-[#f0f6ff] border border-[#d0e0f7] p-3 text-[14px] text-[#0b3d91] font-semibold leading-relaxed">
            নিচের ঘরে টিক দিয়ে “সম্মত আছি” বাটনে ক্লিক করার মাধ্যমে আপনি উপরোক্ত সকল শর্তাবলী পড়েছেন এবং সম্মতি প্রদান করেছেন বলে গণ্য হবে।
          </div>

          {/* Consent checkbox — must be ticked before continuing */}
          <label className="flex items-start gap-2.5 cursor-pointer select-none rounded-md border border-[#dfe6f2] bg-white p-3">
            <input
              type="checkbox"
              checked={gateChecked}
              onChange={(e) => setGateChecked(e.target.checked)}
              className="size-5 mt-0.5 rounded accent-[#0b3d91] shrink-0"
            />
            <span className="text-[15px] font-bold text-[#16213a] leading-snug">
              আমি উপরোক্ত সকল শর্তাবলী পড়েছি এবং সম্মতি দিচ্ছি। <span className="text-red-500">*</span>
            </span>
          </label>
        </div>

        {/* Agree button */}
        <button
          disabled={!gateChecked}
          onClick={() => { if (!gateChecked) return; setAgreed(true); setTermsAccepted(true); }}
          className="w-full h-12 rounded-md bg-[#0b3d91] text-white text-[16px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(11,61,145,0.3)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Check size={18} /> আমি সম্মত আছি — আবেদন শুরু করুন
        </button>

        <p className="text-[11px] text-center text-[#5b6784] px-4">
          কিস্তি সংক্রান্ত তথ্যের জন্য যোগাযোগ করুন — <a href="tel:09649355555" className="font-bold text-[#1f5fc9]">09649355555</a>
        </p>
      </div>
    );
  }

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
          <select value={productType} onChange={(e) => { setProductType(e.target.value); setProductSpec(""); }} className={inputCls}>
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
        {productType && (
          <div>
            <label className={labelCls}>ব্র্যান্ড</label>
            <input value={productBrand} onChange={(e) => setProductBrand(e.target.value)} placeholder="যেমন: Samsung, Walton, Singer..." className={inputCls} />
          </div>
        )}
        {specConfig && (
          <div>
            <label className={labelCls}>{specConfig.label}</label>
            <select value={productSpec} onChange={(e) => setProductSpec(e.target.value)} className={inputCls}>
              {specConfig.options.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className={labelCls}>পণ্যের মডেল <span className="text-red-500">*</span></label>
          <input value={productModel} onChange={(e) => setProductModel(e.target.value)} placeholder="যেমন: Luminous Eco Volt 1050" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>কিস্তির মেয়াদ</label>
            <select value={desiredMonths} onChange={(e) => setDesiredMonths(e.target.value)} className={inputCls}>
              <option value="">নির্বাচন করুন</option>
              {installmentTermOptions.map((t) => (
                <option key={t.months} value={t.months}>
                  {toBanglaNumber(t.months)} মাস ({toBanglaNumber(t.chargePercent)}% চার্জ)
                </option>
              ))}
            </select>
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
          <FileInput id="bankCheck" label="ব্যাংক চেক-এর ছবি" onChange={setBankCheck} preview={preview(bankCheck)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="nidFront" label="NID সামনে" required onChange={setNidFront} preview={preview(nidFront)} />
          <FileInput id="nidBack" label="NID পিছনে" required onChange={setNidBack} preview={preview(nidBack)} />
        </div>
        <SignaturePad label="আপনার স্বাক্ষর" onSignature={setSignatureBlob} />
      </Section>

      {/* Guarantor */}
      <Section icon={Home} title="জামিনদারের তথ্য (ঐচ্ছিক)">
        <input value={guarantorName} onChange={(e) => setGuarantorName(e.target.value)} placeholder="জামিনদারের নাম" className={inputCls} />
        <input value={guarantorPhone} onChange={(e) => setGuarantorPhone(e.target.value)} placeholder="জামিনদারের মোবাইল নম্বর" className={inputCls} />
        <textarea value={guarantorAddress} onChange={(e) => setGuarantorAddress(e.target.value)} placeholder="জামিনদারের ঠিকানা" rows={2} className={textareaCls} />
        <div className="grid grid-cols-2 gap-2">
          <FileInput id="gPhoto" label="জামিনদারের ছবি" onChange={setGPhoto} preview={preview(gPhoto)} />
          <div className="grid grid-cols-2 gap-2">
            <FileInput id="gNidFront" label="জামিনদার NID সামনে" onChange={setGNidFront} preview={preview(gNidFront)} />
            <FileInput id="gNidBack" label="জামিনদার NID পিছনে" onChange={setGNidBack} preview={preview(gNidBack)} />
          </div>
        </div>
        <SignaturePad label="জামিনদারের স্বাক্ষর" onSignature={setGSignatureBlob} />
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

"use client";

import { createStaff, getTOSContent } from "@/actions";
import geoData from "@/assets/data/geo-data.json";
import clsx from "clsx";
import {
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  CreditCard,
  Hash,
  Home,
  Landmark,
  LucideIcon,
  Mail,
  Map as MapIcon,
  MapPin,
  Phone,
  Send,
  UploadCloud,
  User,
  Users,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import Image from "next/image";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

/**
 * Public (token) staff registration form. Same fields, names, required rules
 * and server action as RegistrationForm in "create" mode; only the UI differs.
 */

const steps = ["ব্যক্তিগত", "ঠিকানা", "দক্ষতা", "পেমেন্ট", "ডকুমেন্ট"];
const sectionIds = ["reg-personal", "reg-address", "reg-skill", "reg-payment", "reg-docs"];

const boxCls =
  "w-full h-10 rounded-md border border-[#d9e2f0] bg-white pl-9 pr-2.5 text-[14px] font-semibold text-[#16213a] placeholder:font-medium placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";

const Label = ({ text, req = true }: { text: string; req?: boolean }) => (
  <span className="text-[12.5px] font-bold text-[#16213a]">
    {text} {req && <span className="text-[#e0243f]">*</span>}
  </span>
);

function SectionCard({ id, n, title, children }: { id: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-[76px] rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
        <span className="size-7 rounded-full bg-[#0b3d91] text-white text-[13px] font-extrabold flex items-center justify-center">{n}</span>
        <span className="text-[15px] font-extrabold text-[#0b3d91]">{title}</span>
      </div>
      <div className="p-2.5 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

function Field({ icon: Icon, label, req = true, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <Label text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <input {...props} required={req} placeholder={props.placeholder ?? `${label} লিখুন`} className={boxCls} />
      </span>
    </label>
  );
}

function SelectField({ icon: Icon, label, req = true, children, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean; children: React.ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <Label text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <select {...props} required={req} className={clsx(boxCls, "appearance-none pr-7")}>
          {children}
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5b6784] pointer-events-none" />
      </span>
    </label>
  );
}

function YesNo({ name, question, value, onChange }: { name: string; question: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label text={question} />
      <div className="grid grid-cols-2 gap-2">
        {[
          { v: true, t: "হ্যা" },
          { v: false, t: "না" },
        ].map((o) => (
          <label
            key={o.t}
            className={clsx(
              "h-10 rounded-md border flex items-center justify-center gap-2 text-[14px] font-extrabold cursor-pointer select-none",
              value === o.v ? "bg-[#e8f1ff] border-[#1f7cf0] text-[#0b3d91]" : "bg-white border-[#d9e2f0] text-[#3d4a63]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(o.v)}
              defaultChecked={value === o.v}
              onChange={() => onChange(o.v)}
              required
              className="size-4 accent-[#1f7cf0]"
            />
            {o.t}
          </label>
        ))}
      </div>
    </div>
  );
}

function UploadBox({ name, label, hint }: { name: string; label: string; hint?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);
  const maxMb = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB || 2);
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setPreview(null);
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`ফাইল ${maxMb} MB-এর বেশি হতে পারবে না!`);
      e.target.value = "";
      return setPreview(null);
    }
    setPreview(URL.createObjectURL(file));
  };
  return (
    <div className={clsx("relative h-[104px] rounded-md border border-dashed overflow-hidden", preview ? "border-[#1f7cf0]" : "border-[#b9cdee] bg-[#f7faff]")}>
      {preview ? (
        <>
          <Image src={preview} alt={label} fill className="object-cover object-top" />
          <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] font-bold text-center py-0.5 truncate px-1">{label}</span>
          <button
            type="button"
            aria-label="Remove"
            onClick={() => {
              setPreview(null);
              if (ref.current) ref.current.value = "";
            }}
            className="absolute top-1 right-1 z-20 size-6 rounded-md bg-black/55 text-white flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-1 text-center">
          <UploadCloud size={22} className="text-[#1f5fc9]" />
          <span className="text-[11px] font-bold text-[#16213a] leading-tight">
            {label} <span className="text-[#e0243f]">*</span>
          </span>
          {hint && <span className="text-[10px] font-semibold text-[#1f5fc9] leading-tight">{hint}</span>}
          <span className="text-[9px] font-medium text-[#5b6784] leading-tight">JPG, PNG, WebP · Max {maxMb}MB</span>
        </span>
      )}
      <input
        ref={ref}
        type="file"
        name={name}
        accept="image/png, image/jpeg, image/webp"
        required={!preview}
        onChange={onChange}
        className={clsx("absolute inset-0 opacity-0 cursor-pointer", preview ? "z-10" : "z-20")}
      />
    </div>
  );
}

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function PublicRegistrationForm({ token, onRegistrationComplete }: { token: string; onRegistrationComplete?: (name: string) => void }) {
  const [hasRepairExperience, setHasRepairExperience] = useState(false);
  const [hasInstallationExperience, setHasInstallationExperience] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState("bkash");
  const [createResponse, createStaffAction, isRegistering] = useActionState(createStaff, undefined);
  const [tosContent, setTosContent] = useState("");
  const [selectedCurrentDistrict, setSelectedCurrentDistrict] = useState("");
  const [selectedPermanentDistrict, setSelectedPermanentDistrict] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const lockUntil = useRef(0);
  const districts = Object.keys(geoData);
  const currentThanas = geoData[selectedCurrentDistrict as keyof typeof geoData] || [];
  const permanentThanas = geoData[selectedPermanentDistrict as keyof typeof geoData] || [];

  useEffect(() => {
    getTOSContent("application_declaration")
      .then((res) => setTosContent(res ?? ""))
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!isRegistering && createResponse) {
      if (createResponse.success) onRegistrationComplete?.(createResponse.data?.name ?? "");
      else toast.error(createResponse.message);
    }
  }, [isRegistering]);

  useEffect(() => {
    const onScroll = () => {
      if (Date.now() < lockUntil.current) return;
      let current = 0;
      sectionIds.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = i;
      });
      setActiveStep(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goToStep = (i: number) => {
    setActiveStep(i);
    lockUntil.current = Date.now() + 1200;
    document.getElementById(sectionIds[i])?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const walletLabel = paymentPreference === "bkash" ? "বিকাশ" : paymentPreference === "nagad" ? "নগদ" : "রকেট";

  return (
    <div className="flex flex-col gap-2.5">
      {/* Steps (sticky, clickable) */}
      <nav className="sticky top-0 z-30 -mx-2 px-2 py-1.5 bg-[#eef3fb]/95 backdrop-blur-sm">
        <div className="rounded-md bg-white border border-[#dfe6f2] px-1.5 py-2 flex items-start shadow-[0_2px_8px_rgba(11,61,145,0.05)]">
          {steps.map((st, i) => {
            const active = i === activeStep;
            const done = i < activeStep;
            return (
              <div key={st} className="flex items-start flex-1 last:flex-none">
                <button type="button" onClick={() => goToStep(i)} className="flex flex-col items-center gap-1 w-[54px]">
                  <span className={clsx("size-8 rounded-full text-[12px] font-extrabold flex items-center justify-center border-2 transition-all", active ? "bg-[#1f7cf0] border-[#1f7cf0] text-white shadow-[0_0_0_4px_#dbeafe]" : done ? "bg-[#0b3d91] border-[#0b3d91] text-white" : "bg-white border-[#d7deea] text-[#5b6784]")}>
                    {done ? <Check size={15} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={clsx("text-[10px] font-bold text-center leading-tight", active ? "text-[#1f7cf0]" : "text-[#3d4a63]")}>{st}</span>
                </button>
                {i < steps.length - 1 && <span className={clsx("flex-1 h-0.5 mt-4 -mx-2", done ? "bg-[#0b3d91]" : "bg-[#e3e8f1]")} />}
              </div>
            );
          })}
        </div>
      </nav>

      <form action={createStaffAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="token" value={token} />

        <SectionCard id={sectionIds[0]} n={1} title="ব্যক্তিগত তথ্য">
          <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
            <Field icon={User} label="নাম" name="name" />
            <Field icon={Users} label="পিতার নাম" name="fatherName" />
          </div>
          <Field icon={Phone} label="মোবাইল নাম্বার" name="phone" type="tel" inputMode="tel" />
        </SectionCard>

        <SectionCard id={sectionIds[1]} n={2} title="ঠিকানা">
          <span className="text-[12px] font-extrabold text-[#1f5fc9]">বর্তমান ঠিকানা</span>
          <Field icon={MapPin} label="বর্তমান ঠিকানা" name="currentStreetAddress" />
          <div className="grid grid-cols-2 gap-2">
            <SelectField icon={MapIcon} label="জেলা (বর্তমান)" name="currentDistrict" value={selectedCurrentDistrict} onChange={(e) => setSelectedCurrentDistrict(e.target.value)}>
              <option value="">নির্বাচন করুন</option>
              {districts.map((d) => <option key={d} value={d}>{cap(d)}</option>)}
            </SelectField>
            <SelectField icon={Building2} label="থানা (বর্তমান)" name="currentPoliceStation" defaultValue="">
              <option value="">নির্বাচন করুন</option>
              {currentThanas.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
            </SelectField>
          </div>
          <Field icon={Mail} label="পোস্ট অফিস (বর্তমান)" name="currentPostOffice" />

          <span className="mt-1 pt-2 border-t border-[#eef1f6] text-[12px] font-extrabold text-[#1f5fc9]">স্থায়ী ঠিকানা</span>
          <Field icon={Home} label="স্থায়ী ঠিকানা" name="permanentStreetAddress" />
          <div className="grid grid-cols-2 gap-2">
            <SelectField icon={MapIcon} label="জেলা (স্থায়ী)" name="permanentDistrict" value={selectedPermanentDistrict} onChange={(e) => setSelectedPermanentDistrict(e.target.value)}>
              <option value="">নির্বাচন করুন</option>
              {districts.map((d) => <option key={d} value={d}>{cap(d)}</option>)}
            </SelectField>
            <SelectField icon={Building2} label="থানা (স্থায়ী)" name="permanentPoliceStation" defaultValue="">
              <option value="">নির্বাচন করুন</option>
              {permanentThanas.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
            </SelectField>
          </div>
          <Field icon={Mail} label="পোস্ট অফিস (স্থায়ী ঠিকানা)" name="permanentPostOffice" />
        </SectionCard>

        <SectionCard id={sectionIds[2]} n={3} title="কাজের দক্ষতা">
          <YesNo name="hasRepairExperience" question="IPS কাজের দক্ষতা আছে?" value={hasRepairExperience} onChange={setHasRepairExperience} />
          {hasRepairExperience && <Field icon={Wrench} label="কাজের দক্ষতা কত বছর?" name="repairExperienceYears" type="number" inputMode="numeric" placeholder="বছর লিখুন" />}
          <YesNo name="hasInstallationExperience" question="আপনার কি হাউজ ওরারিং ও IPS এর ওরারিং কাজে দক্ষতা আছে?" value={hasInstallationExperience} onChange={setHasInstallationExperience} />
          {hasInstallationExperience && <Field icon={Briefcase} label="কাজের দক্ষতা কত বছর?" name="installationExperienceYears" type="number" inputMode="numeric" placeholder="বছর লিখুন" />}
        </SectionCard>

        <SectionCard id={sectionIds[3]} n={4} title="পেমেন্ট তথ্য">
          <SelectField icon={Wallet} label="পেমেন্ট কিভাবে নিতে ইচ্ছুক?" name="paymentPreference" value={paymentPreference} onChange={(e) => setPaymentPreference(e.target.value)}>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="rocket">রকেট</option>
            <option value="bank">ব্যাংক</option>
          </SelectField>
          {paymentPreference !== "bank" ? (
            <Field icon={Phone} label={`${walletLabel} নাম্বার`} name="walletNumber" type="tel" inputMode="tel" />
          ) : (
            <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
              <Field icon={Landmark} label="ব্যাংক নাম" name="bankName" />
              <Field icon={User} label="একাউন্ট নাম" name="accountHolderName" />
              <Field icon={CreditCard} label="একাউন্ট নাম্বার" name="accountNumber" type="tel" inputMode="numeric" />
              <Field icon={Hash} label="শাখা" name="branchName" />
            </div>
          )}
        </SectionCard>

        <SectionCard id={sectionIds[4]} n={5} title="ছবি ও ডকুমেন্ট">
          <div className="grid grid-cols-3 gap-2">
            <UploadBox name="photo" label="আপনার ছবি" />
            <UploadBox name="nidFrontPhoto" label="জাতীয় পরিচয়পত্রের ছবি" hint="সামনের দিকের" />
            <UploadBox name="nidBackPhoto" label="জাতীয় পরিচয়পত্রের ছবি" hint="পেছনের দিকের" />
          </div>
        </SectionCard>

        <label className="rounded-md bg-white border border-[#dfe6f2] p-2.5 flex items-start gap-3 cursor-pointer select-none">
          <input value="true" type="checkbox" name="agreed" required className="size-5 mt-0.5 accent-[#0b3d91] shrink-0" />
          <span className="text-[12.5px] leading-relaxed text-[#3d4a63]">{tosContent}</span>
        </label>

        <button type="submit" disabled={isRegistering} className="h-11 rounded-md bg-[linear-gradient(90deg,#0b3d91,#1f7cf0)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(31,124,240,0.35)] disabled:opacity-50 active:scale-[0.98] transition-all">
          {isRegistering ? "Registering..." : <><Send size={18} />Register</>}
        </button>
      </form>
    </div>
  );
}

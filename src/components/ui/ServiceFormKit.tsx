"use client";

/**
 * Form building blocks of the public servicing form (/get-service), shared so
 * other forms (seller application, ...) look and feel exactly the same:
 * numbered section cards, compact h-10 fields with the icon inside the box,
 * and dashed photo upload tiles with preview.
 */

import clsx from "clsx";
import { ChevronDown, LucideIcon, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

export function SectionCard({ id, n, title, hint, children }: { id?: string; n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} data-step={n - 1} className="scroll-mt-[76px] rounded-md bg-white border border-[#dfe6f2] overflow-hidden shadow-[0_4px_14px_rgba(11,61,145,0.06)]">
      <div className="flex items-center gap-2.5 px-2.5 py-2 bg-[#eef4fd] border-b border-[#dfe8f7]">
        <span className="size-7 rounded-full bg-[#0b3d91] text-white text-[13px] font-extrabold flex items-center justify-center shrink-0">{n}</span>
        <span className="flex flex-col leading-tight min-w-0">
          <span className="text-[15px] font-extrabold text-[#0b3d91]">{title}</span>
          {hint && <span className="text-[11px] font-semibold text-[#5b6784]">{hint}</span>}
        </span>
      </div>
      <div className="p-2.5 flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

export const boxCls = "w-full h-10 rounded-md border border-[#d9e2f0] bg-white pl-9 pr-2.5 text-[14px] font-semibold text-[#16213a] placeholder:font-medium placeholder:text-[#9aa4b8] outline-none focus:border-[#1f7cf0] focus:ring-1 focus:ring-[#1f7cf0]";
export const FieldLabel = ({ text, req }: { text: string; req?: boolean }) => <span className="text-[12.5px] font-bold text-[#16213a]">{text} {req && <span className="text-[#e0243f]">*</span>}</span>;

/** Text input with its icon inside the box. */
export function Field({ icon: Icon, label, req = true, className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <FieldLabel text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <input {...props} required={req} className={boxCls} />
      </span>
    </label>
  );
}

/** Select with its icon inside the box. `options` are plain values or {value,label}. */
export function SelectField({ icon: Icon, label, req = true, options, format, placeholder = "নির্বাচন করুন", className = "", ...props }: { icon: LucideIcon; label: string; req?: boolean; options: readonly (string | { value: string; label: string })[]; format?: (v: string) => string; placeholder?: string | null } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className={clsx("flex flex-col gap-1 min-w-0", className)}>
      <FieldLabel text={label} req={req} />
      <span className="relative">
        <Icon size={17} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1f5fc9] pointer-events-none" />
        <select {...props} required={req} className={clsx(boxCls, "appearance-none pr-7")}>
          {placeholder !== null && <option value="">{placeholder}</option>}
          {options.map((o) => {
            const value = typeof o === "string" ? o : o.value;
            const text = typeof o === "string" ? (format ? format(o) : o) : o.label;
            return <option key={value} value={value}>{text}</option>;
          })}
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5b6784] pointer-events-none" />
      </span>
    </label>
  );
}

/**
 * Compact dashed upload tile with preview. `initialSrc` shows an already
 * uploaded image (edit forms); picking a new file replaces the preview.
 */
export function UploadBox({ name, label, req = true, initialSrc }: { name: string; label: string; req?: boolean; initialSrc?: string | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement | null>(null);
  const maxMb = Number(process.env.NEXT_PUBLIC_MAX_IMAGE_SIZE_MB || 2);
  const preview = picked || initialSrc || null;
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setPicked(null);
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`ফাইল ${maxMb} MB-এর বেশি হতে পারবে না!`);
      e.target.value = "";
      return setPicked(null);
    }
    setPicked(URL.createObjectURL(file));
  };
  return (
    <div className={clsx("relative h-[100px] rounded-md border border-dashed overflow-hidden", preview ? "border-[#1f7cf0]" : "border-[#b9cdee] bg-[#f7faff]")}>
      {preview ? (
        <>
          <Image src={preview} alt={label} fill unoptimized={!picked} className="object-cover" />
          <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] font-bold text-center py-0.5 truncate px-1">{label}</span>
          {picked && (
            <button type="button" aria-label="Remove" onClick={() => { setPicked(null); if (ref.current) ref.current.value = ""; }} className="absolute top-1 right-1 z-20 size-6 rounded-md bg-black/55 text-white flex items-center justify-center"><X size={14} /></button>
          )}
        </>
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 text-center">
          <UploadCloud size={22} className="text-[#1f5fc9]" />
          <span className="text-[11px] font-bold text-[#16213a] leading-tight">{label} {req ? <span className="text-[#e0243f]">*</span> : <span className="text-[#5b6784] font-semibold">(ঐচ্ছিক)</span>}</span>
          <span className="text-[9px] font-medium text-[#5b6784] leading-tight">(JPG, PNG বা WebP - Max {maxMb}MB)</span>
        </span>
      )}
      <input ref={ref} type="file" name={name} accept="image/png, image/jpeg, image/webp" required={req && !preview} onChange={onChange} className={clsx("absolute inset-0 opacity-0 cursor-pointer", preview ? "z-10" : "z-20")} />
    </div>
  );
}

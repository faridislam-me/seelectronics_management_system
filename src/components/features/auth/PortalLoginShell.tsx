"use client";

import { contactDetails } from "@/constants";
import { Eye, EyeOff, Headset, LogIn, LucideIcon, Phone, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";

export type PortalRole = "staff" | "customer" | "seller";

/**
 * Page background from the client's artwork. The top crop holds the logo,
 * title, "<ROLE> PORTAL", tagline and building (one crop per role, the role
 * text is baked in); the bottom crop is the shared blue wave.
 */
const bgFor = (role: PortalRole): React.CSSProperties => ({
  backgroundColor: "#f1f4f9",
  backgroundImage: `url('/login/${role}-bg-top.jpg'), url('/login/staff-bg-bottom.jpg')`,
  backgroundPosition: "top center, bottom center",
  backgroundSize: "100% auto, 100% auto",
  backgroundRepeat: "no-repeat, no-repeat",
});

/** Shared login page shell for the staff, customer and seller portals. */
export default function PortalLoginShell({
  role,
  title,
  footerSubtitle,
  children,
  after,
}: {
  role: PortalRole;
  /** Bangla card title, e.g. "এস্টাফ লগইন পোর্টাল". */
  title: string;
  /** e.g. "Authorized Staff Portal". */
  footerSubtitle: string;
  /** The role's own form. */
  children: React.ReactNode;
  /** Anything rendered outside the card (e.g. modals). */
  after?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f1f4f9]">
      <div className="relative mx-auto w-full max-w-[480px] min-h-screen flex flex-col" style={bgFor(role)}>
        <div className="relative z-10 px-3 w-full" style={{ paddingTop: "calc(min(100vw, 480px) * 0.39)", paddingBottom: "calc(min(100vw, 480px) * 0.21 + 8px)" }}>
          <div className="rounded-[14px] bg-white shadow-[0_14px_40px_rgba(11,61,145,0.16)] border border-[#e6ecf6] px-4 pt-5 pb-4">
            <div className="flex items-center justify-center gap-3">
              <Users size={40} className="text-[#1f5fc9] shrink-0" fill="#1f5fc9" strokeWidth={1.6} />
              <span className="flex flex-col leading-tight">
                <span className="text-[clamp(19px,5.8vw,24px)] font-extrabold text-[#0b2a66]">{title}</span>
                <span className="text-[11px] font-semibold tracking-[0.18em] text-[#5b6784]">SIGN IN TO YOUR ACCOUNT</span>
              </span>
            </div>

            <div className="mt-4">{children}</div>

            <div className="mt-4 pt-3 border-t border-[#eef1f6] flex items-center justify-center gap-3">
              <Headset size={30} className="text-[#1f5fc9]" />
              <span className="flex flex-col leading-tight">
                <span className="text-[13px] font-bold text-[#16213a]">Need Help?</span>
                <span className="text-[12px] text-[#3d4a63]">
                  Contact Admin{" "}
                  <a href={`tel:${contactDetails.customerCare}`} className="inline-flex items-center gap-1 font-bold text-[#1f5fc9]"><Phone size={12} fill="currentColor" />{contactDetails.customerCare}</a>
                </span>
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-[#eef1f6] flex items-center gap-3">
              <ShieldCheck size={30} className="text-[#0b2a66] shrink-0" fill="#0b2a66" stroke="white" />
              <span className="flex flex-col leading-tight min-w-0 flex-1">
                <span className="text-[13px] font-extrabold tracking-wide text-[#0b2a66]">SE ELECTRONICS</span>
                <span className="text-[11.5px] text-[#5b6784]">{footerSubtitle}</span>
              </span>
              <span className="w-px self-stretch bg-[#e3e8f1]" />
              <span className="text-[12px] text-[#16213a] text-center leading-snug shrink-0">“একসাথে কাজ করি<br />উন্নয়নের পথে”</span>
            </div>
          </div>
        </div>
      </div>
      {after}
    </div>
  );
}

/** Mockup-style input: icon cell on the left and a two-line EN/BN placeholder. */
export function PortalInput({
  icon: Icon,
  iconFill = true,
  label,
  labelBn,
  type = "text",
  value,
  onChange,
  ...rest
}: {
  icon: LucideIcon;
  iconFill?: boolean;
  label: string;
  labelBn: string;
  type?: "text" | "password" | "tel";
  value?: string;
  onChange?: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange">) {
  const [inner, setInner] = useState("");
  const [show, setShow] = useState(false);
  const v = value ?? inner;
  const isPassword = type === "password";
  return (
    <label className="relative flex items-stretch h-[54px] rounded-[10px] border border-[#cfdcef] bg-[#f5f8fd] focus-within:border-[#1f7cf0] focus-within:ring-1 focus-within:ring-[#1f7cf0] overflow-hidden">
      <span className="w-12 shrink-0 flex items-center justify-center text-[#0b2a66] border-r border-[#cfdcef]"><Icon size={20} fill={iconFill ? "currentColor" : "none"} /></span>
      <span className="relative flex-1 min-w-0">
        {!v && (
          <span className="pointer-events-none absolute inset-0 flex flex-col justify-center px-3 leading-tight">
            <span className="text-[13px] text-[#5b6784] truncate">{label}</span>
            <span className="text-[12px] text-[#8a95ab] truncate">{labelBn}</span>
          </span>
        )}
        <input
          {...rest}
          type={isPassword && show ? "text" : type}
          value={v}
          onChange={(e) => (onChange ? onChange(e.target.value) : setInner(e.target.value))}
          aria-label={label}
          className={`absolute inset-0 w-full h-full bg-transparent pl-3 ${isPassword ? "pr-11" : "pr-3"} text-[15px] font-semibold text-[#16213a] outline-none`}
        />
      </span>
      {isPassword && (
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-0 top-0 h-full w-11 flex items-center justify-center text-[#0b2a66]">
          {show ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      )}
    </label>
  );
}

/** Big gradient LOGIN button with the Bangla sub-label. */
export function PortalSubmit({ pending, pendingText = "LOGGING IN..." }: { pending?: boolean; pendingText?: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 h-[56px] w-full rounded-[12px] bg-[linear-gradient(100deg,#1f7cf0_0%,#0b4fc2_60%,#0b3d91_100%)] text-white shadow-[0_10px_24px_rgba(31,124,240,0.35)] flex items-center justify-center gap-4 disabled:opacity-60 active:scale-[0.98] transition-all"
    >
      <LogIn size={26} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-[16px] font-extrabold tracking-[0.12em]">{pending ? pendingText : "LOGIN"}</span>
        <span className="text-[13px] font-semibold text-white/90">লগইন করুন</span>
      </span>
    </button>
  );
}

/** "Remember Me" + "Forgot Password?" row. Forgot password calls the admin. */
export function PortalRememberRow({ remember, onRemember }: { remember: boolean; onRemember: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-2 px-0.5">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" checked={remember} onChange={(e) => onRemember(e.target.checked)} className="mt-0.5 size-5 accent-[#1f7cf0] shrink-0" />
        <span className="flex flex-col leading-tight">
          <span className="text-[13px] font-semibold text-[#16213a]">Remember Me</span>
          <span className="text-[11.5px] text-[#5b6784]">আমাকে মনে রাখুন</span>
        </span>
      </label>
      <a href={`tel:${contactDetails.customerCare}`} className="flex flex-col items-end leading-tight text-right">
        <span className="text-[13px] font-semibold text-[#1f5fc9]">Forgot Password?</span>
        <span className="text-[11.5px] text-[#5b6784]">পাসওয়ার্ড ভুলে গেছেন?</span>
      </a>
    </div>
  );
}

/** Keeps a username/ID on this device when "Remember Me" is ticked (never passwords). */
export function useRememberedValue(key: string) {
  const [remember, setRemember] = useState(true);
  const load = (set: (v: string) => void) => {
    try { const saved = localStorage.getItem(key); if (saved) set(saved); } catch {}
  };
  const save = (value: string) => {
    try { if (remember) localStorage.setItem(key, value.trim()); else localStorage.removeItem(key); } catch {}
  };
  return { remember, setRemember, load, save };
}

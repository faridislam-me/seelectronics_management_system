import { ArrowRight, Check, ShieldCheck, User } from "lucide-react";
import Link from "next/link";

/** Full-screen success popup shown after a customer form is submitted. */
export default function SuccessPopup({
  title,
  message,
  buttonLabel,
  href,
}: {
  title: string;
  message: string;
  buttonLabel: string;
  href: string;
}) {
  const sparks = [
    "left-[18%] top-[16%] bg-[#f5c518] rotate-[-40deg]",
    "right-[20%] top-[12%] bg-[#12805c] rotate-[40deg]",
    "left-[10%] top-[44%] bg-[#1a9c4b] rotate-[20deg]",
    "right-[10%] top-[40%] bg-[#1a9c4b] rotate-[-10deg]",
    "right-[16%] bottom-[20%] bg-[#1f7cf0] rotate-[35deg]",
    "left-[22%] bottom-[16%] bg-[#f5c518] rotate-[-35deg]",
  ];
  return (
    <div className="fixed inset-0 z-[90] bg-[#0b3d91]/25 backdrop-blur-[2px] flex items-center justify-center p-3">
      <div className="w-full max-w-[420px] rounded-md bg-white border border-[#dfe6f2] px-4 pt-5 pb-4 flex flex-col items-center gap-3 text-center shadow-[0_20px_50px_rgba(11,61,145,0.25)] animate-[sePop_.35s_ease-out]">
        <div className="relative size-36 flex items-center justify-center">
          {sparks.map((c) => <span key={c} className={`absolute h-1 w-2.5 rounded-full ${c}`} />)}
          <span className="absolute left-[12%] top-[62%] size-1.5 rounded-full bg-[#1f7cf0]" />
          <span className="absolute right-[18%] top-[30%] size-1.5 rounded-full bg-[#f5c518]" />
          <span className="absolute inset-4 rounded-full bg-[#e9f9ef] animate-ping [animation-duration:2s] opacity-60" />
          <span className="absolute inset-4 rounded-full bg-[#e9f9ef]" />
          <span className="relative size-20 rounded-full border-[5px] border-[#1a9c4b] bg-white flex items-center justify-center">
            <Check size={38} strokeWidth={3.5} className="text-[#1a9c4b]" />
          </span>
        </div>

        <h2 className="text-[clamp(19px,5.6vw,23px)] font-extrabold leading-snug text-[#0b2a66]">{title}</h2>

        <div className="w-full rounded-md bg-[#eef4fd] border border-[#dfe8f7] p-3 flex items-center gap-3 text-left">
          <ShieldCheck size={36} className="text-[#0b3d91] shrink-0" />
          <span className="w-px self-stretch bg-[#c9d8f0]" />
          <p className="text-[13px] leading-relaxed font-medium text-[#3d4a63]">{message}</p>
        </div>

        <Link href={href} className="w-full h-12 rounded-md bg-[linear-gradient(90deg,#1f7cf0,#0b3d91)] text-white text-[15px] font-extrabold inline-flex items-center justify-center gap-3 shadow-[0_8px_20px_rgba(31,124,240,0.35)] active:scale-[0.98] transition-transform">
          <span className="size-8 rounded-full bg-white text-[#1f5fc9] flex items-center justify-center"><User size={18} /></span>
          {buttonLabel}
          <ArrowRight size={18} />
        </Link>

        <span className="flex items-center gap-3 text-[12.5px] font-bold text-[#1f5fc9]"><span className="w-8 h-px bg-[#1f5fc9]" />আপনার পাশে সবসময়<span className="w-8 h-px bg-[#1f5fc9]" /></span>
      </div>
      <style>{`@keyframes sePop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

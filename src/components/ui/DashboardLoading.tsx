"use client";

import { Headset, Leaf, Settings, ShieldCheck, MapPin } from "lucide-react";
import Image from "next/image";

/** Full-screen branded loader: logo with a spinning ring, progress bar and feature row. */
export default function DashboardLoading() {
  const features = [
    { icon: ShieldCheck, label: "Reliable\nProducts" },
    { icon: Settings, label: "Expert\nService" },
    { icon: Headset, label: "Customer\nSupport" },
    { icon: Leaf, label: "Sustainable\nFuture" },
  ];
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[radial-gradient(120%_80%_at_50%_30%,#ffffff_0%,#eef4ff_60%,#dfeafc_100%)] flex flex-col items-center">
      {/* corner waves */}
      <svg className="absolute -top-2 -left-2 w-[70%] h-40 text-[#0b3d91]" viewBox="0 0 300 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H300C220 20 160 60 110 100C70 130 30 150 0 160Z" fill="currentColor" />
        <path d="M0 150C40 120 90 90 150 60C200 36 250 18 300 8" stroke="#7fb4ff" strokeWidth="2" fill="none" opacity=".7" />
      </svg>
      <svg className="absolute -bottom-2 left-0 w-full h-40 text-[#0b3d91]" viewBox="0 0 400 160" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 80C80 40 160 110 250 90C320 74 360 40 400 30V160H0Z" fill="currentColor" />
        <path d="M0 70C90 30 170 100 260 80C330 64 370 34 400 24" stroke="#7fb4ff" strokeWidth="2" fill="none" opacity=".7" />
      </svg>

      <div className="relative flex-1 w-full max-w-sm px-6 flex flex-col items-center justify-center gap-5 pb-24">
        <div className="flex flex-col items-center leading-none">
          <span className="text-[64px] font-extrabold italic tracking-[-3px] text-[#0b3d91]">SE</span>
          <span className="mt-1 text-[26px] font-extrabold tracking-wide text-[#0b3d91]">SE ELECTRONICS</span>
          <span className="mt-1.5 text-[11px] font-semibold tracking-[3px] text-[#3d4a63]">TRUSTED POWER | BETTER TOMORROW</span>
        </div>

        {/* logo with spinning ring */}
        <div className="relative size-40 flex items-center justify-center">
          <span className="absolute inset-0 rounded-full border-[3px] border-[#1f7cf0]/15" />
          <span className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-[#1f7cf0] border-r-[#1f7cf0] animate-spin [animation-duration:1.1s]" />
          <span className="absolute inset-3 rounded-full border-[3px] border-transparent border-b-[#7fb4ff] animate-spin [animation-duration:1.6s] [animation-direction:reverse]" />
          <Image src="/logo.jpg" alt="SE Electronics" width={112} height={112} priority className="size-28 rounded-full object-cover shadow-[0_8px_24px_rgba(11,61,145,0.25)]" />
        </div>

        <span className="text-[20px] font-extrabold text-[#0b3d91]">Loading...</span>
        <div className="w-48 h-2 rounded-full bg-[#d6e7ff] overflow-hidden">
          <div className="h-full w-1/2 rounded-full bg-[#1f7cf0] animate-[seLoad_1.4s_ease-in-out_infinite]" />
        </div>

        <div className="mt-2 grid grid-cols-4 w-full divide-x divide-[#cfe0fb]">
          {features.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 text-center px-1">
              <span className="size-11 rounded-full bg-[#1f7cf0] text-white flex items-center justify-center"><f.icon size={20} /></span>
              <span className="text-[11px] font-bold text-[#0b3d91] whitespace-pre-line leading-tight">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-5 left-6 flex items-start gap-2 text-white">
        <MapPin size={18} className="text-[#7fb4ff] mt-0.5" />
        <span className="text-[11px] font-bold tracking-[2px] leading-tight">SE ELECTRONICS<br /><span className="font-medium text-white/80">SYLHET, BANGLADESH</span></span>
      </div>

      <style jsx>{`
        @keyframes seLoad { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}

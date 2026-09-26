"use client";

import Image from "next/image";

/**
 * Full-screen branded loader. The artwork (wordmark, feature row, products and
 * location) comes from /loading-bg.jpg; the spinning logo and progress bar sit
 * in the empty middle band of that image.
 */
export default function DashboardLoading() {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#eaf2ff] flex justify-center">
      <div className="relative h-full w-full max-w-[480px]">
        <Image src="/loading-bg.jpg" alt="SE Electronics" fill priority sizes="480px" className="object-cover object-center select-none pointer-events-none" />

        {/* empty band of the artwork: ~31%–65% of its height */}
        <div className="absolute inset-x-0 top-[31%] h-[34%] flex flex-col items-center justify-center gap-4">
          <div className="relative size-[clamp(120px,34vw,150px)] flex items-center justify-center">
            <span className="absolute inset-0 rounded-full bg-white/70 shadow-[0_0_40px_rgba(31,124,240,0.25)]" />
            <span className="absolute inset-0 rounded-full border-[3px] border-[#1f7cf0]/15" />
            <span className="absolute inset-0 rounded-full border-[4px] border-transparent border-t-[#1f7cf0] border-r-[#1f7cf0] animate-spin [animation-duration:1.1s]" />
            <span className="absolute inset-2.5 rounded-full border-[3px] border-transparent border-b-[#7fb4ff] animate-spin [animation-duration:1.6s] [animation-direction:reverse]" />
            <Image src="/logo.jpg" alt="" width={112} height={112} priority className="relative size-[72%] rounded-full object-cover shadow-[0_8px_24px_rgba(11,61,145,0.25)]" />
          </div>

          <span className="text-[20px] font-extrabold text-[#0b3d91]">Loading...</span>
          <div className="w-48 h-2 rounded-full bg-[#d6e7ff] overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-[#1f7cf0] animate-[seLoad_1.4s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes seLoad { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}

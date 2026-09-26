"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function StaffBalanceBar({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;

    const timeoutId = setTimeout(() => {
      setRevealed(false);
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [revealed]);

  const displayAmount = Math.floor(amount || 0);
  const amountText =
    displayAmount < 0
      ? `-${Math.abs(displayAmount).toLocaleString()}৳`
      : `${displayAmount.toLocaleString()}৳`;

  return (
    <div className="flex items-center">
      <div className={`bg-white rounded-full px-1 shadow-md border border-brand/10 overflow-hidden relative ${compact ? "h-8 w-[156px]" : "h-8 min-w-[170px] sm:min-w-[170px]"}`}>
        
        <div className={`flex items-start h-full w-full relative overflow-hidden ${compact ? "px-2 py-1" : "px-8 py-2"}`}>

          {/* 🔹 Tap For Balance (ALWAYS mounted) */}
          <button
            onClick={() => setRevealed(true)}
            className={`absolute inset-0 flex items-center ${compact ? "gap-2 pl-1.5" : "gap-3"} z-20 bg-white
            transition-all duration-1200 ease-[cubic-bezier(0.4,0,0.2,1)] delay-200
            hover:bg-gray-50 active:scale-95
            ${revealed ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`}
          >
            <div className="size-6  rounded-full flex items-center justify-center shrink-0 bg-brand">
              <div className="w-2 h-1 text-white text-xs font-extrabold -mt-3">
                ৳
              </div>
            </div>
            <span className={`${compact ? "text-[12px]" : "text-sm"} font-black text-brand whitespace-nowrap`}>
              Tap For Balance
            </span>
          </button>

          {/* 🔹 Revealed Balance (ALWAYS mounted) */}
          <div
            className={`absolute inset-0 flex items-center justify-between w-full h-full
            transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${revealed ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}
          >
            {/* <div className="size-8 rounded-full flex items-center justify-center shrink-0 bg-brand">
              <div className="w-3 h-3 text-white text-sm font-extrabold -mt-2">
                ৳
              </div>
            </div> */}

            <div className="flex-1 flex items-center justify-between gap-2">
                <span className={`${compact ? "text-[14px] pl-1.5" : "text-lg pl-3 ml-2"} font-black text-brand whitespace-nowrap`}>
                {amountText}
              </span>
               <Link
                href="/staff/payment"
                className={`h-6 px-2 rounded-full bg-brand text-white flex items-center gap-1 ${compact ? "text-[10px] mr-1" : "text-[10px] sm:text-sm"} font-black hover:bg-brand-800 transition-all active:scale-95 shadow-sm`}
              >
              Details
                
              </Link>

            
             
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
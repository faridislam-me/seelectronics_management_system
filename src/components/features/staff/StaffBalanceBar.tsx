"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * "Tap For Balance" pill. Every inner element keeps the same 4px gap to the
 * pill edge. On tap the ৳ circle slides to the right end, then the balance
 * (large) and the Details button take its place; it hides again after 5s.
 */
export function StaffBalanceBar({ amount, compact = false }: { amount: number; compact?: boolean }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!revealed) return;
    const timeoutId = setTimeout(() => setRevealed(false), 5000);
    return () => clearTimeout(timeoutId);
  }, [revealed]);

  const displayAmount = Math.floor(amount || 0);
  const amountText =
    displayAmount < 0 ? `-${Math.abs(displayAmount).toLocaleString()}৳` : `${displayAmount.toLocaleString()}৳`;

  const width = compact ? 164 : 180;
  const travel = width - 8 - 24; // pill width - 2x4px gap - circle size

  return (
    <div className="flex items-center">
      <div
        className="relative h-8 rounded-full bg-white shadow-md border border-brand/10 overflow-hidden"
        style={{ width }}
      >
        {/* Tap area (only while hidden) */}
        <button
          type="button"
          aria-label="Tap For Balance"
          onClick={() => setRevealed(true)}
          disabled={revealed}
          className="absolute inset-0 z-10 disabled:pointer-events-none"
        />

        {/* ৳ circle: left → right end */}
        <span
          aria-hidden
          className={clsx(
            "absolute left-1 top-1 size-6 rounded-full bg-brand text-white text-[13px] font-extrabold flex items-center justify-center",
            "transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
            revealed ? "opacity-0 delay-500" : "opacity-100",
          )}
          style={{ transform: revealed ? `translateX(${travel}px)` : "translateX(0)" }}
        >
          ৳
        </span>

        {/* Label */}
        <span
          className={clsx(
            "absolute left-9 top-1/2 -translate-y-1/2 font-black text-brand whitespace-nowrap transition-opacity duration-300",
            compact ? "text-[12px]" : "text-[13px]",
            revealed ? "opacity-0" : "opacity-100",
          )}
        >
          Tap For Balance
        </span>

        {/* Balance (large) */}
        <span
          className={clsx(
            "absolute left-3 top-1/2 -translate-y-1/2 font-black text-brand whitespace-nowrap leading-none transition-opacity duration-300",
            compact ? "text-[17px]" : "text-[18px]",
            revealed ? "opacity-100 delay-500" : "opacity-0",
          )}
        >
          {amountText}
        </span>

        {/* Details: same 4px gap on top, bottom and right */}
        <Link
          href="/staff/payment"
          tabIndex={revealed ? 0 : -1}
          className={clsx(
            "absolute right-1 top-1 z-20 h-6 px-2.5 rounded-full bg-brand text-white text-[11px] font-black flex items-center shadow-sm transition-opacity duration-300 active:scale-95",
            revealed ? "opacity-100 delay-500" : "opacity-0 pointer-events-none",
          )}
        >
          Details
        </Link>
      </div>
    </div>
  );
}

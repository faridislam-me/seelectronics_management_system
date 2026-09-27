"use client";

import { Crown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

// ─── Types ────────────────────────────────────────────────────────────
interface VipFlipCardProps {
  customer: {
    name: string;
    customerId: string;
    vipExpiryDate?: Date | string | null;
    [key: string]: any;
  };
  vipCardNumber: string;
  vipBgSrc: string;
  baseUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────

/** Format a 16-digit card number into spaced groups of 4. */
function formatCardNumber(num: string): string {
  return (
    num.match(/.{1,4}/g)?.join("\u2003") ?? "####\u2003####\u2003####\u2003####"
  );
}

/** Format expiry date to MM/YY. */
function formatExpiry(date?: Date | string | null): string {
  if (!date) return "MM/YY";
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    year: "2-digit",
  }).format(d);
}

// ─── Component ────────────────────────────────────────────────────────

/**
 * VipFlipCard
 *
 * A credit-card-style flip component. Tap/click toggles between front
 * (card number, holder, expiry) and back (QR, customer ID, barcode).
 *
 * ## Flip animation
 * 1. The outer wrapper sets `perspective: 1200px` to establish a 3-D
 *    rendering context.
 * 2. The inner "card body" uses `transform-style: preserve-3d` so both
 *    child faces live in the same 3-D space.
 * 3. On click, the card body transitions `transform: rotateY(0 → 180deg)`.
 * 4. Each face has `backface-visibility: hidden`; the back face starts at
 *    `rotateY(180deg)` so it's pre-flipped — only becoming visible when
 *    the parent rotates it into view.
 * 5. `transition-duration: 700ms` with an ease-in-out curve gives a smooth,
 *    satisfying flip.
 */
export function VipFlipCard({
  customer,
  vipCardNumber,
  vipBgSrc,
  baseUrl = "",
}: VipFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeRef.current && customer?.customerId) {
      try {
        const barcodeValue = `${baseUrl}/customers?query=${customer.customerId}`;
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: "CODE128",
          lineColor: "#ffffff",
          background: "transparent",
          displayValue: false,
          margin: 0,
          width: 2,
          height: 150,
        });
      } catch (e) {
        console.error("Barcode generation failed", e);
      }
    }
  }, [customer?.customerId, baseUrl]);

  return (
    <div
      className="relative flex flex-col items-center w-full"
      style={{ perspective: "1200px" }}
    >
      {/* ── Card body (flips on click) ─────────────────────────────── */}
      <div
        className="relative w-full max-w-[560px] cursor-pointer"
        style={{
          aspectRatio: "1.7 / 1", // slightly shorter than a credit card, per client
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: "transform 700ms ease-in-out",
        }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        {/* ════════════════════════════════════════════════════════════
            FRONT FACE
           ════════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 rounded-xl shadow-2xl shadow-blue-900/50 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            backgroundImage: "url('/vip-card.jpeg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Slight gradient overlay to lift text off the busy background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#001540]/30 via-transparent to-[#001540]/20 pointer-events-none" />

          <div className="relative z-10 h-full w-full flex flex-col justify-between p-[5%] text-white select-none">
            {/* ── Top row: Brand + VIP badge ───────────────────────── */}
            <div className="flex justify-between items-center">
              <span className="font-black text-xl tracking-tight leading-none drop-shadow-md">
                SE ELECTRONICS
              </span>

              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 p-2 rounded-md border border-white/20 backdrop-blur-md bg-white/10 shadow-lg">
                <div className="flex flex-col items-end -space-y-px">
                  <span className="font-black text-sm tracking-tight leading-none drop-shadow-md">
                    VIP CARD
                  </span>
                  <span className="text-blue-100/80 font-bold text-[7px] uppercase tracking-[0.18em] drop-shadow-sm">
                    Membership
                  </span>
                </div>
                <div className="h-8 sm:h-7 w-px bg-white/25" />
                <Crown className=" text-white drop-shadow-md" size={30} />
              </div>
            </div>

            {/* ── Card number ──────────────────────────────────────── */}
            <p className="font-mono font-bold text-lg tracking-[0.12em] sm:tracking-[0.18em] text-white drop-shadow-xl  leading-none">
              {formatCardNumber(vipCardNumber)}
            </p>

            {/* ── Expiry ───────────────────────────────────────────── */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 -mt-1">
              <span className="font-black text-[10px] sm:text-sm uppercase text-white/80 leading-none">
                Expires in
              </span>
              <span className="font-bold text-[11px] sm:text-sm tracking-widest text-white drop-shadow-md">
                {formatExpiry(customer.vipExpiryDate)}
              </span>
            </div>

            {/* ── Bottom row: Holder + logo placeholder ────────────── */}
            <div className="flex justify-between items-end ">
              <div className="max-w-[65%]">
                <p className="text-xl uppercase tracking-[0.08em] font-bold text-blue-100/60 leading-none mb-4">
                  Card Holder
                </p>
                <p className="font-bold text-sm uppercase tracking-wider text-white drop-shadow-lg leading-tight">
                  {customer.name}
                </p>
              </div>
              {/* The SE IPS BD logo is baked into the background image at bottom-right */}
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            BACK FACE
           ════════════════════════════════════════════════════════════ */}
        <div
          className="absolute inset-0 rounded-xl shadow-2xl shadow-blue-900/50 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundImage: `url(${vipBgSrc})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/5 pointer-events-none" />

          <div className="relative z-10 h-full w-full flex flex-col select-none">
            {/* ── Spacer to clear the BG's built-in white strip ─────── */}
            <div className="h-[9.5%] sm:h-[10%]" />

            {/* ── Title strip ──────────────────────────────────────── */}
            <div className=" w-full py-1 sm:py-1 px-2 flex justify-center items-center shadow-sm">
              <span className="font-black text-[#0A1128] text-base tracking-tight uppercase text-center leading-tight">
                SE Electronics VIP Membership Card
              </span>
            </div>

            {/* ── Middle: QR + Customer ID / Barcode ───────────────── */}
            <div className="flex-1 flex items-stretch  px-[5%] py-6 gap-[4%]">
              {/* QR Code */}
              <div className="flex flex-col items-center flex-shrink-0 w-[26%] max-w-[90px]">
                <p className="text-white text-[10px] font-semibold text-center leading-[1.15] mb-0.5 sm:mb-1">
                  Scan customer
                  <br />
                  Profile login
                </p>
                <div className="bg-white p-[3px] sm:p-1 rounded-sm w-full aspect-square shadow-lg border sm:border-2 border-blue-500/70">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${baseUrl}/customer/profile`}
                    alt="QR Code — scan to login"
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Customer ID + Barcode */}
              <div className="flex flex-col flex-1 min-w-0 justify-center gap-1 sm:gap-1.5 text-white">
                <p className="font-bold text-[clamp(7px,2vw,14px)] tracking-wide uppercase drop-shadow-md truncate leading-none">
                  Customer ID - {customer.customerId}
                </p>

                {/* Dynamic jsbarcode rendering */}
                <div className="w-full h-12 sm:h-16 rounded-[1px] flex items-center mt-0.5">
                  <svg
                    ref={barcodeRef}
                    className="w-full h-full object-fill sm:object-contain sm:object-left"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hint label ────────────────────────────────────────────── */}
      <p className="mt-2 text-base text-gray-700 font-medium tracking-wider select-none animate-pulse">
        কার্ড উল্টাতে ট্যাপ করুন
      </p>
    </div>
  );
}

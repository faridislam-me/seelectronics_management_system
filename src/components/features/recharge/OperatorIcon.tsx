"use client";

import clsx from "clsx";

/**
 * Brand metadata for the six supported mobile operators.
 * `short` is a compact wordmark shown inside the brand-colored chip.
 * Colors are kept in sync with OPERATOR_COLORS used on the recharge page
 * and in the success popup so the whole flow reads as one system.
 */
export const OPERATOR_META: Record<
  string,
  { short: string; color: string; label: string; labelBn: string }
> = {
  grameenphone: { short: "GP", color: "#00a550", label: "Grameenphone", labelBn: "গ্রামীণফোন" },
  banglalink: { short: "bl", color: "#f7941d", label: "Banglalink", labelBn: "বাংলালিংক" },
  robi: { short: "robi", color: "#e2001a", label: "Robi", labelBn: "রবি" },
  airtel: { short: "air", color: "#e40000", label: "Airtel", labelBn: "এয়ারটেল" },
  teletalk: { short: "TT", color: "#0066b3", label: "Teletalk", labelBn: "টেলিটক" },
  skitto: { short: "sk", color: "#6c5ce7", label: "Skitto", labelBn: "স্কিটো" },
};

export const OPERATOR_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(OPERATOR_META).map(([k, v]) => [k, v.color]),
);

type Props = {
  operatorKey: string;
  /** Chip edge length in px. Defaults to 28. */
  size?: number;
  className?: string;
};

/**
 * A tasteful, brand-colored rounded chip showing the operator's short wordmark.
 * Pure inline rendering — no external logo images are fetched.
 */
export default function OperatorIcon({ operatorKey, size = 28, className }: Props) {
  const meta = OPERATOR_META[operatorKey];
  const bg = meta?.color || "#0b3d91";
  const short = meta?.short || (operatorKey ? operatorKey.charAt(0).toUpperCase() : "?");
  // Scale the wordmark with the chip; shorter labels get a larger glyph.
  const fontSize = Math.round(size * (short.length > 2 ? 0.3 : 0.4));

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-md text-white font-extrabold shrink-0 ring-1 ring-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: bg, fontSize, lineHeight: 1 }}
      aria-label={meta?.label || operatorKey}
    >
      {short}
    </span>
  );
}

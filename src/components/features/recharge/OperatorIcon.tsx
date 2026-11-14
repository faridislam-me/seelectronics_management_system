"use client";

import clsx from "clsx";

/**
 * Brand metadata for the six supported mobile operators.
 * `short` is a compact wordmark shown inside the brand-colored chip; `color`/
 * `color2` give the chip its brand gradient. `logo` is an optional drop-in:
 * set it to an official brand image path (e.g. under /operators) and the chip
 * renders that image instead of the wordmark. We ship no logo images — they are
 * the operators' trademarks — so the branded chip is the default everywhere.
 */
export const OPERATOR_META: Record<
  string,
  { short: string; color: string; color2: string; label: string; labelBn: string; logo?: string }
> = {
  grameenphone: { short: "GP", color: "#00a550", color2: "#00763a", label: "Grameenphone", labelBn: "গ্রামীণফোন", logo: "/operators/grameenphone.jpg" },
  banglalink: { short: "bl", color: "#f7941d", color2: "#e07d08", label: "Banglalink", labelBn: "বাংলালিংক", logo: "/operators/banglalink.jpg" },
  robi: { short: "robi", color: "#e2001a", color2: "#b00014", label: "Robi", labelBn: "রবি", logo: "/operators/robi.jpg" },
  airtel: { short: "air", color: "#e40000", color2: "#b00000", label: "Airtel", labelBn: "এয়ারটেল", logo: "/operators/airtel.jpg" },
  teletalk: { short: "TT", color: "#0066b3", color2: "#004e8a", label: "Teletalk", labelBn: "টেলিটক", logo: "/operators/teletalk.jpg" },
  skitto: { short: "sk", color: "#6c5ce7", color2: "#4b3dc4", label: "Skitto", labelBn: "স্কিটো", logo: "/operators/skitto.jpg" },
};

export const OPERATOR_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(OPERATOR_META).map(([k, v]) => [k, v.color]),
);

type Props = {
  operatorKey: string;
  /** Chip edge length in px. Defaults to 28. */
  size?: number;
  /** Chip shape. Defaults to a rounded square. */
  shape?: "square" | "circle";
  className?: string;
};

/**
 * A tasteful, brand-colored logo chip for an operator. When an official logo
 * image is configured (OPERATOR_META[key].logo) it is shown; otherwise a
 * polished gradient chip with the operator's short wordmark. Fully inline — no
 * external logo images are fetched.
 */
export default function OperatorIcon({ operatorKey, size = 28, shape = "square", className }: Props) {
  const meta = OPERATOR_META[operatorKey];
  const c1 = meta?.color || "#0b3d91";
  const c2 = meta?.color2 || c1;
  const short = meta?.short || (operatorKey ? operatorKey.charAt(0).toUpperCase() : "?");
  // Scale the wordmark with the chip; longer labels get a smaller glyph.
  const fontSize = Math.round(size * (short.length > 2 ? 0.3 : 0.42));
  const radius = shape === "circle" ? 9999 : Math.max(6, Math.round(size * 0.26));

  // Official logo drop-in (when provided). A little inner padding keeps the full
  // logo inside the rounded chip instead of letting it bleed to the edges and
  // look clipped at the corners (client: "আইকন কেটে গেছে — ব্যাকগ্রাউন্ড বড়, আইকন ছোট")।
  if (meta?.logo) {
    const pad = Math.max(2, Math.round(size * 0.14));
    return (
      <span
        className={clsx(
          "inline-flex items-center justify-center bg-white overflow-hidden ring-1 ring-black/5 shadow-[0_1px_2px_rgba(0,0,0,0.12)] shrink-0",
          className,
        )}
        style={{ width: size, height: size, borderRadius: radius, padding: pad }}
        aria-label={meta.label}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meta.logo} alt={meta.label} className="w-full h-full object-contain" />
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "relative inline-flex items-center justify-center text-white font-extrabold shrink-0 overflow-hidden ring-1 ring-black/10 shadow-[0_2px_4px_rgba(0,0,0,0.16)]",
        className,
      )}
      style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(145deg, ${c1}, ${c2})`, fontSize, lineHeight: 1 }}
      aria-label={meta?.label || operatorKey}
    >
      {/* subtle top shine for a glossier, logo-like finish */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/15" />
      <span className="relative tracking-tight">{short}</span>
    </span>
  );
}

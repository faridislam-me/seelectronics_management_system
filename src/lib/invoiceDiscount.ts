/**
 * Manual (admin) invoice discount helpers.
 *
 * The invoices table has no discount column, so a manual discount is stored as:
 *   - `total` reduced by the discount (`subtotal` stays the pre-discount sum), and
 *   - one line appended to `notes`, e.g. "অতিরিক্ত ডিসকাউন্ট: 10% (৳1,250)" or
 *     "অতিরিক্ত ডিসকাউন্ট: ৳500".
 * These helpers build/parse/strip that line. Pure functions (client + server safe).
 */

export type ManualDiscountType = "percent" | "flat";
export interface ManualDiscount {
  type: ManualDiscountType;
  /** Percent (0–100) for "percent", taka for "flat". */
  value: number;
  /** Discount in taka. */
  amount: number;
}

const LABEL = "অতিরিক্ত ডিসকাউন্ট:";
const LINE_RE = /^\s*অতিরিক্ত ডিসকাউন্ট:\s*(?:(\d+(?:\.\d+)?)%\s*\(৳([\d,]+(?:\.\d+)?)\)|৳([\d,]+(?:\.\d+)?))\s*$/m;

const num = (s: string) => Number(s.replace(/,/g, ""));

/** Discount in taka for a given type/value against `base`, clamped to [0, base]. */
export function computeManualDiscount(base: number, type: ManualDiscountType, value: number): number {
  const b = Math.max(0, Number(base) || 0);
  const v = Math.max(0, Number(value) || 0);
  const raw = type === "percent" ? (b * Math.min(v, 100)) / 100 : v;
  return Math.min(b, Math.round(raw));
}

export function formatManualDiscountLine(d: ManualDiscount): string {
  const amt = Math.round(d.amount).toLocaleString("en-US");
  return d.type === "percent" ? `${LABEL} ${Number(d.value)}% (৳${amt})` : `${LABEL} ৳${amt}`;
}

export function parseManualDiscount(notes?: string | null): ManualDiscount | null {
  if (!notes) return null;
  const m = notes.match(LINE_RE);
  if (!m) return null;
  if (m[1] !== undefined) return { type: "percent", value: Number(m[1]), amount: num(m[2]) };
  const amount = num(m[3]);
  return { type: "flat", value: amount, amount };
}

/** Notes without the discount line (what the admin actually typed). */
export function stripManualDiscount(notes?: string | null): string {
  if (!notes) return "";
  return notes
    .split("\n")
    .filter((l) => !LINE_RE.test(l))
    .join("\n")
    .trim();
}

/** Admin notes plus (optionally) the discount line at the end. */
export function withManualDiscount(notes: string | null | undefined, d: ManualDiscount | null): string {
  const base = stripManualDiscount(notes);
  if (!d || d.amount <= 0) return base;
  return [base, formatManualDiscountLine(d)].filter(Boolean).join("\n");
}

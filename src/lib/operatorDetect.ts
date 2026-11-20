/**
 * Pure, client-safe BD operator detection from a mobile number prefix.
 *
 * Kept SEPARATE from successtopup.ts (which reads the reseller API secrets) so
 * it can be imported by client recharge components without bundling any secret.
 *
 * Guards the recharge flow against an operator/number mismatch — e.g. the
 * Grameenphone tab selected but a 019 (Banglalink) number entered, which was
 * going through and deducting money. Prefix isn't 100% authoritative because of
 * MNP (number portability), but it blocks the obvious wrong-operator case.
 *
 * Prefix → operator:
 *   013, 017 → Grameenphone (Skitto is a GP sub-brand on the same range)
 *   014, 019 → Banglalink
 *   015      → Teletalk
 *   016      → Airtel
 *   018      → Robi
 */

export const OPERATOR_PREFIX_MAP: Record<string, string> = {
  "013": "grameenphone",
  "017": "grameenphone",
  "014": "banglalink",
  "019": "banglalink",
  "015": "teletalk",
  "016": "airtel",
  "018": "robi",
};

/** Normalise a raw input to an 11-digit local BD number (01XXXXXXXXX) or null. */
export const normalizeBdNumber = (input: string): string | null => {
  let n = String(input ?? "").replace(/\D/g, "");
  if (n.startsWith("880")) n = n.slice(2); // 8801XXXXXXXXX → 01XXXXXXXXX
  else if (n.startsWith("88") && n.length === 13) n = n.slice(2);
  if (n.length === 10 && n.startsWith("1")) n = "0" + n; // 1XXXXXXXXX → 01XXXXXXXXX
  if (n.length !== 11 || !n.startsWith("01")) return null;
  return n;
};

/** Operator key for a number, or null if the number is invalid / prefix unknown. */
export const detectOperator = (input: string): string | null => {
  const n = normalizeBdNumber(input);
  if (!n) return null;
  return OPERATOR_PREFIX_MAP[n.slice(0, 3)] ?? null;
};

// Skitto rides on Grameenphone's 013/017 range, so the two are interchangeable
// for prefix purposes.
const canonical = (op: string) => (op === "skitto" ? "grameenphone" : op);

/**
 * Does `number` belong to the `selectedOperator`? `ok:false` when the number is
 * invalid or its operator cannot be confirmed (block the purchase in that case).
 */
export const operatorMatchesNumber = (
  selectedOperator: string,
  number: string,
): { ok: boolean; detected: string | null } => {
  const detected = detectOperator(number);
  if (!detected) return { ok: false, detected: null };
  return { ok: canonical(detected) === canonical(selectedOperator), detected };
};

/** Shared Banglish copy for the operator-mismatch popup. */
export const OPERATOR_MISMATCH_MESSAGE =
  "নাম্বারটি নির্বাচিত অপারেটরের সাথে মিলছে না — সঠিক অপারেটর নির্বাচন করুন।";

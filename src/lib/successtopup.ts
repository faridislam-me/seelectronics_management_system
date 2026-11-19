const BASE = "https://api.successtopup.com";

const key = () => process.env.SUCCESSTOPUP_KEY!;
const secret = () => process.env.SUCCESSTOPUP_SECRET!;

const post = async (path: string, body: Record<string, unknown>) => {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, successtopup_key: key(), successtopup_secret: secret() }),
    cache: "no-store",
  });
  return res.json() as Promise<Record<string, any>>;
};

export const OPERATOR_MAP: Record<string, string> = {
  grameenphone: "GP",
  banglalink: "BL",
  robi: "RB",
  airtel: "AT",
  teletalk: "TT",
  skitto: "SK",
};

export const recharge = async (input: {
  number: string;
  operator: string;
  amount: number;
  trxid: string;
  type?: "prepaid" | "postpaid";
  packageId?: string;
}) => {
  const body: Record<string, unknown> = {
    number: input.number,
    operator: OPERATOR_MAP[input.operator] || input.operator,
    amount: input.amount,
    trxid: input.trxid,
    type: input.type || "prepaid",
  };
  if (input.packageId) body.package_id = input.packageId;
  return post("/api/recharge", body);
};

export const checkStatus = async (trxid: string) =>
  post("/api/status", { trxid });

export const getDrives = async (
  operator?: string,
  type?: "regular" | "drive",
) => {
  const body: Record<string, unknown> = {
    operator: operator ? (OPERATOR_MAP[operator] || operator) : "ALL",
  };
  // SuccessTopup's /api/drives accepts an optional `type` (regular | drive) to
  // list the standard operator bundles vs. the special drive offers. Omitting
  // it returns the drive offers (the API default).
  if (type) body.type = type;
  return post("/api/drives", body);
};

export const getBalance = async () => post("/api/balance", {});

/* ──────────────────────── Reseller balance guard ────────────────────────
 * When OUR reseller account at SuccessTopup runs out of money, a recharge / pack
 * purchase cannot be fulfilled. We surface that to the UI as a distinct,
 * structured result (API_BALANCE_EMPTY) so both the customer and staff recharge
 * screens can show a popup — not a tiny toast — and the admin gets an SMS to
 * refill the API balance. Two detection paths are used together:
 *   1. a PRE-CHECK via /api/balance before attempting the recharge, and
 *   2. matching the provider's own insufficient-balance error AFTER the attempt.
 */

/** Structured code returned by the recharge actions when OUR API balance is empty. */
export const API_BALANCE_EMPTY = "API_BALANCE_EMPTY" as const;

/** Banglish popup message shown to the customer / staff when the API balance is empty. */
export const API_BALANCE_EMPTY_MESSAGE =
  "এই মুহূর্তে সেবাটি সাময়িকভাবে বন্ধ আছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।";

/** Which reseller pool funds a given recharge: drive packs/offers draw from the
 * provider's drive balance, everything else from the main balance. */
export type ResellerPool = "main" | "drive";

/**
 * PRE-CHECK: is OUR reseller balance enough to fulfil `amountNeeded` from `pool`?
 * Returns `null` when the balance could not be determined (API down / malformed
 * response) so the caller does NOT block the purchase on an inconclusive check —
 * the post-attempt error match (isResellerBalanceError) is the backstop.
 */
export const checkResellerBalance = async (
  amountNeeded: number,
  pool: ResellerPool = "main",
): Promise<{ ok: boolean; available: number; pool: ResellerPool } | null> => {
  try {
    const res = await getBalance();
    if (!res?.result) return null;
    const available = Number(pool === "drive" ? res.driveBalance : res.balance) || 0;
    return { ok: available >= amountNeeded, available, pool };
  } catch (error) {
    console.error("checkResellerBalance error:", error);
    return null;
  }
};

/**
 * POST-ATTEMPT: did a failed recharge response fail because OUR reseller balance
 * was insufficient? The provider has no knowledge of the customer's wallet, so a
 * balance/insufficient-fund phrase in its error refers to the reseller account.
 * (Deliberately does NOT match provider errors like "Package not found",
 * "Invalid number" or "This amount is not allowed for this operator".)
 */
export const isResellerBalanceError = (apiRes: Record<string, any> | null | undefined): boolean => {
  if (!apiRes || apiRes.result === true) return false;
  const msg = String(apiRes.message ?? "").toLowerCase();
  return /balance|insufficient|not enough|low fund|insufficient fund|ব্যালেন্স|অপর্যাপ্ত/.test(msg);
};

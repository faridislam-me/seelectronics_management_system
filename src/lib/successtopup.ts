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

export const getDrives = async (operator?: string) =>
  post("/api/drives", {
    operator: operator ? (OPERATOR_MAP[operator] || operator) : "ALL",
  });

export const getBalance = async () => post("/api/balance", {});

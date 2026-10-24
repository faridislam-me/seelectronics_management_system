import "server-only";

export class SMSError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SMSError";
  }
}

/** Records the outcome of a real SMS / voice attempt so failures are visible in the DB (never throws). */
export async function logDelivery(entry: { phoneNumber: string; message: string; status: "sent" | "failed"; error?: string | null; carrier: "sms" | "voice" }) {
  try {
    const { db } = await import("@/db/drizzle");
    const { smsLogs } = await import("@/db/schema");
    await db.insert(smsLogs).values({ phoneNumber: entry.phoneNumber, message: entry.message, status: entry.status, error: entry.error ?? null, carrier: entry.carrier });
  } catch (e) {
    console.error("logDelivery failed:", e);
  }
}

export const sendSMS = async (phoneNumber: string, message: string) => {
  try {
    const shouldSendRealSMS =
      process.env.NODE_ENV === "production" ||
      process.env.SMS_SEND_IN_DEV === "true";

    if (
      shouldSendRealSMS &&
      process.env.SMS_API_BASE_ENDPOINT &&
      process.env.SMS_API_KEY
    ) {
      const params = new URLSearchParams();
      params.append("api_key", process.env.SMS_API_KEY!);
      params.append("senderid", process.env.SMS_SENDER_ID || "");
      params.append("number", phoneNumber);
      params.append("message", message);

      const res = await fetch(process.env.SMS_API_BASE_ENDPOINT + "/smsapi", {
        method: "POST",
        body: params,
      });
      const jsonRes = await res.json();
      if (jsonRes.response_code != 202) {
        const errMsg = jsonRes.error_message || JSON.stringify(jsonRes);
        await logDelivery({ phoneNumber, message, status: "failed", error: errMsg, carrier: "sms" });
        throw new SMSError("SMS Service Error - " + errMsg);
      }
      await logDelivery({ phoneNumber, message, status: "sent", carrier: "sms" });
      return jsonRes;
    } else {
      // Development: log to console (set SMS_SEND_IN_DEV=true in .env to send real SMS)
      console.log(`
[SMS Service] ${shouldSendRealSMS ? "(would send but missing SMS_API_BASE_ENDPOINT or SMS_API_KEY)" : "(dev mode - set SMS_SEND_IN_DEV=true to send real SMS)"}
Phone: ${phoneNumber}
Message: ${message}
`);
  return { mocked: true };
    }
  } catch (error) {
    console.error(error);
    if (!(error instanceof SMSError)) {
      await logDelivery({ phoneNumber, message, status: "failed", error: error instanceof Error ? error.message : String(error), carrier: "sms" });
    }
    throw error;
  }
};

export const getSMSBalance = async (): Promise<number | null> => {
  try {
    const endpoint = process.env.SMS_API_BASE_ENDPOINT;
    const apiKey = process.env.SMS_API_KEY;
    if (!endpoint || !apiKey) {
      return null;
    }
    const res = await fetch(endpoint + "/getBalanceApi?api_key=" + apiKey);
    const jsonRes = await res.json();
    if (jsonRes.response_code === 1005) {
      throw new SMSError("[SMS Service Error]:" + jsonRes.error_message);
    }
    return jsonRes.balance;
  } catch (error) {
    // Silently return null on network/API errors - don't crash the layout
    return null;
  }
};

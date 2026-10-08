import "server-only";

export class MRAMError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MRAMError";
  }
}

export const sendVoiceCall = async (
  phoneNumbers: string | string[],
  broadcastId: number,
  title: string = "Automated Voice Broadcast",
) => {
  try {
    const shouldSendRealCall =
      process.env.NODE_ENV === "production" ||
      process.env.MRAM_VOICE_SEND_IN_DEV === "true";

    const formatPhoneNumber = (phone: string): string => {
      let cleanPhone = phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("880") && cleanPhone.length >= 13) {
        return cleanPhone;
      }
      if (cleanPhone.startsWith("0") && cleanPhone.length === 11) {
        return "88" + cleanPhone;
      }
      if (cleanPhone.startsWith("1") && cleanPhone.length === 10) {
        return "880" + cleanPhone;
      }
      return cleanPhone;
    };

    const rawNumbers = Array.isArray(phoneNumbers)
      ? phoneNumbers
      : [phoneNumbers];
    const formatted = Array.from(new Set(rawNumbers.map(formatPhoneNumber))).filter(
      (number) => number.length > 0,
    );
    // MRAM rejects the whole request if one number is not 8801XXXXXXXXX, so drop bad ones and report them.
    const numbers = formatted.filter((number) => /^8801[0-9]{9}$/.test(number));
    const skipped = formatted.length - numbers.length;

    if (!numbers.length) {
      return { success: false, error: "No valid phone numbers found", skipped };
    }

    if (
      shouldSendRealCall &&
      process.env.MRAM_VOICE_API_BASE_URL &&
      process.env.MRAM_VOICE_API_KEY &&
      process.env.MRAM_VOICE_SENDER_ID
    ) {
      const payload = {
        title: `${title} ${Date.now()}`.replace(/[^a-zA-Z0-9\s]/g, ""),
        broadcast_id: broadcastId,
        sender: process.env.MRAM_VOICE_SENDER_ID,
        numbers: numbers,
      };

      const res = await fetch(
        `${process.env.MRAM_VOICE_API_BASE_URL}/api/send-broadcast-campaign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MRAM_VOICE_API_KEY}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const jsonRes = await res.json();

      if (!res.ok) {
        const errMsg = jsonRes.message || JSON.stringify(jsonRes);
        console.error("MRAM API Error:", errMsg);
        // We log the error but don't throw it so it doesn't break the main flow.
        return { success: false, error: errMsg };
      }
      return { success: true, data: jsonRes, skipped };
    } else {
      // Development logging
      console.log(`
[MRAM Voice Service] ${
        shouldSendRealCall
          ? "(would send but missing ENV vars)"
          : "(dev mode - set MRAM_VOICE_SEND_IN_DEV=true)"
      }
Numbers: ${numbers.join(", ")}
Broadcast ID: ${broadcastId}
Title: ${title}
`);
      return { success: true, mocked: true, data: { status: "dev_mode_mock" }, skipped };
    }
  } catch (error) {
    console.error("MRAM Service Exception:", error);
    // Return gracefully to prevent disrupting core operations
    return { success: false, error: "MRAM Service failed" };
  }
};

export const getMramBroadcastIds = () => {
  try {
    let rawIds = process.env.MRAM_VOICE_BROADCAST_ID;
    if (!rawIds) return null;

    // Strip surrounding single quotes if present (e.g. from Vercel env configs)
    if (rawIds.startsWith("'") && rawIds.endsWith("'")) {
      rawIds = rawIds.slice(1, -1);
    }

    return JSON.parse(rawIds) as Record<string, number>;
  } catch (error) {
    console.error("Failed to parse MRAM_VOICE_BROADCAST_ID", error);
    return null;
  }
};

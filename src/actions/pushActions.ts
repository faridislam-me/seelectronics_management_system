"use server";

import { db } from "@/db/drizzle";
import { devicePushTokens } from "@/db/schema";
import { verifySession } from "@/lib";

/** The mobile apps hand over their FCM token; it is tied to whoever is logged in on that page. */
export async function registerPushToken(token: string, platform: string = "android") {
  try {
    if (typeof token !== "string" || token.length < 20 || token.length > 4096) return { success: false };
    const session = await verifySession(false);
    const role = session?.role as string | undefined;
    if (!session?.userId || (role !== "customer" && role !== "staff" && role !== "seller")) return { success: false };

    await db
      .insert(devicePushTokens)
      .values({ token, role, userId: session.userId as string, platform: platform === "ios" ? "ios" : "android" })
      .onConflictDoUpdate({
        target: devicePushTokens.token,
        set: { role, userId: session.userId as string, lastSeenAt: new Date() },
      });
    return { success: true };
  } catch (error) {
    console.error("registerPushToken failed:", error);
    return { success: false };
  }
}

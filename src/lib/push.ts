import "server-only";
import { db } from "@/db/drizzle";
import { devicePushTokens } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { createSign } from "crypto";

/**
 * Firebase Cloud Messaging (HTTP v1) without extra dependencies.
 * Needs the env var FCM_SERVICE_ACCOUNT_JSON (the Firebase service-account key JSON).
 * Without it every call is a silent no-op, so nothing else in the app is affected.
 */
type ServiceAccount = { project_id: string; client_email: string; private_key: string };

let cachedAccount: ServiceAccount | null | undefined;
let cachedToken: { value: string; expiresAt: number } | null = null;

const account = (): ServiceAccount | null => {
  if (cachedAccount !== undefined) return cachedAccount;
  try {
    const raw = process.env.FCM_SERVICE_ACCOUNT_JSON;
    cachedAccount = raw ? (JSON.parse(raw) as ServiceAccount) : null;
    if (cachedAccount) cachedAccount.private_key = cachedAccount.private_key.replace(/\\n/g, "\n");
  } catch (e) {
    console.error("FCM_SERVICE_ACCOUNT_JSON is not valid JSON");
    cachedAccount = null;
  }
  return cachedAccount;
};

const b64url = (input: Buffer | string) => Buffer.from(input).toString("base64url");

async function accessToken(acc: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: acc.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claim}`).sign(acc.private_key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claim}.${signature}` }),
  });
  if (!res.ok) throw new Error(`FCM token request failed: ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

export type PushRole = "customer" | "staff" | "seller";

async function sendToTokens(acc: ServiceAccount, tokens: string[], msg: { title: string; body: string; link?: string }) {
  if (!tokens.length) return;
  const bearer = await accessToken(acc);
  const dead: string[] = [];
  const send = async (token: string) => {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          data: { link: msg.link || "" },
          android: { priority: "HIGH", notification: { sound: "default" } },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 404 || /UNREGISTERED|not a valid FCM registration token/i.test(text)) dead.push(token);
      else console.error("FCM send failed:", res.status, text.slice(0, 200));
    }
  };
  // modest parallelism so a notice to hundreds of devices does not open hundreds of sockets at once
  for (let i = 0; i < tokens.length; i += 20) await Promise.all(tokens.slice(i, i + 20).map(send));
  if (dead.length) await db.delete(devicePushTokens).where(inArray(devicePushTokens.token, dead));
}

/** Sends a push to every device of one user. Never throws. */
export async function pushToUser(role: PushRole, userId: string, msg: { title: string; body: string; link?: string }) {
  try {
    const acc = account();
    if (!acc || !userId) return;
    const rows = await db
      .select({ token: devicePushTokens.token })
      .from(devicePushTokens)
      .where(and(eq(devicePushTokens.role, role), eq(devicePushTokens.userId, userId)));
    await sendToTokens(acc, rows.map((r) => r.token), msg);
  } catch (error) {
    console.error("pushToUser failed:", error);
  }
}

/** Same for many users at once (one token lookup). Never throws. */
export async function pushToUsers(role: PushRole, userIds: string[], msg: { title: string; body: string; link?: string }) {
  try {
    const acc = account();
    if (!acc || !userIds.length) return;
    const tokens: string[] = [];
    for (let i = 0; i < userIds.length; i += 500) {
      const rows = await db
        .select({ token: devicePushTokens.token })
        .from(devicePushTokens)
        .where(and(eq(devicePushTokens.role, role), inArray(devicePushTokens.userId, userIds.slice(i, i + 500))));
      tokens.push(...rows.map((r) => r.token));
    }
    await sendToTokens(acc, tokens, msg);
  } catch (error) {
    console.error("pushToUsers failed:", error);
  }
}

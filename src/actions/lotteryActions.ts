"use server";

import { db } from "@/db/drizzle";
import { lotteryCards, lotteryEntries } from "@/db/schema";
import { verifySession } from "@/lib";
import { sendSMS } from "@/lib/sms";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

// Human-friendly code: 8 chars, no ambiguous glyphs (no 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randCode = (len = 8) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

/** Admin: generate a batch of unique scratch-card codes (to print on cards). */
export async function generateLotteryCards(count: number, batchLabel = "") {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const n = Math.max(1, Math.min(5000, Math.floor(Number(count) || 0)));

  const existing = new Set(
    (await db.select({ code: lotteryCards.code }).from(lotteryCards)).map((r) => r.code),
  );
  const codes: string[] = [];
  const seen = new Set<string>();
  let guard = 0;
  while (codes.length < n && guard < n * 50 + 100) {
    guard++;
    const c = randCode();
    if (existing.has(c) || seen.has(c)) continue;
    seen.add(c);
    codes.push(c);
  }
  if (!codes.length) return { success: false as const, message: "কোড তৈরি করা যায়নি" };

  await db.insert(lotteryCards).values(
    codes.map((code) => ({ code, batchLabel: batchLabel.trim().slice(0, 120) })),
  );
  revalidatePath("/lottery");
  return { success: true as const, codes, count: codes.length };
}

/** Admin: list generated cards (newest first). */
export async function getLotteryCards() {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const rows = await db
    .select()
    .from(lotteryCards)
    .orderBy(desc(lotteryCards.createdAt))
    .limit(3000);
  return { success: true as const, data: rows };
}

/**
 * PUBLIC (no auth) — a customer submits their scratch-card entry from the QR
 * link form. The card code must be a generated, unused one; the card is marked
 * used atomically so the same card can't be submitted twice.
 */
export async function submitLotteryEntry(input: {
  cardCode: string;
  name: string;
  phone: string;
  address: string;
}) {
  try {
    const cardCode = (input.cardCode || "").trim().toUpperCase();
    const name = (input.name || "").trim();
    const phone = (input.phone || "").trim();
    const address = (input.address || "").trim();

    if (!cardCode) return { success: false as const, message: "কার্ড নম্বর দিন" };
    if (!name) return { success: false as const, message: "আপনার নাম দিন" };
    if (!/^01\d{9}$/.test(phone))
      return { success: false as const, message: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" };
    if (!address) return { success: false as const, message: "আপনার ঠিকানা দিন" };

    const [card] = await db
      .select()
      .from(lotteryCards)
      .where(eq(lotteryCards.code, cardCode))
      .limit(1);
    if (!card) return { success: false as const, message: "এই কার্ড নম্বরটি সঠিক নয়" };
    if (card.used)
      return { success: false as const, message: "এই কার্ড নম্বরটি আগে ব্যবহার করা হয়েছে" };

    // Guarded mark-used (prevents a double submit racing on the same card).
    const claimed = await db
      .update(lotteryCards)
      .set({ used: true })
      .where(and(eq(lotteryCards.code, cardCode), eq(lotteryCards.used, false)))
      .returning({ id: lotteryCards.id });
    if (!claimed.length)
      return { success: false as const, message: "এই কার্ড নম্বরটি আগে ব্যবহার করা হয়েছে" };

    await db.insert(lotteryEntries).values({ cardCode, name, phone, address });
    revalidatePath("/lottery");
    return {
      success: true as const,
      message: "আপনার এন্ট্রি সফলভাবে জমা হয়েছে! ড্র শেষে বিজয়ীদের SMS-এ জানানো হবে।",
    };
  } catch (error) {
    console.error("submitLotteryEntry error:", error);
    return { success: false as const, message: "জমা দেওয়া যায়নি, আবার চেষ্টা করুন" };
  }
}

/** Admin: all submissions (newest first). */
export async function getLotteryEntries() {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const rows = await db
    .select()
    .from(lotteryEntries)
    .orderBy(desc(lotteryEntries.createdAt))
    .limit(5000);
  return { success: true as const, data: rows };
}

/** Admin: winners so far, ordered by rank. */
export async function getLotteryWinners() {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const rows = await db
    .select()
    .from(lotteryEntries)
    .where(isNotNull(lotteryEntries.rank))
    .orderBy(lotteryEntries.rank, desc(lotteryEntries.drawnAt))
    .limit(1000);
  return { success: true as const, data: rows };
}

/**
 * Admin: run a random draw. Picks `count` distinct entries that are not already
 * winners, assigns them the next sequential ranks, and SMSes each winner.
 */
export async function drawLotteryWinners(count: number) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const n = Math.max(1, Math.min(100, Math.floor(Number(count) || 0)));

  const current = await db
    .select({ id: lotteryEntries.id })
    .from(lotteryEntries)
    .where(isNotNull(lotteryEntries.rank));
  const startRank = current.length;

  const eligible = await db
    .select()
    .from(lotteryEntries)
    .where(isNull(lotteryEntries.rank))
    .orderBy(sql`random()`)
    .limit(n);
  if (!eligible.length)
    return { success: false as const, message: "ড্র করার মতো নতুন কোনো এন্ট্রি নেই" };

  const now = new Date();
  const winners: { id: string; name: string; phone: string; cardCode: string; rank: number }[] = [];
  for (let i = 0; i < eligible.length; i++) {
    const rank = startRank + i + 1;
    await db
      .update(lotteryEntries)
      .set({ rank, drawnAt: now })
      .where(eq(lotteryEntries.id, eligible[i].id));
    winners.push({
      id: eligible[i].id,
      name: eligible[i].name,
      phone: eligible[i].phone,
      cardCode: eligible[i].cardCode,
      rank,
    });
  }

  await Promise.all(
    winners.map((w) =>
      sendSMS(
        w.phone,
        `অভিনন্দন ${w.name}! SE Electronics লটারিতে আপনি ${w.rank} নম্বর বিজয়ী হয়েছেন। পুরস্কার সংগ্রহের জন্য যোগাযোগ করুন। (কার্ডঃ ${w.cardCode})`,
      ).catch(() => {}),
    ),
  );

  revalidatePath("/lottery");
  return {
    success: true as const,
    winners,
    message: `${winners.length} জন বিজয়ী নির্বাচিত ও SMS পাঠানো হয়েছে`,
  };
}

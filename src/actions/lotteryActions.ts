"use server";

import { db } from "@/db/drizzle";
import { lotteryCampaigns, lotteryCards, lotteryEntries } from "@/db/schema";
import { verifySession } from "@/lib";
import { compressImage } from "@/lib/sharp";
import { deleteObject, getObjectUrl, putObject } from "@/lib/s3";
import { sendSMS } from "@/lib/sms";
import { getBaseUrl } from "@/utils";
import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";

/** Best-effort signed-URL resolution for an optional object key. */
async function signKey(key: string | null | undefined) {
  if (!key) return null;
  try {
    return await getObjectUrl(key);
  } catch {
    return null;
  }
}

/**
 * In-place Fisher-Yates shuffle using crypto.randomInt for an unbiased, truly
 * random order (Math.random fallback if the CSPRNG is unavailable). Used by the
 * draw so winners are never tied to DB/submission order.
 */
function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    let j: number;
    try {
      j = randomInt(0, i + 1);
    } catch {
      j = Math.floor(Math.random() * (i + 1));
    }
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const requireAdmin = async () => {
  const s = await verifySession(false, "admin");
  return s ? { userId: s.userId as string } : null;
};

// Human-friendly code: 8 chars, no ambiguous glyphs (no 0/O/1/I).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randCode = (len = 8) =>
  Array.from({ length: len }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join("");

/**
 * Internal: the currently active campaign (the round now accepting entries and
 * draws). If none exists yet, one is created on the fly so the lottery always
 * has a campaign to attach entries to.
 */
async function ensureActiveCampaign() {
  const [active] = await db
    .select()
    .from(lotteryCampaigns)
    .where(eq(lotteryCampaigns.status, "active"))
    .orderBy(desc(lotteryCampaigns.createdAt))
    .limit(1);
  if (active) return active;

  const total = await db.select({ id: lotteryCampaigns.id }).from(lotteryCampaigns);
  const [created] = await db
    .insert(lotteryCampaigns)
    .values({ name: `ক্যাম্পেইন ${total.length + 1}`, status: "active" })
    .returning();
  return created;
}

/** Admin: all campaigns (newest first) with entry/winner counts. */
export async function getCampaigns() {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };

  // Make sure there is always at least one campaign to show.
  await ensureActiveCampaign();

  const camps = await db
    .select()
    .from(lotteryCampaigns)
    .orderBy(desc(lotteryCampaigns.createdAt))
    .limit(500);

  const counts = await db
    .select({
      campaignId: lotteryEntries.campaignId,
      entries: sql<number>`count(*)`,
      winners: sql<number>`count(*) filter (where ${lotteryEntries.rank} is not null)`,
    })
    .from(lotteryEntries)
    .groupBy(lotteryEntries.campaignId);
  const map = new Map(counts.map((c) => [c.campaignId, c]));

  const data = camps.map((c) => ({
    ...c,
    entries: Number(map.get(c.id)?.entries ?? 0),
    winners: Number(map.get(c.id)?.winners ?? 0),
  }));
  return { success: true as const, data };
}

/**
 * Admin: end the current active campaign and start a fresh one. Unused cards
 * carry over automatically (they stay unused), so the same printed cards/QR can
 * be used again in this new round — with its own entries and its own draw.
 */
export async function startNewCampaign(name = "") {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };

  await db
    .update(lotteryCampaigns)
    .set({ status: "ended", endedAt: new Date() })
    .where(eq(lotteryCampaigns.status, "active"));

  const total = await db.select({ id: lotteryCampaigns.id }).from(lotteryCampaigns);
  const [created] = await db
    .insert(lotteryCampaigns)
    .values({
      name: name.trim().slice(0, 120) || `ক্যাম্পেইন ${total.length + 1}`,
      status: "active",
    })
    .returning();

  revalidatePath("/lottery");
  return { success: true as const, campaign: created };
}

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
 * used atomically so the same card can't be submitted twice. The entry is
 * attached to the currently active campaign.
 */
export async function submitLotteryEntry(formData: FormData) {
  try {
    const cardCode = String(formData.get("cardCode") || "").trim().toUpperCase();
    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const customerId = String(formData.get("customerId") || "").trim() || null;
    const photo = formData.get("photo") as File | null;

    if (!cardCode) return { success: false as const, message: "লটারি নাম্বার দিন" };
    if (!name) return { success: false as const, message: "আপনার নাম দিন" };
    if (!/^01\d{9}$/.test(phone))
      return { success: false as const, message: "সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)" };
    if (!address) return { success: false as const, message: "আপনার ঠিকানা দিন" };

    const [card] = await db
      .select()
      .from(lotteryCards)
      .where(eq(lotteryCards.code, cardCode))
      .limit(1);
    if (!card) return { success: false as const, message: "এই লটারি নাম্বারটি সঠিক নয়" };
    if (card.used)
      return { success: false as const, message: "এই লটারি নাম্বারটি আগে ব্যবহার করা হয়েছে" };

    const campaign = await ensureActiveCampaign();

    // Guarded mark-used (prevents a double submit racing on the same card).
    const claimed = await db
      .update(lotteryCards)
      .set({ used: true })
      .where(and(eq(lotteryCards.code, cardCode), eq(lotteryCards.used, false)))
      .returning({ id: lotteryCards.id });
    if (!claimed.length)
      return { success: false as const, message: "এই লটারি নাম্বারটি আগে ব্যবহার করা হয়েছে" };

    // Optional entrant photo → compress & store the object key (same pattern as
    // installment applicant photos). Non-fatal: a failed upload still records
    // the entry, so a customer is never blocked by a camera/upload hiccup.
    let photoKey: string | null = null;
    if (photo && photo.size > 0) {
      try {
        const buf = await compressImage(Buffer.from(await photo.arrayBuffer()), "portrait");
        const key = `lottery-entries/${campaign.id}/${cardCode}-${Date.now()}.webp`;
        await putObject({ Key: key, Body: buf, ContentType: "image/webp" });
        photoKey = key;
      } catch (e) {
        console.error("lottery entry photo upload failed:", e);
      }
    }

    await db
      .insert(lotteryEntries)
      .values({ cardCode, name, phone, address, customerId, photoKey, campaignId: campaign.id });
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

/**
 * PUBLIC (no auth) — display data for the active campaign's branded entry page.
 * Returns the campaign meta plus resolved signed banner URLs. Never creates a
 * campaign (read-only), so a public visit never mutates data.
 */
export async function getPublicCampaign() {
  try {
    const [c] = await db
      .select()
      .from(lotteryCampaigns)
      .where(eq(lotteryCampaigns.status, "active"))
      .orderBy(desc(lotteryCampaigns.createdAt))
      .limit(1);
    if (!c) return { success: true as const, data: null };

    const [topBannerUrl, bannerUrls, prizeFirstImageUrl, prizeSecondImageUrl, prizeThirdImageUrl] =
      await Promise.all([
        signKey(c.topBannerKey),
        Promise.all((c.bannerKeys ?? []).map((k) => signKey(k))),
        signKey(c.prizeFirstImageKey),
        signKey(c.prizeSecondImageKey),
        signKey(c.prizeThirdImageKey),
      ]);

    return {
      success: true as const,
      data: {
        id: c.id,
        name: c.name,
        drawDate: c.drawDate,
        shopAddress: c.shopAddress,
        shopMobile: c.shopMobile,
        prizeFirst: c.prizeFirst,
        prizeSecond: c.prizeSecond,
        prizeThird: c.prizeThird,
        prizeFirstImageUrl,
        prizeSecondImageUrl,
        prizeThirdImageUrl,
        topBannerUrl,
        banners: bannerUrls.filter((u): u is string => Boolean(u)),
      },
    };
  } catch (error) {
    console.error("getPublicCampaign error:", error);
    return { success: false as const, message: "লোড করা যায়নি" };
  }
}

/**
 * PUBLIC (no auth) — winners for a campaign (default = the active campaign), for
 * the celebratory public winners page. Read-only; resolves each entrant photo to
 * a usable URL the same way getPublicCampaign resolves image keys (signKey).
 */
export async function getPublicWinners(campaignId?: string) {
  try {
    let cid = campaignId;
    let campaignName = "";
    let shopMobile: string | null = null;

    if (!cid) {
      const [c] = await db
        .select({
          id: lotteryCampaigns.id,
          name: lotteryCampaigns.name,
          shopMobile: lotteryCampaigns.shopMobile,
        })
        .from(lotteryCampaigns)
        .where(eq(lotteryCampaigns.status, "active"))
        .orderBy(desc(lotteryCampaigns.createdAt))
        .limit(1);
      if (!c) return { success: true as const, data: null };
      cid = c.id;
      campaignName = c.name;
      shopMobile = c.shopMobile;
    } else {
      const [c] = await db
        .select({ name: lotteryCampaigns.name, shopMobile: lotteryCampaigns.shopMobile })
        .from(lotteryCampaigns)
        .where(eq(lotteryCampaigns.id, cid))
        .limit(1);
      if (!c) return { success: true as const, data: null };
      campaignName = c.name;
      shopMobile = c.shopMobile;
    }

    const rows = await db
      .select()
      .from(lotteryEntries)
      .where(and(eq(lotteryEntries.campaignId, cid), isNotNull(lotteryEntries.rank)))
      .orderBy(lotteryEntries.rank, desc(lotteryEntries.drawnAt))
      .limit(1000);

    const winners = await Promise.all(
      rows.map(async (r) => ({
        id: r.id,
        rank: r.rank as number,
        name: r.name,
        address: r.address,
        photoUrl: await signKey(r.photoKey),
      })),
    );

    return {
      success: true as const,
      data: {
        campaignId: cid,
        campaignName,
        shopMobile: shopMobile || "09649355555",
        winners,
      },
    };
  } catch (error) {
    console.error("getPublicWinners error:", error);
    return { success: false as const, message: "লোড করা যায়নি" };
  }
}

/**
 * Resolve which campaign to operate on: the one passed in, or the active one.
 */
async function resolveCampaignId(campaignId?: string) {
  if (campaignId) return campaignId;
  return (await ensureActiveCampaign()).id;
}

/** Admin: submissions for a campaign (defaults to the active one), newest first. */
export async function getLotteryEntries(campaignId?: string) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const cid = await resolveCampaignId(campaignId);
  const rows = await db
    .select()
    .from(lotteryEntries)
    .where(eq(lotteryEntries.campaignId, cid))
    .orderBy(desc(lotteryEntries.createdAt))
    .limit(5000);
  const data = await Promise.all(
    rows.map(async (r) => ({ ...r, photoUrl: await signKey(r.photoKey) })),
  );
  return { success: true as const, data, campaignId: cid };
}

/**
 * Admin: delete a single entry (e.g. a test submission before the real draw).
 * Removes the entry, frees its card back to "unused" so the lottery number
 * returns to the pool and the used/remaining counts correct themselves, and
 * best-effort deletes the entrant photo. Works on winner entries too (deleting
 * one also removes that winner).
 */
export async function deleteLotteryEntry(entryId: string) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  try {
    const id = String(entryId || "").trim();
    if (!id) return { success: false as const, message: "এন্ট্রি পাওয়া যায়নি" };
    const [entry] = await db
      .select({ cardCode: lotteryEntries.cardCode, photoKey: lotteryEntries.photoKey })
      .from(lotteryEntries)
      .where(eq(lotteryEntries.id, id))
      .limit(1);
    if (!entry) return { success: false as const, message: "এন্ট্রি পাওয়া যায়নি" };

    await db.delete(lotteryEntries).where(eq(lotteryEntries.id, id));
    // Free the used card so its number returns to the unused pool and the
    // used/remaining counts correct themselves.
    if (entry.cardCode) {
      await db
        .update(lotteryCards)
        .set({ used: false })
        .where(eq(lotteryCards.code, entry.cardCode));
    }
    // Best-effort: remove the entrant photo object (never block on storage).
    if (entry.photoKey) await deleteObject({ Key: entry.photoKey }).catch(() => {});

    revalidatePath("/lottery-manage");
    return { success: true as const, message: "এন্ট্রি মুছে ফেলা হয়েছে — নাম্বারটি আবার অব্যবহৃত" };
  } catch (error) {
    console.error("deleteLotteryEntry error:", error);
    return { success: false as const, message: "মুছে ফেলা যায়নি" };
  }
}

/** Admin: winners for a campaign (defaults to the active one), ordered by rank. */
export async function getLotteryWinners(campaignId?: string) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const cid = await resolveCampaignId(campaignId);
  const rows = await db
    .select()
    .from(lotteryEntries)
    .where(and(eq(lotteryEntries.campaignId, cid), isNotNull(lotteryEntries.rank)))
    .orderBy(lotteryEntries.rank, desc(lotteryEntries.drawnAt))
    .limit(1000);
  const data = await Promise.all(
    rows.map(async (r) => ({ ...r, photoUrl: await signKey(r.photoKey) })),
  );
  return { success: true as const, data, campaignId: cid };
}

/**
 * Admin: run a random draw within a campaign (defaults to the active one). Picks
 * `count` distinct entries from that campaign that are not already winners,
 * assigns them the next sequential ranks within the campaign, and SMSes each.
 */
export async function drawLotteryWinners(count: number, campaignId?: string) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const n = Math.max(1, Math.min(100, Math.floor(Number(count) || 0)));
  const cid = await resolveCampaignId(campaignId);

  const current = await db
    .select({ id: lotteryEntries.id })
    .from(lotteryEntries)
    .where(and(eq(lotteryEntries.campaignId, cid), isNotNull(lotteryEntries.rank)));
  const startRank = current.length;

  // Truly-random draw: fetch ALL un-ranked entries for this campaign, shuffle
  // them in JS with a crypto Fisher-Yates (never trust DB/insert ordering), then
  // take the first `n`. This guarantees a fresh random set on every draw.
  const pool = await db
    .select()
    .from(lotteryEntries)
    .where(and(eq(lotteryEntries.campaignId, cid), isNull(lotteryEntries.rank)));
  if (!pool.length)
    return { success: false as const, message: "এই ক্যাম্পেইনে ড্র করার মতো নতুন কোনো এন্ট্রি নেই" };
  const eligible = shuffleInPlace([...pool]).slice(0, n);

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

  // Contact phone for the SMS: the campaign's own shop mobile if set, else the
  // business default. The link points at the public celebratory winners page.
  const [camp] = await db
    .select({ shopMobile: lotteryCampaigns.shopMobile })
    .from(lotteryCampaigns)
    .where(eq(lotteryCampaigns.id, cid))
    .limit(1);
  const contactPhone = camp?.shopMobile?.trim() || "09649355555";
  const winnersUrl = `${getBaseUrl()}/lottery/winners`;

  await Promise.all(
    winners.map((w) =>
      sendSMS(
        w.phone,
        `অভিনন্দন ${w.name}! SE Electronics লটারিতে আপনি ${w.rank} নম্বর বিজয়ী হয়েছেন 🎉 বিজয়ীদের তালিকা দেখুন: ${winnersUrl} | যোগাযোগ: ${contactPhone} (SE Electronics)`,
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

/**
 * Admin: full media/meta for one campaign for the editor UI — the raw meta
 * fields plus resolved signed banner URLs (paired with their keys so the admin
 * can remove individual slider images).
 */
export async function getCampaignMedia(campaignId?: string) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  const cid = await resolveCampaignId(campaignId);
  const [c] = await db
    .select()
    .from(lotteryCampaigns)
    .where(eq(lotteryCampaigns.id, cid))
    .limit(1);
  if (!c) return { success: false as const, message: "ক্যাম্পেইন পাওয়া যায়নি" };

  const [topBannerUrl, banners, prizeFirstImageUrl, prizeSecondImageUrl, prizeThirdImageUrl] =
    await Promise.all([
      signKey(c.topBannerKey),
      Promise.all(
        (c.bannerKeys ?? []).map(async (k) => ({ key: k, url: await signKey(k) })),
      ),
      signKey(c.prizeFirstImageKey),
      signKey(c.prizeSecondImageKey),
      signKey(c.prizeThirdImageKey),
    ]);

  return {
    success: true as const,
    data: {
      id: c.id,
      name: c.name,
      drawDate: c.drawDate,
      shopAddress: c.shopAddress,
      shopMobile: c.shopMobile,
      prizeFirst: c.prizeFirst,
      prizeSecond: c.prizeSecond,
      prizeThird: c.prizeThird,
      prizeFirstImageUrl,
      prizeSecondImageUrl,
      prizeThirdImageUrl,
      topBannerUrl,
      banners,
    },
  };
}

/** Admin: update a campaign's text meta (name, draw date, address, mobile, prizes). */
export async function updateCampaignMeta(
  campaignId: string,
  input: {
    name?: string;
    drawDate?: string | null;
    shopAddress?: string | null;
    shopMobile?: string | null;
    prizeFirst?: string | null;
    prizeSecond?: string | null;
    prizeThird?: string | null;
  },
) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  if (!campaignId) return { success: false as const, message: "ক্যাম্পেইন নির্বাচন করুন" };

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name.trim().slice(0, 120);
  if (input.drawDate !== undefined)
    set.drawDate = input.drawDate ? new Date(input.drawDate) : null;
  if (input.shopAddress !== undefined)
    set.shopAddress = input.shopAddress?.trim().slice(0, 500) || null;
  if (input.shopMobile !== undefined)
    set.shopMobile = input.shopMobile?.trim().slice(0, 20) || null;
  if (input.prizeFirst !== undefined) set.prizeFirst = input.prizeFirst?.trim() || null;
  if (input.prizeSecond !== undefined) set.prizeSecond = input.prizeSecond?.trim() || null;
  if (input.prizeThird !== undefined) set.prizeThird = input.prizeThird?.trim() || null;

  if (Object.keys(set).length === 0) return { success: true as const };

  await db.update(lotteryCampaigns).set(set).where(eq(lotteryCampaigns.id, campaignId));
  revalidatePath("/lottery");
  revalidatePath("/lottery-manage");
  return { success: true as const, message: "সংরক্ষণ হয়েছে" };
}

/**
 * Admin: upload a banner image for a campaign (same R2 pattern as other
 * uploads). `kind` = "top" replaces the single top banner; "slider" appends to
 * the slider array. Returns the resolved signed URL of the uploaded image.
 */
export async function uploadCampaignBanner(formData: FormData) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  try {
    const campaignId = String(formData.get("campaignId") || "").trim();
    const kind = String(formData.get("kind") || "slider");
    const file = formData.get("file") as File | null;
    if (!campaignId) return { success: false as const, message: "ক্যাম্পেইন নির্বাচন করুন" };
    if (!file || file.size === 0) return { success: false as const, message: "ছবি নির্বাচন করুন" };

    const buf = await compressImage(Buffer.from(await file.arrayBuffer()), "product");
    const key = `lottery-banners/${campaignId}/${kind}-${Date.now()}.webp`;
    await putObject({ Key: key, Body: buf, ContentType: "image/webp" });

    const [c] = await db
      .select({
        topBannerKey: lotteryCampaigns.topBannerKey,
        bannerKeys: lotteryCampaigns.bannerKeys,
        prizeFirstImageKey: lotteryCampaigns.prizeFirstImageKey,
        prizeSecondImageKey: lotteryCampaigns.prizeSecondImageKey,
        prizeThirdImageKey: lotteryCampaigns.prizeThirdImageKey,
      })
      .from(lotteryCampaigns)
      .where(eq(lotteryCampaigns.id, campaignId))
      .limit(1);
    if (!c) return { success: false as const, message: "ক্যাম্পেইন পাওয়া যায়নি" };

    // Each prize image is a single replaceable slot, like the top banner.
    const PRIZE_COLUMNS = {
      prize1: "prizeFirstImageKey",
      prize2: "prizeSecondImageKey",
      prize3: "prizeThirdImageKey",
    } as const;

    if (kind === "top") {
      const old = c.topBannerKey;
      await db
        .update(lotteryCampaigns)
        .set({ topBannerKey: key })
        .where(eq(lotteryCampaigns.id, campaignId));
      if (old) await deleteObject({ Key: old }).catch(() => {});
    } else if (kind in PRIZE_COLUMNS) {
      const col = PRIZE_COLUMNS[kind as keyof typeof PRIZE_COLUMNS];
      const old = c[col];
      await db
        .update(lotteryCampaigns)
        .set({ [col]: key })
        .where(eq(lotteryCampaigns.id, campaignId));
      if (old) await deleteObject({ Key: old }).catch(() => {});
    } else {
      const next = [...(c.bannerKeys ?? []), key].slice(0, 20);
      await db
        .update(lotteryCampaigns)
        .set({ bannerKeys: next })
        .where(eq(lotteryCampaigns.id, campaignId));
    }

    revalidatePath("/lottery");
    revalidatePath("/lottery-manage");
    const url = await signKey(key);
    return { success: true as const, key, url, message: "ব্যানার আপলোড হয়েছে" };
  } catch (error) {
    console.error("uploadCampaignBanner error:", error);
    return { success: false as const, message: "আপলোড করা যায়নি" };
  }
}

/** Admin: remove a campaign banner (top banner, or one slider image by key). */
export async function removeCampaignBanner(
  campaignId: string,
  kind: "top" | "slider" | "prize1" | "prize2" | "prize3",
  key?: string,
) {
  if (!(await requireAdmin())) return { success: false as const, message: "Unauthorized" };
  if (!campaignId) return { success: false as const, message: "ক্যাম্পেইন নির্বাচন করুন" };

  const [c] = await db
    .select({
      topBannerKey: lotteryCampaigns.topBannerKey,
      bannerKeys: lotteryCampaigns.bannerKeys,
      prizeFirstImageKey: lotteryCampaigns.prizeFirstImageKey,
      prizeSecondImageKey: lotteryCampaigns.prizeSecondImageKey,
      prizeThirdImageKey: lotteryCampaigns.prizeThirdImageKey,
    })
    .from(lotteryCampaigns)
    .where(eq(lotteryCampaigns.id, campaignId))
    .limit(1);
  if (!c) return { success: false as const, message: "ক্যাম্পেইন পাওয়া যায়নি" };

  const PRIZE_COLUMNS = {
    prize1: "prizeFirstImageKey",
    prize2: "prizeSecondImageKey",
    prize3: "prizeThirdImageKey",
  } as const;

  if (kind === "top") {
    if (c.topBannerKey) await deleteObject({ Key: c.topBannerKey }).catch(() => {});
    await db
      .update(lotteryCampaigns)
      .set({ topBannerKey: null })
      .where(eq(lotteryCampaigns.id, campaignId));
  } else if (kind in PRIZE_COLUMNS) {
    const col = PRIZE_COLUMNS[kind as keyof typeof PRIZE_COLUMNS];
    if (c[col]) await deleteObject({ Key: c[col] as string }).catch(() => {});
    await db
      .update(lotteryCampaigns)
      .set({ [col]: null })
      .where(eq(lotteryCampaigns.id, campaignId));
  } else {
    if (!key) return { success: false as const, message: "ছবি নির্বাচন করুন" };
    const next = (c.bannerKeys ?? []).filter((k) => k !== key);
    await db
      .update(lotteryCampaigns)
      .set({ bannerKeys: next })
      .where(eq(lotteryCampaigns.id, campaignId));
    await deleteObject({ Key: key }).catch(() => {});
  }

  revalidatePath("/lottery");
  revalidatePath("/lottery-manage");
  return { success: true as const, message: "মুছে ফেলা হয়েছে" };
}

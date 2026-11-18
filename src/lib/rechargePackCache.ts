import { db } from "@/db/drizzle";
import { cachedRechargePacks } from "@/db/schema";
import { getDrives, OPERATOR_MAP } from "@/lib/successtopup";
import { eq } from "drizzle-orm";

/**
 * Shared, cache-backed fetch of the recharge "regular packs" for an operator.
 *
 * The SuccessTopup `/api/drives` endpoint returns ALL packs (every one tagged
 * type:"drive"), but it goes EMPTY after midnight — so customers/staff would
 * otherwise see "কোনো প্যাকেজ নেই" (no packages) at night. To keep packs always
 * visible we cache the last-known list per operator in our own Neon DB:
 *   - live API returns a non-empty list  → upsert the cache, serve live
 *   - live API returns empty OR throws   → serve the cached list (or [] if none)
 *
 * Both the staff and customer paths call this so they behave identically. It
 * never throws: the UI gets packs (possibly cached, possibly empty) regardless
 * of whether the live API was up, and a cache-write failure never blocks the
 * live response.
 */

// Normalize to the same operator code getDrives uses on the wire (e.g.
// "grameenphone" → "GP"), so staff + customer callers share one cache row.
// The key is prefixed with the pack `type` (e.g. "regular:GP" / "drive:GP") so
// the regular-pack cache and the drive-pack cache stay separate — otherwise the
// old drive-cache rows would be served back as "regular" packs.
const cacheKeyFor = (operator?: string, type?: "regular" | "drive") => {
  const op = operator ? OPERATOR_MAP[operator] || operator : "ALL";
  return type ? `${type}:${op}` : op;
};

const readCachedPacks = async (key: string): Promise<any[]> => {
  const row = await db.query.cachedRechargePacks.findFirst({
    where: eq(cachedRechargePacks.operator, key),
    columns: { packs: true },
  });
  return Array.isArray(row?.packs) ? (row.packs as any[]) : [];
};

export const getRechargePacksWithCache = async (
  operator?: string,
  type?: "regular" | "drive",
): Promise<any[]> => {
  const key = cacheKeyFor(operator, type);

  try {
    const res = await getDrives(operator, type);
    const packs = Array.isArray(res?.drives) ? (res.drives as any[]) : [];

    if (res?.result && packs.length > 0) {
      // Live list is good — refresh the cache (but never let a DB write failure
      // break the response: still return the live data).
      try {
        await db
          .insert(cachedRechargePacks)
          .values({ operator: key, packs, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: cachedRechargePacks.operator,
            set: { packs, updatedAt: new Date() },
          });
      } catch (writeError) {
        console.error("cachedRechargePacks upsert failed:", writeError);
      }
      return packs;
    }

    // Live API empty (or result=false) — fall back to the cached packs.
    return await readCachedPacks(key);
  } catch (error) {
    // Live API threw — fall back to the cached packs.
    console.error("getRechargePacksWithCache live error:", error);
    try {
      return await readCachedPacks(key);
    } catch (readError) {
      console.error("cachedRechargePacks read failed:", readError);
      return [];
    }
  }
};

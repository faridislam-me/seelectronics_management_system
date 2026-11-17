-- Cache the last-known recharge "regular packs" per operator so the recharge
-- pack list never shows empty. The SuccessTopup /api/drives endpoint returns
-- ALL packs but goes EMPTY after midnight, which otherwise shows customers/staff
-- "কোনো প্যাকেজ নেই" (no packages) at night. When the live API returns packs we
-- upsert them here (keyed by the normalized operator code, e.g. 'GP'); when it
-- returns empty or errors we serve these cached packs instead. One row per
-- operator. Idempotent.

CREATE TABLE IF NOT EXISTS "cached_recharge_packs" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "operator" varchar(40) NOT NULL,
  "packs" jsonb NOT NULL,
  "updatedAt" timestamptz DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "cached_recharge_packs_operator_idx"
  ON "cached_recharge_packs" ("operator");

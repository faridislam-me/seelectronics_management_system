-- Lottery campaigns (rounds): reuse the same printed cards/QR across multiple
-- independent draws. Each campaign collects its own entries and draws its own
-- winners; exactly one campaign is 'active' at a time. Idempotent.

CREATE TABLE IF NOT EXISTS "lottery_campaigns" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" varchar(120) DEFAULT '' NOT NULL,
  "status" varchar(20) DEFAULT 'active' NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL,
  "endedAt" timestamptz
);

CREATE INDEX IF NOT EXISTS "lottery_campaigns_status_idx" ON "lottery_campaigns" ("status");

-- Tag each entry with its campaign.
ALTER TABLE "lottery_entries" ADD COLUMN IF NOT EXISTS "campaignId" uuid;

CREATE INDEX IF NOT EXISTS "lottery_entries_campaign_idx" ON "lottery_entries" ("campaignId");

-- Seed a first campaign and move any pre-existing entries into it, but only if
-- no campaign exists yet (so re-running this never creates duplicates).
DO $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "lottery_campaigns") THEN
    INSERT INTO "lottery_campaigns" ("name", "status")
    VALUES ('ক্যাম্পেইন ১', 'active')
    RETURNING "id" INTO v_id;

    UPDATE "lottery_entries" SET "campaignId" = v_id WHERE "campaignId" IS NULL;
  END IF;
END $$;

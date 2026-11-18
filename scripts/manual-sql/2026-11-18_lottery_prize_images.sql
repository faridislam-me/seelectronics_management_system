-- Per-prize product images for the public lottery page (admin-uploadable).
-- Idempotent: safe to re-run. Applied manually to prod Neon (no drizzle-kit).
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "prizeFirstImageKey" varchar(255);
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "prizeSecondImageKey" varchar(255);
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "prizeThirdImageKey" varchar(255);

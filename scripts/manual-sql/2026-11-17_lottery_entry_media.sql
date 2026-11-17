-- Lottery: branded, media-rich public entry page.
-- Extends campaigns with admin-configurable display meta (draw date, shop
-- address/mobile, prize texts, a top banner + a slider of banner images) and
-- extends entries with the entrant's customer ID and photo. Object STORAGE KEYS
-- are stored (resolved to signed URLs on read via getObjectUrl), matching how
-- applicant/KYC photos are stored elsewhere. Additive & idempotent.

-- --- Campaign display meta ---
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "drawDate" timestamptz;
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "shopAddress" varchar(500);
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "shopMobile" varchar(20);
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "prizeFirst" text;
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "prizeSecond" text;
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "prizeThird" text;
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "topBannerKey" varchar(255);
ALTER TABLE "lottery_campaigns" ADD COLUMN IF NOT EXISTS "bannerKeys" jsonb DEFAULT '[]'::jsonb NOT NULL;

-- --- Entry: customer ID + entrant photo ---
ALTER TABLE "lottery_entries" ADD COLUMN IF NOT EXISTS "customerId" varchar(255);
ALTER TABLE "lottery_entries" ADD COLUMN IF NOT EXISTS "photoKey" varchar(255);

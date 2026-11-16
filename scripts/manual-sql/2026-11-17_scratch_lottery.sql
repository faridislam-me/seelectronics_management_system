-- Scratch-card lottery tables. Idempotent; apply to each DB (prod Neon + local).
-- Column names are camelCase (quoted) to match Drizzle's default naming.

CREATE TABLE IF NOT EXISTS "lottery_cards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" varchar(32) UNIQUE NOT NULL,
  "batchLabel" varchar(120) DEFAULT '' NOT NULL,
  "used" boolean DEFAULT false NOT NULL,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lottery_cards_used_idx" ON "lottery_cards" ("used");

CREATE TABLE IF NOT EXISTS "lottery_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "cardCode" varchar(32) NOT NULL,
  "name" varchar(255) NOT NULL,
  "phone" varchar(20) NOT NULL,
  "address" varchar(500) DEFAULT '' NOT NULL,
  "rank" integer,
  "drawnAt" timestamptz,
  "createdAt" timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "lottery_entries_rank_idx" ON "lottery_entries" ("rank");
CREATE INDEX IF NOT EXISTS "lottery_entries_card_idx" ON "lottery_entries" ("cardCode");

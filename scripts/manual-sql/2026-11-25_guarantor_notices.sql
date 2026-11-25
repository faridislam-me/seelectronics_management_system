-- Guarantor notices (জামিনদারকে নোটিশ): one row per notice the admin sends to an
-- installment plan's guarantor (level: reminder -> legal -> final).
-- Apply to each environment's DB (local + Neon production) BEFORE merging the PR,
-- e.g. `psql "$DATABASE_URL" -f scripts/manual-sql/2026-11-25_guarantor_notices.sql`.
-- Purely additive + idempotent (safe to re-run). No existing table is altered.

CREATE TABLE IF NOT EXISTS "guarantor_notices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "token" varchar(64) NOT NULL,
  "noticeNo" varchar(50) NOT NULL,
  "planId" uuid NOT NULL,
  "planCode" varchar(255) NOT NULL,
  "level" varchar(20) NOT NULL,
  "guarantorName" varchar(255),
  "guarantorPhone" varchar(255) NOT NULL,
  "guarantorAddress" text,
  "customerName" varchar(255) NOT NULL,
  "customerPhone" varchar(255) NOT NULL,
  "productModel" varchar(255) NOT NULL,
  "body" text NOT NULL,
  "dueAmount" numeric(12, 2) DEFAULT 0 NOT NULL,
  "dueCount" integer DEFAULT 0 NOT NULL,
  "remainingAmount" numeric(12, 2) DEFAULT 0 NOT NULL,
  "deadlineDate" timestamp with time zone,
  "smsSent" boolean DEFAULT false NOT NULL,
  "smsError" text,
  "guarantorCustomerId" varchar(255),
  "createdBy" varchar(255),
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "guarantor_notices_token_unique" UNIQUE ("token"),
  CONSTRAINT "guarantor_notices_noticeNo_unique" UNIQUE ("noticeNo"),
  CONSTRAINT "guarantor_notices_planId_installment_plans_id_fk"
    FOREIGN KEY ("planId") REFERENCES "installment_plans" ("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "guarantor_notices_plan_idx" ON "guarantor_notices" ("planId");
CREATE INDEX IF NOT EXISTS "guarantor_notices_plan_code_idx" ON "guarantor_notices" ("planCode");

-- #11 Guarantor address detail (installment applications)
-- Apply to each environment's DB (local + Neon production) BEFORE merging the PR,
-- e.g. `psql "$DATABASE_URL" -f scripts/manual-sql/2026-11-15_guarantor_address_detail.sql`
-- or `npx drizzle-kit push`. All additive + idempotent (safe to re-run).
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "guarantorCurrentAddress" text;
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "guarantorPermanentAddress" text;
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "guarantorIsRenting" boolean DEFAULT false;
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "guarantorLandlordName" varchar(255);
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "guarantorLandlordPhone" varchar(255);

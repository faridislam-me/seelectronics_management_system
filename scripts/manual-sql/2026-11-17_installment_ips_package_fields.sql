-- B4.4 IPS-package battery fields (installment applications)
-- When productType = "ips_package" the form captures the battery brand + capacity
-- alongside the IPS brand (productBrand) and the package VA (productSpec).
-- Apply to each environment's DB (local + Neon production) BEFORE merging the PR,
-- e.g. `psql "$DATABASE_URL" -f scripts/manual-sql/2026-11-17_installment_ips_package_fields.sql`
-- All additive + idempotent (safe to re-run).
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "batteryBrand" varchar(255);
ALTER TABLE "installment_applications" ADD COLUMN IF NOT EXISTS "batteryAmpere" varchar(100);

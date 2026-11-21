-- Performance indexes for the customer referral + notifications pages.
--
-- Root cause of the 10-15s loads: three fast-growing tables had NO index on
-- the column they are always filtered by, so every page load did a full
-- sequential scan (+ in-memory sort) of the whole table over neon-http.
--
--   * products.invoiceId          -> referral page loads each referred
--                                     customer's invoice products (invoice
--                                     detail also joins by invoiceId).
--   * customerNotifications        -> notifications page: WHERE customerId = ?
--                                     ORDER BY createdAt DESC.
--   * noticeRecipients.customerId  -> notifications page: WHERE customerId = ?
--     noticeRecipients.staffId        ORDER BY createdAt DESC (staff feed too).
--
-- Apply to each environment's DB (local + Neon production) BEFORE merging the PR,
-- e.g. `psql "$DATABASE_URL" -f scripts/manual-sql/2026-11-22_referral_notification_perf_indexes.sql`
-- All additive + idempotent (safe to re-run). CREATE INDEX takes a brief lock;
-- these tables are small enough that a plain CREATE INDEX is fine, but
-- CONCURRENTLY can be used if you prefer zero write-blocking (must run outside
-- a transaction block).

CREATE INDEX IF NOT EXISTS "products_invoice_id_idx"
  ON "products" ("invoiceId");

CREATE INDEX IF NOT EXISTS "customer_notifications_customer_created_idx"
  ON "customerNotifications" ("customerId", "createdAt");

CREATE INDEX IF NOT EXISTS "notice_recipients_customer_created_idx"
  ON "noticeRecipients" ("customerId", "createdAt");

CREATE INDEX IF NOT EXISTS "notice_recipients_staff_created_idx"
  ON "noticeRecipients" ("staffId", "createdAt");

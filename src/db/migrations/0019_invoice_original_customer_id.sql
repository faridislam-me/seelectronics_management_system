ALTER TABLE "invoices" ADD COLUMN "originalCustomerId" varchar(255);--> statement-breakpoint
CREATE INDEX "invoice_original_customer_id_idx" ON "invoices" USING btree ("originalCustomerId");
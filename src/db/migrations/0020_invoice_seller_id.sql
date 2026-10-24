ALTER TABLE "invoices" ADD COLUMN "sellerId" varchar(255);--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sellerId_sellers_sellerId_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("sellerId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_seller_id_idx" ON "invoices" USING btree ("sellerId");--> statement-breakpoint
UPDATE "invoices" i SET "sellerId" = c."sellerId" FROM "customers" c WHERE i."customerId" = c."customerId" AND i."sellerId" IS NULL AND c."sellerId" IS NOT NULL;

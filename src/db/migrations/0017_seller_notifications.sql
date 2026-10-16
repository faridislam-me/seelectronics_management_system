CREATE TABLE "sellerNotifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sellerId" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"message" text NOT NULL,
	"link" varchar(255),
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sellerNotifications" ADD CONSTRAINT "sellerNotifications_sellerId_sellers_sellerId_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("sellerId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seller_notifications_seller_id_idx" ON "sellerNotifications" USING btree ("sellerId");
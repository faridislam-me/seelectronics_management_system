CREATE TYPE "public"."sellerBusinessType" AS ENUM('retail', 'wholesale', 'showroom', 'other');--> statement-breakpoint
ALTER TYPE "public"."applicationTypes" ADD VALUE 'seller_application';--> statement-breakpoint
CREATE TABLE "sellerPurchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchaseId" varchar(255) NOT NULL,
	"invoiceNumber" varchar(255) NOT NULL,
	"sellerId" varchar(255) NOT NULL,
	"productType" "productType" NOT NULL,
	"productModel" varchar(255) NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unitPrice" numeric(12, 2) NOT NULL,
	"totalAmount" numeric(12, 2) NOT NULL,
	"paidAmount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"note" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellerPurchases_purchaseId_unique" UNIQUE("purchaseId"),
	CONSTRAINT "sellerPurchases_invoiceNumber_unique" UNIQUE("invoiceNumber")
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sellerId" varchar(255) NOT NULL,
	"username" varchar(255),
	"password" text,
	"shopName" varchar(255) NOT NULL,
	"businessType" "sellerBusinessType" DEFAULT 'retail' NOT NULL,
	"tradeLicenseNumber" varchar(255) NOT NULL,
	"businessYears" integer DEFAULT 0,
	"shopStreetAddress" text NOT NULL,
	"shopDistrict" varchar(100) NOT NULL,
	"shopPoliceStation" varchar(100),
	"shopPostOffice" varchar(100),
	"ownerName" varchar(255) NOT NULL,
	"phone" varchar(255) NOT NULL,
	"nidNumber" varchar(50) NOT NULL,
	"ownerPhotoKey" varchar(255) NOT NULL,
	"tradeLicensePhotoKey" varchar(255) NOT NULL,
	"shopFrontPhotoKey" varchar(255) NOT NULL,
	"shopInsidePhotoKey" varchar(255),
	"nidFrontPhotoKey" varchar(255) NOT NULL,
	"nidBackPhotoKey" varchar(255) NOT NULL,
	"paymentPreference" "paymentTypes" DEFAULT 'bank' NOT NULL,
	"walletNumber" varchar(255),
	"bankInfo" json,
	"isVerified" boolean DEFAULT false NOT NULL,
	"isActiveSeller" boolean DEFAULT true NOT NULL,
	"profileCompleted" boolean DEFAULT false NOT NULL,
	"createdFrom" "serviceSourceTypes" NOT NULL,
	"ipAddress" varchar(255),
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_sellerId_unique" UNIQUE("sellerId"),
	CONSTRAINT "sellers_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "sellerId" varchar(255);--> statement-breakpoint
ALTER TABLE "sellerPurchases" ADD CONSTRAINT "sellerPurchases_sellerId_sellers_sellerId_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("sellerId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seller_purchase_seller_id_idx" ON "sellerPurchases" USING btree ("sellerId");--> statement-breakpoint
CREATE INDEX "seller_purchase_date_idx" ON "sellerPurchases" USING btree ("date");--> statement-breakpoint
CREATE INDEX "seller_id_idx" ON "sellers" USING btree ("sellerId");--> statement-breakpoint
CREATE INDEX "seller_username_idx" ON "sellers" USING btree ("username");--> statement-breakpoint
CREATE INDEX "seller_phone_idx" ON "sellers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "seller_is_verified_idx" ON "sellers" USING btree ("isVerified");--> statement-breakpoint
CREATE INDEX "seller_active_idx" ON "sellers" USING btree ("isActiveSeller");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_sellerId_sellers_sellerId_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("sellerId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customer_seller_id_idx" ON "customers" USING btree ("sellerId");
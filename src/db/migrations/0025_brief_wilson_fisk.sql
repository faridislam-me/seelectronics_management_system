CREATE TYPE "public"."installmentAppStatus" AS ENUM('pending', 'under_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "installment_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicationCode" varchar(255) NOT NULL,
	"customerId" varchar(255) NOT NULL,
	"customerName" varchar(255) NOT NULL,
	"customerPhone" varchar(255) NOT NULL,
	"customerAddress" text,
	"productType" "productType",
	"productModel" varchar(255) NOT NULL,
	"photoKey" varchar(512),
	"nidFrontPhotoKey" varchar(512),
	"nidBackPhotoKey" varchar(512),
	"signatureKey" varchar(512),
	"guarantorName" varchar(255),
	"guarantorPhone" varchar(255),
	"guarantorAddress" text,
	"guarantorNidFrontPhotoKey" varchar(512),
	"guarantorNidBackPhotoKey" varchar(512),
	"status" "installmentAppStatus" DEFAULT 'pending' NOT NULL,
	"rejectReason" text,
	"notes" text,
	"adminNotes" text,
	"planId" uuid,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_applications_applicationCode_unique" UNIQUE("applicationCode")
);
--> statement-breakpoint
ALTER TABLE "installment_applications" ADD CONSTRAINT "installment_applications_customerId_customers_customerId_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("customerId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_applications" ADD CONSTRAINT "installment_applications_planId_installment_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."installment_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "installment_app_code_idx" ON "installment_applications" USING btree ("applicationCode");--> statement-breakpoint
CREATE INDEX "installment_app_customer_idx" ON "installment_applications" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "installment_app_status_idx" ON "installment_applications" USING btree ("status");
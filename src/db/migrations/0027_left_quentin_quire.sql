ALTER TYPE "public"."productType" ADD VALUE 'fridge';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'ac';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'tv';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'oven';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'washing_machine';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'mobile';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'ips_package';--> statement-breakpoint
ALTER TYPE "public"."productType" ADD VALUE 'blender';--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "fatherName" varchar(255);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "motherName" varchar(255);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "currentAddress" text;--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "permanentAddress" text;--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "isRenting" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "landlordName" varchar(255);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "landlordPhone" varchar(255);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "productTypeOther" varchar(255);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "desiredMonths" integer;--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "desiredDownPayment" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "bankCheckPhotoKey" varchar(512);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "guarantorPhotoKey" varchar(512);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "guarantorSignatureKey" varchar(512);--> statement-breakpoint
ALTER TABLE "installment_applications" ADD COLUMN "termsAccepted" boolean DEFAULT false NOT NULL;
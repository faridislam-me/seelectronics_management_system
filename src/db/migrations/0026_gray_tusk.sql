CREATE TYPE "public"."mobileOperator" AS ENUM('grameenphone', 'banglalink', 'robi', 'airtel', 'teletalk');--> statement-breakpoint
CREATE TYPE "public"."rechargeStatus" AS ENUM('pending', 'processing', 'completed', 'rejected');--> statement-breakpoint
CREATE TABLE "mobile_recharge_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requestCode" varchar(255) NOT NULL,
	"customerId" varchar(255) NOT NULL,
	"customerName" varchar(255) NOT NULL,
	"customerPhone" varchar(255) NOT NULL,
	"rechargePhone" varchar(255) NOT NULL,
	"operator" "mobileOperator" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "rechargeStatus" DEFAULT 'pending' NOT NULL,
	"rejectReason" text,
	"adminNotes" text,
	"processedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mobile_recharge_requests_requestCode_unique" UNIQUE("requestCode")
);
--> statement-breakpoint
ALTER TABLE "mobile_recharge_requests" ADD CONSTRAINT "mobile_recharge_requests_customerId_customers_customerId_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("customerId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recharge_code_idx" ON "mobile_recharge_requests" USING btree ("requestCode");--> statement-breakpoint
CREATE INDEX "recharge_customer_idx" ON "mobile_recharge_requests" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "recharge_status_idx" ON "mobile_recharge_requests" USING btree ("status");
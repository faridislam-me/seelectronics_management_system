CREATE TYPE "public"."installmentDueStatus" AS ENUM('pending', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."installmentPlanStatus" AS ENUM('active', 'completed', 'defaulted', 'banned', 'cancelled');--> statement-breakpoint
CREATE TABLE "installment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planCode" varchar(255) NOT NULL,
	"customerId" varchar(255) NOT NULL,
	"customerName" varchar(255) NOT NULL,
	"customerPhone" varchar(255) NOT NULL,
	"customerAddress" text,
	"productType" "productType",
	"productModel" varchar(255) NOT NULL,
	"serialNumber" varchar(255),
	"productImageKey" varchar(255),
	"cashPrice" numeric(12, 2) NOT NULL,
	"extraCharge" numeric(12, 2) DEFAULT 0 NOT NULL,
	"totalPayable" numeric(12, 2) NOT NULL,
	"downPayment" numeric(12, 2) DEFAULT 0 NOT NULL,
	"financedAmount" numeric(12, 2) NOT NULL,
	"months" integer NOT NULL,
	"monthlyAmount" numeric(12, 2) NOT NULL,
	"startDate" timestamp with time zone NOT NULL,
	"endDate" timestamp with time zone NOT NULL,
	"status" "installmentPlanStatus" DEFAULT 'active' NOT NULL,
	"guarantorName" varchar(255),
	"guarantorPhone" varchar(255),
	"guarantorAddress" text,
	"notes" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "installment_plans_planCode_unique" UNIQUE("planCode")
);
--> statement-breakpoint
CREATE TABLE "installment_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planId" uuid NOT NULL,
	"installmentNo" integer NOT NULL,
	"dueDate" timestamp with time zone NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" "installmentDueStatus" DEFAULT 'pending' NOT NULL,
	"paidAmount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"paidAt" timestamp with time zone,
	"paymentMethod" "paymentTypes",
	"transactionId" varchar(255),
	"remindedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "installment_plans" ADD CONSTRAINT "installment_plans_customerId_customers_customerId_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("customerId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_schedule" ADD CONSTRAINT "installment_schedule_planId_installment_plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."installment_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "installment_plan_code_idx" ON "installment_plans" USING btree ("planCode");--> statement-breakpoint
CREATE INDEX "installment_plan_customer_idx" ON "installment_plans" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "installment_plan_status_idx" ON "installment_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "installment_schedule_plan_idx" ON "installment_schedule" USING btree ("planId");--> statement-breakpoint
CREATE INDEX "installment_schedule_due_idx" ON "installment_schedule" USING btree ("dueDate");--> statement-breakpoint
CREATE INDEX "installment_schedule_status_idx" ON "installment_schedule" USING btree ("status");
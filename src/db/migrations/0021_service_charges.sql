CREATE TABLE "serviceCharges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serviceId" varchar(255) NOT NULL,
	"customerId" varchar(255),
	"sellerId" varchar(255),
	"amount" numeric(12, 2) NOT NULL,
	"paidAmount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"reason" varchar(30) NOT NULL,
	"note" text,
	"status" varchar(20) DEFAULT 'due' NOT NULL,
	"paymentMethod" varchar(50),
	"paidAt" timestamp with time zone,
	"createdBy" varchar(255),
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "serviceCharges_serviceId_unique" UNIQUE("serviceId")
);
--> statement-breakpoint
ALTER TABLE "serviceCharges" ADD CONSTRAINT "serviceCharges_serviceId_services_serviceId_fk" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("serviceId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceCharges" ADD CONSTRAINT "serviceCharges_customerId_customers_customerId_fk" FOREIGN KEY ("customerId") REFERENCES "public"."customers"("customerId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "serviceCharges" ADD CONSTRAINT "serviceCharges_sellerId_sellers_sellerId_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("sellerId") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_charge_customer_id_idx" ON "serviceCharges" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "service_charge_seller_id_idx" ON "serviceCharges" USING btree ("sellerId");--> statement-breakpoint
CREATE INDEX "service_charge_status_idx" ON "serviceCharges" USING btree ("status");
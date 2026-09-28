CREATE TABLE "supplierTransactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transactionId" varchar(255) NOT NULL,
	"supplierId" varchar(255) NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "supplierTransactions_transactionId_unique" UNIQUE("transactionId")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplierId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"shopName" varchar(255) NOT NULL,
	"phone" varchar(255) NOT NULL,
	"address" text,
	"origin" varchar(100),
	"username" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"note" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_supplierId_unique" UNIQUE("supplierId"),
	CONSTRAINT "suppliers_phone_unique" UNIQUE("phone"),
	CONSTRAINT "suppliers_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "supplierTransactions" ADD CONSTRAINT "supplierTransactions_supplierId_suppliers_supplierId_fk" FOREIGN KEY ("supplierId") REFERENCES "public"."suppliers"("supplierId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "supplier_tx_supplier_id_idx" ON "supplierTransactions" USING btree ("supplierId");--> statement-breakpoint
CREATE INDEX "supplier_tx_date_idx" ON "supplierTransactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "supplier_id_idx" ON "suppliers" USING btree ("supplierId");--> statement-breakpoint
CREATE INDEX "supplier_phone_idx" ON "suppliers" USING btree ("phone");
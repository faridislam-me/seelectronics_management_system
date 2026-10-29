CREATE TABLE "sellerPaymentRequests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requestId" varchar(255) NOT NULL,
	"sellerId" varchar(255) NOT NULL,
	"targetType" varchar(20) NOT NULL,
	"targetRef" varchar(255) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"paymentMethod" "paymentTypes" NOT NULL,
	"senderNumber" varchar(255),
	"transactionId" varchar(255),
	"note" text,
	"status" "paymentStatus" DEFAULT 'requested' NOT NULL,
	"adminNote" text,
	"processedBy" varchar(255),
	"processedAt" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellerPaymentRequests_requestId_unique" UNIQUE("requestId")
);
--> statement-breakpoint
ALTER TABLE "sellerPaymentRequests" ADD CONSTRAINT "sellerPaymentRequests_sellerId_sellers_sellerId_fk" FOREIGN KEY ("sellerId") REFERENCES "public"."sellers"("sellerId") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seller_payment_req_seller_idx" ON "sellerPaymentRequests" USING btree ("sellerId");--> statement-breakpoint
CREATE INDEX "seller_payment_req_status_idx" ON "sellerPaymentRequests" USING btree ("status");
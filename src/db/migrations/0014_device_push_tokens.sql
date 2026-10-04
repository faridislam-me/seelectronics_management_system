CREATE TABLE "devicePushTokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"role" varchar(20) NOT NULL,
	"userId" varchar(255) NOT NULL,
	"platform" varchar(20) DEFAULT 'android' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastSeenAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devicePushTokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX "device_push_user_idx" ON "devicePushTokens" USING btree ("role","userId");
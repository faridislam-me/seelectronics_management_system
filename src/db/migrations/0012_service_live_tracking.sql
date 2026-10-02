ALTER TABLE "services" ADD COLUMN "customerLat" double precision;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "customerLng" double precision;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "staffLat" double precision;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "staffLng" double precision;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "staffLocationAt" timestamp with time zone;
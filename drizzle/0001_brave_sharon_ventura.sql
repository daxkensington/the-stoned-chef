CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'paid', 'failed', 'refunded');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tip_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" varchar(32);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "square_payment_id" varchar(128);
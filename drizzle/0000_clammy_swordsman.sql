CREATE TYPE "public"."order_status" AS ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "email_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(128),
	"subscribed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unsubscribed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "email_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"item_name" varchar(128) NOT NULL,
	"item_category" varchar(64) NOT NULL,
	"price_cents" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(32) NOT NULL,
	"customer_name" varchar(128) NOT NULL,
	"customer_phone" varchar(32) NOT NULL,
	"customer_email" varchar(320),
	"pickup_time" varchar(64) NOT NULL,
	"total_cents" integer NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"square_order_id" varchar(128),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "sold_out_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_item_id" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sold_out_items_menu_item_id_unique" UNIQUE("menu_item_id")
);
--> statement-breakpoint
CREATE TABLE "specials" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(128) NOT NULL,
	"description" text,
	"price_cents" integer,
	"badge" varchar(64),
	"active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "specials_active_expires_idx" ON "specials" USING btree ("active","expires_at");
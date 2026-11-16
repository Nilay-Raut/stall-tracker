CREATE TYPE "public"."day_status" AS ENUM('open', 'closed', 'off');--> statement-breakpoint
CREATE TYPE "public"."entry_type" AS ENUM('sale', 'expense', 'cash_out');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('raw_material', 'gas', 'packaging', 'transport', 'salary', 'other');--> statement-breakpoint
CREATE TYPE "public"."paid_from" AS ENUM('drawer', 'upi', 'own_pocket');--> statement-breakpoint
CREATE TYPE "public"."payment_mode" AS ENUM('cash', 'upi');--> statement-breakpoint
CREATE TABLE "days" (
	"shop_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"status" "day_status" DEFAULT 'open' NOT NULL,
	"sales_total" integer DEFAULT 0 NOT NULL,
	"cash_sales" integer DEFAULT 0 NOT NULL,
	"upi_sales" integer DEFAULT 0 NOT NULL,
	"expense_total" integer DEFAULT 0 NOT NULL,
	"drawer_expenses" integer DEFAULT 0 NOT NULL,
	"cash_out_total" integer DEFAULT 0 NOT NULL,
	"fixed_cost" integer DEFAULT 0 NOT NULL,
	"profit" integer DEFAULT 0 NOT NULL,
	"entry_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "days_shop_id_business_date_pk" PRIMARY KEY("shop_id","business_date")
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"shop_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"type" "entry_type" NOT NULL,
	"amount" integer NOT NULL,
	"payment_mode" "payment_mode",
	"category" "expense_category",
	"paid_from" "paid_from",
	"occurred_at" timestamp with time zone NOT NULL,
	"client_updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entries_amount_positive" CHECK ("entries"."amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "days" ADD CONSTRAINT "days_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entries_shop_date_idx" ON "entries" USING btree ("shop_id","business_date");
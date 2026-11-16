ALTER TABLE "days" ADD COLUMN "entered_cash_sales" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "entered_upi_sales" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "opening_cash" integer;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "counted_cash" integer;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "upi_total" integer;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "waste_amount" integer;--> statement-breakpoint
ALTER TABLE "days" ADD COLUMN "closed_at" timestamp with time zone;
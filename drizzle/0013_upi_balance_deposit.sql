ALTER TYPE "public"."entry_type" ADD VALUE 'deposit';--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "upi_balance" integer;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "upi_balance_date" date;
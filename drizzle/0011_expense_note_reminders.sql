ALTER TABLE "entries" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "last_follow_up_date" date;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "fixed_cost_in_daily_profit" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_note_length" CHECK (char_length("entries"."note") <= 40);
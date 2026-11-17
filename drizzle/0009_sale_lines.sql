ALTER TYPE "public"."sales_mode" ADD VALUE 'bills';--> statement-breakpoint
CREATE TABLE "sale_lines" (
	"entry_id" uuid NOT NULL,
	"line_no" integer NOT NULL,
	"shop_id" uuid NOT NULL,
	"item_id" uuid,
	"name" text NOT NULL,
	"name_key" text NOT NULL,
	"unit_price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"cost_at_time" integer,
	CONSTRAINT "sale_lines_entry_id_line_no_pk" PRIMARY KEY("entry_id","line_no"),
	CONSTRAINT "sale_lines_price_positive" CHECK ("sale_lines"."unit_price" > 0),
	CONSTRAINT "sale_lines_quantity_range" CHECK ("sale_lines"."quantity" between 1 and 999)
);
--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sale_lines_shop_item_idx" ON "sale_lines" USING btree ("shop_id","item_id");--> statement-breakpoint
CREATE INDEX "sale_lines_shop_name_idx" ON "sale_lines" USING btree ("shop_id","name_key");
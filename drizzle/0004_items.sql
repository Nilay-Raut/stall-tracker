CREATE TABLE "day_item_counts" (
	"shop_id" uuid NOT NULL,
	"business_date" date NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price_at_time" integer NOT NULL,
	"cost_at_time" integer NOT NULL,
	CONSTRAINT "day_item_counts_shop_id_business_date_item_id_pk" PRIMARY KEY("shop_id","business_date","item_id"),
	CONSTRAINT "day_item_counts_quantity_positive" CHECK ("day_item_counts"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"cost" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "items_price_positive" CHECK ("items"."price" > 0),
	CONSTRAINT "items_cost_non_negative" CHECK ("items"."cost" >= 0)
);
--> statement-breakpoint
ALTER TABLE "day_item_counts" ADD CONSTRAINT "day_item_counts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "day_item_counts" ADD CONSTRAINT "day_item_counts_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "items_shop_idx" ON "items" USING btree ("shop_id");
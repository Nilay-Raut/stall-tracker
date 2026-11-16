CREATE TABLE "monthly_targets" (
	"shop_id" uuid NOT NULL,
	"month" text NOT NULL,
	"profit_target" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_targets_shop_id_month_pk" PRIMARY KEY("shop_id","month"),
	CONSTRAINT "monthly_targets_positive" CHECK ("monthly_targets"."profit_target" > 0)
);
--> statement-breakpoint
ALTER TABLE "monthly_targets" ADD CONSTRAINT "monthly_targets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;
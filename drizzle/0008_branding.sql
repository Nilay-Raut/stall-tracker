CREATE TABLE "shop_logos" (
	"shop_id" uuid PRIMARY KEY NOT NULL,
	"mime" text NOT NULL,
	"bytes" "bytea" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shop_logos_mime" CHECK ("shop_logos"."mime" in ('image/webp', 'image/png', 'image/jpeg')),
	CONSTRAINT "shop_logos_size" CHECK (octet_length("shop_logos"."bytes") <= 102400)
);
--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "accent_color" text;--> statement-breakpoint
ALTER TABLE "shop_logos" ADD CONSTRAINT "shop_logos_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_accent_color_hex" CHECK ("shops"."accent_color" ~ '^#[0-9a-f]{6}$');
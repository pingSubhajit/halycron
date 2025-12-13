CREATE TABLE "shared_link_keys" (
	"shared_link_id" uuid PRIMARY KEY NOT NULL,
	"sk_wrapped_by_pin" text NOT NULL,
	"pin_kdf_salt" text NOT NULL,
	"pin_kdf_params" text NOT NULL,
	"sk_wrap_iv" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "user_keys" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"crypto_version" integer DEFAULT 1 NOT NULL,
	"kdf_salt" text NOT NULL,
	"kdf_params" text NOT NULL,
	"wrapped_umk_pw" text NOT NULL,
	"wrapped_umk_pw_iv" text NOT NULL,
	"wrapped_umk_rk" text NOT NULL,
	"wrapped_umk_rk_iv" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "encrypted_file_key" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "file_key_iv" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ALTER COLUMN "original_filename" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "encryption_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "content_iv" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "wrapped_dek" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "wrapped_dek_iv" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "encrypted_filename" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "filename_iv" text;--> statement-breakpoint
ALTER TABLE "shared_photos" ADD COLUMN "wrapped_dek_for_share" text;--> statement-breakpoint
ALTER TABLE "shared_photos" ADD COLUMN "wrapped_dek_for_share_iv" text;--> statement-breakpoint
ALTER TABLE "shared_photos" ADD COLUMN "encrypted_filename_for_share" text;--> statement-breakpoint
ALTER TABLE "shared_photos" ADD COLUMN "filename_for_share_iv" text;--> statement-breakpoint
ALTER TABLE "shared_link_keys" ADD CONSTRAINT "shared_link_keys_shared_link_id_shared_links_id_fk" FOREIGN KEY ("shared_link_id") REFERENCES "public"."shared_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_keys" ADD CONSTRAINT "user_keys_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "photos"
    ADD COLUMN "file_iv" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user"
    ADD COLUMN "encrypted_user_key" text;--> statement-breakpoint
ALTER TABLE "user"
    ADD COLUMN "user_key_iv" text;--> statement-breakpoint
ALTER TABLE "user"
    ADD COLUMN "user_key_salt" text;
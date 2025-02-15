CREATE TABLE "two_factor" (
	"secret" text,
	"backup_codes" text
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean DEFAULT false;
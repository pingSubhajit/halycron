CREATE TABLE "qr_login_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"user_id" uuid,
	"web_session_id" uuid,
	"approved_by_session_id" uuid,
	"ip_address" varchar,
	"user_agent" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "qr_login_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "privacy_settings" ALTER COLUMN "id" SET DEFAULT gen_random_uuid
    ();--> statement-breakpoint
ALTER TABLE "qr_login_requests" ADD CONSTRAINT "qr_login_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_login_requests" ADD CONSTRAINT "qr_login_requests_web_session_id_session_id_fk" FOREIGN KEY ("web_session_id") REFERENCES "public"."session"("id") ON DELETE set null ON UPDATE no action;
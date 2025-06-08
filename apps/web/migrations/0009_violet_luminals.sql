CREATE TABLE "privacy_settings"
(
    "id"                   uuid PRIMARY KEY         DEFAULT gen_random_uuid() NOT NULL,
    "user_id"              uuid                                               NOT NULL,
    "strip_location_data"  boolean                  DEFAULT false             NOT NULL,
    "anonymize_timestamps" boolean                  DEFAULT false             NOT NULL,
    "disable_analytics"    boolean                  DEFAULT false             NOT NULL,
    "minimal_server_logs"  boolean                  DEFAULT true              NOT NULL,
    "created_at"           timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at"           timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "privacy_settings_user_id_unique" UNIQUE ("user_id")
);
--> statement-breakpoint
ALTER TABLE "export_jobs"
    ALTER COLUMN "id" SET DEFAULT gen_random_uuid
                                  ();--> statement-breakpoint
ALTER TABLE "privacy_settings"
    ADD CONSTRAINT "privacy_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;
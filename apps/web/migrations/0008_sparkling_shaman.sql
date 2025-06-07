CREATE TABLE "export_jobs"
(
    "id"               uuid PRIMARY KEY         DEFAULT gen_random_uuid() NOT NULL,
    "user_id"          uuid                                               NOT NULL,
    "status"           varchar(20)              DEFAULT 'pending'         NOT NULL,
    "total_photos"     integer                  DEFAULT 0                 NOT NULL,
    "processed_photos" integer                  DEFAULT 0                 NOT NULL,
    "download_url"     text,
    "s3_key"           text,
    "error_message"    text,
    "expires_at"       timestamp with time zone,
    "created_at"       timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "two_factor"
    ALTER COLUMN "id" SET DEFAULT gen_random_uuid
                                  ();--> statement-breakpoint
ALTER TABLE "export_jobs"
    ADD CONSTRAINT "export_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON DELETE cascade ON UPDATE no action;
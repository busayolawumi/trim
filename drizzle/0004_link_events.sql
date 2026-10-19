CREATE TABLE "link_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"type" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "link_events" ADD CONSTRAINT "link_events_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "link_events_link_id_created_at_idx" ON "link_events" USING btree ("link_id","created_at");--> statement-breakpoint
-- Existing links get a "created" entry at their creation time. No destination: it may have been edited since.
INSERT INTO "link_events" ("link_id", "type", "created_at") SELECT "id", 'created', "created_at" FROM "links";

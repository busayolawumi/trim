ALTER TABLE "users" ADD COLUMN "avatar" text DEFAULT 'cat' NOT NULL;--> statement-breakpoint
-- Existing accounts get a random avatar (ids from src/lib/avatars.ts); random() runs once per row.
UPDATE "users" SET "avatar" = (ARRAY['monster','cat','chick','alien','frog','robot','penguin','ghost','owl','bunny'])[floor(random() * 10)::int + 1];

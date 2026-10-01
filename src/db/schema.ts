import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const links = pgTable(
  "links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Always stored lowercase so slugs are case-insensitive.
    slug: text("slug").notNull().unique(),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("links_user_id_idx").on(t.userId)],
);

export const clicks = pgTable(
  "clicks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    linkId: uuid("link_id")
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    referrer: text("referrer"),
    country: text("country"),
    device: text("device"),
    browser: text("browser"),
    isBot: boolean("is_bot").notNull().default(false),
  },
  (t) => [index("clicks_link_id_created_at_idx").on(t.linkId, t.createdAt)],
);

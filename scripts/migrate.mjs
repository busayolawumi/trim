// Applies new SQL files in drizzle/ to the database. All pending migrations run in one
// transaction, so a failure leaves the database unchanged (and fails the deploy).
//
// Runs for `npm run db:migrate` (against .env.local) and during Vercel production builds.
// Skipped for local `npm run build` and for preview deploys, so neither can change a database.
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";

const onVercel = Boolean(process.env.VERCEL);
const manual = process.env.npm_lifecycle_event === "db:migrate";

if (onVercel ? process.env.VERCEL_ENV !== "production" : !manual) {
  console.log("[migrate] skipped (only runs for `npm run db:migrate` and production deploys)");
  process.exit(0);
}

if (!onVercel) {
  // Doesn't override a DATABASE_URL already set in the shell, so one-off targets still work.
  const { config } = await import("dotenv");
  config({ path: ".env.local", quiet: true });
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
if (!globalThis.WebSocket) throw new Error("Node 22+ is required (needs a global WebSocket)");

const pool = new Pool({ connectionString: url });
try {
  console.log(`[migrate] applying migrations to ${new URL(url).hostname}`);
  await migrate(drizzle({ client: pool }), { migrationsFolder: "drizzle" });
  console.log("[migrate] done");
} finally {
  await pool.end();
}

import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { and, count, eq, gt, lt, sql } from "drizzle-orm";
import { authAttempts, db } from "@/db";

export type Limit = { max: number; windowMinutes: number };

// Keyed hash so stored keys can't be reversed by hashing every IPv4 address or a list of emails.
function hashKey(key: string) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(`rate-limit:${key}`).digest("hex");
}

/** The client's IP as reported by Vercel. Only ever used hashed. */
export async function clientIp() {
  const forwarded = (await headers()).get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() || "unknown";
}

export async function isRateLimited(key: string, { max, windowMinutes }: Limit) {
  const [{ total }] = await db()
    .select({ total: count() })
    .from(authAttempts)
    .where(
      and(
        eq(authAttempts.key, hashKey(key)),
        gt(authAttempts.createdAt, sql`now() - make_interval(mins => ${windowMinutes})`),
      ),
    );
  return total >= max;
}

export async function recordAttempt(...keys: string[]) {
  await db()
    .insert(authAttempts)
    .values(keys.map((key) => ({ key: hashKey(key) })));
  // No limit looks back more than an hour, so anything older than a day can go.
  await db()
    .delete(authAttempts)
    .where(lt(authAttempts.createdAt, sql`now() - interval '1 day'`));
}

export async function clearAttempts(key: string) {
  await db().delete(authAttempts).where(eq(authAttempts.key, hashKey(key)));
}

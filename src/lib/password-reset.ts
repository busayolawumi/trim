import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { db, passwordResetTokens } from "@/db";

export const RESET_TOKEN_MINUTES = 60;

// Tokens are 256 random bits, so a fast hash is enough (no need for scrypt).
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a new token for the user, replacing any earlier ones. Returns the raw token for the email link. */
export async function createResetToken(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db().delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
  await db()
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, sql`now()`));
  await db()
    .insert(passwordResetTokens)
    .values({
      userId,
      tokenHash: hashToken(token),
      expiresAt: sql`now() + make_interval(mins => ${RESET_TOKEN_MINUTES})`,
    });
  return token;
}

const unexpired = (token: string) =>
  and(eq(passwordResetTokens.tokenHash, hashToken(token)), gt(passwordResetTokens.expiresAt, sql`now()`));

export async function isResetTokenValid(token: string) {
  const [row] = await db()
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(unexpired(token));
  return Boolean(row);
}

/** Deletes the token and returns its user id, or null if it's unknown or expired. Single-use. */
export async function consumeResetToken(token: string) {
  const [row] = await db()
    .delete(passwordResetTokens)
    .where(unexpired(token))
    .returning({ userId: passwordResetTokens.userId });
  return row?.userId ?? null;
}

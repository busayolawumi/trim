import "server-only";
import { and, eq, gt, isNull, lt, sql } from "drizzle-orm";
import { db, emailVerificationTokens, users } from "@/db";
import { APP_BASE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { renderEmail } from "@/lib/email-template";
import { hashToken, newToken } from "@/lib/tokens";

const VERIFY_TOKEN_HOURS = 24;

/** Emails the user a fresh verification link, replacing any earlier ones. */
export async function sendVerificationEmail(userId: string, email: string) {
  const token = newToken();
  await db().delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  await db()
    .delete(emailVerificationTokens)
    .where(lt(emailVerificationTokens.expiresAt, sql`now()`));
  await db()
    .insert(emailVerificationTokens)
    .values({
      userId,
      tokenHash: hashToken(token),
      expiresAt: sql`now() + make_interval(hours => ${VERIFY_TOKEN_HOURS})`,
    });

  const link = `${APP_BASE_URL}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    ...renderEmail({
      subject: "Verify your email for Trim",
      preheader: "Confirm your address to start creating short links.",
      hero: "verify",
      heroAlt: "Envelope with a tick",
      heading: "Confirm your email",
      intro: "Welcome to Trim. Confirm this is your address and you can start creating short links.",
      button: { label: "Verify email", url: link },
      expiry: `Expires in ${VERIFY_TOKEN_HOURS} hours`,
      footer: "If you didn't sign up for Trim, you can ignore this email.",
    }),
  });
}

/**
 * Marks the token's user as verified. The token isn't deleted, so opening the link
 * twice (e.g. after an email scanner already followed it) still succeeds.
 */
export async function verifyEmailToken(token: string) {
  const [row] = await db()
    .select({ userId: emailVerificationTokens.userId })
    .from(emailVerificationTokens)
    .where(
      and(
        eq(emailVerificationTokens.tokenHash, hashToken(token)),
        gt(emailVerificationTokens.expiresAt, sql`now()`),
      ),
    );
  if (!row) return false;

  await db()
    .update(users)
    .set({ emailVerifiedAt: sql`now()` })
    .where(and(eq(users.id, row.userId), isNull(users.emailVerifiedAt)));
  return true;
}

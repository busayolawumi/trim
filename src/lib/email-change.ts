import "server-only";
import { after } from "next/server";
import { and, eq, gt, lt, ne, sql } from "drizzle-orm";
import {
  db,
  emailChangeTokens,
  emailVerificationTokens,
  isUniqueViolation,
  passwordResetTokens,
  users,
} from "@/db";
import { SHORT_BASE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { hashToken, newToken } from "@/lib/tokens";

const CHANGE_TOKEN_HOURS = 24;

/** Emails a confirmation link to the new address, replacing any earlier request. */
export async function sendEmailChangeLink(userId: string, newEmail: string) {
  const token = newToken();
  await db().delete(emailChangeTokens).where(eq(emailChangeTokens.userId, userId));
  await db().delete(emailChangeTokens).where(lt(emailChangeTokens.expiresAt, sql`now()`));
  await db()
    .insert(emailChangeTokens)
    .values({
      userId,
      newEmail,
      tokenHash: hashToken(token),
      expiresAt: sql`now() + make_interval(hours => ${CHANGE_TOKEN_HOURS})`,
    });

  const link = `${SHORT_BASE_URL}/confirm-email?token=${token}`;
  await sendEmail({
    to: newEmail,
    subject: "Confirm your new email for Trim",
    text:
      `Someone (hopefully you) asked to use this address for their Trim account.\n\n` +
      `Confirm it here (the link expires in ${CHANGE_TOKEN_HOURS} hours):\n${link}\n\n` +
      `If you didn't ask for this, you can ignore this email. Nothing will change.`,
  });
}

/** The address the user asked to switch to, while its link is still valid and not yet opened. */
export async function pendingEmailChange(userId: string) {
  const [row] = await db()
    .select({ newEmail: emailChangeTokens.newEmail })
    .from(emailChangeTokens)
    .innerJoin(users, eq(users.id, emailChangeTokens.userId))
    .where(
      and(
        eq(emailChangeTokens.userId, userId),
        gt(emailChangeTokens.expiresAt, sql`now()`),
        // Opened links are kept until they expire; those changes are done.
        ne(emailChangeTokens.newEmail, users.email),
      ),
    );
  return row?.newEmail ?? null;
}

/** Cancels a pending change, e.g. when the password changes, in case someone else asked for it. */
export async function cancelEmailChange(userId: string) {
  await db().delete(emailChangeTokens).where(eq(emailChangeTokens.userId, userId));
}

export type EmailChangeResult =
  | { status: "changed"; email: string }
  | { status: "taken" }
  | { status: "invalid" };

/**
 * Switches the user to the token's address and tells the old one. Like verification links, the
 * token isn't deleted, so opening it twice (e.g. after an email scanner followed it) still succeeds.
 * A new request deletes it, so an old link can't switch the email back later.
 */
export async function confirmEmailChange(token: string): Promise<EmailChangeResult> {
  const [row] = await db()
    .select({
      userId: emailChangeTokens.userId,
      newEmail: emailChangeTokens.newEmail,
      currentEmail: users.email,
    })
    .from(emailChangeTokens)
    .innerJoin(users, eq(users.id, emailChangeTokens.userId))
    .where(
      and(eq(emailChangeTokens.tokenHash, hashToken(token)), gt(emailChangeTokens.expiresAt, sql`now()`)),
    );
  if (!row) return { status: "invalid" };
  if (row.currentEmail === row.newEmail) return { status: "changed", email: row.newEmail };

  try {
    await db()
      .update(users)
      // Opening the link proves they can read the new inbox.
      .set({ email: row.newEmail, emailVerifiedAt: sql`now()` })
      .where(eq(users.id, row.userId));
  } catch (error) {
    // Someone signed up with the address after the link was sent.
    if (isUniqueViolation(error)) return { status: "taken" };
    throw error;
  }
  // Links sent to the old address shouldn't work any more.
  await db().delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, row.userId));
  await db().delete(passwordResetTokens).where(eq(passwordResetTokens.userId, row.userId));

  // After responding, so a failed send doesn't turn a completed change into an error page.
  after(() =>
    sendEmail({
      to: row.currentEmail,
      subject: "Your Trim email was changed",
      text:
        `The email for your Trim account was changed from ${row.currentEmail} to ${row.newEmail}.\n\n` +
        `If you didn't make this change, someone else may know your password.`,
    }),
  );
  return { status: "changed", email: row.newEmail };
}

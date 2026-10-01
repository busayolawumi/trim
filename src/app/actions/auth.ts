"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, passwordResetTokens, users } from "@/db";
import { SHORT_BASE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { sendVerificationEmail } from "@/lib/email-verification";
import { fakeVerifyPassword, hashPassword, verifyPassword } from "@/lib/password";
import { consumeResetToken, createResetToken, RESET_TOKEN_MINUTES } from "@/lib/password-reset";
import { clearAttempts, clientIp, isRateLimited, recordAttempt, type Limit } from "@/lib/rate-limit";
import { createSession, deleteSession, requireUser } from "@/lib/session";

export type AuthState = { error?: string } | undefined;
export type ForgotPasswordState = { error?: string; sent?: boolean } | undefined;
export type ResendVerificationState = { error?: string; sent?: boolean } | undefined;

const LOGIN_PER_EMAIL: Limit = { max: 5, windowMinutes: 15 };
const LOGIN_PER_IP: Limit = { max: 20, windowMinutes: 60 };
const SIGNUP_PER_IP: Limit = { max: 3, windowMinutes: 60 };
const RESET_PER_EMAIL: Limit = { max: 3, windowMinutes: 60 };
const RESET_PER_IP: Limit = { max: 5, windowMinutes: 60 };
const VERIFY_RESEND_PER_USER: Limit = { max: 3, windowMinutes: 60 };

const TOO_MANY = "Too many attempts. Please try again later.";

const passwordSchema = z.string().min(8, "Password must be at least 8 characters.").max(200);

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.email("Enter a valid email.").trim().toLowerCase(),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.email("Enter a valid email.").trim().toLowerCase(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "Passwords don't match." });

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const ipKey = `signup:ip:${await clientIp()}`;
  if (await isRateLimited(ipKey, SIGNUP_PER_IP)) return { error: TOO_MANY };
  await recordAttempt(ipKey);

  const { name, email, password } = parsed.data;
  const [user] = await db()
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id, sessionVersion: users.sessionVersion });

  if (!user) return { error: "An account with that email already exists." };

  after(() => sendVerificationEmail(user.id, email));
  await createSession(user.id, user.sessionVersion);
  redirect("/dashboard");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };

  const emailKey = `login:email:${parsed.data.email}`;
  const ipKey = `login:ip:${await clientIp()}`;
  const [emailLimited, ipLimited] = await Promise.all([
    isRateLimited(emailKey, LOGIN_PER_EMAIL),
    isRateLimited(ipKey, LOGIN_PER_IP),
  ]);
  if (emailLimited || ipLimited) return { error: TOO_MANY };

  const [user] = await db()
    .select({ id: users.id, passwordHash: users.passwordHash, sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.email, parsed.data.email));

  let valid = false;
  if (user) valid = await verifyPassword(parsed.data.password, user.passwordHash);
  else await fakeVerifyPassword(parsed.data.password);

  if (!user || !valid) {
    await recordAttempt(emailKey, ipKey);
    return { error: "Incorrect email or password." };
  }

  await clearAttempts(emailKey);
  await createSession(user.id, user.sessionVersion);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function requestPasswordReset(
  _: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email } = parsed.data;

  const emailKey = `reset:email:${email}`;
  const ipKey = `reset:ip:${await clientIp()}`;
  const [emailLimited, ipLimited] = await Promise.all([
    isRateLimited(emailKey, RESET_PER_EMAIL),
    isRateLimited(ipKey, RESET_PER_IP),
  ]);
  if (emailLimited || ipLimited) return { error: TOO_MANY };
  await recordAttempt(emailKey, ipKey);

  // Done after responding, so the response looks the same (content and timing)
  // whether or not an account exists for this email.
  after(async () => {
    const [user] = await db().select({ id: users.id }).from(users).where(eq(users.email, email));
    if (!user) return;

    const token = await createResetToken(user.id);
    const link = `${SHORT_BASE_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: "Reset your Trim password",
      text:
        `Someone (hopefully you) asked to reset the password for your Trim account.\n\n` +
        `Choose a new password here (the link expires in ${RESET_TOKEN_MINUTES} minutes):\n${link}\n\n` +
        `If you didn't ask for this, you can ignore this email. Your password won't change.`,
    });
  });

  return { sent: true };
}

export async function resetPassword(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Only consume the token once the new password is known to be valid.
  const userId = await consumeResetToken(parsed.data.token);
  if (!userId) return { error: "This reset link is invalid or has expired. Request a new one." };

  // Bumping the session version logs out every existing session.
  const [user] = await db()
    .update(users)
    .set({
      passwordHash: await hashPassword(parsed.data.password),
      sessionVersion: sql`${users.sessionVersion} + 1`,
      // The reset link proves they can read this inbox.
      emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, now())`,
    })
    .where(eq(users.id, userId))
    .returning({ id: users.id, email: users.email, sessionVersion: users.sessionVersion });
  if (!user) return { error: "This reset link is invalid or has expired. Request a new one." };

  await db().delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await clearAttempts(`login:email:${user.email}`);

  await createSession(user.id, user.sessionVersion);
  redirect("/dashboard");
}

export async function resendVerificationEmail(): Promise<ResendVerificationState> {
  const user = await requireUser();
  if (user.emailVerifiedAt) return { sent: true };

  const key = `verify:user:${user.id}`;
  if (await isRateLimited(key, VERIFY_RESEND_PER_USER)) return { error: TOO_MANY };
  await recordAttempt(key);

  await sendVerificationEmail(user.id, user.email);
  return { sent: true };
}

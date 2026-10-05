"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, passwordResetTokens, users } from "@/db";
import { AVATAR_IDS } from "@/lib/avatars";
import { cancelEmailChange, sendEmailChangeLink } from "@/lib/email-change";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearAttempts, isRateLimited, recordAttempt, TOO_MANY, type Limit } from "@/lib/rate-limit";
import { createSession, deleteSession, requireUser } from "@/lib/session";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/validation";

export type SettingsState = { error?: string; message?: string } | undefined;

// Same as failed logins, so a stolen session can't be used to guess the password.
const PASSWORD_CHECK_PER_USER: Limit = { max: 5, windowMinutes: 15 };
// Each request emails an address the user typed in.
const EMAIL_CHANGE_PER_USER: Limit = { max: 3, windowMinutes: 60 };

const avatarSchema = z.enum(AVATAR_IDS);

const emailChangeSchema = z.object({ email: emailSchema, password: z.string() });

const passwordChangeSchema = z
  .object({
    currentPassword: z.string(),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { error: "Passwords don't match." });

/** Checks the user's current password. Returns an error message, or null if it's right. */
async function checkPassword(userId: string, password: string) {
  const key = `password:user:${userId}`;
  if (await isRateLimited(key, PASSWORD_CHECK_PER_USER)) return TOO_MANY;

  const [user] = await db()
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId));
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordAttempt(key);
    return "Incorrect password.";
  }

  await clearAttempts(key);
  return null;
}

/** Logs out every other session by bumping the version, and gives this one a fresh cookie. */
async function rotateSession(userId: string, changes: { passwordHash?: string } = {}) {
  const [user] = await db()
    .update(users)
    .set({ ...changes, sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId))
    .returning({ sessionVersion: users.sessionVersion });
  await createSession(userId, user.sessionVersion);
}

export async function updateName(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  await db().update(users).set({ name: parsed.data }).where(eq(users.id, user.id));
  revalidatePath("/dashboard/settings");
  return { message: "Saved." };
}

export async function updateAvatar(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = avatarSchema.safeParse(formData.get("avatar"));
  if (!parsed.success) return { error: "Pick one of the avatars." };

  await db().update(users).set({ avatar: parsed.data }).where(eq(users.id, user.id));
  // The header shows it on every dashboard page.
  revalidatePath("/dashboard", "layout");
  return undefined;
}

/** Emails a confirmation link to the new address. The email only changes once it's opened. */
export async function requestEmailChange(
  _: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = emailChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { email, password } = parsed.data;
  if (email === user.email) return { error: "That's already your email." };

  const passwordError = await checkPassword(user.id, password);
  if (passwordError) return { error: passwordError };

  const key = `email-change:user:${user.id}`;
  if (await isRateLimited(key, EMAIL_CHANGE_PER_USER)) return { error: TOO_MANY };

  // Checked again when the link is opened, in case someone signs up with it meanwhile.
  const [taken] = await db().select({ id: users.id }).from(users).where(eq(users.email, email));
  if (taken) return { error: "An account with that email already exists." };

  await recordAttempt(key);
  await sendEmailChangeLink(user.id, email);
  revalidatePath("/dashboard/settings");
  return { message: `Link sent to ${email}.` };
}

export async function changePassword(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const passwordError = await checkPassword(user.id, parsed.data.currentPassword);
  if (passwordError) return { error: passwordError };

  await rotateSession(user.id, { passwordHash: await hashPassword(parsed.data.password) });
  // Links requested before the change shouldn't still work.
  await db().delete(passwordResetTokens).where(eq(passwordResetTokens.userId, user.id));
  await cancelEmailChange(user.id);
  return { message: "Password changed. Your other devices have been logged out." };
}

export async function logOutOtherDevices(): Promise<SettingsState> {
  const user = await requireUser();
  await rotateSession(user.id);
  return { message: "Logged out on all other devices." };
}

export async function deleteAccount(_: SettingsState, formData: FormData): Promise<SettingsState> {
  const user = await requireUser();
  const passwordError = await checkPassword(user.id, String(formData.get("password") ?? ""));
  if (passwordError) return { error: passwordError };

  // Links, clicks and tokens are deleted with the user (ON DELETE CASCADE).
  await db().delete(users).where(eq(users.id, user.id));
  await deleteSession();
  redirect("/");
}

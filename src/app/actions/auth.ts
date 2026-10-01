"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, users } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: string } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80),
  email: z.email("Enter a valid email.").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase(),
  password: z.string(),
});

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, email, password } = parsed.data;
  const [user] = await db()
    .insert(users)
    .values({ name, email, passwordHash: await hashPassword(password) })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id });

  if (!user) return { error: "An account with that email already exists." };

  await createSession(user.id);
  redirect("/dashboard");
}

export async function login(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter your email and password." };

  const [user] = await db()
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, parsed.data.email));

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Incorrect email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { jwtVerify, SignJWT } from "jose";
import { and, eq } from "drizzle-orm";
import { db, users } from "@/db";

const COOKIE_NAME = "trim_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, sessionVersion: number) {
  const token = await new SignJWT({ sub: userId, ver: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function deleteSession() {
  (await cookies()).delete(COOKIE_NAME);
}

async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    // Sessions created before versions existed have no `ver`; treat them as version 0.
    return { userId: payload.sub, version: typeof payload.ver === "number" ? payload.ver : 0 };
  } catch {
    return null;
  }
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      emailVerifiedAt: users.emailVerifiedAt,
    })
    .from(users)
    .where(and(eq(users.id, session.userId), eq(users.sessionVersion, session.version)));
  return user ?? null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

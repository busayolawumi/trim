import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let instance: ReturnType<typeof create> | undefined;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(url, { schema });
}

// Created on first use so builds don't need a database connection.
export function db() {
  instance ??= create();
  return instance;
}

/** True for Postgres' unique-constraint error, which Drizzle wraps in its own error. */
export function isUniqueViolation(error: unknown) {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: string }).code === "23505") return true;
  }
  return false;
}

export * from "./schema";

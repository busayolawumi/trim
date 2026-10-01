import "server-only";
import { createHash, randomBytes } from "node:crypto";

/** A random token for an emailed link (256 bits). */
export function newToken() {
  return randomBytes(32).toString("base64url");
}

// Tokens are 256 random bits, so a fast hash is enough (no need for scrypt).
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

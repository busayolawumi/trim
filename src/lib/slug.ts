import { randomInt } from "node:crypto";

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
export const SLUG_MIN = 3;
export const SLUG_MAX = 50;

// Paths the app itself uses; these can never be short links.
const RESERVED = new Set([
  "api",
  "dashboard",
  "login",
  "logout",
  "signup",
  "register",
  "settings",
  "account",
  "admin",
  "about",
  "help",
  "terms",
  "privacy",
  "static",
  "assets",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

/** Returns an error message, or null if the slug is valid. */
export function validateSlug(slug: string): string | null {
  if (slug.length < SLUG_MIN) return `Must be at least ${SLUG_MIN} characters.`;
  if (slug.length > SLUG_MAX) return `Must be at most ${SLUG_MAX} characters.`;
  if (!SLUG_PATTERN.test(slug))
    return "Use letters, numbers and hyphens only (not at the start or end).";
  if (RESERVED.has(slug)) return "That name is reserved.";
  return null;
}

const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function randomSlug(length = 6) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

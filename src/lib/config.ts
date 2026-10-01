export const SHORT_BASE_URL = (
  process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SHORT_HOST = SHORT_BASE_URL.replace(/^https?:\/\//, "");

export function shortUrl(slug: string) {
  return `${SHORT_BASE_URL}/${slug}`;
}

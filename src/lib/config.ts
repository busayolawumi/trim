export const SHORT_BASE_URL = (
  process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SHORT_HOST = SHORT_BASE_URL.replace(/^https?:\/\//, "");

/** Where the site itself lives: login, dashboard and the links in emails. Defaults to the short-link URL. */
export const APP_BASE_URL = (process.env.NEXT_PUBLIC_APP_BASE_URL || SHORT_BASE_URL).replace(/\/$/, "");

export function shortUrl(slug: string) {
  return `${SHORT_BASE_URL}/${slug}`;
}

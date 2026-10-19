export const TITLE_MAX_LENGTH = 100;

/** Trims and collapses whitespace. Empty means no title (null); too long is an error. */
export function normalizeTitle(raw: string): { title: string | null } | { error: string } {
  const title = raw.replace(/\s+/g, " ").trim();
  if (title.length > TITLE_MAX_LENGTH) {
    return { error: `Keep the title to ${TITLE_MAX_LENGTH} characters or fewer.` };
  }
  return { title: title || null };
}

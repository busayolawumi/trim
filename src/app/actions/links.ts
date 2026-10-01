"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, links } from "@/db";
import { isUnsafeUrl } from "@/lib/safe-browsing";
import { requireUser } from "@/lib/session";
import { normalizeSlug, randomSlug, validateSlug } from "@/lib/slug";

const MAX_LINKS_PER_USER = 100;

export type CreateLinkState =
  | { error?: string; slugError?: string; created?: string }
  | undefined;

export type UpdateLinkState = { error?: string; updated?: boolean } | undefined;
export type RenameLinkState = { error?: string } | undefined;

const urlSchema = z
  .url({ protocol: /^https?$/, error: "Enter a full URL starting with http:// or https://" })
  .max(2048);

const linkIdSchema = z.uuid();

function shortHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

/** Checks a destination URL for both new and edited links. */
async function checkDestination(raw: string): Promise<{ url: string } | { error: string }> {
  const parsedUrl = urlSchema.safeParse(raw.trim());
  if (!parsedUrl.success) return { error: parsedUrl.error.issues[0].message };
  const url = parsedUrl.data;

  if (new URL(url).hostname === shortHost()) {
    return { error: "You can't shorten a Trim link." };
  }

  if (await isUnsafeUrl(url)) {
    return { error: "This link goes to a site known to be dangerous, so we can't shorten it." };
  }

  return { url };
}

export async function createLink(
  _: CreateLinkState,
  formData: FormData,
): Promise<CreateLinkState> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) return { error: "Verify your email before creating links." };

  const checked = await checkDestination(String(formData.get("url") ?? ""));
  if ("error" in checked) return checked;
  const { url } = checked;

  const [{ total }] = await db()
    .select({ total: count() })
    .from(links)
    .where(eq(links.userId, user.id));
  if (total >= MAX_LINKS_PER_USER) {
    return { error: `You've reached the limit of ${MAX_LINKS_PER_USER} links.` };
  }

  const requested = normalizeSlug(String(formData.get("slug") ?? ""));
  let slug: string | null = null;

  if (requested) {
    const slugError = validateSlug(requested);
    if (slugError) return { slugError };

    slug = await insertLink(user.id, requested, url);
    if (!slug) return { slugError: `"${requested}" is already taken.` };
  } else {
    // Retry on the rare collision with an existing random slug.
    for (let attempt = 0; attempt < 5 && !slug; attempt++) {
      slug = await insertLink(user.id, randomSlug(), url);
    }
    if (!slug) return { error: "Couldn't generate a short link. Please try again." };
  }

  revalidatePath("/dashboard");
  return { created: slug };
}

async function insertLink(userId: string, slug: string, url: string) {
  const [row] = await db()
    .insert(links)
    .values({ userId, slug, url })
    .onConflictDoNothing({ target: links.slug })
    .returning({ slug: links.slug });
  return row?.slug ?? null;
}

/** Changes where a link points. The slug (and its click history) stays the same. */
export async function updateLinkUrl(
  linkId: string,
  _: UpdateLinkState,
  formData: FormData,
): Promise<UpdateLinkState> {
  const user = await requireUser();
  if (!linkIdSchema.safeParse(linkId).success) return { error: "Link not found." };

  const checked = await checkDestination(String(formData.get("url") ?? ""));
  if ("error" in checked) return checked;

  const [row] = await db()
    .update(links)
    .set({ url: checked.url })
    .where(and(eq(links.id, linkId), eq(links.userId, user.id)))
    .returning({ slug: links.slug });
  if (!row) return { error: "Link not found." };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${row.slug}`);
  return { updated: true };
}

/** True for Postgres' unique-constraint error, which Drizzle wraps in its own error. */
function isUniqueViolation(error: unknown) {
  for (let e = error; e instanceof Error; e = e.cause) {
    if ((e as { code?: string }).code === "23505") return true;
  }
  return false;
}

/**
 * Gives a link a new slug. Click history stays; the old short URL stops working.
 * Redirects to the link's stats page at its new address.
 */
export async function renameLink(
  linkId: string,
  _: RenameLinkState,
  formData: FormData,
): Promise<RenameLinkState> {
  const user = await requireUser();
  if (!linkIdSchema.safeParse(linkId).success) return { error: "Link not found." };

  const slug = normalizeSlug(String(formData.get("slug") ?? ""));
  const slugError = validateSlug(slug);
  if (slugError) return { error: slugError };

  let row: { slug: string } | undefined;
  try {
    [row] = await db()
      .update(links)
      .set({ slug })
      .where(and(eq(links.id, linkId), eq(links.userId, user.id)))
      .returning({ slug: links.slug });
  } catch (error) {
    if (isUniqueViolation(error)) return { error: `"${slug}" is already taken.` };
    throw error;
  }
  if (!row) return { error: "Link not found." };

  revalidatePath("/dashboard");
  redirect(`/dashboard/${row.slug}`);
}

export async function deleteLink(linkId: string) {
  const user = await requireUser();
  if (!linkIdSchema.safeParse(linkId).success) return;
  await db()
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.userId, user.id)));
  revalidatePath("/dashboard");
}

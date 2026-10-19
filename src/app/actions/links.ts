"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, isUniqueViolation, linkEvents, links } from "@/db";
import { normalizeTitle } from "@/lib/link-title";
import { isUnsafeUrl } from "@/lib/safe-browsing";
import { requireUser } from "@/lib/session";
import { normalizeSlug, randomSlug, validateSlug } from "@/lib/slug";

const MAX_LINKS_PER_USER = 100;

export type CreateLinkState =
  | { error?: string; slugError?: string; titleError?: string; created?: string }
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

  const named = normalizeTitle(String(formData.get("title") ?? ""));
  if ("error" in named) return { titleError: named.error };
  const { title } = named;

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

    slug = await insertLink(user.id, requested, url, title);
    if (!slug) return { slugError: `"${requested}" is already taken.` };
  } else {
    // Retry on the rare collision with an existing random slug.
    for (let attempt = 0; attempt < 5 && !slug; attempt++) {
      slug = await insertLink(user.id, randomSlug(), url, title);
    }
    if (!slug) return { error: "Couldn't generate a short link. Please try again." };
  }

  revalidatePath("/dashboard");
  return { created: slug };
}

/** Inserts the link and its "created" history entry together. Null if the slug is taken. */
async function insertLink(userId: string, slug: string, url: string, title: string | null) {
  const { rows } = await db().execute<{ slug: string }>(sql`
    with inserted as (
      insert into ${links} (user_id, slug, url, title) values (${userId}, ${slug}, ${url}, ${title})
      on conflict (slug) do nothing
      returning id, slug
    ), logged as (
      insert into ${linkEvents} (link_id, type, new_value) select id, 'created', ${url} from inserted
    )
    select slug from inserted
  `);
  return rows[0]?.slug ?? null;
}

// Each editable column and the link_events type its changes are logged as.
const EDITABLE = {
  url: { column: links.url, event: "destination" },
  slug: { column: links.slug, event: "slug" },
  title: { column: links.title, event: "title" },
} as const;

/**
 * Sets one column of the user's link and logs the change in link_events, in one statement so the
 * history can't miss a change. Saving the same value again isn't logged. Returns the link's slug
 * after the change, or null if the link isn't the user's.
 */
async function changeLink(
  userId: string,
  linkId: string,
  field: keyof typeof EDITABLE,
  value: string | null,
) {
  const { column, event } = EDITABLE[field];
  const { rows } = await db().execute<{ slug: string }>(sql`
    with old as (
      select id, ${column} as old_value from ${links} where id = ${linkId} and user_id = ${userId}
    ), updated as (
      update ${links} set ${sql.identifier(field)} = ${value} from old where ${links.id} = old.id
      returning ${links.id} as id, ${links.slug} as slug, old.old_value
    ), logged as (
      insert into ${linkEvents} (link_id, type, old_value, new_value)
      select id, ${event}, old_value, ${value} from updated
      where old_value is distinct from ${value}
    )
    select slug from updated
  `);
  return rows[0]?.slug ?? null;
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

  const newSlug = await changeLink(user.id, linkId, "url", checked.url);
  if (!newSlug) return { error: "Link not found." };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${newSlug}`);
  return { updated: true };
}

/** Sets or clears (empty) the link's title. */
export async function updateLinkTitle(
  linkId: string,
  _: UpdateLinkState,
  formData: FormData,
): Promise<UpdateLinkState> {
  const user = await requireUser();
  if (!linkIdSchema.safeParse(linkId).success) return { error: "Link not found." };

  const named = normalizeTitle(String(formData.get("title") ?? ""));
  if ("error" in named) return named;

  const slug = await changeLink(user.id, linkId, "title", named.title);
  if (!slug) return { error: "Link not found." };

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/${slug}`);
  return { updated: true };
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

  let newSlug: string | null;
  try {
    newSlug = await changeLink(user.id, linkId, "slug", slug);
  } catch (error) {
    if (isUniqueViolation(error)) return { error: `"${slug}" is already taken.` };
    throw error;
  }
  if (!newSlug) return { error: "Link not found." };

  revalidatePath("/dashboard");
  redirect(`/dashboard/${newSlug}`);
}

export async function deleteLink(linkId: string) {
  const user = await requireUser();
  if (!linkIdSchema.safeParse(linkId).success) return;
  await db()
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.userId, user.id)));
  revalidatePath("/dashboard");
}

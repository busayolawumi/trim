"use server";

import { revalidatePath } from "next/cache";
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

const urlSchema = z
  .url({ protocol: /^https?$/, error: "Enter a full URL starting with http:// or https://" })
  .max(2048);

function shortHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SHORT_BASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

export async function createLink(
  _: CreateLinkState,
  formData: FormData,
): Promise<CreateLinkState> {
  const user = await requireUser();
  if (!user.emailVerifiedAt) return { error: "Verify your email before creating links." };

  const parsedUrl = urlSchema.safeParse(String(formData.get("url") ?? "").trim());
  if (!parsedUrl.success) return { error: parsedUrl.error.issues[0].message };
  const url = parsedUrl.data;

  if (new URL(url).hostname === shortHost()) {
    return { error: "You can't shorten a Trim link." };
  }

  if (await isUnsafeUrl(url)) {
    return { error: "This link goes to a site known to be dangerous, so we can't shorten it." };
  }

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

export async function deleteLink(linkId: string) {
  const user = await requireUser();
  await db()
    .delete(links)
    .where(and(eq(links.id, linkId), eq(links.userId, user.id)));
  revalidatePath("/dashboard");
}

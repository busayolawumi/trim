import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, links } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { normalizeSlug, validateSlug } from "@/lib/slug";

export async function GET(request: NextRequest) {
  if (!(await getCurrentUser())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = normalizeSlug(request.nextUrl.searchParams.get("slug") ?? "");
  const error = validateSlug(slug);
  if (error) return Response.json({ available: false, reason: error });

  const [existing] = await db()
    .select({ id: links.id })
    .from(links)
    .where(eq(links.slug, slug));

  return Response.json(
    existing ? { available: false, reason: `"${slug}" is already taken.` } : { available: true },
  );
}

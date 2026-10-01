import { after, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { clicks, db, links } from "@/db";
import { normalizeSlug } from "@/lib/slug";
import { parseUserAgent, referrerHost } from "@/lib/user-agent";

export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]">) {
  const slug = normalizeSlug((await ctx.params).slug);

  const [link] = await db()
    .select({ id: links.id, url: links.url })
    .from(links)
    .where(eq(links.slug, slug));

  if (!link) {
    return Response.redirect(new URL(`/?missing=${encodeURIComponent(slug)}`, request.url), 302);
  }

  const { headers } = request;
  // Logged after the response is sent so it never slows the redirect down.
  after(async () => {
    const ua = parseUserAgent(headers.get("user-agent"));
    await db().insert(clicks).values({
      linkId: link.id,
      referrer: referrerHost(headers.get("referer")),
      country: headers.get("x-vercel-ip-country"),
      device: ua.device,
      browser: ua.browser,
      isBot: ua.isBot,
    });
  });

  // 302 (not 301) so browsers don't cache the redirect and every click reaches us.
  return new Response(null, {
    status: 302,
    headers: { Location: link.url, "Cache-Control": "no-store" },
  });
}

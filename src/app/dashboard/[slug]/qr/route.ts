import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, links } from "@/db";
import { qrPng, qrSvg } from "@/lib/qr";
import { getCurrentUser } from "@/lib/session";

/** Downloads the QR code for one of the user's links: PNG by default, SVG with ?format=svg. */
export async function GET(request: NextRequest, ctx: RouteContext<"/dashboard/[slug]/qr">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const slug = (await ctx.params).slug.toLowerCase();
  const [link] = await db()
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.slug, slug), eq(links.userId, user.id)));
  if (!link) return new Response("Not found", { status: 404 });

  const svg = request.nextUrl.searchParams.get("format") === "svg";
  const body = svg ? await qrSvg(slug) : new Uint8Array(await qrPng(slug));

  return new Response(body, {
    headers: {
      "Content-Type": svg ? "image/svg+xml" : "image/png",
      "Content-Disposition": `attachment; filename="trim-${slug}-qr.${svg ? "svg" : "png"}"`,
      "Cache-Control": "no-store",
    },
  });
}

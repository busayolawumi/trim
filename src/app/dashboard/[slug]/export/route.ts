import { and, asc, eq, sql } from "drizzle-orm";
import { clicks, db, links } from "@/db";
import { countryName } from "@/lib/countries";
import { getCurrentUser } from "@/lib/session";
import { getTimezone } from "@/lib/timezone";

const BATCH_SIZE = 5000;

const HEADER = ["time_utc", "time_local", "referrer", "country_code", "country", "device", "browser", "is_bot"];

function csvField(value: string | null) {
  if (value == null) return "";
  // Stop spreadsheets from treating a value as a formula.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// created_at as Postgres text keeps microseconds; a JS Date would round to ms and repeat rows.
type Cursor = { createdAt: string; id: string };

/** One batch of clicks, oldest first. Keyset pagination: continues after the last (created_at, id) seen. */
function fetchBatch(linkId: string, tz: string, after: Cursor | null) {
  return db()
    .select({
      id: clicks.id,
      createdAt: clicks.createdAt,
      cursor: sql<string>`${clicks.createdAt}::text`,
      local: sql<string>`to_char(${clicks.createdAt} at time zone ${tz}, 'YYYY-MM-DD HH24:MI:SS')`,
      referrer: clicks.referrer,
      country: clicks.country,
      device: clicks.device,
      browser: clicks.browser,
      isBot: clicks.isBot,
    })
    .from(clicks)
    .where(
      and(
        eq(clicks.linkId, linkId),
        after
          ? sql`(${clicks.createdAt}, ${clicks.id}) > (${after.createdAt}::timestamptz, ${after.id}::uuid)`
          : undefined,
      ),
    )
    .orderBy(asc(clicks.createdAt), asc(clicks.id))
    .limit(BATCH_SIZE);
}

/** Downloads every click on one of the user's links as CSV, streamed in batches. */
export async function GET(_: Request, ctx: RouteContext<"/dashboard/[slug]/export">) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const slug = (await ctx.params).slug.toLowerCase();
  const [link] = await db()
    .select({ id: links.id })
    .from(links)
    .where(and(eq(links.slug, slug), eq(links.userId, user.id)));
  if (!link) return new Response("Not found", { status: 404 });

  const tz = await getTimezone();
  const encoder = new TextEncoder();

  async function* rows() {
    yield HEADER.join(",") + "\n";

    let after: Cursor | null = null;
    while (true) {
      const batch = await fetchBatch(link.id, tz, after);

      yield batch
        .map((c) =>
          [
            c.createdAt.toISOString(),
            c.local,
            c.referrer,
            c.country,
            c.country ? countryName(c.country) : null,
            c.device,
            c.browser,
            c.isBot ? "true" : "false",
          ]
            .map(csvField)
            .join(","),
        )
        .join("\n") + (batch.length ? "\n" : "");

      if (batch.length < BATCH_SIZE) return;
      const last = batch[batch.length - 1];
      after = { createdAt: last.cursor, id: last.id };
    }
  }

  const iterator = rows();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) controller.close();
      else controller.enqueue(encoder.encode(value));
    },
  });

  const date = new Date().toISOString().slice(0, 10);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trim-${slug}-clicks-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

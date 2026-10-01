import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, sql, type AnyColumn } from "drizzle-orm";
import { clicks, db, links } from "@/db";
import { CopyButton } from "@/components/copy-button";
import { cardClass } from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { requireUser } from "@/lib/session";

const DAYS = 30;

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryName(code: string) {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export async function generateMetadata({ params }: PageProps<"/dashboard/[slug]">) {
  return { title: `/${(await params).slug} · Trim` };
}

export default async function LinkStatsPage({ params }: PageProps<"/dashboard/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;

  const [link] = await db()
    .select()
    .from(links)
    .where(and(eq(links.slug, slug.toLowerCase()), eq(links.userId, user.id)));
  if (!link) notFound();

  const human = and(eq(clicks.linkId, link.id), eq(clicks.isBot, false));

  const breakdown = (column: AnyColumn, fallback: string) =>
    db()
      .select({ label: sql<string>`coalesce(${column}, ${fallback})`, value: count() })
      .from(clicks)
      .where(human)
      .groupBy(sql`1`)
      .orderBy(desc(count()))
      .limit(8);

  const [[totals], daily, referrers, countries, devices, browsers] = await Promise.all([
    db()
      .select({
        humans: sql<number>`count(*) filter (where not ${clicks.isBot})`.mapWith(Number),
        bots: sql<number>`count(*) filter (where ${clicks.isBot})`.mapWith(Number),
      })
      .from(clicks)
      .where(eq(clicks.linkId, link.id)),
    db().execute<{ day: string; value: number }>(sql`
      select to_char(d.day, 'YYYY-MM-DD') as day, count(c.id)::int as value
      from generate_series(current_date - ${DAYS - 1}::int, current_date, interval '1 day') as d(day)
      left join ${clicks} c
        on c.link_id = ${link.id}
        and not c.is_bot
        and c.created_at::date = d.day::date
      group by d.day
      order by d.day
    `),
    breakdown(clicks.referrer, "Direct / unknown"),
    breakdown(clicks.country, "Unknown"),
    breakdown(clicks.device, "Unknown"),
    breakdown(clicks.browser, "Unknown"),
  ]);

  const days = daily.rows;
  const maxDay = Math.max(1, ...days.map((d) => d.value));
  const last30 = days.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← All links
      </Link>

      <div className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-center`}>
        <div className="min-w-0 flex-1">
          <h1 className="font-mono text-lg font-semibold">{SHORT_HOST}/{link.slug}</h1>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm text-zinc-500 hover:underline"
          >
            → {link.url}
          </a>
          <p className="mt-1 text-xs text-zinc-500">
            Created {link.createdAt.toLocaleDateString("en", { dateStyle: "medium" })}
          </p>
        </div>
        <CopyButton text={shortUrl(link.slug)} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total clicks" value={totals.humans} />
        <Stat label={`Last ${DAYS} days`} value={last30} />
        <Stat
          label="Bot & preview hits"
          value={totals.bots}
          hint="Link previews from apps like WhatsApp or Slack. Not counted in totals."
        />
      </div>

      <section className={cardClass}>
        <h2 className="mb-4 font-semibold">Clicks over the last {DAYS} days</h2>
        <div className="flex h-40 items-end gap-1">
          {days.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-emerald-500 transition group-hover:bg-emerald-600"
                style={{ height: `${Math.max((d.value / maxDay) * 100, d.value ? 4 : 1)}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                {formatDay(d.day)}: {d.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>{days[0] && formatDay(days[0].day)}</span>
          <span>Today</span>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Breakdown title="Top referrers" rows={referrers} />
        <Breakdown
          title="Countries"
          rows={countries.map((r) => ({ ...r, label: r.label === "Unknown" ? r.label : countryName(r.label) }))}
        />
        <Breakdown title="Devices" rows={devices} />
        <Breakdown title="Browsers" rows={browsers} />
      </div>
    </div>
  );
}

function formatDay(day: string) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" });
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className={cardClass} title={hint}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className={cardClass}>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">No clicks yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.label} className="relative flex justify-between overflow-hidden rounded px-2 py-1 text-sm">
              <span
                className="absolute inset-y-0 left-0 bg-emerald-500/15"
                style={{ width: `${(r.value / max) * 100}%` }}
              />
              <span className="relative truncate">{r.label}</span>
              <span className="relative tabular-nums text-zinc-600 dark:text-zinc-400">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

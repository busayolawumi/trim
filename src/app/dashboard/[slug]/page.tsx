import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, getTableColumns, gte, sql, type AnyColumn } from "drizzle-orm";
import { clicks, db, links } from "@/db";
import { CopyButton } from "@/components/copy-button";
import { FileDownIcon } from "@/components/icons";
import { cardClass, iconButtonClass } from "@/components/ui";
import { shortUrl } from "@/lib/config";
import { countryName } from "@/lib/countries";
import { requireUser } from "@/lib/session";
import { getTimezone } from "@/lib/timezone";
import { LinkDestination, LinkSlug } from "./link-editors";
import { QrCodeButton } from "../qr-code-button";

// How far back the chart and breakdowns go. "All time" starts on the day the link was created.
const RANGES = {
  "7": { label: "7 days", days: 7 },
  "30": { label: "30 days", days: 30 },
  "90": { label: "90 days", days: 90 },
  all: { label: "All time", days: null },
} as const;
type Range = keyof typeof RANGES;
const DEFAULT_RANGE: Range = "30";

type Unit = "day" | "week" | "month";

/** Bar size for the all-time chart, so it stays under ~100 bars. */
function unitFor(spanDays: number): Unit {
  if (spanDays <= 90) return "day";
  if (spanDays <= 730) return "week";
  return "month";
}

export async function generateMetadata({ params }: PageProps<"/dashboard/[slug]">) {
  return { title: `/${(await params).slug} · Trim` };
}

export default async function LinkStatsPage({ params, searchParams }: PageProps<"/dashboard/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;
  const { range: rangeParam } = await searchParams;
  const range: Range =
    typeof rangeParam === "string" && Object.hasOwn(RANGES, rangeParam) ? (rangeParam as Range) : DEFAULT_RANGE;
  const { days } = RANGES[range];
  const tz = await getTimezone();

  const [link] = await db()
    .select({
      ...getTableColumns(links),
      // Calendar days since creation in the viewer's timezone, counting today. Sizes the
      // all-time chart and its average.
      spanDays: sql<number>`(now() at time zone ${tz})::date - (${links.createdAt} at time zone ${tz})::date + 1`.mapWith(Number),
    })
    .from(links)
    .where(and(eq(links.slug, slug.toLowerCase()), eq(links.userId, user.id)));
  if (!link) notFound();

  const spanDays = Math.max(1, link.spanDays);
  const unit: Unit = days ? "day" : unitFor(spanDays);

  // First calendar day shown, in the viewer's timezone, and the moment it starts.
  const firstDay = days
    ? sql`(now() at time zone ${tz})::date - ${days - 1}::int`
    : sql`(select (created_at at time zone ${tz})::date from ${links} where id = ${link.id})`;
  const since = days ? sql`((${firstDay})::timestamp at time zone ${tz})` : undefined;

  const human = and(eq(clicks.linkId, link.id), eq(clicks.isBot, false));
  const humanInRange = and(human, since && gte(clicks.createdAt, since));

  const breakdown = (column: AnyColumn, fallback: string) =>
    db()
      .select({ label: sql<string>`coalesce(${column}, ${fallback})`, value: count() })
      .from(clicks)
      .where(humanInRange)
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
    // One row per day/week/month in the viewer's timezone, ending with the current one.
    db().execute<{ day: string; value: number }>(sql`
      with bounds as (
        select date_trunc(${unit}, (${firstDay})::timestamp) as first,
               date_trunc(${unit}, now() at time zone ${tz}) as last
      )
      select to_char(b.bucket, 'YYYY-MM-DD') as day, count(c.id)::int as value
      from generate_series(
        (select first from bounds),
        (select last from bounds),
        ${`1 ${unit}`}::interval
      ) as b(bucket)
      left join ${clicks} c
        on c.link_id = ${link.id}
        and not c.is_bot
        ${since ? sql`and c.created_at >= ${since}` : sql``}
        and date_trunc(${unit}, c.created_at at time zone ${tz}) = b.bucket
      group by b.bucket
      order by b.bucket
    `),
    breakdown(clicks.referrer, "Direct / unknown"),
    breakdown(clicks.country, "Unknown"),
    breakdown(clicks.device, "Unknown"),
    breakdown(clicks.browser, "Unknown"),
  ]);

  const bars = daily.rows;
  const maxBar = Math.max(1, ...bars.map((d) => d.value));
  const inRange = bars.reduce((sum, d) => sum + d.value, 0);
  const emptyText = days ? "No clicks in this period." : "No clicks yet.";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← All links
      </Link>

      <div className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-center`}>
        <div className="min-w-0 flex-1">
          <LinkSlug linkId={link.id} slug={link.slug} />
          <LinkDestination linkId={link.id} url={link.url} />
          <p className="mt-1 text-xs text-zinc-500">
            Created {link.createdAt.toLocaleDateString("en", { dateStyle: "medium", timeZone: tz })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QrCodeButton slug={link.slug} />
          <a
            href={`/dashboard/${link.slug}/export`}
            download
            aria-label="Export clicks as CSV"
            title="Export clicks as CSV"
            className={iconButtonClass}
          >
            <FileDownIcon />
          </a>
          <CopyButton text={shortUrl(link.slug)} />
        </div>
      </div>

      <RangePicker slug={link.slug} current={range} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Total clicks" value={totals.humans} />
        {days ? (
          <Stat label={`Last ${days} days`} value={inRange} />
        ) : (
          <Stat label="Average per day" value={Math.round((totals.humans / spanDays) * 10) / 10} />
        )}
        <Stat
          label="Bot & preview hits"
          value={totals.bots}
          hint="Link previews from apps like WhatsApp or Slack. Not counted in totals."
        />
      </div>

      <section className={cardClass}>
        <h2 className="mb-4 font-semibold">
          {days ? `Clicks over the last ${days} days` : `All-time clicks per ${unit}`}
        </h2>
        {/* Thinner gaps for long ranges so 90 bars still fit on a phone. */}
        <div className={`flex h-40 items-end ${bars.length > 40 ? "gap-px" : "gap-1"}`}>
          {bars.map((d) => (
            <div key={d.day} className="group relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-emerald-500 transition group-hover:bg-emerald-600"
                style={{ height: `${Math.max((d.value / maxBar) * 100, d.value ? 4 : 1)}%` }}
              />
              <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-zinc-900 px-2 py-1 text-xs text-white group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                {UNITS[unit].format(d.day)}: {d.value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-zinc-500">
          <span>{bars[0] && UNITS[unit].format(bars[0].day)}</span>
          <span>{UNITS[unit].current}</span>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {unit === "week" && "Weeks start on Monday. "}Dates in your timezone ({tz.replace(/_/g, " ")}).
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Breakdown title="Top referrers" rows={referrers} empty={emptyText} />
        <Breakdown
          title="Countries"
          rows={countries.map((r) => ({ ...r, label: r.label === "Unknown" ? r.label : countryName(r.label) }))}
          empty={emptyText}
        />
        <Breakdown title="Devices" rows={devices} empty={emptyText} />
        <Breakdown title="Browsers" rows={browsers} empty={emptyText} />
      </div>
    </div>
  );
}

function formatDate(day: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en", options);
}

// Labels for one bar of the chart; `day` is the first day of the bar as YYYY-MM-DD.
const UNITS: Record<Unit, { current: string; format: (day: string) => string }> = {
  day: { current: "Today", format: (d) => formatDate(d, { month: "short", day: "numeric" }) },
  week: {
    current: "This week",
    format: (d) => `Week of ${formatDate(d, { month: "short", day: "numeric", year: "numeric" })}`,
  },
  month: { current: "This month", format: (d) => formatDate(d, { month: "short", year: "numeric" }) },
};

/** Links that switch the range (?range=), so it works without client JavaScript. */
function RangePicker({ slug, current }: { slug: string; current: Range }) {
  return (
    <nav
      aria-label="Date range"
      className="grid grid-cols-4 gap-1 self-stretch rounded-lg border border-zinc-200 bg-white p-1 text-xs sm:self-end sm:text-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {(Object.keys(RANGES) as Range[]).map((r) => (
        <Link
          key={r}
          href={r === DEFAULT_RANGE ? `/dashboard/${slug}` : `/dashboard/${slug}?range=${r}`}
          replace
          scroll={false}
          aria-current={r === current ? "page" : undefined}
          className={`whitespace-nowrap rounded-md px-2 py-1 text-center transition sm:px-3 ${
            r === current
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          {RANGES[r].label}
        </Link>
      ))}
    </nav>
  );
}

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className={cardClass} title={hint}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { label: string; value: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className={cardClass}>
      <h2 className="mb-3 font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
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

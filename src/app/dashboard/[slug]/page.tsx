import Link from "next/link";
import { notFound } from "next/navigation";
import { and, count, desc, eq, getTableColumns, gte, sql, type AnyColumn } from "drizzle-orm";
import type { ReactNode } from "react";
import { clicks, db, linkEvents, links } from "@/db";
import {
  ArrowLeftIcon,
  CornerDownRightIcon,
  FileDownIcon,
  LinkIcon,
  PencilIcon,
  TypeIcon,
} from "@/components/icons";
import { cardClass, iconButtonClass, rowIconButtonClass } from "@/components/ui";
import { SHORT_HOST } from "@/lib/config";
import { countryName } from "@/lib/countries";
import { domainOf } from "@/lib/domain";
import { requireUser } from "@/lib/session";
import { getTimezone } from "@/lib/timezone";
import { ClicksChart } from "./clicks-chart";
import { LinkDestination, LinkSlug, LinkTitle } from "./link-editors";
import { RangeMenu } from "./range-menu";
import { LinkFavicon } from "../link-favicon";
import { QrCodeButton } from "../qr-code-button";

// How far back the chart and breakdowns go. "All time" starts on the day the link was created.
const RANGES = {
  "7": { label: "Last 7 days", days: 7 },
  "30": { label: "Last 30 days", days: 30 },
  "90": { label: "Last 90 days", days: 90 },
  all: { label: "All time", days: null },
} as const;
type Range = keyof typeof RANGES;
const DEFAULT_RANGE: Range = "30";

type Unit = "day" | "week" | "month";

// How many changes the history shows, newest first.
const MAX_EVENTS = 50;

/** Bordered box inside the analytics card, for the chart and each breakdown. */
const panelClass = "rounded-xl border border-zinc-200 p-4 sm:p-5 dark:border-zinc-800";

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

  const [[totals], daily, referrers, countries, devices, browsers, events] = await Promise.all([
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
    // One extra, to know whether there are more than we show.
    db()
      .select()
      .from(linkEvents)
      .where(eq(linkEvents.linkId, link.id))
      .orderBy(desc(linkEvents.createdAt), desc(linkEvents.id))
      .limit(MAX_EVENTS + 1),
  ]);

  const bars = daily.rows;
  const inRange = bars.reduce((sum, d) => sum + d.value, 0);
  const emptyText = days ? "No clicks in this period." : "No clicks yet.";
  const domain = domainOf(link.url);
  const heading = link.title ?? domain;
  const dateTime = (date: Date, month: "long" | "short") =>
    date.toLocaleString("en", {
      year: "numeric",
      month,
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: tz,
      timeZoneName: "short",
    });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" aria-label="All links" title="All links" className={`${rowIconButtonClass} -ml-2`}>
          <ArrowLeftIcon />
        </Link>
        <LinkFavicon domain={domain} />
        <h1 className="min-w-0 flex-1 truncate text-2xl font-semibold tracking-tight sm:text-3xl" title={heading}>
          {heading}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
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
        </div>
      </div>

      <section className={`${cardClass} sm:p-6`}>
        <h2 className="text-lg font-semibold">Details</h2>
        <dl className="mt-4 flex flex-col gap-5">
          <Field label="Title">
            <LinkTitle linkId={link.id} title={link.title} />
          </Field>
          <Field label="Short link">
            <LinkSlug linkId={link.id} slug={link.slug} />
          </Field>
          <Field label="Destination">
            <LinkDestination linkId={link.id} url={link.url} />
          </Field>
          <Field label="Created on">
            <span className="text-zinc-600 dark:text-zinc-400">{dateTime(link.createdAt, "long")}</span>
          </Field>
        </dl>
      </section>

      <section className={`${cardClass} sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Link analytics</h2>
          <RangeMenu
            current={range}
            options={(Object.keys(RANGES) as Range[]).map((r) => ({
              value: r,
              label: RANGES[r].label,
              href: r === DEFAULT_RANGE ? `/dashboard/${link.slug}` : `/dashboard/${link.slug}?range=${r}`,
            }))}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

        <div className={`${panelClass} mt-4`}>
          <h3 className="mb-4 font-semibold">
            {days ? `Clicks over the last ${days} days` : `All-time clicks per ${unit}`}
          </h3>
          <ClicksChart
            caption={days ? `Clicks per day, last ${days} days` : `Clicks per ${unit}, all time`}
            points={bars.map((d) => ({ tick: UNITS[unit].tick(d.day), label: UNITS[unit].label(d.day), value: d.value }))}
          />
          <p className="mt-4 text-xs text-zinc-500">
            {unit === "week" && "Weeks start on Monday. "}Dates in your timezone ({tz.replace(/_/g, " ")}).
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Breakdown title="Referrers" column="Referrer" rows={referrers} total={inRange} empty={emptyText} />
          <Breakdown
            title="Countries"
            column="Country"
            rows={countries.map((r) => ({ ...r, label: r.label === "Unknown" ? r.label : countryName(r.label) }))}
            total={inRange}
            empty={emptyText}
          />
          <Breakdown title="Devices" column="Device" rows={devices} total={inRange} empty={emptyText} />
          <Breakdown title="Browsers" column="Browser" rows={browsers} total={inRange} empty={emptyText} />
        </div>
      </section>

      <section className={`${cardClass} sm:p-6`}>
        <h2 className="text-lg font-semibold wrap-anywhere">
          Changes to {SHORT_HOST}/<wbr />
          {link.slug}
        </h2>
        <ol className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {events.slice(0, MAX_EVENTS).map((e) => (
            <li key={e.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 dark:border-zinc-700">
                {EVENTS[e.type].icon}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-col gap-x-4 gap-y-0.5 sm:flex-row sm:justify-between">
                  <p className="font-medium">{EVENTS[e.type].title}</p>
                  <time dateTime={e.createdAt.toISOString()} className="shrink-0 text-sm text-zinc-500">
                    {dateTime(e.createdAt, "short")}
                  </time>
                </div>
                {e.type === "created" && e.newValue && <Change label="Destination" value={e.newValue} />}
                {e.type === "destination" && (
                  <>
                    <Change label="From" value={e.oldValue} />
                    <Change label="To" value={e.newValue} />
                  </>
                )}
                {e.type === "title" && (
                  <>
                    <Change label="From" value={e.oldValue ?? "(no title)"} />
                    <Change label="To" value={e.newValue ?? "(no title)"} />
                  </>
                )}
                {e.type === "slug" && (
                  <>
                    <Change label="From" value={`${SHORT_HOST}/${e.oldValue}`} />
                    <Change label="To" value={`${SHORT_HOST}/${e.newValue}`} />
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
        {events.length > MAX_EVENTS && (
          <p className="mt-4 text-xs text-zinc-500">Showing the {MAX_EVENTS} most recent changes.</p>
        )}
      </section>
    </div>
  );
}

const EVENTS: Record<(typeof linkEvents.$inferSelect)["type"], { title: string; icon: ReactNode }> = {
  created: { title: "Link created", icon: <LinkIcon size={16} /> },
  destination: { title: "Destination changed", icon: <CornerDownRightIcon size={16} /> },
  slug: { title: "Short link renamed", icon: <PencilIcon size={14} /> },
  title: { title: "Title changed", icon: <TypeIcon size={16} /> },
};

function Change({ label, value }: { label: string; value: string | null }) {
  return (
    <p className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-300" title={value ?? undefined}>
      <span className="text-zinc-500">{label}:</span> {value}
    </p>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="mb-1 text-sm font-medium">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function formatDate(day: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00`).toLocaleDateString("en", options);
}

// Labels for one point of the chart; `day` is its first day as YYYY-MM-DD. `tick` goes under
// the axis, `label` in the tooltip.
const UNITS: Record<Unit, { tick: (day: string) => string; label: (day: string) => string }> = {
  day: {
    tick: (d) => formatDate(d, { month: "short", day: "numeric" }),
    label: (d) => formatDate(d, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
  },
  week: {
    tick: (d) => formatDate(d, { month: "short", day: "numeric" }),
    label: (d) => `Week of ${formatDate(d, { month: "short", day: "numeric", year: "numeric" })}`,
  },
  month: {
    tick: (d) => formatDate(d, { month: "short", year: "numeric" }),
    label: (d) => formatDate(d, { month: "long", year: "numeric" }),
  },
};

function Stat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className={panelClass}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value.toLocaleString("en")}</p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/** Top values for one dimension, with each one's share of the clicks in range. */
function Breakdown({
  title,
  column,
  rows,
  total,
  empty,
}: {
  title: string;
  column: string;
  rows: { label: string; value: number }[];
  total: number;
  empty: string;
}) {
  const share = (value: number) => (total ? (value / total) * 100 : 0);

  return (
    <section className={panelClass}>
      <h3 className="font-semibold">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500">{empty}</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500">
              <th scope="col" className="pb-2 text-left font-normal">
                {column}
              </th>
              <th scope="col" className="pb-2 pl-3 text-right font-normal">
                Clicks
              </th>
              <th scope="col" className="w-14 pb-2 pl-3 text-right font-normal">
                %
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-zinc-100 dark:border-zinc-800">
                {/* max-w-0 + w-full lets the label truncate instead of widening the table. */}
                <td className="w-full max-w-0 py-2.5">
                  <div className="truncate" title={r.label}>
                    {r.label}
                  </div>
                  <div aria-hidden className="mt-1.5 h-1 rounded-full bg-emerald-600/10">
                    <div className="h-full rounded-full bg-emerald-600" style={{ width: `${share(r.value)}%` }} />
                  </div>
                </td>
                <td className="py-2.5 pl-3 text-right align-top tabular-nums">{r.value.toLocaleString("en")}</td>
                <td className="py-2.5 pl-3 text-right align-top tabular-nums text-zinc-500">
                  {share(r.value) > 0 && share(r.value) < 1 ? "<1" : Math.round(share(r.value))}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

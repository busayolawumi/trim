"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { BarChartIcon, CalendarIcon, CornerDownRightIcon } from "@/components/icons";
import { Select } from "@/components/select";
import {
  cardClass,
  dangerRowIconButtonClass,
  inputClass,
  rowIconButtonClass,
} from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { domainOf } from "@/lib/domain";
import { DeleteLinkButton } from "./delete-link-button";
import { LinkFavicon } from "./link-favicon";
import { QrCodeButton } from "./qr-code-button";

export type LinkRow = {
  id: string;
  slug: string;
  url: string;
  title: string | null;
  clicks: number;
  createdAt: Date;
};

const newestFirst = (a: LinkRow, b: LinkRow) => b.createdAt.getTime() - a.createdAt.getTime();

const SORTS = {
  newest: { label: "Newest", compare: newestFirst },
  oldest: { label: "Oldest", compare: (a: LinkRow, b: LinkRow) => newestFirst(b, a) },
  clicks: { label: "Most clicks", compare: (a: LinkRow, b: LinkRow) => b.clicks - a.clicks || newestFirst(a, b) },
};

type Sort = keyof typeof SORTS;

/**
 * The user's links with search (by title, slug or destination) and sorting. All links are already loaded.
 * `timeZone` is the viewer's (from the tz cookie), so dates match between server and browser.
 */
export function LinkList({ links, timeZone }: { links: LinkRow[]; timeZone: string }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  // Strip the scheme and short domain so pasting a whole short link finds it too.
  const q = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(`${SHORT_HOST.toLowerCase()}/`, "");
  const shown = links
    .filter(
      (link) =>
        link.slug.includes(q) ||
        link.url.toLowerCase().includes(q) ||
        !!link.title?.toLowerCase().includes(q),
    )
    .sort(SORTS[sort].compare);

  return (
    <section>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">
          Your links ({q ? `${shown.length} of ${links.length}` : links.length})
        </h2>
        {links.length > 0 && (
          <div className="flex gap-2">
            <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search links"
                aria-label="Search links"
                className={inputClass}
              />
            </div>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort links"
            >
              {Object.entries(SORTS).map(([value, { label }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {links.length === 0 ? (
        <p className={`${cardClass} text-center text-sm text-zinc-500`}>
          No links yet. Shorten your first one above.
        </p>
      ) : shown.length === 0 ? (
        <p className={`${cardClass} text-center text-sm wrap-anywhere text-zinc-500`}>
          No links match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {shown.map((link) => (
              <LinkItem key={link.id} link={link} timeZone={timeZone} />
            ))}
          </ul>
          <p className="mt-8 flex items-center justify-center gap-4 text-sm text-zinc-500">
            <span aria-hidden className="h-px w-10 bg-zinc-300 sm:w-16 dark:bg-zinc-700" />
            {q ? "No more matches" : "You've reached the end of your links"}
            <span aria-hidden className="h-px w-10 bg-zinc-300 sm:w-16 dark:bg-zinc-700" />
          </p>
        </>
      )}
    </section>
  );
}

function LinkItem({ link, timeZone }: { link: LinkRow; timeZone: string }) {
  const domain = domainOf(link.url);
  const stats = `/dashboard/${link.slug}`;

  return (
    // Icon | details | actions. On phones the actions drop below the details.
    <li className={`${cardClass} grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]`}>
      <LinkFavicon domain={domain} />

      <div className="min-w-0">
        <Link href={stats} className="block truncate text-lg font-semibold hover:underline" title={link.title ?? undefined}>
          {link.title ?? domain}
        </Link>
        <div className="mt-1 flex items-center gap-1">
          {/* The preview page, so opening it from here isn't counted as a click. */}
          <a
            href={`/${link.slug}/preview`}
            target="_blank"
            title="Open preview"
            className="min-w-0 font-medium wrap-anywhere text-blue-600 hover:underline dark:text-blue-400"
          >
            {/* Long names wrap on phones, after the slash if possible. */}
            {SHORT_HOST}/<wbr />
            {link.slug}
          </a>
          <CopyButton text={shortUrl(link.slug)} ghost />
        </div>
        <p className="mt-3 flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <CornerDownRightIcon size={16} />
          <span className="truncate" title={link.url}>
            {link.url}
          </span>
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
          <Link
            href={stats}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2 py-0.5 tabular-nums text-zinc-700 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            <BarChartIcon size={14} />
            {link.clicks} {link.clicks === 1 ? "click" : "clicks"}
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon size={16} />
            {link.createdAt.toLocaleDateString("en", { dateStyle: "medium", timeZone })}
          </span>
        </div>
      </div>

      <div className="col-start-2 mt-3 -ml-2 flex items-center gap-1 sm:col-start-3 sm:row-start-1 sm:mt-0 sm:ml-0 sm:-mr-2 sm:-mt-1">
        <Link href={stats} aria-label={`Stats for /${link.slug}`} title="Stats" className={rowIconButtonClass}>
          <BarChartIcon />
        </Link>
        <QrCodeButton slug={link.slug} buttonClassName={rowIconButtonClass} />
        <DeleteLinkButton linkId={link.id} slug={link.slug} buttonClassName={dangerRowIconButtonClass} />
      </div>
    </li>
  );
}

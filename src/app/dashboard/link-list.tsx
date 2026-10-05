"use client";

import Link from "next/link";
import { useState } from "react";
import { CopyButton } from "@/components/copy-button";
import { Select } from "@/components/select";
import { cardClass, inputClass } from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { DeleteLinkButton } from "./delete-link-button";
import { QrCodeButton } from "./qr-code-button";

export type LinkRow = { id: string; slug: string; url: string; clicks: number; createdAt: Date };

const newestFirst = (a: LinkRow, b: LinkRow) => b.createdAt.getTime() - a.createdAt.getTime();

const SORTS = {
  newest: { label: "Newest", compare: newestFirst },
  oldest: { label: "Oldest", compare: (a: LinkRow, b: LinkRow) => newestFirst(b, a) },
  clicks: { label: "Most clicks", compare: (a: LinkRow, b: LinkRow) => b.clicks - a.clicks || newestFirst(a, b) },
};

type Sort = keyof typeof SORTS;

/** The user's links with search (by slug or destination) and sorting. All links are already loaded. */
export function LinkList({ links }: { links: LinkRow[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");

  // Strip the scheme and short domain so pasting a whole short link finds it too.
  const q = query
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(`${SHORT_HOST.toLowerCase()}/`, "");
  const shown = links
    .filter((link) => link.slug.includes(q) || link.url.toLowerCase().includes(q))
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
        <ul className="flex flex-col gap-3">
          {shown.map((link) => (
            <li key={link.id} className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-center`}>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/dashboard/${link.slug}`}
                  className="font-mono text-sm font-medium wrap-anywhere hover:underline"
                >
                  {/* Long names wrap on phones, after the slash if possible. */}
                  {SHORT_HOST}/<wbr />
                  {link.slug}
                </Link>
                <p className="truncate text-sm text-zinc-500" title={link.url}>
                  → {link.url}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/${link.slug}`}
                  className="mr-2 text-sm tabular-nums text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{link.clicks}</span>{" "}
                  {link.clicks === 1 ? "click" : "clicks"}
                </Link>
                <QrCodeButton slug={link.slug} />
                <CopyButton text={shortUrl(link.slug)} />
                <DeleteLinkButton linkId={link.id} slug={link.slug} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

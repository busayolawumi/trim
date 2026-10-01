import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import { clicks, db, links } from "@/db";
import { CopyButton } from "@/components/copy-button";
import { cardClass } from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { requireUser } from "@/lib/session";
import { CreateLinkForm } from "./create-link-form";
import { DeleteLinkButton } from "./delete-link-button";

export const metadata = { title: "Dashboard · Trim" };

export default async function DashboardPage() {
  const user = await requireUser();

  const rows = await db()
    .select({
      id: links.id,
      slug: links.slug,
      url: links.url,
      createdAt: links.createdAt,
      clicks: count(clicks.id),
    })
    .from(links)
    .leftJoin(clicks, and(eq(clicks.linkId, links.id), eq(clicks.isBot, false)))
    .where(eq(links.userId, user.id))
    .groupBy(links.id)
    .orderBy(desc(links.createdAt));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hi, {user.name.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Create short links and track how often they&apos;re clicked.
        </p>
      </div>

      <CreateLinkForm />

      <section>
        <h2 className="mb-3 font-semibold">Your links ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className={`${cardClass} text-center text-sm text-zinc-500`}>
            No links yet. Shorten your first one above.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((link) => (
              <li key={link.id} className={`${cardClass} flex flex-col gap-3 sm:flex-row sm:items-center`}>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/${link.slug}`}
                    className="font-mono text-sm font-medium hover:underline"
                  >
                    {SHORT_HOST}/{link.slug}
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
                  <CopyButton text={shortUrl(link.slug)} />
                  <DeleteLinkButton linkId={link.id} slug={link.slug} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

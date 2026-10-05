import { and, count, desc, eq } from "drizzle-orm";
import { clicks, db, links } from "@/db";
import { requireUser } from "@/lib/session";
import { CreateLinkForm } from "./create-link-form";
import { LinkList } from "./link-list";
import { VerifyEmailBanner } from "./verify-email-banner";

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

      {user.emailVerifiedAt ? <CreateLinkForm /> : <VerifyEmailBanner email={user.email} />}

      <LinkList links={rows} />
    </div>
  );
}

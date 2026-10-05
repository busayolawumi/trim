import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, links } from "@/db";
import { Logo } from "@/components/logo";
import { buttonClass, cardClass } from "@/components/ui";
import { SHORT_HOST } from "@/lib/config";
import { normalizeSlug } from "@/lib/slug";

export async function generateMetadata({ params }: PageProps<"/[slug]/preview">): Promise<Metadata> {
  return {
    title: `Where /${normalizeSlug((await params).slug)} goes · Trim`,
    // Continuing shouldn't show this page as the referrer in the link's stats.
    referrer: "no-referrer",
    robots: { index: false },
  };
}

/** Public page showing where a short link goes, reached via /<slug>+ or /<slug>/preview. */
export default async function LinkPreviewPage({ params }: PageProps<"/[slug]/preview">) {
  const slug = normalizeSlug((await params).slug);
  const [link] = await db().select({ url: links.url }).from(links).where(eq(links.slug, slug));
  if (!link) redirect(`/?missing=${encodeURIComponent(slug)}`);

  // Shown large: lookalike addresses usually hide in the domain. IDNs stay in punycode (xn--…).
  const host = new URL(link.url).hostname.replace(/^www\./, "");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className={`${cardClass} w-full max-w-md`}>
        <h1 className="text-lg font-semibold">Where this link goes</h1>
        <p className="mt-4 font-mono text-sm wrap-anywhere text-zinc-500">
          {SHORT_HOST}/{slug}
        </p>
        <p className="my-1 text-zinc-400" aria-hidden>
          ↓
        </p>
        <p className="break-all text-2xl font-semibold">{host}</p>
        <p className="mt-1 break-all font-mono text-xs text-zinc-500">{link.url}</p>

        {/* A plain <a>, not <Link>: prefetching the short link would count as a click. */}
        <a href={`/${slug}`} rel="noreferrer" className={`${buttonClass} mt-6 w-full text-center wrap-anywhere`}>
          Continue to {host}
        </a>
        <p className="mt-4 text-xs text-zinc-500">
          Short links can hide where they go. Only continue if you recognise and trust this address.
        </p>
      </div>
      <p className="mt-6 text-xs text-zinc-500">
        Shortened with{" "}
        <Link href="/" className="underline">
          Trim
        </Link>
        . Add a + to the end of any Trim link to see where it goes.
      </p>
    </main>
  );
}

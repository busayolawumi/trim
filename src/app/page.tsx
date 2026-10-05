import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonClass, secondaryButtonClass } from "@/components/ui";
import { SHORT_HOST } from "@/lib/config";
import { getCurrentUser } from "@/lib/session";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { missing } = await searchParams;
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
      <header className="flex items-center justify-between">
        <Logo />
        <nav className="flex gap-2">
          {user ? (
            <Link href="/dashboard" className={buttonClass}>Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className={secondaryButtonClass}>Log in</Link>
              <Link href="/signup" className={buttonClass}>Sign up</Link>
            </>
          )}
        </nav>
      </header>

      {typeof missing === "string" && (
        <p className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          <span className="font-mono wrap-anywhere">{SHORT_HOST}/{missing}</span> doesn&apos;t exist.
        </p>
      )}

      <section className="flex flex-1 flex-col items-center justify-center py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Long links, trimmed.
        </h1>
        <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
          Turn any URL into a short link with a name you choose, then see how many
          people clicked it and where they came from.
        </p>
        <div className="mt-8 rounded-lg border border-zinc-200 bg-white px-4 py-2 font-mono text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {SHORT_HOST}/<span className="text-emerald-600 dark:text-emerald-400">your-link</span>
        </div>
        <Link href={user ? "/dashboard" : "/signup"} className={`${buttonClass} mt-8 px-6 py-3`}>
          {user ? "Go to dashboard" : "Get started — it's free"}
        </Link>
        <p className="mt-6 max-w-sm text-xs text-zinc-500">
          Not sure where a Trim link goes? Add a <span className="font-mono">+</span> to the end
          (like <span className="font-mono">{SHORT_HOST}/your-link+</span>) to see it first.
        </p>
      </section>
    </main>
  );
}

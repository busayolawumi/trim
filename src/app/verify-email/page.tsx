import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonClass, cardClass } from "@/components/ui";
import { verifyEmailToken } from "@/lib/email-verification";

// The token is in the URL, so never send it to other sites in a Referer header.
export const metadata = { title: "Verify email · Trim", referrer: "no-referrer" };

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const { token } = await searchParams;
  const verified = typeof token === "string" && (await verifyEmailToken(token));

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <div className={`${cardClass} w-full max-w-sm`}>
        {verified ? (
          <>
            <h1 className="mb-2 text-lg font-semibold">Email verified</h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              Thanks! You can now create short links.
            </p>
            <Link href="/dashboard" className={`${buttonClass} w-full`}>
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-2 text-lg font-semibold">Link expired</h1>
            <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
              This verification link is invalid or has expired. Log in and use{" "}
              <span className="font-medium">Resend email</span> on your dashboard to get a new one.
            </p>
            <Link href="/dashboard" className={`${buttonClass} w-full`}>
              Go to dashboard
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

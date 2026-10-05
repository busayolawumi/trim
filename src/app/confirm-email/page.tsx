import Link from "next/link";
import { Logo } from "@/components/logo";
import { buttonClass, cardClass } from "@/components/ui";
import { confirmEmailChange, type EmailChangeResult } from "@/lib/email-change";

// The token is in the URL, so never send it to other sites in a Referer header.
export const metadata = { title: "Confirm email · Trim", referrer: "no-referrer" };

export default async function ConfirmEmailPage({ searchParams }: PageProps<"/confirm-email">) {
  const { token } = await searchParams;
  const result: EmailChangeResult =
    typeof token === "string" ? await confirmEmailChange(token) : { status: "invalid" };

  const { title, body } =
    result.status === "changed"
      ? {
          title: "Email changed",
          body: (
            <>
              Your Trim account now uses <span className="font-medium">{result.email}</span>. Use it
              the next time you log in.
            </>
          ),
        }
      : result.status === "taken"
        ? {
            title: "Email already in use",
            body: "Another account started using this address after you asked to switch. Choose a different one in Settings.",
          }
        : {
            title: "Link expired",
            body: "This confirmation link is invalid or has expired. Request a new one in Settings.",
          };

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <div className={`${cardClass} w-full max-w-sm`}>
        <h1 className="mb-2 text-lg font-semibold">{title}</h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
        <Link
          href={result.status === "changed" ? "/dashboard" : "/dashboard/settings"}
          className={`${buttonClass} w-full`}
        >
          {result.status === "changed" ? "Go to dashboard" : "Go to Settings"}
        </Link>
      </div>
    </main>
  );
}

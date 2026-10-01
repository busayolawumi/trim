import Link from "next/link";
import { isResetTokenValid } from "@/lib/password-reset";
import { ResetPasswordForm } from "./reset-password-form";

// The token is in the URL, so never send it to other sites in a Referer header.
export const metadata = { title: "Reset password · Trim", referrer: "no-referrer" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { token } = await searchParams;
  const valid = typeof token === "string" && (await isResetTokenValid(token));

  if (!valid) {
    return (
      <>
        <h1 className="mb-2 text-lg font-semibold">Link expired</h1>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          This reset link is invalid or has expired. Links work once and only for 1 hour.
        </p>
        <Link href="/forgot-password" className="text-sm font-medium underline">
          Request a new link
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-lg font-semibold">Choose a new password</h1>
      <ResetPasswordForm token={token} />
    </>
  );
}

"use client";

import { useActionState } from "react";
import { resendVerificationEmail } from "@/app/actions/auth";
import { cardClass, secondaryButtonClass } from "@/components/ui";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerificationEmail, undefined);

  return (
    <div className={`${cardClass} border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950`}>
      <h2 className="font-semibold">Verify your email to start creating links</h2>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        We sent a link to <span className="font-medium">{email}</span>. Check your spam folder if
        it&apos;s not in your inbox.
      </p>
      <form action={action} className="mt-4 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className={secondaryButtonClass}>
          {pending ? "Sending…" : "Resend email"}
        </button>
        {state?.sent && (
          <span className="text-sm text-emerald-700 dark:text-emerald-400">Sent! Check your inbox.</span>
        )}
        {state?.error && <span className="text-sm text-red-600 dark:text-red-400">{state.error}</span>}
      </form>
    </div>
  );
}

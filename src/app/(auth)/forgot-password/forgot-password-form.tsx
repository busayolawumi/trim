"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions/auth";
import { buttonClass, inputClass } from "@/components/ui";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.sent) {
    return (
      <div className="flex flex-col gap-4 text-sm">
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          If an account exists for that email, a reset link is on its way. It expires in 1 hour.
        </p>
        <Link href="/login" className="text-center font-medium underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Please wait…" : "Send reset link"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Remembered it?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { buttonClass } from "@/components/ui";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        New password
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Confirm new password
        <PasswordInput name="confirmPassword" required minLength={8} autoComplete="new-password" />
      </label>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Please wait…" : "Set new password"}
      </button>
      <p className="text-center text-xs text-zinc-500">
        This logs you out everywhere else.
      </p>
    </form>
  );
}

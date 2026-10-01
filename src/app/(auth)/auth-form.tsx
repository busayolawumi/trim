"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup } from "@/app/actions/auth";
import { PasswordInput } from "@/components/password-input";
import { buttonClass, inputClass } from "@/components/ui";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState(mode === "login" ? login : signup, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={action} className="flex flex-col gap-4">
      {isSignup && (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <input name="name" required autoComplete="name" className={inputClass} />
        </label>
      )}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input name="email" type="email" required autoComplete="email" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span className="flex justify-between">
          Password
          {!isSignup && (
            <Link href="/forgot-password" className="font-normal text-zinc-500 hover:underline">
              Forgot password?
            </Link>
          )}
        </span>
        <PasswordInput
          name="password"
          required
          minLength={isSignup ? 8 : undefined}
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
      </label>

      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

      <button type="submit" disabled={pending} className={buttonClass}>
        {pending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
      </button>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        {isSignup ? "Already have an account? " : "New to Trim? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

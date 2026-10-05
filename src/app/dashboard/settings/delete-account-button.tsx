"use client";

import { useActionState, useRef } from "react";
import { deleteAccount } from "@/app/actions/account";
import { isBackdropClick } from "@/components/dialog";
import { PasswordInput } from "@/components/password-input";
import { dangerButtonClass, modalClass, secondaryButtonClass } from "@/components/ui";

export function DeleteAccountButton() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(deleteAccount, undefined);

  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()} className={dangerButtonClass}>
        Delete account
      </button>
      {/* showModal() makes the page behind inert, focuses the password field and closes on Escape. */}
      <dialog
        ref={dialog}
        aria-labelledby="delete-account-title"
        className={modalClass}
        onCancel={(e) => pending && e.preventDefault()}
        onClick={(e) => !pending && isBackdropClick(e) && e.currentTarget.close()}
      >
        <form action={action} className="flex flex-col gap-4">
          <div>
            <h2 id="delete-account-title" className="font-semibold">
              Delete your account?
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              All your short links and QR codes will stop working, and their click history will be
              deleted. This can&apos;t be undone.
            </p>
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Enter your password to confirm
            <PasswordInput name="password" required autoComplete="current-password" />
          </label>
          {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => dialog.current?.close()}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
            <button type="submit" disabled={pending} className={dangerButtonClass}>
              {pending ? "Deleting…" : "Delete account"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}

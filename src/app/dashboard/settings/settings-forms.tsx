"use client";

import { useActionState, useOptimistic, useState } from "react";
import {
  changePassword,
  logOutOtherDevices,
  requestEmailChange,
  updateAvatar,
  updateName,
  type SettingsState,
} from "@/app/actions/account";
import { Avatar } from "@/components/avatar";
import { PasswordInput } from "@/components/password-input";
import { buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { AVATARS } from "@/lib/avatars";

const formClass = "flex flex-col gap-4 sm:max-w-sm";
const labelClass = "flex flex-col gap-1.5 text-sm font-medium";

function Status({ state }: { state: SettingsState }) {
  if (state?.error) return <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>;
  if (state?.message)
    return <p className="text-sm text-emerald-700 dark:text-emerald-400">{state.message}</p>;
  return null;
}

/** Clicking an avatar saves it straight away; the highlight moves before the server replies. */
export function AvatarPicker({ current }: { current: string }) {
  const [selected, setSelected] = useOptimistic(current);
  const [state, action, pending] = useActionState(
    async (prev: SettingsState, formData: FormData) => {
      setSelected(String(formData.get("avatar")));
      return updateAvatar(prev, formData);
    },
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {AVATARS.map(({ id, label }) => (
          <button
            key={id}
            type="submit"
            name="avatar"
            value={id}
            disabled={pending}
            aria-label={label}
            aria-pressed={selected === id}
            title={label}
            className="rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-white transition hover:scale-105 aria-pressed:ring-emerald-500 dark:ring-offset-zinc-900"
          >
            <Avatar id={id} size={48} />
          </button>
        ))}
      </div>
      <Status state={state} />
    </form>
  );
}

export function NameForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateName, undefined);
  // Controlled so it survives the form reset after submitting.
  const [value, setValue] = useState(name);

  return (
    <form action={action} className={formClass}>
      <label className={labelClass}>
        Name
        <input
          name="name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          maxLength={80}
          autoComplete="name"
          className={inputClass}
        />
      </label>
      <Status state={state} />
      <div>
        <button type="submit" disabled={pending || value.trim() === name} className={buttonClass}>
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export function EmailForm({
  email,
  verified,
  pendingEmail,
}: {
  email: string;
  verified: boolean;
  pendingEmail: string | null;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [state, action, pending] = useActionState(
    async (prev: SettingsState, formData: FormData) => {
      const result = await requestEmailChange(prev, formData);
      if (!result?.error) setNewEmail("");
      return result;
    },
    undefined,
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        <span className="font-medium">{email}</span>{" "}
        {verified ? (
          <span className="text-emerald-700 dark:text-emerald-400">· Verified</span>
        ) : (
          <span className="text-amber-700 dark:text-amber-400">· Not verified</span>
        )}
      </p>
      {pendingEmail && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          Waiting for you to confirm <span className="font-medium">{pendingEmail}</span>. Your email
          won&apos;t change until you open the link we sent there.
        </p>
      )}
      <form action={action} className={formClass}>
        <label className={labelClass}>
          New email
          <input
            name="email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Current password
          <PasswordInput name="password" required autoComplete="current-password" />
        </label>
        <Status state={state} />
        <div>
          <button type="submit" disabled={pending} className={buttonClass}>
            {pending ? "Sending…" : "Send confirmation link"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);

  return (
    <form action={action} className={formClass}>
      <label className={labelClass}>
        Current password
        <PasswordInput name="currentPassword" required autoComplete="current-password" />
      </label>
      <label className={labelClass}>
        New password
        <PasswordInput name="password" required minLength={8} autoComplete="new-password" />
      </label>
      <label className={labelClass}>
        Confirm new password
        <PasswordInput name="confirmPassword" required minLength={8} autoComplete="new-password" />
      </label>
      <Status state={state} />
      <div>
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Saving…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

export function LogOutOthersForm() {
  const [state, action, pending] = useActionState(logOutOtherDevices, undefined);

  return (
    <form action={action} className="flex flex-col items-start gap-3">
      <button type="submit" disabled={pending} className={secondaryButtonClass}>
        {pending ? "Logging out…" : "Log out other devices"}
      </button>
      <Status state={state} />
    </form>
  );
}

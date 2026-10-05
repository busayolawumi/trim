import Link from "next/link";
import type { ReactNode } from "react";
import { cardClass } from "@/components/ui";
import { pendingEmailChange } from "@/lib/email-change";
import { requireUser } from "@/lib/session";
import { DeleteAccountButton } from "./delete-account-button";
import {
  AvatarPicker,
  EmailForm,
  LogOutOthersForm,
  NameForm,
  PasswordForm,
} from "./settings-forms";

export const metadata = { title: "Settings · Trim" };

export default async function SettingsPage() {
  const user = await requireUser();
  const pendingEmail = await pendingEmailChange(user.id);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← All links
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <Section title="Avatar" description="Shown in the menu at the top right.">
        <AvatarPicker current={user.avatar} />
      </Section>

      <Section title="Name">
        <NameForm name={user.name} />
      </Section>

      <Section
        title="Email"
        description="We'll send a link to the new address. Your email changes once you open it."
      >
        <EmailForm
          email={user.email}
          verified={Boolean(user.emailVerifiedAt)}
          pendingEmail={pendingEmail}
        />
      </Section>

      <Section title="Password" description="Changing it logs you out on your other devices.">
        <PasswordForm />
      </Section>

      <Section
        title="Devices"
        description="Logged in somewhere you no longer use? Log out everywhere except here."
      >
        <LogOutOthersForm />
      </Section>

      <Section
        title="Delete account"
        description="Deletes your account, all your links and their click history."
        danger
      >
        <DeleteAccountButton />
      </Section>
    </div>
  );
}

function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cardClass}>
      <h2 className={`font-semibold ${danger ? "text-red-600 dark:text-red-400" : ""}`}>{title}</h2>
      {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

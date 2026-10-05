import { AccountMenu } from "@/components/account-menu";
import { Logo } from "@/components/logo";
import { TimezoneSync } from "@/components/timezone-sync";
import { requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const user = await requireUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-4">
          <Logo href="/dashboard" />
          <AccountMenu name={user.name} email={user.email} avatar={user.avatar} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
      <TimezoneSync />
    </div>
  );
}

import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { cardClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8"><Logo /></div>
      <div className={`${cardClass} w-full max-w-sm`}>{children}</div>
    </main>
  );
}

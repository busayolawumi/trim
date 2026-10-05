import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-xl font-semibold tracking-tight">
      Trim<span className="text-emerald-500">.</span>
    </Link>
  );
}

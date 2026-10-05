"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { logout } from "@/app/actions/auth";
import { Avatar } from "@/components/avatar";
import { LogOutIcon, SettingsIcon } from "@/components/icons";

const itemClass =
  "flex w-full items-center gap-2 px-4 py-2.5 text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800";

/** The user's avatar in the dashboard header. Opens a dropdown with their details, Settings and Log out. */
export function AccountMenu({ name, email, avatar }: { name: string; email: string; avatar: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Close on a click outside, or on Escape (putting focus back on the button).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-label="Account menu"
        title="Account"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className="flex rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-zinc-50 transition hover:ring-zinc-300 dark:ring-offset-zinc-950 dark:hover:ring-zinc-700"
      >
        <Avatar id={avatar} />
      </button>
      {/* Right-aligned under the avatar, so keep it at the right edge of the header. */}
      <div
        id={menuId}
        hidden={!open}
        className="absolute right-0 top-full z-10 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Avatar id={avatar} size={40} />
          <div className="min-w-0">
            <p className="truncate font-medium">{name}</p>
            <p className="truncate text-xs text-zinc-500" title={email}>
              {email}
            </p>
          </div>
        </div>
        <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={itemClass}>
          <SettingsIcon size={16} /> Settings
        </Link>
        <form action={logout} className="border-t border-zinc-200 dark:border-zinc-800">
          <button type="submit" className={itemClass}>
            <LogOutIcon size={16} /> Log out
          </button>
        </form>
      </div>
    </div>
  );
}

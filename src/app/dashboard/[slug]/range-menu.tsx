"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarIcon, CheckIcon, ChevronDownIcon } from "@/components/icons";

/** Dropdown of date ranges for the stats page. Each option is a link that sets ?range=. */
export function RangeMenu({
  options,
  current,
}: {
  options: { label: string; href: string; value: string }[];
  current: string;
}) {
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

  const selected = options.find((o) => o.value === current);

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Date range: ${selected?.label}`}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        <CalendarIcon size={16} />
        {selected?.label}
        <ChevronDownIcon size={16} />
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute left-0 top-full z-10 mt-2 w-48 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
      >
        {options.map((o) => (
          <Link
            key={o.value}
            href={o.href}
            replace
            scroll={false}
            aria-current={o.value === current ? "page" : undefined}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
              o.value === current ? "font-semibold" : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {o.label}
            {o.value === current && <CheckIcon size={16} />}
          </Link>
        ))}
      </div>
    </div>
  );
}

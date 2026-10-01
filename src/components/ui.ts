export const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-300 dark:focus:ring-zinc-100/10";

export const buttonClass =
  "inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 px-3 py-1.5 text-sm transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800";

export const cardClass =
  "rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

// Colours aren't in the shared base: two Tailwind colour classes on one element don't
// reliably override each other, so each variant sets its own.
const iconButtonBase =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition disabled:opacity-50";

/** Square, bordered button holding a single icon (pair with aria-label and title). */
export const iconButtonClass = `${iconButtonBase} border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800`;

/** Red variant for destructive actions like delete. */
export const dangerIconButtonClass = `${iconButtonBase} border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950`;

/** Green variant for confirming success, e.g. after copying. */
export const successIconButtonClass = `${iconButtonBase} border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400`;

/** Small borderless icon button for inline actions, e.g. edit next to a value. */
export const ghostIconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100";

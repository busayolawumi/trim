"use client";

import { useActionState, useState } from "react";
import {
  renameLink,
  updateLinkUrl,
  type RenameLinkState,
  type UpdateLinkState,
} from "@/app/actions/links";
import { PencilIcon } from "@/components/icons";
import { buttonClass, ghostIconButtonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { SHORT_HOST } from "@/lib/config";
import { useSlugAvailability } from "../use-slug-availability";

// Each form is mounted fresh when editing starts, so an old error never shows on reopening.

/** The short link's name, with an edit icon that swaps in a rename form. */
export function LinkSlug({ linkId, slug }: { linkId: string; slug: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <RenameForm linkId={linkId} slug={slug} onCancel={() => setEditing(false)} />;

  return (
    <div className="flex min-w-0 items-center gap-1">
      <h1 className="truncate font-mono text-lg font-semibold">
        {SHORT_HOST}/{slug}
      </h1>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Rename short link"
        title="Rename short link"
        className={ghostIconButtonClass}
      >
        <PencilIcon size={15} />
      </button>
    </div>
  );
}

function RenameForm({ linkId, slug, onCancel }: { linkId: string; slug: string; onCancel: () => void }) {
  const [value, setValue] = useState(slug);
  const availability = useSlugAvailability(value, slug);
  // On success the action redirects to the new address, so there's no "done" state.
  const [state, action, pending] = useActionState(
    (prev: RenameLinkState, formData: FormData) => renameLink(linkId, prev, formData),
    undefined,
  );

  const unchanged = value.trim().toLowerCase() === slug;
  const message =
    state?.error ?? (availability.status === "unavailable" ? availability.reason : undefined);

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-zinc-300 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:border-zinc-700 dark:focus-within:border-zinc-300">
          <span className="flex items-center bg-zinc-100 px-3 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
            {SHORT_HOST}/
          </span>
          <input
            name="slug"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            maxLength={50}
            autoFocus
            autoComplete="off"
            aria-label="New short name"
            className="min-w-0 flex-1 bg-white px-3 py-2 font-mono text-sm outline-none dark:bg-zinc-900"
          />
        </div>
        <FormButtons
          pending={pending}
          disabled={unchanged || availability.status !== "available"}
          onCancel={onCancel}
        />
      </div>
      <span className="min-h-5 text-xs">
        {availability.status === "checking" && <span className="text-zinc-500">Checking…</span>}
        {availability.status === "available" && !state?.error && (
          <span className="text-emerald-600 dark:text-emerald-400">✓ Available</span>
        )}
        {message && <span className="text-red-600 dark:text-red-400">✗ {message}</span>}
      </span>
      <p className="text-xs text-amber-700 dark:text-amber-400">
        Anyone using the old link ({SHORT_HOST}/{slug}) or its QR code will see that it doesn&apos;t
        exist, and someone else could take that name. Click history is kept.
      </p>
    </form>
  );
}

/** A link's destination ("→ https://…"), with an edit icon that swaps in a form. */
export function LinkDestination({ linkId, url }: { linkId: string; url: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <DestinationForm linkId={linkId} url={url} onDone={() => setEditing(false)} />;

  return (
    <div className="flex min-w-0 items-center gap-1 text-sm text-zinc-500">
      <a href={url} target="_blank" rel="noreferrer" className="truncate hover:underline" title={url}>
        → {url}
      </a>
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label="Edit destination"
        title="Edit destination"
        className={ghostIconButtonClass}
      >
        <PencilIcon size={15} />
      </button>
    </div>
  );
}

function DestinationForm({ linkId, url, onDone }: { linkId: string; url: string; onDone: () => void }) {
  const [value, setValue] = useState(url);
  const [state, action, pending] = useActionState(
    async (prev: UpdateLinkState, formData: FormData) => {
      const result = await updateLinkUrl(linkId, prev, formData);
      if (result?.updated) onDone();
      return result;
    },
    undefined,
  );

  return (
    <form action={action} className="mt-1 flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="url"
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoFocus
          aria-label="New destination URL"
          className={inputClass}
        />
        <FormButtons pending={pending} disabled={value.trim() === url} onCancel={onDone} />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <p className="text-xs text-zinc-500">The short link stays the same and keeps its click history.</p>
    </form>
  );
}

function FormButtons({
  pending,
  disabled,
  onCancel,
}: {
  pending: boolean;
  disabled: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button type="submit" disabled={pending || disabled} className={buttonClass}>
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={onCancel} disabled={pending} className={secondaryButtonClass}>
        Cancel
      </button>
    </div>
  );
}

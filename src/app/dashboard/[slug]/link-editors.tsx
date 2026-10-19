"use client";

import { useActionState, useState } from "react";
import {
  renameLink,
  updateLinkTitle,
  updateLinkUrl,
  type RenameLinkState,
  type UpdateLinkState,
} from "@/app/actions/links";
import { CopyButton } from "@/components/copy-button";
import { CornerDownRightIcon, PencilIcon } from "@/components/icons";
import {
  buttonClass,
  fieldTextClass,
  ghostIconButtonClass,
  inputClass,
  secondaryButtonClass,
} from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { TITLE_MAX_LENGTH } from "@/lib/link-title";
import { useSlugAvailability } from "../use-slug-availability";

// Each form is mounted fresh when editing starts, so an old error never shows on reopening.

/** The link's title, or a prompt to add one, with an edit icon that swaps in a form. */
export function LinkTitle({ linkId, title }: { linkId: string; title: string | null }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <TitleForm linkId={linkId} title={title} onDone={() => setEditing(false)} />;

  return (
    <div className="flex min-w-0 items-center gap-1">
      {title ? (
        <p className="min-w-0 wrap-anywhere">{title}</p>
      ) : (
        <p className="text-zinc-500">No title. The domain is shown instead.</p>
      )}
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={title ? "Edit title" : "Add title"}
        title={title ? "Edit title" : "Add title"}
        className={ghostIconButtonClass}
      >
        <PencilIcon size={15} />
      </button>
    </div>
  );
}

function TitleForm({ linkId, title, onDone }: { linkId: string; title: string | null; onDone: () => void }) {
  const [value, setValue] = useState(title ?? "");
  const [state, action, pending] = useActionState(
    async (prev: UpdateLinkState, formData: FormData) => {
      const result = await updateLinkTitle(linkId, prev, formData);
      if (result?.updated) onDone();
      return result;
    },
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="title"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          autoFocus
          placeholder="e.g. Portfolio"
          aria-label="Title"
          className={inputClass}
        />
        <FormButtons pending={pending} disabled={value.trim() === (title ?? "")} onCancel={onDone} />
      </div>
      {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      <p className="text-xs text-zinc-500">Only you see this. Leave it empty to show the domain instead.</p>
    </form>
  );
}

/** The short link, with copy and an edit icon that swaps in a rename form. */
export function LinkSlug({ linkId, slug }: { linkId: string; slug: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <RenameForm linkId={linkId} slug={slug} onCancel={() => setEditing(false)} />;

  return (
    <div className="flex min-w-0 items-center gap-1">
      {/* Wraps instead of truncating: on a phone the host alone nearly fills the line. Opens the
          preview page, so checking the link from here isn't counted as a click. */}
      <a
        href={`/${slug}/preview`}
        target="_blank"
        title="Open preview"
        className="mr-1 min-w-0 text-lg font-semibold wrap-anywhere text-blue-600 hover:underline sm:text-xl dark:text-blue-400"
      >
        {SHORT_HOST}/<wbr />
        {slug}
      </a>
      <CopyButton text={shortUrl(slug)} ghost />
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
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="New short name"
            className={`min-w-0 flex-1 bg-white px-3 py-2 font-mono ${fieldTextClass} outline-none dark:bg-zinc-900`}
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
      <p className="text-xs wrap-anywhere text-amber-700 dark:text-amber-400">
        Anyone using the old link ({SHORT_HOST}/{slug}) or its QR code will see that it doesn&apos;t
        exist, and someone else could take that name. Click history is kept.
      </p>
    </form>
  );
}

/** A link's destination ("↳ https://…"), with an edit icon that swaps in a form. */
export function LinkDestination({ linkId, url }: { linkId: string; url: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) return <DestinationForm linkId={linkId} url={url} onDone={() => setEditing(false)} />;

  return (
    <div className="flex min-w-0 items-center gap-2 text-zinc-700 dark:text-zinc-300">
      <span className="shrink-0 text-zinc-500">
        <CornerDownRightIcon />
      </span>
      <a href={url} target="_blank" rel="noreferrer" className="truncate hover:underline" title={url}>
        {url}
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

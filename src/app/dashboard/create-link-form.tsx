"use client";

import { useActionState, useState } from "react";
import { createLink, type CreateLinkState } from "@/app/actions/links";
import { CopyButton } from "@/components/copy-button";
import { buttonClass, cardClass, fieldTextClass, inputClass } from "@/components/ui";
import { SHORT_HOST, shortUrl } from "@/lib/config";
import { useSlugAvailability } from "./use-slug-availability";

export function CreateLinkForm() {
  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");

  const [state, action, pending] = useActionState(
    async (prev: CreateLinkState, formData: FormData) => {
      const result = await createLink(prev, formData);
      if (result?.created) {
        setUrl("");
        setSlug("");
      }
      return result;
    },
    undefined,
  );

  const availability = useSlugAvailability(slug);

  const slugMessage =
    state?.slugError ??
    (availability.status === "unavailable" ? availability.reason : undefined);

  return (
    <div className={cardClass}>
      <h2 className="mb-4 font-semibold">Shorten a link</h2>
      <form action={action} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Long URL
          <input
            name="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://example.com/a/very/long/link"
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {/* One span, so the hint follows the label instead of getting its own row in the column. */}
          <span>
            Short name <span className="font-normal text-zinc-500">(optional — leave blank for a random one)</span>
          </span>
          <div className="flex items-stretch overflow-hidden rounded-lg border border-zinc-300 focus-within:border-zinc-900 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:border-zinc-700 dark:focus-within:border-zinc-300">
            <span className="flex items-center bg-zinc-100 px-3 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
              {SHORT_HOST}/
            </span>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={50}
              placeholder="my-link"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className={`min-w-0 flex-1 bg-white px-3 py-2 font-mono ${fieldTextClass} outline-none dark:bg-zinc-900`}
            />
          </div>
          <span className="min-h-5 text-xs font-normal">
            {availability.status === "checking" && (
              <span className="text-zinc-500">Checking…</span>
            )}
            {availability.status === "available" && !state?.slugError && (
              <span className="text-emerald-600 dark:text-emerald-400">✓ Available</span>
            )}
            {slugMessage && (
              <span className="text-red-600 dark:text-red-400">✗ {slugMessage}</span>
            )}
          </span>
        </label>

        {state?.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}

        <button
          type="submit"
          disabled={pending || availability.status === "unavailable"}
          className={`${buttonClass} self-start`}
        >
          {pending ? "Trimming…" : "Trim it"}
        </button>
      </form>

      {state?.created && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-950">
          <span className="min-w-0 font-mono text-sm wrap-anywhere text-emerald-800 dark:text-emerald-200">
            {shortUrl(state.created)}
          </span>
          <CopyButton text={shortUrl(state.created)} />
        </div>
      )}
    </div>
  );
}

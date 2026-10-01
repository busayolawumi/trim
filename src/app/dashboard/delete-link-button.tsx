"use client";

import { useTransition } from "react";
import { deleteLink } from "@/app/actions/links";
import { secondaryButtonClass } from "@/components/ui";

export function DeleteLinkButton({ linkId, slug }: { linkId: string; slug: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className={`${secondaryButtonClass} text-red-600 dark:text-red-400`}
      onClick={() => {
        if (!confirm(`Delete /${slug}? Its click history will be deleted too.`)) return;
        startTransition(() => deleteLink(linkId));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

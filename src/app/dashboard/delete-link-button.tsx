"use client";

import { useTransition } from "react";
import { deleteLink } from "@/app/actions/links";
import { TrashIcon } from "@/components/icons";
import { dangerIconButtonClass } from "@/components/ui";

export function DeleteLinkButton({ linkId, slug }: { linkId: string; slug: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Delete /${slug}`}
      title="Delete"
      className={dangerIconButtonClass}
      onClick={() => {
        if (!confirm(`Delete /${slug}? Its click history will be deleted too.`)) return;
        startTransition(() => deleteLink(linkId));
      }}
    >
      <TrashIcon />
    </button>
  );
}

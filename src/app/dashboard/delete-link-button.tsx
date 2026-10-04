"use client";

import { useRef, useTransition, type MouseEvent } from "react";
import { deleteLink } from "@/app/actions/links";
import { TrashIcon } from "@/components/icons";
import {
  dangerButtonClass,
  dangerIconButtonClass,
  modalClass,
  secondaryButtonClass,
} from "@/components/ui";

export function DeleteLinkButton({ linkId, slug }: { linkId: string; slug: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const titleId = `delete-${linkId}-title`;

  // A click on the dimmed backdrop lands on the dialog itself, outside its box.
  function closeOnBackdrop(e: MouseEvent<HTMLDialogElement>) {
    if (pending || e.target !== e.currentTarget) return;
    const box = e.currentTarget.getBoundingClientRect();
    const outside =
      e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom;
    if (outside) e.currentTarget.close();
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Delete /${slug}`}
        title="Delete"
        className={dangerIconButtonClass}
        onClick={() => dialog.current?.showModal()}
      >
        <TrashIcon />
      </button>
      {/* showModal() makes the page behind inert, focuses Cancel (the first button) and closes on Escape. */}
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className={modalClass}
        onCancel={(e) => pending && e.preventDefault()}
        onClick={closeOnBackdrop}
      >
        <h2 id={titleId} className="font-semibold">
          Delete /{slug}?
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          The short link and any QR codes for it will stop working, and its click history will be
          deleted. This can&apos;t be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => dialog.current?.close()}
            className={secondaryButtonClass}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteLink(linkId);
                dialog.current?.close();
              })
            }
            className={dangerButtonClass}
          >
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}

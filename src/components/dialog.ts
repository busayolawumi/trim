import type { MouseEvent } from "react";

/** For a modal <dialog>'s onClick: true when the click landed on the dimmed backdrop, not the box. */
export function isBackdropClick(e: MouseEvent<HTMLDialogElement>) {
  // Backdrop clicks target the dialog itself, but fall outside its box.
  if (e.target !== e.currentTarget) return false;
  const box = e.currentTarget.getBoundingClientRect();
  return e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom;
}

"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import {
  ghostIconButtonClass,
  iconButtonClass,
  successGhostIconButtonClass,
  successIconButtonClass,
} from "@/components/ui";

/** Copies `text` to the clipboard. `ghost` makes it a small borderless button for use inline. */
export function CopyButton({ text, ghost = false }: { text: string; ghost?: boolean }) {
  const [copied, setCopied] = useState(false);
  const label = copied ? "Copied" : "Copy link";
  const className = ghost
    ? copied
      ? successGhostIconButtonClass
      : ghostIconButtonClass
    : copied
      ? successIconButtonClass
      : iconButtonClass;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon size={ghost ? 16 : 18} /> : <CopyIcon size={ghost ? 16 : 18} />}
    </button>
  );
}

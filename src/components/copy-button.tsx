"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { iconButtonClass, successIconButtonClass } from "@/components/ui";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const label = copied ? "Copied" : "Copy link";

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={copied ? successIconButtonClass : iconButtonClass}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

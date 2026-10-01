"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { inputClass } from "@/components/ui";

/** Password field with a show/hide toggle that appears once something is typed. */
export function PasswordInput(props: Omit<ComponentProps<"input">, "type" | "className">) {
  const ref = useRef<HTMLInputElement>(null);
  const [hasValue, setHasValue] = useState(false);
  const [visible, setVisible] = useState(false);

  // Forms using actions are reset after submitting, which doesn't fire onChange.
  useEffect(() => {
    const form = ref.current?.form;
    if (!form) return;
    const onReset = () => {
      setHasValue(false);
      setVisible(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  return (
    <div className="relative">
      <input
        {...props}
        ref={ref}
        type={visible ? "text" : "password"}
        onChange={(e) => {
          setHasValue(e.target.value !== "");
          if (!e.target.value) setVisible(false);
          props.onChange?.(e);
        }}
        className={`${inputClass} pr-10`}
      />
      {hasValue && (
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          // Keep focus (and the cursor) in the input.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="M10.6 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.2 3.2" />
      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

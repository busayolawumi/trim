"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { EyeIcon, EyeOffIcon } from "@/components/icons";
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

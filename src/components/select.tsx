import type { ComponentProps } from "react";
import { ChevronDownIcon } from "@/components/icons";
import { selectClass } from "@/components/ui";

/**
 * Native select with our own chevron instead of the browser's, so its padding, height and
 * arrow position match the text inputs in every browser.
 */
export function Select(props: Omit<ComponentProps<"select">, "className">) {
  return (
    <div className="relative">
      <select {...props} className={selectClass} />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-zinc-500">
        <ChevronDownIcon size={16} />
      </span>
    </div>
  );
}

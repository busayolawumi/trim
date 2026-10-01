"use client";

import { useEffect, useState } from "react";

type CheckResult = { slug: string; available: boolean; reason?: string };

export type SlugAvailability =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available" }
  | { status: "unavailable"; reason: string };

/**
 * Live "is this slug free?" check while typing (debounced). `current` is the slug the link
 * already has, which counts as idle rather than taken. The server re-checks on submit anyway.
 */
export function useSlugAvailability(slug: string, current?: string): SlugAvailability {
  const value = slug.trim().toLowerCase();
  const skip = !value || value === current;
  const [check, setCheck] = useState<CheckResult | null>(null);

  useEffect(() => {
    if (skip) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug-available?slug=${encodeURIComponent(value)}`, {
          signal: controller.signal,
        });
        const data: { available: boolean; reason?: string } = await res.json();
        setCheck({ slug: value, ...data });
      } catch {
        // Aborted or offline; the server re-checks on submit anyway.
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [value, skip]);

  if (skip) return { status: "idle" };
  if (check?.slug !== value) return { status: "checking" };
  return check.available
    ? { status: "available" }
    : { status: "unavailable", reason: check.reason ?? "Not available." };
}

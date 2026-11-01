"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { sileo, Toaster as SileoToaster } from "sileo";
import { FLASH_COOKIE, FLASH_MESSAGES, isFlashKey } from "@/lib/flash-messages";

/** Sileo's toaster, plus the toast left in a cookie by an action that redirected here. */
export function Toaster() {
  const pathname = usePathname();

  // Runs after SileoToaster's own effects (children first), so it's listening by then.
  useEffect(() => {
    const key = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${FLASH_COOKIE}=`))
      ?.slice(FLASH_COOKIE.length + 1);
    if (!key) return;

    document.cookie = `${FLASH_COOKIE}=; path=/; max-age=0`;
    if (isFlashKey(key)) sileo.success(FLASH_MESSAGES[key]);
  }, [pathname]);

  return <SileoToaster position="top-center" />;
}

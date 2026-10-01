"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TIMEZONE_COOKIE } from "@/lib/timezone-cookie";

/**
 * Saves the browser's timezone in a cookie so server-rendered stats can use local days.
 * Refreshes once when the cookie is first set or the timezone changes (e.g. after travelling).
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const saved = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${TIMEZONE_COOKIE}=`))
      ?.slice(TIMEZONE_COOKIE.length + 1);
    if (!tz || tz === saved) return;

    document.cookie = `${TIMEZONE_COOKIE}=${tz}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}

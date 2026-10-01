import "server-only";
import { cookies } from "next/headers";
import { TIMEZONE_COOKIE } from "@/lib/timezone-cookie";

function isValidTimezone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The viewer's IANA timezone (e.g. "Africa/Lagos"), saved by TimezoneSync. Falls back to UTC. */
export async function getTimezone() {
  const tz = (await cookies()).get(TIMEZONE_COOKIE)?.value;
  return tz && isValidTimezone(tz) ? tz : "UTC";
}

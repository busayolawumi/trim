import "server-only";
import { cookies } from "next/headers";
import { FLASH_COOKIE, type FlashKey } from "./flash-messages";

/** Call before redirect(): the next page reads the cookie, shows the toast and clears it. */
export async function setFlash(key: FlashKey) {
  (await cookies()).set(FLASH_COOKIE, key, {
    maxAge: 60,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
}

import type { SileoOptions } from "sileo";

export const FLASH_COOKIE = "flash";

/** Toasts for actions that redirect, shown on the page they land on. */
export const FLASH_MESSAGES = {
  "signed-up": {
    title: "Account created",
    description: "We've emailed you a link to verify your address.",
  },
  "logged-in": { title: "Welcome back" },
  "logged-out": { title: "Logged out" },
  "password-reset": {
    title: "Password reset",
    description: "You're logged in here, and your other devices have been logged out.",
  },
  "account-deleted": {
    title: "Account deleted",
    description: "Your links and their click history have been removed.",
  },
  renamed: {
    title: "Short link renamed",
    description: "The old address no longer works.",
  },
} satisfies Record<string, SileoOptions>;

export type FlashKey = keyof typeof FLASH_MESSAGES;

export function isFlashKey(value: string): value is FlashKey {
  return Object.hasOwn(FLASH_MESSAGES, value);
}

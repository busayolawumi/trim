import "server-only";
import { after } from "next/server";
import { APP_BASE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { renderEmail } from "@/lib/email-template";
import { getTimezone } from "@/lib/timezone";

/** Now, in the requester's timezone, e.g. "Nov 1, 2026, 2:16 PM (Europe/London)". */
async function now() {
  // Read before after(): the timezone cookie belongs to this request.
  const tz = await getTimezone();
  const when = new Date().toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: tz });
  return `${when} (${tz.replace(/_/g, " ")})`;
}

/**
 * Tells the user their password just changed, so a takeover doesn't go unnoticed. Sent after
 * the response, so a failed send can't turn a completed change into an error.
 */
export async function notifyPasswordChanged(email: string) {
  const when = await now();

  after(() =>
    sendEmail({
      to: email,
      ...renderEmail({
        subject: "Your Trim password was changed",
        preheader: `Your password was changed on ${when}.`,
        hero: "password-changed",
        heroAlt: "Shield with a padlock and a tick",
        security: true,
        heading: "Your password was changed",
        intro: "The password for your Trim account was just changed, and your other devices were logged out.",
        details: [
          ["Account", email],
          ["When", when],
        ],
        outro:
          "If this was you, there's nothing else to do. If it wasn't, reset your password now. That also logs out every device.",
        button: { label: "Reset password", url: `${APP_BASE_URL}/forgot-password` },
        footer: "You're getting this because the password on your Trim account changed.",
      }),
    }),
  );
}

/** Tells the old address its account moved to a new one. Sent after the response, like above. */
export async function notifyEmailChanged(oldEmail: string, newEmail: string) {
  const when = await now();

  after(() =>
    sendEmail({
      to: oldEmail,
      ...renderEmail({
        subject: "Your Trim email was changed",
        preheader: `Your Trim account now uses ${newEmail}.`,
        hero: "email-changed",
        heroAlt: "Shield with an at sign and swap arrows",
        security: true,
        heading: "Your email was changed",
        intro: "The email for your Trim account is no longer this address. From now on, Trim will only email the new one.",
        details: [
          ["Old email", oldEmail],
          ["New email", newEmail],
          ["When", when],
        ],
        outro: "If you made this change, there's nothing else to do. If you didn't, someone else may know your password.",
        footer: "You're getting this because the email on a Trim account was changed from this address.",
      }),
    }),
  );
}

import "server-only";
import { after } from "next/server";
import { SHORT_BASE_URL } from "@/lib/config";
import { sendEmail } from "@/lib/email";
import { getTimezone } from "@/lib/timezone";

/**
 * Tells the user their password just changed, so a takeover doesn't go unnoticed. Sent after
 * the response, so a failed send can't turn a completed change into an error.
 */
export async function notifyPasswordChanged(email: string) {
  // Read now: the timezone cookie belongs to this request.
  const tz = await getTimezone();
  const when = new Date().toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: tz });

  after(() =>
    sendEmail({
      to: email,
      subject: "Your Trim password was changed",
      text:
        `The password for your Trim account (${email}) was changed on ${when} (${tz.replace(/_/g, " ")}).\n\n` +
        `If this was you, there's nothing else to do.\n\n` +
        `If it wasn't, reset your password now. That also logs out every device:\n` +
        `${SHORT_BASE_URL}/forgot-password`,
    }),
  );
}

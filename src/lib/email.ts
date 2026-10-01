import "server-only";

type Email = { to: string; subject: string; text: string };

/** Sends an email through Resend's HTTP API. Without an API key in development, logs it instead. */
export async function sendEmail({ to, subject, text }: Email) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY and EMAIL_FROM must be set to send email");
    }
    console.log(`[email] to=${to} subject=${subject}\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
}

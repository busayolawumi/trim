import "server-only";
import { APP_BASE_URL } from "@/lib/config";

/** Illustrations in public/email/, one per kind of email. */
type Hero = "verify" | "reset" | "confirm-email" | "email-changed" | "password-changed";

export type EmailContent = {
  subject: string;
  /** The preview line inboxes show after the subject. */
  preheader: string;
  hero: Hero;
  heroAlt: string;
  heading: string;
  intro: string;
  /** Part of `intro` to show in bold, e.g. an email address. */
  introHighlight?: string;
  /** Security emails get a "Security notice" label and no expiry or backup link. */
  security?: boolean;
  details?: [label: string, value: string][];
  outro?: string;
  button?: { label: string; url: string };
  expiry?: string;
  footer: string;
};

const FONT = "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const APP_HOST = APP_BASE_URL.replace(/^https?:\/\//, "");

function esc(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Zero-width breaks stop mail apps turning addresses into mailto links. Takes escaped text. */
function unlink(html: string) {
  return html.replace(/@/g, "@&zwnj;").replace(/\./g, "&zwnj;.");
}

function highlighted(text: string, highlight?: string) {
  const safe = esc(text);
  if (!highlight) return safe;
  return safe.replace(
    esc(highlight),
    () => `<strong class="text-strong" style="color:#09090b;font-weight:600;">${unlink(esc(highlight))}</strong>`,
  );
}

// Light styles are inline (Gmail and Outlook ignore most <style> rules); dark mode overrides them
// where the client supports prefers-color-scheme, e.g. Apple Mail. Others apply their own dark mode.
const STYLE = `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
a[x-apple-data-detectors] {
  color: inherit !important; text-decoration: none !important; font-size: inherit !important;
  font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important;
}
@media (max-width: 620px) {
  .pad { padding-left: 24px !important; padding-right: 24px !important; }
  .heading { font-size: 24px !important; }
}
@media (prefers-color-scheme: dark) {
  .bg-page { background-color: #09090b !important; }
  .bg-card { background-color: #18181b !important; border-color: #27272a !important; box-shadow: none !important; }
  .bg-footer { background-color: #141416 !important; border-color: #27272a !important; }
  .bg-box { background-color: #111113 !important; border-color: #27272a !important; }
  .bg-pill { background-color: #27272a !important; color: #d4d4d8 !important; }
  .hero { border-top: 1px solid #27272a !important; border-bottom: 1px solid #27272a !important; }
  .divider { border-color: #27272a !important; }
  .text-strong { color: #fafafa !important; }
  .text-body, .text-muted { color: #a1a1aa !important; }
  .text-link { color: #34d399 !important; }
  .btn { background-color: #fafafa !important; }
  .btn-link { color: #09090b !important; }
  .chip { background-color: #261a06 !important; border-color: #78350f !important; color: #fbbf24 !important; }
  .logo-light { display: none !important; }
  .logo-dark { display: block !important; max-height: none !important; }
}`;

function button({ label, url }: { label: string; url: string }, marginTop: number) {
  return `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:${marginTop}px auto 0;">
<tr><td class="btn" bgcolor="#09090b" style="background-color:#09090b;border-radius:12px;">
<a class="btn-link" href="${esc(url)}" style="display:inline-block;padding:15px 34px;font-family:${FONT};font-size:15px;font-weight:600;line-height:20px;color:#ffffff;text-decoration:none;border-radius:12px;">${esc(label)}</a>
</td></tr></table>`;
}

function details(rows: [string, string][]) {
  const cells = rows
    .map(([label, value], i) => {
      const border = i < rows.length - 1 ? "border-bottom:1px solid #f4f4f5;" : "";
      return `<tr>
<td class="text-muted divider" style="padding:14px 0 14px 20px;${border}font-family:${FONT};font-size:14px;color:#71717a;text-align:left;">${esc(label)}</td>
<td class="text-strong divider" style="padding:14px 20px 14px 16px;${border}font-family:${FONT};font-size:14px;font-weight:500;color:#09090b;text-align:right;overflow-wrap:anywhere;word-break:break-word;">${unlink(esc(value))}</td>
</tr>`;
    })
    .join("");
  return `<table role="presentation" class="bg-box" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa;border:1px solid #f4f4f5;border-radius:14px;border-collapse:separate;">${cells}</table>`;
}

function renderHtml(c: EmailContent) {
  const p = (text: string, margin: string, size = 16) =>
    `<p class="text-body" style="margin:${margin};font-family:${FONT};font-size:${size}px;line-height:1.65;color:#52525b;">${text}</p>`;

  const body = [
    c.security
      ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 18px;"><tr><td class="chip" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:999px;padding:4px 12px;font-family:${FONT};font-size:12px;font-weight:600;color:#b45309;">Security notice</td></tr></table>`
      : "",
    `<h1 class="heading text-strong" style="margin:0 0 14px;font-family:${FONT};font-size:28px;line-height:1.2;font-weight:700;letter-spacing:-0.025em;color:#09090b;">${esc(c.heading)}</h1>`,
    p(highlighted(c.intro, c.introHighlight), c.details || c.button ? "0 0 28px" : "0"),
    c.details ? details(c.details) : "",
    c.outro ? p(esc(c.outro), "28px 0 0", 15) : "",
    c.button ? button(c.button, c.outro ? 24 : 0) : "",
    c.expiry
      ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0;"><tr><td class="bg-pill" style="background-color:#f4f4f5;border-radius:999px;padding:6px 12px;font-family:${FONT};font-size:13px;color:#52525b;">${esc(c.expiry)}</td></tr></table>`
      : "",
    c.button && !c.security
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:36px 0 24px;"><tr><td class="divider" style="border-top:1px solid #f4f4f5;font-size:0;line-height:0;">&nbsp;</td></tr></table>
<p class="text-muted" style="margin:0;font-family:${FONT};font-size:13px;line-height:1.6;color:#71717a;">Button not working? Paste this link into your browser:</p>
<p style="margin:4px 0 0;font-family:${FONT};font-size:13px;line-height:1.6;word-break:break-all;"><a class="text-link" href="${esc(c.button.url)}" style="color:#047857;text-decoration:none;">${esc(c.button.url)}</a></p>`
      : "",
  ].join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<title>${esc(c.subject)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap">
<style>${STYLE}</style>
</head>
<body class="bg-page" style="margin:0;padding:0;background-color:#f4f4f5;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(c.preheader)}${"&#847;&zwnj;&nbsp;".repeat(40)}</div>
<table role="presentation" class="bg-page" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:32px 12px 40px;">
<table role="presentation" class="bg-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #ffffff;border-radius:20px;border-collapse:separate;box-shadow:0 1px 2px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);">
<tr><td align="center" style="padding:28px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td style="padding-right:8px;vertical-align:middle;">
<img class="logo-light" src="${APP_BASE_URL}/email/logo.png" width="30" height="30" alt="" style="display:block;border:0;">
<!--[if !mso]><!--><img class="logo-dark" src="${APP_BASE_URL}/email/logo-dark.png" width="30" height="30" alt="" style="display:none;max-height:0;border:0;"><!--<![endif]-->
</td>
<td class="text-strong" style="vertical-align:middle;font-family:${FONT};font-size:24px;font-weight:600;letter-spacing:-0.03em;color:#09090b;">Trim<span style="color:#10b981;">.</span></td>
</tr></table>
</td></tr>
<tr><td class="hero" bgcolor="#06100b" style="background-color:#06100b;font-size:0;line-height:0;">
<img src="${APP_BASE_URL}/email/${c.hero}.jpg" width="600" height="300" alt="${esc(c.heroAlt)}" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
</td></tr>
<tr><td class="pad" align="center" style="padding:${c.security ? 40 : 44}px 48px 40px;text-align:center;">
${body}
</td></tr>
<tr><td class="bg-footer pad" align="center" style="background-color:#fafafa;border-top:1px solid #f4f4f5;border-radius:0 0 20px 20px;padding:28px 48px 32px;text-align:center;font-family:${FONT};font-size:12px;line-height:1.7;">
<p class="text-body" style="margin:0;color:#52525b;">${esc(c.footer)}</p>
<p class="text-body" style="margin:10px 0 0;color:#52525b;"><span class="text-strong" style="font-weight:600;color:#18181b;">Trim</span> · Short links with a name you choose</p>
<p style="margin:2px 0 0;"><a class="text-body" href="${APP_BASE_URL}" style="color:#52525b;">${esc(APP_HOST)}</a></p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function renderText(c: EmailContent) {
  return [
    c.heading,
    c.intro,
    c.details?.map(([label, value]) => `${label}: ${value}`).join("\n"),
    c.outro,
    c.button && `${c.button.label}:\n${c.button.url}`,
    c.expiry,
    c.footer,
    `Trim · ${APP_HOST}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

/** The subject, HTML and plain-text versions of an email, ready for sendEmail. */
export function renderEmail(content: EmailContent) {
  return { subject: content.subject, html: renderHtml(content), text: renderText(content) };
}

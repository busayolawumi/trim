// Match the link-preview crawlers, not app names: in-app browsers (e.g. LinkedIn's "[LinkedInApp]",
// Pinterest's "Pinterest for iOS") are real people. LinkedInBot, TelegramBot, Slackbot, Discordbot and
// Pinterestbot are caught by "bot"; SkypeUriPreview and BingPreview by "preview".
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|^whatsapp\/|slack-imgproxy|embedly|vkshare|headless|curl|wget|python-requests|axios|go-http-client|node-fetch|httpclient/i;

export function parseUserAgent(ua: string | null) {
  if (!ua) return { isBot: true, device: null, browser: null };

  const isBot = BOT_PATTERN.test(ua);

  const device = /ipad|tablet/i.test(ua)
    ? "Tablet"
    : /mobi|iphone|android/i.test(ua)
      ? "Mobile"
      : "Desktop";

  const browser = /edg\//i.test(ua)
    ? "Edge"
    : /opr\/|opera/i.test(ua)
      ? "Opera"
      : /samsungbrowser/i.test(ua)
        ? "Samsung Internet"
        : /firefox|fxios/i.test(ua)
          ? "Firefox"
          : /chrome|crios/i.test(ua)
            ? "Chrome"
            : /safari/i.test(ua)
              ? "Safari"
              : "Other";

  return { isBot, device, browser };
}

export function referrerHost(referrer: string | null) {
  if (!referrer) return null;
  try {
    return new URL(referrer).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

import "server-only";

const ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";

/**
 * Asks Google Safe Browsing whether a URL is known phishing/malware.
 * Fails open: without an API key, or if the API errors or is slow, the URL is treated as safe.
 */
export async function isUnsafeUrl(url: string) {
  const key = process.env.SAFE_BROWSING_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify({
        client: { clientId: "trim", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: [
            "MALWARE",
            "SOCIAL_ENGINEERING",
            "UNWANTED_SOFTWARE",
            "POTENTIALLY_HARMFUL_APPLICATION",
          ],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    });
    if (!res.ok) throw new Error(`Safe Browsing responded ${res.status}: ${await res.text()}`);

    // An empty object means no matches.
    const data: { matches?: unknown[] } = await res.json();
    return Boolean(data.matches?.length);
  } catch (error) {
    console.error("[safe-browsing] check failed, allowing URL", error);
    return false;
  }
}

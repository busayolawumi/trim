/** A URL's host without "www.", used as a link's heading. Returns the input if it isn't a URL. */
export function domainOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

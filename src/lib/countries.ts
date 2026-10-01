const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

/** "NG" → "Nigeria". Returns the code itself if it isn't a known region. */
export function countryName(code: string) {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

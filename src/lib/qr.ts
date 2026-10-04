import "server-only";
import QRCode from "qrcode";
import { shortUrl } from "@/lib/config";

// Always black on white: many scanners can't read light-on-dark codes.
const OPTIONS = {
  errorCorrectionLevel: "M",
  margin: 4, // the blank border scanners need, in modules
  color: { dark: "#000000", light: "#ffffff" },
} as const;

// The code holds the short URL, not the destination, so scans are counted as clicks and the
// destination can change without reprinting. Renaming the slug does break existing codes.

/** QR code for a link's short URL as an SVG string. It has no width, so it scales to its container. */
export function qrSvg(slug: string) {
  return QRCode.toString(shortUrl(slug), { ...OPTIONS, type: "svg" });
}

/** QR code for a link's short URL as a 1024px PNG. */
export function qrPng(slug: string) {
  return QRCode.toBuffer(shortUrl(slug), { ...OPTIONS, type: "png", width: 1024 });
}

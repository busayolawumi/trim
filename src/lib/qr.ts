import "server-only";
import QRCode from "qrcode";
import { shortUrl } from "@/lib/config";
import { QR_OPTIONS } from "@/lib/qr-options";

// The code holds the short URL, not the destination, so scans are counted as clicks and the
// destination can change without reprinting. Renaming the slug does break existing codes.

/** QR code for a link's short URL as an SVG string. It has no width, so it scales to its container. */
export function qrSvg(slug: string) {
  return QRCode.toString(shortUrl(slug), { ...QR_OPTIONS, type: "svg" });
}

/** QR code for a link's short URL as a 1024px PNG. */
export function qrPng(slug: string) {
  return QRCode.toBuffer(shortUrl(slug), { ...QR_OPTIONS, type: "png", width: 1024 });
}

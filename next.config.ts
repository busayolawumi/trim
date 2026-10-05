import type { NextConfig } from "next";

const securityHeaders = [
  // No site may show these pages in a frame, so a page like Delete account can't be hidden
  // under another site's buttons to trick clicks (clickjacking). X-Frame-Options is for old browsers.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must use the declared Content-Type (e.g. the QR SVG) instead of guessing one.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The app never uses these, so no page can ask for them.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // No Referrer-Policy: the browser default is fine, and setting one on the short-link redirect
  // would change what destination sites see. Vercel already sends Strict-Transport-Security.
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Some apps fetch /favicon.ico directly. A favicon.ico file can't be generated in code,
    // so serve the PNG from src/app/icon.tsx there.
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;

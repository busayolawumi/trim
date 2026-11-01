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

// The website's own pages. On the short-link domain they redirect to the app's domain, so a
// new top-level page needs adding here.
const APP_PATHS = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/confirm-email",
  "/dashboard/:path*",
  "/api/:path*",
];

const nextConfig: NextConfig = {
  async redirects() {
    const short = process.env.NEXT_PUBLIC_SHORT_BASE_URL;
    const app = process.env.NEXT_PUBLIC_APP_BASE_URL;
    if (!short || !app) return [];
    const shortHost = new URL(short).hostname;
    const appUrl = new URL(app);
    if (shortHost === appUrl.hostname) return [];

    return APP_PATHS.map((source) => ({
      source,
      has: [{ type: "host" as const, value: shortHost }],
      destination: `${appUrl.origin}${source}`,
      // Temporary, so browsers don't cache it if the domains ever change.
      permanent: false,
    }));
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Some apps fetch /favicon.ico directly, so serve the PNG icon there.
    return [{ source: "/favicon.ico", destination: "/favicon-32.png" }];
  },
};

export default nextConfig;

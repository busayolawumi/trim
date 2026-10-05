import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";
import { SHORT_HOST } from "@/lib/config";

// The card shown when a Trim page (not a short link, which redirects) is shared in chat or social
// apps. Generated at build time; the text uses next/og's built-in Geist, the app's font.
export const alt = "Trim: short links with a name you choose, and stats on who clicks";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "#09090b",
          color: "#fafafa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <BrandMark size={64} />
          <div style={{ display: "flex", fontSize: 52, letterSpacing: -1.5 }}>
            trim<span style={{ color: "#10b981" }}>.</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 96, letterSpacing: -3, lineHeight: 1 }}>Long links, trimmed.</div>
          <div style={{ fontSize: 36, color: "#a1a1aa" }}>
            Short links with a name you choose, and stats on who clicks.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            padding: "14px 26px",
            borderRadius: 16,
            border: "2px solid #27272a",
            background: "#18181b",
            fontSize: 32,
          }}
        >
          {SHORT_HOST}/<span style={{ color: "#10b981" }}>your-link</span>
        </div>
      </div>
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";

// Generated once at build time. /favicon.ico is rewritten here in next.config.ts.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <BrandMark size={32} />
      </div>
    ),
    size,
  );
}

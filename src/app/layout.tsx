import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SHORT_BASE_URL } from "@/lib/config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description = "Shorten links and see who clicks them.";

export const metadata: Metadata = {
  // Makes the generated share image's URL absolute, as chat and social apps require.
  metadataBase: new URL(SHORT_BASE_URL),
  title: "Trim",
  description,
  openGraph: { siteName: "Trim", title: "Trim", description, type: "website" },
  // X uses the Open Graph image; this asks for the large card.
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

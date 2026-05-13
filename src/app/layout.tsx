import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

// MarkGEO — primary Georgian + Latin family.
// Regular & Bold drive body and display; CAPS handles uppercase labels.
const markGeo = localFont({
  src: [
    { path: "./fonts/MarkGEO-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/MarkGEO-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-markgeo",
  display: "swap",
});

const markGeoCaps = localFont({
  src: "./fonts/MarkGEO-CAPS.ttf",
  variable: "--font-markgeo-caps",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "walle.school — AI lessons that meet you where you are",
  description:
    "Learn AI tools, build AI agents, and create apps with vibe coding. Personalized lessons for every age, taught by Walli.",
  openGraph: {
    title: "walle.school — AI lessons that meet you where you are",
    description:
      "Learn AI tools, build AI agents, and create apps with vibe coding. Personalized lessons for every age, taught by Walli.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0E1A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ka" suppressHydrationWarning>
      <body
        className={`${markGeo.variable} ${markGeoCaps.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

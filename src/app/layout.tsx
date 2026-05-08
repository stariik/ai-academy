import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

// FiraGO — primary font family. Carries Georgian + Latin in one consistent voice.
import "@fontsource/firago/400.css";
import "@fontsource/firago/500.css";
import "@fontsource/firago/600.css";
import "@fontsource/firago/700.css";

import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

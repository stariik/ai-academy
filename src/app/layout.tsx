import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { SITE_URL } from "@/lib/seo";

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "walle.academy — პრაქტიკული AI განათლება",
    template: "%s | walle.academy",
  },
  description:
    "ისწავლე ხელოვნური ინტელექტი, AI ინსტრუმენტები და პროგრამირება პრაქტიკული ონლაინ კურსებით ქართულად და ინგლისურად.",
  openGraph: {
    title: "walle.academy — პრაქტიკული AI განათლება",
    description:
      "პრაქტიკული AI კურსები ქართულად და ინგლისურად — შენი ტემპით, Walli-სთან ერთად.",
    siteName: "walle.academy",
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "walle.academy — პრაქტიკული AI განათლება",
    description: "პრაქტიკული AI კურსები ქართულად და ინგლისურად.",
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
    <html lang="ka" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${markGeo.variable} ${markGeoCaps.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

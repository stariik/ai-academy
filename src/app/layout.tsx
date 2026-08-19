import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import "./globals.css";
import { MetaPixelPageView } from "@/components/analytics/MetaPixelPageView";
import { AppProviders } from "@/components/providers/AppProviders";
import { SITE_URL } from "@/lib/seo";

const META_PIXEL_ID = "4383004695342851";
const META_PIXEL_SCRIPT = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
`;

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
      "პრაქტიკული AI კურსები ქართულად და ინგლისურად — შენი ტემპით, Walle-სთან ერთად.",
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
  // Font variables live on <html>, not <body>: --font-caps & friends are
  // declared on :root and reference these, and a var() resolves on the element
  // that declares it. Sitting on <body> they were invisible to :root, so every
  // `font-family: var(--font-caps)` silently computed to nothing.
  return (
    <html
      lang="ka"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${markGeo.variable} ${markGeoCaps.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: META_PIXEL_SCRIPT }} />
      </head>
      <body className="antialiased">
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
        <MetaPixelPageView />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

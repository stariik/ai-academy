import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Academy - Demo",
  description: "AI-powered learning platform demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav
          className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-6 py-3"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="text-lg font-bold no-underline text-[var(--foreground)]"
            aria-label="AI Academy home"
          >
            AI Academy
          </Link>
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="text-sm font-medium no-underline text-[var(--muted-foreground)]"
              aria-label="Navigate to Admin panel"
            >
              Admin
            </Link>
            <Link
              href="/student"
              className="text-sm font-medium no-underline text-[var(--muted-foreground)]"
              aria-label="Navigate to Student view"
            >
              Student
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}

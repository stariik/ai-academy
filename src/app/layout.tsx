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
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--background)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              textDecoration: "none",
              color: "var(--foreground)",
            }}
          >
            AI Academy
          </Link>
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link
              href="/admin"
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                color: "var(--muted-foreground)",
              }}
            >
              Admin
            </Link>
            <Link
              href="/student"
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                textDecoration: "none",
                color: "var(--muted-foreground)",
              }}
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

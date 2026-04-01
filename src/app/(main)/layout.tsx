import Link from "next/link";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
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
        <Link
          href="/student"
          className="text-sm font-medium no-underline text-[var(--muted-foreground)]"
          aria-label="Navigate to Courses"
        >
          Courses
        </Link>
      </nav>
      <main>{children}</main>
    </>
  );
}

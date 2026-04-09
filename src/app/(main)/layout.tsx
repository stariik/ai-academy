'use client';

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const categories = [
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Programming",
    "Business",
    "Design",
    "Marketing",
    "Personal Growth",
  ];

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-navy text-white transition-shadow ${
          scrolled ? "shadow-lg shadow-navy/20" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6 h-14 sm:h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 no-underline flex-shrink-0"
              aria-label="AI Academy home"
            >
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan to-teal flex items-center justify-center font-black text-navy text-sm shadow-md">
                AI
              </div>
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-cream hidden sm:block">
                AI Academy
              </span>
            </Link>

            {/* Categories (desktop) */}
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setCatOpen(true)}
              onMouseLeave={() => setCatOpen(false)}
            >
              <button
                className="flex items-center gap-1 text-sm font-semibold text-white/90 hover:text-cyan transition py-2"
                aria-haspopup="true"
                aria-expanded={catOpen}
              >
                Categories
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 pt-1 w-64">
                  <div className="bg-white rounded-xl shadow-2xl border border-navy-100 overflow-hidden animate-in fade-in">
                    {categories.map((c) => (
                      <Link
                        key={c}
                        href="/student"
                        className="block px-4 py-2.5 text-sm text-navy hover:bg-cyan-50 hover:text-teal font-medium no-underline transition"
                      >
                        {c}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Search (desktop) */}
            <form
              action="/"
              className="hidden md:flex flex-1 max-w-xl relative"
              role="search"
            >
              <input
                type="search"
                name="q"
                placeholder="Search for anything…"
                className="w-full rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:bg-white focus:text-navy focus:placeholder:text-navy-100 focus:border-cyan focus:ring-2 focus:ring-cyan/40 transition"
                aria-label="Search"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70 pointer-events-none peer-focus:text-navy"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </form>

            {/* Links (desktop) */}
            <div className="hidden md:flex items-center gap-1 flex-shrink-0">
              <Link
                href="/student"
                className="text-sm font-semibold text-white/90 hover:text-cyan px-3 py-2 no-underline transition"
              >
                My Learning
              </Link>
              <Link
                href="/student"
                className="text-sm font-bold bg-cyan text-navy px-4 py-2 rounded-full no-underline hover:bg-cream transition shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                Explore
              </Link>
            </div>

            {/* Mobile: search icon + hamburger */}
            <div className="flex md:hidden items-center gap-1 ml-auto">
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="h-10 w-10 flex items-center justify-center rounded-lg hover:bg-white/10 transition"
                aria-label="Menu"
                aria-expanded={mobileOpen}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-3 animate-in slide-in-from-top">
              <form action="/" role="search" className="relative">
                <input
                  type="search"
                  name="q"
                  placeholder="Search…"
                  className="w-full rounded-full bg-white text-navy placeholder:text-navy-100 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </form>
              <div className="flex flex-col">
                <Link href="/student" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold text-white/90 hover:text-cyan no-underline">
                  My Learning
                </Link>
                <p className="py-2 text-[11px] uppercase tracking-wider text-cream/70 font-bold">Categories</p>
                {categories.map((c) => (
                  <Link
                    key={c}
                    href="/student"
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-sm text-white/80 hover:text-cyan no-underline"
                  >
                    {c}
                  </Link>
                ))}
                <Link
                  href="/student"
                  onClick={() => setMobileOpen(false)}
                  className="mt-3 text-center text-sm font-bold bg-cyan text-navy px-4 py-3 rounded-full no-underline"
                >
                  Explore all courses
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}

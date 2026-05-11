'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { CATEGORIES } from '@/lib/constants/categories';

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function fetchDue() {
      try {
        const res = await fetch('/api/review?count=1');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data?.dueCount === 'number') setReviewDueCount(data.dueCount);
      } catch {}
    }
    fetchDue();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initials = (user?.displayName || user?.email || user?.phone || '?').charAt(0).toUpperCase();

  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-navy text-white transition-shadow ${
          scrolled ? 'shadow-lg shadow-navy/20' : ''
        }`}
        aria-label="მთავარი ნავიგაცია"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-6 h-14 sm:h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 no-underline flex-shrink-0"
              aria-label="AI Academy"
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
                კატეგორიები
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 pt-1 w-64">
                  <div className="bg-white rounded-xl shadow-2xl border border-navy-100 overflow-hidden">
                    {CATEGORIES.map((c) => (
                      <Link
                        key={c}
                        href={`/courses?cat=${encodeURIComponent(c)}`}
                        className="block px-4 py-2.5 text-sm text-navy hover:bg-cyan-50 hover:text-teal font-medium no-underline transition"
                      >
                        {c}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Flex spacer */}
            <div className="hidden md:block flex-1" />

            {/* Courses link (desktop) */}
            <Link
              href="/courses"
              className="hidden md:block text-sm font-semibold text-white/90 hover:text-cyan px-3 py-2 no-underline transition"
            >
              ყველა კურსი
            </Link>

            {/* Review link (desktop) */}
            {user && (
              <Link
                href="/review"
                className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-white/90 hover:text-cyan px-3 py-2 no-underline transition"
              >
                გამეორება
                {reviewDueCount > 0 && (
                  <span className="inline-flex items-center justify-center text-[10px] font-black bg-cyan text-navy rounded-full min-w-[20px] h-5 px-1.5">
                    {reviewDueCount}
                  </span>
                )}
              </Link>
            )}

            {/* Auth area (desktop) */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0">
              {user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan to-teal text-navy font-black text-sm flex items-center justify-center shadow-md hover:scale-105 transition"
                    aria-label="პროფილი"
                    aria-expanded={userMenuOpen}
                  >
                    {initials}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-navy-100 overflow-hidden">
                      <div className="px-4 py-3 border-b border-cyan-50">
                        <p className="text-sm font-bold text-navy truncate">
                          {user.displayName || 'სტუდენტი'}
                        </p>
                        <p className="text-xs text-navy-100 truncate">
                          {user.email || user.phone}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-navy hover:bg-cyan-50 hover:text-teal font-medium no-underline transition"
                      >
                        პროფილი
                      </Link>
                      <Link
                        href="/courses"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-2.5 text-sm text-navy hover:bg-cyan-50 hover:text-teal font-medium no-underline transition"
                      >
                        ჩემი კურსები
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition"
                      >
                        გასვლა
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-white/90 hover:text-cyan px-3 py-2 no-underline transition"
                  >
                    შესვლა
                  </Link>
                  <Link
                    href="/register"
                    className="text-sm font-bold bg-cyan text-navy px-4 py-2 rounded-full no-underline hover:bg-cream transition shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    რეგისტრაცია
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden h-10 w-10 ml-auto flex items-center justify-center rounded-lg hover:bg-white/10 transition"
              aria-label="მენიუ"
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

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-3">
              {user && (
                <div className="flex items-center gap-3 px-1 pb-3 border-b border-white/10">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan to-teal text-navy font-black flex items-center justify-center shadow-md">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{user.displayName || 'სტუდენტი'}</p>
                    <p className="text-xs text-white/60 truncate">{user.email || user.phone}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-col">
                <Link href="/courses" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold text-white/90 hover:text-cyan no-underline">
                  ყველა კურსი
                </Link>
                {user && (
                  <Link
                    href="/review"
                    onClick={() => setMobileOpen(false)}
                    className="py-2.5 text-sm font-semibold text-white/90 hover:text-cyan no-underline flex items-center gap-2"
                  >
                    გამეორება
                    {reviewDueCount > 0 && (
                      <span className="inline-flex items-center justify-center text-[10px] font-black bg-cyan text-navy rounded-full min-w-[20px] h-5 px-1.5">
                        {reviewDueCount}
                      </span>
                    )}
                  </Link>
                )}
                {user && (
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="py-2.5 text-sm font-semibold text-white/90 hover:text-cyan no-underline">
                    პროფილი
                  </Link>
                )}
                <p className="py-2 text-[11px] uppercase tracking-wider text-cream/70 font-bold">კატეგორიები</p>
                {CATEGORIES.map((c) => (
                  <Link
                    key={c}
                    href={`/courses?cat=${encodeURIComponent(c)}`}
                    onClick={() => setMobileOpen(false)}
                    className="py-2 text-sm text-white/80 hover:text-cyan no-underline"
                  >
                    {c}
                  </Link>
                ))}
                {user ? (
                  <button
                    onClick={() => {
                      signOut();
                      setMobileOpen(false);
                    }}
                    className="mt-3 text-center text-sm font-bold border border-white/30 text-white px-4 py-3 rounded-full"
                  >
                    გასვლა
                  </button>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="text-center text-sm font-bold border border-white/30 text-white px-4 py-3 rounded-full no-underline"
                    >
                      შესვლა
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="text-center text-sm font-bold bg-cyan text-navy px-4 py-3 rounded-full no-underline"
                    >
                      რეგისტრაცია
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}

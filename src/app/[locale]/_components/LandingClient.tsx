'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Walli } from '@/components/walli/Walli';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  TONE_CLASSES,
  type Category,
  type Course,
  type Tone,
} from '@/lib/v2/data';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import type { AuthUser } from '@/lib/auth';
import { signOutAction } from '../(auth)/actions';
import { CatalogSection } from './CatalogSection';
import Link from 'next/link';

/* ============================================================
   Top-level shell
   ============================================================ */

export default function LandingClient({
  categories,
  courses,
  dict,
  locale,
  authUser,
  enrolledCourseIds = [],
}: {
  categories: Category[];
  courses: Course[];
  dict: Dict;
  locale: Locale;
  authUser: AuthUser | null;
  enrolledCourseIds?: string[];
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar authUser={authUser} />
        <main>
          <Hero />
          <CatalogSection
            categories={categories}
            courses={courses}
            authed={Boolean(authUser)}
            enrolledCourseIds={enrolledCourseIds}
          />
          <HowItWorks />
          <CtaBanner />
        </main>
        <Footer categories={categories} />
      </div>
    </V2LocaleProvider>
  );
}

/* ============================================================
   Navbar
   ============================================================ */

export function Navbar({
  authUser,
  homeAnchors = true,
}: {
  authUser: AuthUser | null;
  /** When true (landing), section links are same-page hashes. When false
   *  (e.g. /about), they point back to the homepage's sections. */
  homeAnchors?: boolean;
}) {
  const { dict, href } = useV2Locale();
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy for the landing page's three sections, so the nav answers
  // "where am I?" on a page you scroll for a long time. The band sits just
  // below the header: a section is active while it crosses the upper third.
  React.useEffect(() => {
    if (!homeAnchors || typeof IntersectionObserver === 'undefined') return;
    const els = ['categories', 'courses', 'how']
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActiveSection(top.target.id);
      },
      { rootMargin: '-18% 0px -70% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [homeAnchors]);

  const anchor = (id: string) => (homeAnchors ? `#${id}` : `${href()}#${id}`);
  const NAV_LINKS = [
    { label: dict.navbar.categories, href: anchor('categories'), section: 'categories' },
    { label: dict.navbar.courses, href: anchor('courses'), section: 'courses' },
    { label: dict.navbar.howItWorks, href: anchor('how'), section: 'how' },
    { label: dict.navbar.about, href: href('about') },
    { label: dict.navbar.contact, href: href('contact') },
  ].map((l) => ({
    ...l,
    active: l.section
      ? homeAnchors && activeSection === l.section
      : pathname === l.href,
  }));

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 transition-all duration-300',
          scrolled
            ? 'backdrop-blur-md bg-background/85 border-b border-border shadow-[0_4px_24px_-16px_rgba(0,0,0,0.18)]'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3 h-14 sm:h-16">
          <Link href={href()} className="flex items-center gap-2 shrink-0 min-w-0">
            <Walli size={32} state="idle" noShadow />
            <div className="leading-tight min-w-0">
              <p className="text-sm sm:text-base font-bold tracking-tight truncate">
                {dict.meta.brandName}
              </p>
              <p className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">
                {dict.meta.siteTagline}
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                aria-current={l.active ? 'true' : undefined}
                className={cn(
                  'relative transition-colors py-1.5',
                  'after:absolute after:left-0 after:right-0 after:bottom-0 after:mx-auto after:h-[2px] after:rounded-full after:bg-pulse after:transition-[width] after:duration-300 hover:after:w-full',
                  l.active
                    ? 'text-foreground after:w-full'
                    : 'text-muted-foreground hover:text-foreground after:w-0',
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              {authUser ? (
                <UserMenu authUser={authUser} />
              ) : (
                <>
                  <Link
                    href={href('login')}
                    className="text-sm font-semibold px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {dict.navbar.signIn}
                  </Link>
                  <Link
                    href={href('register')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full bg-pulse text-primary-foreground px-4 py-2 hover:shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                  >
                    {dict.navbar.signUp}
                    <span aria-hidden>→</span>
                  </Link>
                </>
              )}
            </div>

            {/* Phones: only the primary action stays on the bar. Language,
                theme and the profile all live inside the sheet. */}
            <div className="md:hidden flex items-center gap-1.5">
              {!authUser && (
                <Link
                  href={href('register')}
                  className="inline-flex h-9 items-center rounded-full bg-pulse px-3.5 text-[13px] font-bold text-primary-foreground shadow-[0_4px_14px_var(--pulse-glow)] active:scale-95 transition-transform"
                >
                  {dict.navbar.signUp}
                </Link>
              )}
              <button
                onClick={() => setMobileOpen(true)}
                aria-label={dict.navbar.menu}
                aria-expanded={mobileOpen}
                className="grid h-10 w-10 place-items-center rounded-xl text-foreground hover:bg-muted active:bg-muted transition-colors"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <MobileMenu
          links={NAV_LINKS}
          authUser={authUser}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

export function UserMenu({ authUser }: { authUser: AuthUser }) {
  const { dict, locale, href } = useV2Locale();
  const [open, setOpen] = React.useState(false);
  const tone = toneFromString(authUser.id);
  const t = TONE_CLASSES[tone];
  const name = authUser.displayName ?? dict.profile.anonymousName;
  const initials = userInitials(name);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-card pl-2 pr-3 py-1 hover:border-pulse/40 transition-colors"
      >
        <span
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-black text-primary-foreground',
            t.bg,
          )}
          aria-hidden
        >
          {initials}
        </span>
        <span className="text-sm font-bold tracking-tight max-w-[8rem] truncate">{name}</span>
        <span aria-hidden className={cn('text-xs transition-transform', open && 'rotate-180')}>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-2xl border border-border bg-card shadow-[0_18px_50px_-20px_rgba(0,0,0,0.2)] py-1.5 z-50"
        >
          <Link
            href={href('profile')}
            role="menuitem"
            className="block px-4 py-2 text-sm font-semibold hover:bg-pulse/5 hover:text-pulse transition-colors"
          >
            {dict.profile.pageTitle}
          </Link>
          <form action={signOutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              role="menuitem"
              className="block w-full text-left px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-heart hover:bg-heart/5 transition-colors"
            >
              {dict.auth.signOut}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFromString(s: string): Tone {
  const tones: Tone[] = ['pulse', 'heart', 'amber', 'violet', 'indigo'];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return tones[Math.abs(h) % tones.length];
}

export function LanguageSwitcher({ full = false }: { full?: boolean }) {
  const { locale } = useV2Locale();
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (target: Locale) => {
    if (target === locale) return;
    const newPath = pathname.replace(/^\/(ka|en)(?=\/|$)/, `/${target}`);
    router.push(newPath);
  };

  return (
    <div
      className={cn(
        'inline-flex items-center font-bold rounded-full border border-border bg-card overflow-hidden',
        // Both variants clear a 36px tap target; the old 24px pill was below
        // anything you could reliably hit with a thumb.
        full ? 'h-11 text-sm' : 'h-9 text-xs',
      )}
    >
      {(['ka', 'en'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          aria-pressed={locale === l}
          className={cn(
            'h-full transition-colors',
            full ? 'px-4' : 'px-2.5',
            locale === l
              ? 'bg-pulse text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function MobileMenu({
  links,
  authUser,
  onClose,
}: {
  links: { label: string; href: string; active?: boolean }[];
  authUser: AuthUser | null;
  onClose: () => void;
}) {
  const { dict, locale, href } = useV2Locale();
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={dict.navbar.menu}
      className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md md:hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 border-b border-border">
        <Link href={href()} className="flex items-center gap-2" onClick={onClose}>
          <Walli size={32} state="idle" noShadow />
          <span className="text-sm sm:text-base font-bold tracking-tight">
            {dict.meta.brandName}
          </span>
        </Link>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label={dict.navbar.closeMenu}
          className="grid h-10 w-10 place-items-center rounded-xl hover:bg-muted text-foreground"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 flex flex-col px-5 sm:px-6 py-6 gap-1 overflow-y-auto">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            onClick={onClose}
            aria-current={l.active ? 'true' : undefined}
            className={cn(
              'group flex items-center justify-between py-4 border-b border-border text-2xl font-bold transition-colors',
              l.active ? 'text-pulse' : 'hover:text-pulse',
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span className="flex items-center gap-2.5">
              {l.active && (
                <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" aria-hidden />
              )}
              {l.label}
            </span>
            <span
              aria-hidden
              className="text-base text-muted-foreground/60 group-hover:text-pulse group-hover:translate-x-0.5 transition-all"
            >
              →
            </span>
          </Link>
        ))}

        <div className="mt-8 space-y-3">
          {authUser ? (
            <>
              {/* Identity row — who you're signed in as, and the way through
                  to the profile. Replaces the avatar that used to sit on the
                  bar. */}
              <Link
                href={href('profile')}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-colors hover:border-pulse/40 active:bg-muted"
              >
                <span
                  className={cn(
                    'grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-black text-primary-foreground',
                    TONE_CLASSES[toneFromString(authUser.id)].bg,
                  )}
                  aria-hidden
                >
                  {userInitials(authUser.displayName ?? dict.profile.anonymousName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold tracking-tight">
                    {authUser.displayName ?? dict.profile.anonymousName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {dict.profile.pageTitle}
                  </span>
                </span>
                <span aria-hidden className="text-muted-foreground">
                  →
                </span>
              </Link>
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="block w-full text-center text-base font-semibold text-muted-foreground hover:text-heart transition-colors py-2"
                >
                  {dict.auth.signOut}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href={href('register')}
                onClick={onClose}
                className="block text-center rounded-full bg-pulse text-primary-foreground px-5 py-3.5 text-base font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:shadow-[0_8px_24px_var(--pulse-glow)] transition-shadow"
              >
                {dict.navbar.signUp}
              </Link>
              <Link
                href={href('login')}
                onClick={onClose}
                className="block text-center text-base font-semibold text-foreground hover:text-pulse transition-colors py-2"
              >
                {dict.navbar.signIn}
              </Link>
            </>
          )}
        </div>

        {/* Preferences strip — language and theme both live here only. */}
        <div className="mt-auto pt-6 space-y-3 border-t border-border">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-bold">
              {dict.navbar.language}
            </span>
            <LanguageSwitcher full />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-bold">
              {dict.profile.tabSettings}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </div>
  );
}

/* ============================================================
   Hero
   ============================================================ */

function useHeroWalliSize() {
  const [size, setSize] = React.useState(240);
  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 380) setSize(132);
      else if (w < 640) setSize(168);
      else if (w < 1024) setSize(240);
      else if (w < 1280) setSize(280);
      else setSize(320);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

function Hero() {
  const { dict } = useV2Locale();
  const walliSize = useHeroWalliSize();

  return (
    <section className="relative pt-6 pb-10 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-starfield opacity-40" aria-hidden />
      <div
        className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-pulse/15 blur-3xl -z-10 lg:block hidden"
        aria-hidden
      />
      <div
        className="absolute -bottom-20 -left-20 w-[320px] h-[320px] rounded-full bg-heart/10 blur-3xl -z-10"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl grid gap-8 sm:gap-10 lg:gap-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="order-1 lg:order-2 flex items-center justify-center">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-pulse/25 via-pulse/5 to-transparent blur-2xl scale-[1.15] -z-10"
              aria-hidden
            />
            <Walli size={walliSize} state="wave" />

            {/* On phones the chips sit fully outside Walli — right-full and
                left-full put their edge against his, so no offset guessing and
                no overlap whatever the label says. From sm up there's room to
                float them over him again, as before. */}
            <FloatingChip
              className="top-0 right-full mr-1.5 sm:right-auto sm:mr-0 sm:-top-1 sm:-left-10 lg:-left-14"
              delay="0s"
              tone="pulse"
            >
              <span>🧭</span>
              <span>{dict.hero.chipFoundations}</span>
            </FloatingChip>
            <FloatingChip
              className="top-1/2 left-full ml-1.5 sm:left-auto sm:ml-0 sm:top-14 sm:-right-10 lg:-right-14"
              delay="0.6s"
              tone="heart"
            >
              <span>🎨</span>
              <span>{dict.hero.chipCreative}</span>
            </FloatingChip>
            <FloatingChip
              className="bottom-2 right-full mr-1.5 sm:right-auto sm:mr-0 sm:-bottom-1 sm:left-0 lg:-left-4"
              delay="1.2s"
              tone="amber"
            >
              <span>🎈</span>
              <span>{dict.hero.chipForKids}</span>
            </FloatingChip>
          </div>
        </div>

        <div className="order-2 lg:order-1 text-center lg:text-left lg:pl-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 text-pulse px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" />
            {dict.hero.eyebrow}
          </div>

          <h1
            className="mt-4 sm:mt-6 text-[24px] min-[380px]:text-[27px] sm:text-[36px] lg:text-[42px] xl:text-5xl font-bold leading-[1.12] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dict.hero.titleBefore}{' '}
            <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
              {dict.hero.titleHighlight}
            </span>
          </h1>

          <p className="mt-4 sm:mt-6 text-[14.5px] sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {dict.hero.description}
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <a
              href="#categories"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground px-5 py-3 text-[13px] sm:px-6 sm:py-3.5 sm:text-[15px] font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              {dict.hero.ctaPrimary}
              <span aria-hidden>→</span>
            </a>
            <a
              href="#categories"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-card border border-border px-5 py-3 text-[13px] sm:px-6 sm:py-3.5 sm:text-[15px] font-bold text-foreground hover:border-pulse/40 hover:bg-pulse/5 transition-colors"
            >
              <span
                aria-hidden
                className="flex items-center justify-center w-5 h-5 rounded-full bg-pulse/15 text-pulse text-[10px] group-hover:bg-pulse group-hover:text-primary-foreground transition-colors"
              >
                ▶
              </span>
              {dict.hero.ctaSecondary}
            </a>
          </div>

          <div className="mt-6 sm:mt-10 grid grid-cols-3 max-w-md mx-auto lg:mx-0 divide-x divide-border border-y border-border py-2.5 sm:py-3">
            <div className="text-center lg:text-left lg:px-4 first:lg:px-0">
              <p
                className="text-base sm:text-xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                2.4K+
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {dict.hero.statStudents}
              </p>
            </div>
            <div className="text-center lg:px-4">
              <p
                className="text-base sm:text-xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                9
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {dict.hero.statCategories}
              </p>
            </div>
            <div className="text-center lg:text-left lg:px-4">
              <p
                className="text-base sm:text-xl font-bold tabular-nums inline-flex items-center gap-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                4.8
                <span className="text-amber-500 text-base">★</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                {dict.hero.statRating}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2">
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
              {dict.hero.audienceFor}
            </span>
            <div className="flex flex-wrap gap-1.5">
              <AudiencePill>{dict.hero.audienceKids}</AudiencePill>
              <AudiencePill>{dict.hero.audienceTeens}</AudiencePill>
              <AudiencePill>{dict.hero.audienceAdults}</AudiencePill>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingChip({
  children,
  className,
  delay,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  delay: string;
  tone: 'pulse' | 'heart' | 'amber';
}) {
  const ring =
    tone === 'pulse' ? 'border-pulse/30' : tone === 'heart' ? 'border-heart/30' : 'border-amber-500/30';
  const glow =
    tone === 'pulse'
      ? 'shadow-[0_4px_16px_var(--pulse-glow)]'
      : tone === 'heart'
        ? 'shadow-[0_4px_16px_var(--heart-glow)]'
        : 'shadow-[0_4px_16px_rgba(245,158,11,0.20)]';
  return (
    <div className={cn('absolute float', className)} style={{ animationDelay: delay }}>
      <div
        className={cn(
          // Narrow on phones so the chip clears Walli in the ~95px beside him.
          'rounded-full bg-card border px-1.5 py-0.5 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 whitespace-nowrap',
          ring,
          glow,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function AudiencePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

/* ============================================================
   How It Works
   ============================================================ */

function HowItWorks() {
  const { dict } = useV2Locale();
  return (
    <section id="how" className="py-12 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader eyebrow={dict.howItWorks.eyebrow} title={dict.howItWorks.title} />

        <div className="relative mt-7 sm:mt-14 grid gap-3 sm:gap-5 md:grid-cols-3">
          <div
            className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px -z-10 bg-gradient-to-r from-transparent via-border to-transparent"
            aria-hidden
          />
          <Step
            number="01"
            tone="pulse"
            walliState="idle"
            title={dict.howItWorks.step1Title}
            description={dict.howItWorks.step1Description}
          />
          <Step
            number="02"
            tone="heart"
            walliState="wave"
            title={dict.howItWorks.step2Title}
            description={dict.howItWorks.step2Description}
          />
          <Step
            number="03"
            tone="amber"
            walliState="dance"
            title={dict.howItWorks.step3Title}
            description={dict.howItWorks.step3Description}
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  walliState,
  title,
  description,
  tone,
}: {
  number: string;
  walliState: 'idle' | 'wave' | 'dance';
  title: string;
  description: string;
  tone: keyof typeof TONE_CLASSES;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <div
      className={cn(
        'group relative rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-7 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_var(--pulse-glow)]',
        'hover:border-transparent',
      )}
    >
      <div
        className={cn(
          'absolute -top-6 -left-6 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500',
          t.bg,
        )}
        aria-hidden
      />
      <div
        className={cn(
          'absolute inset-0 rounded-3xl ring-2 ring-inset opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          t.ring,
        )}
        aria-hidden
      />

      <div
        className={cn(
          'absolute top-4 sm:top-6 right-4 sm:right-6 text-3xl sm:text-5xl font-black tabular-nums leading-none transition-opacity',
          t.text,
          'opacity-20 group-hover:opacity-40',
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {number}
      </div>
      <div className="relative mb-2.5 sm:mb-4 inline-block">
        <Walli size={58} state={walliState} noShadow />
      </div>
      <h3
        className="text-base sm:text-xl font-bold mb-1.5 sm:mb-2 leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

/* ============================================================
   CTA Banner
   ============================================================ */

function CtaBanner() {
  const { dict } = useV2Locale();
  return (
    <section className="py-10 sm:py-20 lg:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-pulse/40 bg-card p-5 sm:p-10 lg:p-12">
          <div className="absolute inset-0 -z-10 opacity-50 bg-starfield" aria-hidden />
          <div
            className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-pulse/25 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-heart/15 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-6 sm:gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="text-center md:text-left">
              <h2
                className="text-[26px] sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {dict.ctaBanner.titleBefore}{' '}
                <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
                  {dict.ctaBanner.titleHighlight}
                </span>
              </h2>
              <p className="mt-2.5 sm:mt-4 text-[14.5px] sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed">
                {dict.ctaBanner.description}
              </p>
              <div className="mt-5 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center md:justify-start gap-3">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground px-5 py-3 text-[13px] sm:px-6 sm:py-3.5 sm:text-[15px] font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                >
                  {dict.ctaBanner.ctaPrimary}
                  <span aria-hidden>→</span>
                </a>
                <a
                  href="#categories"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-card border border-border px-5 py-3 text-[13px] sm:px-6 sm:py-3.5 sm:text-[15px] font-bold text-foreground hover:border-pulse/40 hover:bg-pulse/5 transition-colors"
                >
                  {dict.ctaBanner.ctaSecondary}
                </a>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1.5 md:justify-start justify-center w-full">
                <span className="text-pulse">✓</span>
                {dict.ctaBanner.trustMicro}
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Walli size={112} state="wave" className="sm:hidden" />
              <Walli size={180} state="wave" className="hidden sm:block lg:hidden" />
              <Walli size={210} state="wave" className="hidden lg:block" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */

export function Footer({ categories }: { categories: Category[] }) {
  const { dict, href } = useV2Locale();
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-14 lg:py-16">
        <div className="grid gap-6 sm:gap-10 grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link href={href()} className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <Walli size={32} state="idle" noShadow />
              <span className="text-base font-bold tracking-tight">{dict.meta.brandName}</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              {dict.footer.about}
            </p>
            <div className="mt-4 sm:mt-5 flex items-center gap-2">
              <SocialIcon href="#" label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M13.5 21v-8h2.5l.5-3h-3V8c0-1 .3-1.5 1.5-1.5H16.5V4h-2.2c-2.4 0-3.3 1.3-3.3 3.3V10H9v3h2v8h2.5z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="YouTube">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.9 2 12 2 12s0 3.1.4 4.8c.2.9.9 1.6 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15V9l5 3-5 3z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <FooterColumn
            title={dict.footer.columnCategories}
            links={categories.map((c) => ({ label: c.name, href: `${href()}#cat-${c.id}` }))}
          />
          <FooterColumn
            title={dict.footer.columnProduct}
            links={[
              { label: dict.footer.productCourses, href: '#courses' },
              { label: dict.footer.productFreeSample, href: '#' },
            ]}
          />
          <FooterColumn
            title={dict.footer.columnCompany}
            links={[
              { label: dict.footer.companyAbout, href: href('about') },
              { label: dict.footer.companyContact, href: href('contact') },
              { label: dict.footer.companyPrivacy, href: href('privacy') },
              { label: dict.footer.companyTerms, href: href('terms') },
            ]}
          />
        </div>

        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{dict.footer.copyright}</p>
          <FooterLocaleSwitch />
        </div>
      </div>
    </footer>
  );
}

function FooterLocaleSwitch() {
  const { locale, dict } = useV2Locale();
  const router = useRouter();
  const pathname = usePathname();

  const go = (target: Locale) => {
    if (target === locale) return;
    const newPath = pathname.replace(/^\/(ka|en)(?=\/|$)/, `/${target}`);
    router.push(newPath);
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => go('ka')}
        className={cn(
          'transition-colors',
          locale === 'ka'
            ? 'font-bold text-foreground'
            : 'hover:text-foreground text-muted-foreground',
        )}
      >
        {dict.footer.languageKa}
      </button>
      <span className="opacity-50">/</span>
      <button
        onClick={() => go('en')}
        className={cn(
          'transition-colors',
          locale === 'en'
            ? 'font-bold text-foreground'
            : 'hover:text-foreground text-muted-foreground',
        )}
      >
        {dict.footer.languageEn}
      </button>
    </div>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-[11px] uppercase tracking-[0.18em] text-foreground font-bold mb-3 sm:mb-4">
        {title}
      </h4>
      <ul className="space-y-2 sm:space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="text-foreground/70 hover:text-pulse transition-colors leading-snug"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:border-pulse hover:text-pulse hover:bg-pulse/5 transition-all"
    >
      {children}
    </a>
  );
}

/* ============================================================
   Section Header (shared)
   ============================================================ */

function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <header
      className={cn(
        'space-y-3 max-w-2xl',
        align === 'center' && 'mx-auto text-center',
      )}
    >
      <p
        className={cn(
          'text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2',
          align === 'left' && 'before:content-[""] before:block before:h-1 before:w-6 before:rounded-full before:bg-pulse',
        )}
      >
        {eyebrow}
      </p>
      <h2
        className="text-[26px] sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
    </header>
  );
}

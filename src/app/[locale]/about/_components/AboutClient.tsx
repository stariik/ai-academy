'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { Category } from '@/lib/v2/data';
import type { AuthUser } from '@/lib/auth';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { Walli } from '@/components/walli/Walli';
import { Navbar, Footer, CtaBanner } from '../../_components/LandingClient';

export default function AboutClient({
  dict,
  locale,
  authUser,
  categories,
}: {
  dict: Dict;
  locale: Locale;
  authUser: AuthUser | null;
  categories: Category[];
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
        <Navbar authUser={authUser} homeAnchors={false} />
        <main>
          <AboutSections categories={categories} />
        </main>
        <Footer categories={categories} />
      </div>
    </V2LocaleProvider>
  );
}

function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2">
      <span className="h-1 w-6 rounded-full bg-pulse" />
      {children}
    </p>
  );
}

function AboutSections({ categories }: { categories: Category[] }) {
  const { dict, href } = useV2Locale();
  const a = dict.about;

  // Real numbers off the live catalog — the same data the storefront renders,
  // so this strip can never drift from what's actually on sale.
  const stats = [
    { value: categories.filter((c) => c.courses > 0).length, label: dict.navbar.categories },
    {
      value: categories.reduce((sum, c) => sum + c.courses, 0),
      label: dict.catalog.coursesUnit,
    },
    {
      value: categories.reduce((sum, c) => sum + c.lessons, 0),
      label: dict.catalog.lessonsUnit,
    },
  ];

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[900px] max-w-[120vw] rounded-full bg-pulse/15 blur-[120px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-12 sm:pt-20 sm:pb-24">
          <div className="grid items-center gap-7 sm:gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Walli leads on a phone — the character introduces the page
                before the copy does. On desktop it stays on the right. */}
            <Reveal delay={0.1} className="order-1 flex justify-center lg:order-2 lg:justify-end">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-pulse/20 to-transparent blur-2xl scale-150"
                />
                <Walli size={132} state="wave" className="sm:hidden" />
                <Walli size={210} state="wave" className="hidden sm:block" />
              </div>
            </Reveal>

            <div className="order-2 space-y-4 sm:space-y-6 lg:order-1">
              <Reveal>
                <Eyebrow>{a.heroEyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h1 className="caps text-[30px] min-[380px]:text-[34px] sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06]">
                  {a.heroTitle}{' '}
                  <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
                    {a.heroTitleHighlight}
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-[15px] sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  {a.heroSubtitle}
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3 pt-1">
                  <a
                    href={href('register')}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground px-5 text-sm font-bold shadow-[0_8px_28px_var(--pulse-glow)] sm:hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--pulse-glow)] transition-all"
                  >
                    {a.heroCtaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href={`${href()}#courses`}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-bold hover:border-pulse/40 hover:text-pulse transition-colors"
                  >
                    {a.heroCtaSecondary}
                  </a>
                </div>
              </Reveal>

              {/* Quick facts — answers "what is this, actually?" before anyone
                  has to read a paragraph. */}
              <Reveal delay={0.2}>
                <dl className="mt-1 grid grid-cols-3 divide-x divide-border border-y border-border py-3">
                  {stats.map((s) => (
                    <div key={s.label} className="px-2 text-center lg:text-left lg:first:pl-0">
                      <dt className="sr-only">{s.label}</dt>
                      <dd>
                        <span
                          className="block text-xl sm:text-2xl font-bold tabular-nums leading-none"
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {s.value}
                        </span>
                        <span className="mt-1 block text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {s.label}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Story ─── */}
      <section className="py-12 sm:py-24 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6 text-center">
          <Reveal delay={0.05}>
            <h2
              className="text-[26px] sm:text-4xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {a.storyTitle}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed text-left sm:text-center">
              {a.storyBody}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <blockquote className="mt-6 sm:mt-8 rounded-3xl border border-pulse/25 bg-gradient-to-br from-pulse/8 via-card to-card px-5 py-6 sm:px-10 sm:py-9">
              {/* <Sparkles className="w-5 h-5 text-pulse mx-auto mb-3" /> */}
              <p
                className="text-[17px] sm:text-2xl font-bold leading-snug text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {a.storyPullquote}
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA — same banner the landing page ends on ─── */}
      <div className="border-t border-border">
        <CtaBanner />
      </div>
    </>
  );
}

'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  BarChart3,
  RepeatIcon,
  Share2,
  Globe,
  Clock,
  ShieldCheck,
  Infinity as InfinityIcon,
  Mail,
} from 'lucide-react';
import type { Category } from '@/lib/v2/data';
import type { AuthUser } from '@/lib/auth';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { Walli } from '@/components/walli/Walli';
import { Navbar, Footer } from '../../_components/LandingClient';

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

const WHAT_ICONS = [BookOpen, BarChart3, RepeatIcon, Share2];
const VALUE_ICONS = [Globe, Clock, ShieldCheck, InfinityIcon];

function AboutSections({ categories }: { categories: Category[] }) {
  const { dict, href } = useV2Locale();
  const a = dict.about;
  const audiences = [dict.audience.kids, dict.audience.teens, dict.audience.adults];

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
                <h1
                  className="text-[30px] min-[380px]:text-[34px] sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.06]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
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
          <Reveal>
            <div className="flex justify-center">
              <Eyebrow>{a.storyEyebrow}</Eyebrow>
            </div>
          </Reveal>
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
              <Sparkles className="w-5 h-5 text-pulse mx-auto mb-3" />
              <p
                className="text-[17px] sm:text-2xl font-bold leading-snug text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                "{a.storyPullquote}"
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ─── What we built ─── */}
      <section className="py-12 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            {/* text left */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <Reveal>
                <Eyebrow>{a.whatEyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h2
                  className="text-[26px] sm:text-4xl font-bold tracking-tight leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {a.whatTitle}
                </h2>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {a.whatBody}
                </p>
              </Reveal>
              <Reveal delay={0.15} className="hidden lg:block pt-4">
                <div className="relative w-fit">
                  <div
                    aria-hidden
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-pulse/15 to-transparent blur-2xl scale-125"
                  />
                  <Walli size={140} state="idle" />
                </div>
              </Reveal>
            </div>

            {/* cards right */}
            <div className="grid gap-4 sm:gap-5">
              {a.whatItems.map((item, i) => {
                const Icon = WHAT_ICONS[i % WHAT_ICONS.length];
                return (
                  <Reveal key={item.title} delay={0.06 * i}>
                    <div className="group rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all hover:-translate-y-0.5 hover:border-pulse/40 hover:shadow-[0_18px_44px_-24px_var(--pulse-glow)]">
                      <div className="flex items-start gap-4">
                        <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-pulse/12 text-pulse shrink-0 transition-colors group-hover:bg-pulse group-hover:text-primary-foreground">
                          <Icon className="w-5 h-5" />
                        </span>
                        <div>
                          <h3
                            className="text-[15px] font-bold tracking-tight"
                            style={{ fontFamily: 'var(--font-display)' }}
                          >
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Who we teach ─── */}
      <section className="py-12 sm:py-24 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <Reveal>
              <Eyebrow>{a.audienceEyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="text-[26px] sm:text-4xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {a.audienceTitle}
              </h2>
            </Reveal>
          </div>

          <div className="mt-7 sm:mt-10 grid gap-3 sm:gap-5 md:grid-cols-3">
            {audiences.map((aud, i) => (
              <Reveal key={aud.title} delay={0.05 * i}>
                <div className="h-full rounded-3xl border border-border bg-card p-5 sm:p-6 transition-all hover:-translate-y-1 hover:border-pulse/40">
                  <p
                    className="text-lg font-bold tracking-tight text-pulse"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {aud.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{aud.tagline}</p>
                  <ul className="mt-4 space-y-2">
                    {aud.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                        <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-pulse" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Values ─── */}
      <section className="py-12 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <Reveal>
              <Eyebrow>{a.valuesEyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="text-[26px] sm:text-4xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {a.valuesTitle}
              </h2>
            </Reveal>
          </div>

          <div className="mt-7 sm:mt-10 grid gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.valuesItems.map((item, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <Reveal key={item.title} delay={0.05 * i}>
                  {/* Icon beside the text on phones, above it once there's a
                      column to stack in — same shape as the "what we built"
                      cards, so the page has one card idiom instead of two. */}
                  <div className="h-full rounded-2xl border border-border bg-card p-4 sm:p-5 flex gap-3.5 sm:block">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pulse/12 text-pulse sm:mb-3">
                      <Icon className="w-5 h-5" />
                    </span>
                    <div>
                      <h3
                        className="text-[15px] font-bold tracking-tight"
                        style={{ fontFamily: 'var(--font-display)' }}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Contact nudge ─── */}
      <section className="py-10 sm:py-14 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-5 rounded-2xl border border-border bg-card p-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pulse/12 text-pulse shrink-0">
                  <Mail className="w-5 h-5" />
                </span>
                <div>
                  <p className="text-sm font-bold">{a.contactNudgeTitle}</p>
                  <p className="text-xs text-muted-foreground">{a.contactNudgeBody}</p>
                </div>
              </div>
              <a
                href={href('contact')}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-bold hover:border-pulse/40 hover:text-pulse transition-colors shrink-0"
              >
                {dict.contact.heroEyebrow}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-12 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] border border-pulse/25 bg-gradient-to-br from-pulse/12 via-card to-card px-5 py-9 sm:px-12 sm:py-14 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full bg-pulse/20 blur-3xl"
              />
              <div className="relative space-y-4">
                <h2
                  className="text-[26px] sm:text-4xl font-bold tracking-tight leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {a.ctaTitle}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
                  {a.ctaSubtitle}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <a
                    href={href('register')}
                    className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_28px_var(--pulse-glow)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--pulse-glow)] transition-all"
                  >
                    {a.ctaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href={`${href()}#courses`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-bold hover:border-pulse/40 hover:text-pulse transition-colors"
                  >
                    {a.ctaSecondary}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

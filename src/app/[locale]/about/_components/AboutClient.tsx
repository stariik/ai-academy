'use client';

/**
 * /about — the WALLE story page.
 *
 * Reuses the landing Navbar + Footer for consistent chrome (Navbar in
 * `homeAnchors={false}` mode so its section links point back to the home
 * page). All copy comes from the `about` dict section, so the page is fully
 * bilingual / EN-ready. Sections reveal on scroll; motion respects
 * prefers-reduced-motion via the global MotionConfig.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  LayoutGrid,
  Users,
  FlaskConical,
  Trophy,
  Infinity as InfinityIcon,
  Languages,
  MessageCircle,
  Brain,
  Clock,
  Globe,
  GraduationCap,
  ShieldCheck,
  Heart,
  ArrowRight,
  Sparkles,
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
          <AboutSections />
        </main>
        <Footer categories={categories} />
      </div>
    </V2LocaleProvider>
  );
}

/* ─── motion helper ─── */
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

const OFFER_ICONS = [Bot, LayoutGrid, Users, FlaskConical, Trophy, InfinityIcon];
const TEACH_ICONS = [Languages, MessageCircle, Brain, Clock];
const VALUE_ICONS = [Globe, GraduationCap, ShieldCheck, Heart];

function AboutSections() {
  const { dict, href } = useV2Locale();
  const a = dict.about;
  const audiences = [dict.audience.kids, dict.audience.teens, dict.audience.adults];

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        {/* ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[420px] w-[820px] max-w-[120vw] rounded-full bg-pulse/15 blur-[120px]"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <Reveal>
                <Eyebrow>{a.heroEyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {a.heroTitle}{' '}
                  <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
                    {a.heroTitleHighlight}
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.1}>
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl">
                  {a.heroSubtitle}
                </p>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <a
                    href={href('register')}
                    className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-5 py-3 text-sm font-bold shadow-[0_8px_28px_var(--pulse-glow)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--pulse-glow)] transition-all"
                  >
                    {a.heroCtaPrimary}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <a
                    href={`${href()}#courses`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-bold hover:border-pulse/40 hover:text-pulse transition-colors"
                  >
                    {a.heroCtaSecondary}
                  </a>
                </div>
              </Reveal>
            </div>

            <Reveal delay={0.1} className="flex justify-center lg:justify-end">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-pulse/20 to-transparent blur-2xl"
                />
                <Walli size={208} state="wave" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── Mission ─── */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-6 text-center">
          <Reveal>
            <div className="flex justify-center">
              <Eyebrow>{a.missionEyebrow}</Eyebrow>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {a.missionTitle}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {a.missionBody}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <blockquote className="mt-8 rounded-3xl border border-pulse/25 bg-gradient-to-br from-pulse/8 via-card to-card px-6 py-7 sm:px-10 sm:py-9">
              <Sparkles className="w-5 h-5 text-pulse mx-auto mb-3" />
              <p
                className="text-xl sm:text-2xl font-bold leading-snug text-foreground"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                “{a.missionPullquote}”
              </p>
            </blockquote>
          </Reveal>
        </div>
      </section>

      {/* ─── What we do ─── */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <Reveal>
              <Eyebrow>{a.offerEyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {a.offerTitle}
              </h2>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {a.offerSubtitle}
              </p>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {a.offerItems.map((item, i) => {
              const Icon = OFFER_ICONS[i % OFFER_ICONS.length];
              return (
                <Reveal key={item.title} delay={0.04 * i}>
                  <div className="group h-full rounded-2xl border border-border bg-card p-5 sm:p-6 transition-all hover:-translate-y-1 hover:border-pulse/40 hover:shadow-[0_18px_44px_-24px_var(--pulse-glow)]">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-pulse/12 text-pulse mb-4 transition-colors group-hover:bg-pulse group-hover:text-primary-foreground">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How Walli teaches ─── */}
      <section className="py-16 sm:py-24 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="space-y-4">
              <Reveal>
                <Eyebrow>{a.teachEyebrow}</Eyebrow>
              </Reveal>
              <Reveal delay={0.05}>
                <h2
                  className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {a.teachTitle}
                </h2>
              </Reveal>
              <Reveal delay={0.1} className="hidden lg:block">
                <Walli size={140} state="idle" />
              </Reveal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {a.teachItems.map((item, i) => {
                const Icon = TEACH_ICONS[i % TEACH_ICONS.length];
                return (
                  <Reveal key={item.title} delay={0.04 * i}>
                    <div className="h-full rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-pulse/12 text-pulse shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <h3 className="text-[15px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Who it's for ─── */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <Reveal>
              <Eyebrow>{a.audienceEyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {a.audienceTitle}
              </h2>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-5 md:grid-cols-3">
            {audiences.map((aud, i) => (
              <Reveal key={aud.title} delay={0.05 * i}>
                <div className="h-full rounded-3xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-pulse/40">
                  <p className="text-lg font-bold tracking-tight text-pulse" style={{ fontFamily: 'var(--font-display)' }}>
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
      <section className="py-16 sm:py-24 border-t border-border bg-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl space-y-3">
            <Reveal>
              <Eyebrow>{a.valuesEyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={0.05}>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {a.valuesTitle}
              </h2>
            </Reveal>
          </div>

          <div className="mt-10 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {a.valuesItems.map((item, i) => {
              const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
              return (
                <Reveal key={item.title} delay={0.04 * i}>
                  <div className="h-full rounded-2xl border border-border bg-card p-5">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-pulse/12 text-pulse mb-3">
                      <Icon className="w-5 h-5" />
                    </span>
                    <h3 className="text-[15px] font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-24 border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] border border-pulse/25 bg-gradient-to-br from-pulse/12 via-card to-card px-6 py-10 sm:px-12 sm:py-14 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-20 -right-10 h-56 w-56 rounded-full bg-pulse/20 blur-3xl"
              />
              <div className="relative space-y-4">
                <h2
                  className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
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
                    href={`${href()}#pricing`}
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

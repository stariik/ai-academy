'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TONE_CLASSES, type Tone } from '@/lib/v2/data';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { BADGES, type BadgeCode } from '@/lib/gamification/badges';
import type { PublicProfilePayload } from '@/lib/v2/profile';
import Link from 'next/link';

export default function PublicProfileClient({
  payload,
  dict,
  locale,
}: {
  payload: PublicProfilePayload;
  dict: Dict;
  locale: Locale;
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <PublicInner payload={payload} />
    </V2LocaleProvider>
  );
}

function initialsFromName(name: string): string {
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

function PublicInner({ payload }: { payload: PublicProfilePayload }) {
  const { dict, href } = useV2Locale();
  const tone = toneFromString(payload.displayName);
  const t = TONE_CLASSES[tone];
  const initials = initialsFromName(payload.displayName);
  const tierName = dict.profile.tiers[payload.tier.index];

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href={href()} className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            ← {dict.meta.brandName}
          </Link>
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-bold">
            {dict.profile.publicViewSubtitle}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 pt-8 sm:pt-10 lg:pt-12 pb-16">
        {/* Header card */}
        <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-8 text-center">
          <div className={cn('absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-25', t.bg)} aria-hidden />
          <div className="absolute inset-0 -z-10 bg-starfield opacity-25" aria-hidden />

          <div className="relative space-y-4 flex flex-col items-center">
            <div
              className="relative inline-flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border border-border shadow-[0_8px_24px_rgba(0,0,0,0.08)] font-black text-3xl sm:text-4xl select-none"
              style={{ fontFamily: 'var(--font-display)' }}
              aria-hidden
            >
              <div className={cn('absolute inset-0 rounded-3xl opacity-90', t.bg)} />
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 via-transparent to-black/10" />
              <span className="relative text-primary-foreground drop-shadow-sm">{initials}</span>
            </div>

            <div className="space-y-2">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {payload.displayName}
              </h1>
              <p className="text-xs text-muted-foreground">{dict.profile.publicViewMember}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest', t.chip)}>
                ★ {tierName}
              </span>
              {payload.rank.yourRank !== null && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-bold">
                  {dict.profile.rankPrefix}
                  <span className="tabular-nums">{payload.rank.yourRank}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    {dict.profile.rankOf} {payload.rank.total}
                  </span>
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <PublicStat label={dict.profile.statXp} value={payload.profile.totalXp.toLocaleString()} accent="pulse" />
          <PublicStat label={dict.profile.statStreak} value={String(payload.profile.currentStreak)} sub={`${dict.profile.streakBestPrefix} ${payload.profile.longestStreak}`} accent="amber" />
          <PublicStat label={dict.profile.statLessons} value={String(payload.totalCompletedLessons)} accent="heart" />
          <PublicStat label={dict.profile.statQuizzes} value={String(payload.profile.totalQuizzes)} accent="violet" />
        </div>

        {/* Activity heatmap (compact) */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-3">
            {dict.profile.activityHeatmapTitle}
          </p>
          <PublicHeatmap activity={payload.activity} />
        </div>

        {/* Badges */}
        {payload.badges.length > 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-4">
              {dict.profile.tabAchievements}
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {payload.badges.slice(0, 12).map((b) => {
                const def = BADGES[b.badgeCode as BadgeCode];
                if (!def) return null;
                return (
                  <div key={b.id} className="flex flex-col items-center text-center gap-1.5">
                    <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-pulse/10 text-2xl">
                      {def.icon}
                    </span>
                    <p className="text-[10px] font-bold leading-tight line-clamp-2">{def.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer CTA — turn the share page into a soft conversion */}
        <div className="mt-8 text-center">
          <Link
            href={href()}
            className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
          >
            {dict.meta.brandName}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}

function PublicStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: Tone;
}) {
  const t = TONE_CLASSES[accent];
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className={cn('text-2xl font-bold tabular-nums leading-none', t.text)} style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mt-1">
        {label}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground/80 mt-1">{sub}</p>}
    </div>
  );
}

function PublicHeatmap({ activity }: { activity: PublicProfilePayload['activity'] }) {
  const columns: typeof activity[] = [];
  for (let i = 0; i < activity.length; i += 7) {
    columns.push(activity.slice(i, i + 7));
  }
  const bg = (level: 0 | 1 | 2 | 3 | 4): string => {
    switch (level) {
      case 0:
        return 'bg-muted';
      case 1:
        return 'bg-pulse/25';
      case 2:
        return 'bg-pulse/50';
      case 3:
        return 'bg-pulse/75';
      case 4:
        return 'bg-pulse';
    }
  };
  return (
    <div className="flex gap-[3px] overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
      {columns.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date} · ${day.count}`}
              className={cn('w-3 h-3 rounded-[3px]', bg(day.level))}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

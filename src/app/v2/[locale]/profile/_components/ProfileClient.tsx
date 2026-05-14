'use client';

import * as React from 'react';
import { Walli } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';
import { TONE_CLASSES, type Tone } from '@/lib/v2/data';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { BADGES, type BadgeCode } from '@/lib/gamification/badges';
import type { ProfilePayload } from '@/lib/v2/profile';

type Tab = 'overview' | 'achievements' | 'progress' | 'settings';

export default function ProfileClient({
  payload,
  dict,
  locale,
}: {
  payload: ProfilePayload;
  dict: Dict;
  locale: Locale;
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <ProfileInner payload={payload} />
    </V2LocaleProvider>
  );
}

function ProfileInner({ payload }: { payload: ProfilePayload }) {
  const { dict, href } = useV2Locale();
  const [tab, setTab] = React.useState<Tab>('overview');

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <MiniNav />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 pt-8 sm:pt-10 lg:pt-12 pb-16">
        <ProfileHeader payload={payload} />
        <StatsRow payload={payload} />
        <div className="mt-6 sm:mt-8 grid gap-5 sm:gap-6 lg:grid-cols-[1fr_320px]">
          <ActivityHeatmap payload={payload} />
          <DailyGoalCard payload={payload} />
        </div>

        <TabsNav tab={tab} onChange={setTab} />

        <div className="mt-6 sm:mt-8">
          {tab === 'overview' && <OverviewTabContent payload={payload} />}
          {tab === 'achievements' && <AchievementsStub />}
          {tab === 'progress' && <ProgressStub />}
          {tab === 'settings' && <SettingsStub />}
        </div>
      </main>
    </div>
  );
}

/* ------------------------------------------------------------ Mini nav */

function MiniNav() {
  const { dict, href } = useV2Locale();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/85 border-b border-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <a href={href()} className="flex items-center gap-2 group">
          <span
            aria-hidden
            className="flex items-center justify-center w-7 h-7 rounded-full border border-border bg-card text-muted-foreground group-hover:text-foreground group-hover:border-pulse/40 transition-colors"
          >
            ←
          </span>
          <span className="text-sm font-semibold tracking-tight">{dict.meta.brandName}</span>
        </a>
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-bold">
          {dict.profile.pageTitle}
        </span>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------ Header */

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

function ProfileHeader({ payload }: { payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  const tone = toneFromString(payload.sessionId);
  const t = TONE_CLASSES[tone];
  const initials = initialsFromName(payload.displayName);
  const tierName = dict.profile.tiers[payload.tier.index];
  const toNext = payload.tier.toNext;
  const hasRank = payload.rank.yourRank !== null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-7 lg:p-8">
      <div className={cn('absolute -top-24 -right-20 w-72 h-72 rounded-full blur-3xl opacity-25', t.bg)} aria-hidden />
      <div className="absolute inset-0 -z-10 bg-starfield opacity-25" aria-hidden />

      <div className="relative grid gap-5 sm:gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <Avatar tone={tone} initials={initials} />

        <div className="space-y-2 sm:space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest', t.chip)}>
              ★ {tierName}
            </span>
            {hasRank ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-foreground">
                {dict.profile.rankPrefix}
                <span className="tabular-nums">{payload.rank.yourRank}</span>
                <span className="text-muted-foreground">
                  {' '}
                  {dict.profile.rankOf} {payload.rank.total}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border bg-card/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-medium text-muted-foreground italic">
                {dict.profile.unranked}
              </span>
            )}
          </div>

          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {payload.displayName}
          </h1>

          <TierBar tone={tone} payload={payload} />
        </div>
      </div>
    </section>
  );
}

function Avatar({ tone, initials, size = 'lg' }: { tone: Tone; initials: string; size?: 'sm' | 'md' | 'lg' }) {
  const t = TONE_CLASSES[tone];
  const dimensions = {
    sm: 'w-12 h-12 text-base',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl',
  }[size];
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-2xl border border-border shadow-[0_8px_24px_rgba(0,0,0,0.08)] shrink-0 font-black tabular-nums select-none',
        dimensions,
      )}
      aria-hidden
      style={{ fontFamily: 'var(--font-display)' }}
    >
      <div className={cn('absolute inset-0 rounded-2xl opacity-90', t.bg)} />
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-transparent to-black/10" />
      <span className="relative text-primary-foreground drop-shadow-sm">{initials}</span>
    </div>
  );
}

function TierBar({ tone, payload }: { tone: Tone; payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[tone];
  const toNext = payload.tier.toNext;

  if (!toNext) {
    return (
      <p className="text-sm text-muted-foreground">
        {dict.profile.tierMax} ·{' '}
        <span className="font-bold text-foreground tabular-nums">{payload.profile.totalXp}</span> XP
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {dict.profile.tierXpToNext}:{' '}
          <span className="font-bold text-foreground tabular-nums">
            {toNext.next - toNext.current}
          </span>{' '}
          XP
        </span>
        <span className="font-bold tabular-nums">{toNext.pct}%</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all', t.bg)}
          style={{ width: `${toNext.pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground/70 font-medium tabular-nums">
        {payload.tier.thresholds.map((x, i) => (
          <span key={i} className={cn(i === payload.tier.index && 'text-foreground font-bold')}>
            {x >= 1000 ? `${(x / 1000).toFixed(x % 1000 === 0 ? 0 : 1)}K` : x}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Stats row */

function StatsRow({ payload }: { payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  const earnedBadges = payload.badges.length;

  return (
    <div className="mt-5 sm:mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      <StatCard
        label={dict.profile.statXp}
        value={payload.profile.totalXp.toLocaleString()}
        accent="pulse"
        icon="⚡"
      />
      <StatCard
        label={dict.profile.statStreak}
        value={`${payload.profile.currentStreak}`}
        sub={`${dict.profile.streakBestPrefix} ${payload.profile.longestStreak} ${dict.profile.streakDaysUnit}`}
        accent="amber"
        icon="🔥"
      />
      <StatCard
        label={dict.profile.statLessons}
        value={`${payload.totalCompletedLessons}`}
        accent="heart"
        icon="📚"
      />
      <StatCard
        label={dict.profile.statQuizzes}
        value={`${payload.profile.totalQuizzes}`}
        sub={
          payload.profile.totalQuizzes > 0
            ? `~${payload.profile.averageScore}%`
            : undefined
        }
        accent="violet"
        icon="🎯"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: Tone;
  icon: string;
}) {
  const t = TONE_CLASSES[accent];
  return (
    <div className="group relative rounded-2xl border border-border bg-card p-4 sm:p-5 overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
      <div
        className={cn(
          'absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-60',
          t.bg,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-0.5">
          <p
            className={cn('text-2xl sm:text-3xl font-bold tabular-nums leading-none', t.text)}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {value}
          </p>
          <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-muted-foreground font-bold mt-1">
            {label}
          </p>
          {sub && <p className="text-[10px] text-muted-foreground/80 mt-1">{sub}</p>}
        </div>
        <span aria-hidden className="text-xl sm:text-2xl opacity-50">
          {icon}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Daily goal */

function DailyGoalCard({ payload }: { payload: ProfilePayload }) {
  const { dict, href } = useV2Locale();
  const done = payload.completedToday;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border p-5 sm:p-6 transition-all',
        done
          ? 'border-pulse/40 bg-pulse/5'
          : 'border-border bg-card hover:border-pulse/30',
      )}
    >
      <div className={cn('absolute -bottom-12 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30', done ? 'bg-pulse' : 'bg-pulse/40')} aria-hidden />
      <div className="relative flex items-start gap-3">
        <Walli size={48} state={done ? 'dance' : 'wave'} noShadow />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
            {dict.profile.dailyGoalTitle}
          </p>
          <p className="mt-1 text-sm sm:text-base font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {done ? dict.profile.dailyGoalDone : dict.profile.dailyGoalSubtitle}
          </p>
          {!done && (
            <a
              href={href()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-3.5 py-1.5 text-xs font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              {dict.profile.dailyGoalCta}
              <span aria-hidden>→</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Heatmap */

function ActivityHeatmap({ payload }: { payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  // Render as 14 weekly columns × 7 day rows. activity is ordered oldest-first.
  const columns: typeof payload.activity[] = [];
  for (let i = 0; i < payload.activity.length; i += 7) {
    columns.push(payload.activity.slice(i, i + 7));
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-3 sm:mb-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
            {dict.profile.activityHeatmapTitle}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{dict.profile.activityHeatmapSubtitle}</p>
        </div>
      </div>

      <div className="flex gap-[3px] overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date} · ${day.count}`}
                className={cn(
                  'w-3 h-3 rounded-[3px]',
                  levelToBg(day.level),
                )}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-medium">
        <span>{dict.profile.activityLegendLess}</span>
        <span className={cn('w-3 h-3 rounded-[3px]', levelToBg(0))} />
        <span className={cn('w-3 h-3 rounded-[3px]', levelToBg(1))} />
        <span className={cn('w-3 h-3 rounded-[3px]', levelToBg(2))} />
        <span className={cn('w-3 h-3 rounded-[3px]', levelToBg(3))} />
        <span className={cn('w-3 h-3 rounded-[3px]', levelToBg(4))} />
        <span>{dict.profile.activityLegendMore}</span>
      </div>
    </div>
  );
}

function levelToBg(level: 0 | 1 | 2 | 3 | 4): string {
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
}

/* ------------------------------------------------------------ Tabs */

function TabsNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { dict } = useV2Locale();
  const items: { id: Tab; label: string }[] = [
    { id: 'overview', label: dict.profile.tabOverview },
    { id: 'achievements', label: dict.profile.tabAchievements },
    { id: 'progress', label: dict.profile.tabProgress },
    { id: 'settings', label: dict.profile.tabSettings },
  ];
  return (
    <nav
      className="mt-8 sm:mt-10 border-b border-border overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none' }}
      role="tablist"
    >
      <div className="flex gap-1 min-w-max">
        {items.map((it) => (
          <button
            key={it.id}
            role="tab"
            aria-selected={tab === it.id}
            onClick={() => onChange(it.id)}
            className={cn(
              'relative px-3.5 sm:px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors',
              tab === it.id
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {it.label}
            {tab === it.id && (
              <span className="absolute left-3.5 sm:left-4 right-3.5 sm:right-4 bottom-0 h-[2px] rounded-full bg-pulse" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------ Overview tab */

function OverviewTabContent({ payload }: { payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  const totalBadges = Object.keys(BADGES).length;
  const earnedBadges = payload.badges.length;
  const recentBadges = payload.badges.slice(0, 4);
  const topRanks = payload.rank.top.slice(0, 5);

  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
      {/* Recent badges preview */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="flex items-baseline justify-between mb-4">
          <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
            {dict.profile.tabAchievements}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {dict.profile.badgesEarnedPrefix}{' '}
            <span className="font-bold text-foreground">{earnedBadges}</span>{' '}
            {dict.profile.badgesEarnedSeparator} {totalBadges}
          </p>
        </div>

        {recentBadges.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm font-bold">{dict.profile.badgesEmptyTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">{dict.profile.badgesEmptyBody}</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {recentBadges.map((b) => {
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
        )}
      </div>

      {/* Top ranks preview */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-4">
          {dict.profile.leaderboardTitle}
        </p>
        {topRanks.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-4">—</p>
        ) : (
          <ol className="space-y-2">
            {topRanks.map((entry) => {
              const isYou = entry.sessionId === payload.sessionId;
              return (
                <li
                  key={entry.sessionId}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 transition-colors',
                    isYou && 'bg-pulse/10',
                  )}
                >
                  <span
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full text-xs font-black tabular-nums shrink-0',
                      entry.rank === 1 && 'bg-amber-500 text-white',
                      entry.rank === 2 && 'bg-slate-400 text-white',
                      entry.rank === 3 && 'bg-amber-700 text-white',
                      entry.rank > 3 && 'bg-muted text-foreground',
                    )}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {entry.rank}
                  </span>
                  <span className="flex-1 truncate text-sm font-bold">
                    {entry.displayName}
                    {isYou && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-pulse font-bold">
                        {dict.profile.leaderboardYouHere}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground shrink-0">
                    {entry.xp.toLocaleString()} XP
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Stubs (Phase 3-5) */

function AchievementsStub() {
  return <StubPanel>Achievements coming next pass</StubPanel>;
}
function ProgressStub() {
  return <StubPanel>Progress coming next pass</StubPanel>;
}
function SettingsStub() {
  return <StubPanel>Settings coming next pass</StubPanel>;
}
function StubPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

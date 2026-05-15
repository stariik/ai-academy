'use client';

import * as React from 'react';
import { Walli } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';
import { TONE_CLASSES, type Tone } from '@/lib/v2/data';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import type { Dict, Locale } from '@/lib/v2/i18n';
import { BADGES, type BadgeCode } from '@/lib/gamification/badges';
import type { ProfilePayload } from '@/lib/v2/profile';
import { signOutAction } from '../../(auth)/actions';

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
          {tab === 'achievements' && <AchievementsTab payload={payload} />}
          {tab === 'progress' && <ProgressTab payload={payload} />}
          {tab === 'settings' && <SettingsTab payload={payload} />}
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

/* ------------------------------------------------------------ Achievements tab */

type BadgeStatus =
  | { kind: 'earned'; earnedAt: string }
  | { kind: 'progress'; current: number; goal: number }
  | { kind: 'locked' };

function badgeStatus(
  code: BadgeCode,
  payload: ProfilePayload,
): BadgeStatus {
  const earned = payload.badges.find((b) => b.badgeCode === code);
  if (earned) return { kind: 'earned', earnedAt: earned.earnedAt };
  switch (code) {
    case 'first_lesson':
      return { kind: 'progress', current: Math.min(payload.totalCompletedLessons, 1), goal: 1 };
    case 'streak_7':
      return {
        kind: 'progress',
        current: Math.min(payload.profile.currentStreak, 7),
        goal: 7,
      };
    case 'streak_30':
      return {
        kind: 'progress',
        current: Math.min(payload.profile.currentStreak, 30),
        goal: 30,
      };
    case 'xp_1000':
      return {
        kind: 'progress',
        current: Math.min(payload.profile.totalXp, 1000),
        goal: 1000,
      };
    case 'xp_5000':
      return {
        kind: 'progress',
        current: Math.min(payload.profile.totalXp, 5000),
        goal: 5000,
      };
    case 'perfect_quiz':
    case 'course_complete':
    case 'review_warrior':
      return { kind: 'locked' };
  }
}

function AchievementsTab({ payload }: { payload: ProfilePayload }) {
  const codes = Object.keys(BADGES) as BadgeCode[];
  const earnedCount = payload.badges.length;
  const totalCount = codes.length;

  // Sort: earned first (by recency), then in-progress, then locked
  const sorted = [...codes].sort((a, b) => {
    const sa = badgeStatus(a, payload);
    const sb = badgeStatus(b, payload);
    const rank = (s: BadgeStatus) =>
      s.kind === 'earned' ? 0 : s.kind === 'progress' ? 1 : 2;
    const dRank = rank(sa) - rank(sb);
    if (dRank !== 0) return dRank;
    if (sa.kind === 'earned' && sb.kind === 'earned')
      return sb.earnedAt.localeCompare(sa.earnedAt);
    if (sa.kind === 'progress' && sb.kind === 'progress') {
      const pa = sa.current / sa.goal;
      const pb = sb.current / sb.goal;
      return pb - pa;
    }
    return 0;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      <TierLadder payload={payload} />
      <BadgeGrid badges={sorted} payload={payload} earnedCount={earnedCount} totalCount={totalCount} />
      <RecentAchievementsFeed payload={payload} />
    </div>
  );
}

function TierLadder({ payload }: { payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  const tone = toneFromString(payload.sessionId);
  const t = TONE_CLASSES[tone];
  const tiers = dict.profile.tiers;
  const cur = payload.tier.index;
  const maxXp = payload.tier.thresholds[payload.tier.thresholds.length - 1];
  // Position % within the entire ladder (0 → max XP), capped.
  const positionPct = Math.min(100, Math.round((payload.profile.totalXp / maxXp) * 100));

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className={cn('absolute -top-16 -right-16 w-60 h-60 rounded-full blur-3xl opacity-20', t.bg)} aria-hidden />

      <div className="relative">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
          {dict.profile.tierLadderTitle}
        </p>

        <div className="mt-3 sm:mt-4">
          {/* The bar */}
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <div className={cn('absolute inset-y-0 left-0 rounded-full', t.bg)} style={{ width: `${positionPct}%` }} />
            {/* Threshold ticks */}
            {payload.tier.thresholds.map((_, i) => {
              const left = (i / (payload.tier.thresholds.length - 1)) * 100;
              return (
                <span
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-background"
                  style={{ left: `${left}%` }}
                  aria-hidden
                />
              );
            })}
          </div>

          {/* Labels under bar */}
          <div className="mt-2 grid grid-cols-5 text-center gap-1">
            {tiers.map((name, i) => (
              <div key={name} className="flex flex-col items-center min-w-0">
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold mb-1.5 transition-colors',
                    i <= cur ? cn(t.bg, 'text-primary-foreground') : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold leading-tight truncate w-full',
                    i === cur ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {name}
                </span>
                <span className="text-[9px] text-muted-foreground/70 tabular-nums">
                  {payload.tier.thresholds[i]}
                </span>
              </div>
            ))}
          </div>

          {payload.tier.toNext && (
            <p className="mt-4 text-sm text-center">
              <span className="font-bold tabular-nums">{payload.tier.toNext.next - payload.tier.toNext.current}</span>{' '}
              <span className="text-muted-foreground">XP {dict.profile.tierXpToNext.toLowerCase()}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function BadgeGrid({
  badges,
  payload,
  earnedCount,
  totalCount,
}: {
  badges: BadgeCode[];
  payload: ProfilePayload;
  earnedCount: number;
  totalCount: number;
}) {
  const { dict } = useV2Locale();
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-baseline justify-between mb-4 sm:mb-5">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
          {dict.profile.tabAchievements}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {dict.profile.badgesEarnedPrefix}{' '}
          <span className="font-bold text-foreground">{earnedCount}</span>{' '}
          {dict.profile.badgesEarnedSeparator} {totalCount}
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {badges.map((code) => (
          <BadgeCard key={code} code={code} status={badgeStatus(code, payload)} />
        ))}
      </div>
    </div>
  );
}

function BadgeCard({ code, status }: { code: BadgeCode; status: BadgeStatus }) {
  const { dict } = useV2Locale();
  const def = BADGES[code];
  const earned = status.kind === 'earned';

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-4 transition-all',
        earned
          ? 'border-pulse/30 bg-pulse/5 hover:border-pulse/50'
          : 'border-border bg-card opacity-70 hover:opacity-95',
      )}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <span
          className={cn(
            'flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl text-3xl sm:text-4xl transition-transform',
            earned ? 'bg-pulse/15' : 'bg-muted grayscale',
          )}
        >
          {def.icon}
        </span>
        <p
          className="text-xs sm:text-sm font-bold leading-tight line-clamp-2 min-h-[2.4em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {def.title}
        </p>
        <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.4em]">
          {def.description}
        </p>

        {status.kind === 'progress' && (
          <div className="w-full space-y-1.5 pt-1">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-pulse rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((status.current / status.goal) * 100))}%`,
                }}
              />
            </div>
            <p className="text-[10px] font-bold tabular-nums">
              {status.current} <span className="text-muted-foreground font-normal">/ {status.goal}</span>
            </p>
          </div>
        )}

        {status.kind === 'locked' && (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold pt-1">
            {dict.profile.badgeLockedHint}
          </p>
        )}

        {status.kind === 'earned' && (
          <p className="text-[10px] text-pulse font-bold uppercase tracking-widest pt-1">
            ★ {formatRelativeDate(status.earnedAt, dict)}
          </p>
        )}
      </div>
    </div>
  );
}

function RecentAchievementsFeed({ payload }: { payload: ProfilePayload }) {
  const { dict } = useV2Locale();
  const recent = payload.badges.slice(0, 5);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-4">
        {dict.profile.achievementsRecentTitle}
      </p>
      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-4">
          {dict.profile.achievementsEmpty}
        </p>
      ) : (
        <ul className="space-y-3">
          {recent.map((b) => {
            const def = BADGES[b.badgeCode as BadgeCode];
            if (!def) return null;
            return (
              <li key={b.id} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-pulse/10 text-xl shrink-0">
                  {def.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{def.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeDate(b.earnedAt, dict)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatRelativeDate(iso: string, dict: Dict): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days <= 0) return dict.profile.dailyGoalDone.replace(/[!🎉]/g, '').trim() || 'today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/* ------------------------------------------------------------ Progress tab */

function ProgressTab({ payload }: { payload: ProfilePayload }) {
  const { dict, href } = useV2Locale();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Recommended next */}
      {payload.recommendedNext && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-pulse/40 bg-card p-5 sm:p-7">
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-pulse/15 blur-3xl" aria-hidden />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
                {dict.profile.progressRecommendedTitle}
              </p>
              <p
                className="mt-1.5 text-lg sm:text-xl font-bold leading-tight truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {payload.recommendedNext.courseTitle}
              </p>
              {payload.recommendedNext.pct > 0 && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  {payload.recommendedNext.pct}% {dict.profile.progressPercentComplete}
                </p>
              )}
            </div>
            <a
              href={href(`lessons/${payload.recommendedNext.lessonId}`)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground px-5 py-3 text-sm font-bold shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all shrink-0"
            >
              {dict.profile.progressContinue}
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      )}

      {/* Enrolled courses */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-4 sm:mb-5">
          {dict.profile.progressEnrolledTitle}
        </p>
        {payload.courseProgress.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold mb-2">{dict.profile.progressEmpty}</p>
            <a
              href={href()}
              className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-4 py-2 text-xs font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              {dict.profile.progressEmptyCta}
              <span aria-hidden>→</span>
            </a>
          </div>
        ) : (
          <ul className="space-y-3">
            {payload.courseProgress.map((c) => (
              <li key={c.courseId}>
                <a
                  href={href(`courses/${c.courseId}`)}
                  className="group flex items-center gap-4 rounded-xl border border-border bg-background hover:border-pulse/40 hover:bg-pulse/5 p-3 sm:p-4 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">{c.courseTitle}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                      <span className="font-bold text-foreground">{c.completedLessons}</span>{' '}
                      <span className="opacity-60">/ {c.totalLessons}</span> {dict.profile.progressOfLessons}
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-pulse rounded-full transition-all"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold tabular-nums leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                      {c.pct}%
                    </span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Per-category breakdown */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-4 sm:mb-5">
          {dict.profile.progressByCategoryTitle}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {payload.categoryProgress.map((cat) => {
            const t = TONE_CLASSES[cat.tone];
            const visual = (
              cat as typeof cat & { name?: string }
            );
            // Display name from CATEGORY_VISUALS would be locale-aware via dict
            // wiring on the server. Here we have nameKa as the canonical key —
            // we render in the user's locale via getCategoryDisplay if it's the
            // current locale. For now use nameKa since the dict equivalent
            // already shipped through the storefront. (Catalog page handles
            // localized names; profile is consistent with that surface.)
            return (
              <div
                key={cat.categorySlug}
                className={cn(
                  'group relative rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_8px_24px_-12px_var(--pulse-glow)]',
                )}
              >
                <div className={cn('absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20', t.bg)} aria-hidden />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn('text-2xl', t.text)}>{cat.icon}</span>
                      <span className={cn('text-[9px] font-bold uppercase tracking-widest', t.text)}>
                        {cat.pct}%
                      </span>
                    </div>
                    <p className="text-xs font-bold leading-tight line-clamp-2 min-h-[2.4em]" style={{ fontFamily: 'var(--font-display)' }}>
                      {cat.nameKa}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground tabular-nums">
                      <span className="font-bold text-foreground">{cat.completedLessons}</span>{' '}
                      <span className="opacity-60">/ {cat.totalLessons}</span>
                    </p>
                  </div>
                </div>
                <div className="relative mt-3 h-1 rounded-full bg-muted overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all', t.bg)} style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ Settings tab */

function SettingsTab({ payload }: { payload: ProfilePayload }) {
  const { dict, locale } = useV2Locale();
  const [displayName, setDisplayName] = React.useState(payload.displayName);
  const [savingName, setSavingName] = React.useState(false);
  const [nameSaved, setNameSaved] = React.useState(false);
  const [shareToken, setShareToken] = React.useState<string | null>(payload.shareToken);
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const onSaveName = async () => {
    if (savingName) return;
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setSavingName(true);
    try {
      const res = await fetch('/api/v2/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setDisplayName', displayName: trimmed }),
      });
      if (res.ok) {
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      }
    } finally {
      setSavingName(false);
    }
  };

  const onEnsureToken = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/v2/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensureShareToken' }),
      });
      const data = await res.json();
      if (res.ok && data.token) setShareToken(data.token);
    } finally {
      setGenerating(false);
    }
  };

  const onRotateToken = async () => {
    if (generating) return;
    if (!confirm('Regenerate share link? Old link will stop working.')) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/v2/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rotateShareToken' }),
      });
      const data = await res.json();
      if (res.ok && data.token) setShareToken(data.token);
    } finally {
      setGenerating(false);
    }
  };

  const shareUrl =
    typeof window !== 'undefined' && shareToken
      ? `${window.location.origin}/${locale}/u/${shareToken}`
      : null;

  const onCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore — older browsers */
    }
  };

  return (
    <div className="space-y-6">
      {/* Display name */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <label className="block text-[10px] uppercase tracking-widest text-pulse font-bold mb-3">
          {dict.profile.settingsDisplayName}
        </label>
        <p className="text-[11px] text-muted-foreground mb-3">{dict.profile.settingsDisplayNameHint}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-pulse/40 focus:border-pulse/40"
          />
          <button
            type="button"
            onClick={onSaveName}
            disabled={savingName || displayName.trim() === payload.displayName}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-[0_4px_16px_var(--pulse-glow)] transition-all',
              'hover:shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5',
              'disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_16px_var(--pulse-glow)] disabled:cursor-not-allowed',
            )}
          >
            {savingName ? '...' : nameSaved ? dict.profile.settingsSaved : dict.profile.settingsSave}
          </button>
        </div>
      </div>

      {/* Sign out */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-3">
          {dict.auth.signOut}
        </p>
        <form action={signOutAction}>
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full border border-heart/40 bg-heart/5 px-5 py-2.5 text-sm font-bold text-heart hover:bg-heart/10 transition-colors"
          >
            {dict.auth.signOut}
            <span aria-hidden>→</span>
          </button>
        </form>
      </div>

      {/* Share link */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <p className="text-[10px] uppercase tracking-widest text-pulse font-bold mb-2">
          {dict.profile.settingsShareLinkTitle}
        </p>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {dict.profile.settingsShareLinkBody}
        </p>

        {shareUrl ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 rounded-full border border-border bg-muted px-4 py-2.5 text-xs font-mono text-foreground/80 truncate"
              />
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
              >
                {copied ? `✓ ${dict.profile.settingsShareLinkCopied}` : dict.profile.settingsShareLinkCopy}
              </button>
            </div>
            <button
              type="button"
              onClick={onRotateToken}
              disabled={generating}
              className="text-[11px] text-muted-foreground hover:text-pulse font-semibold transition-colors disabled:opacity-50"
            >
              {dict.profile.settingsShareLinkRegen} →
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onEnsureToken}
            disabled={generating}
            className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {generating ? '...' : dict.profile.settingsShareLinkCopy}
          </button>
        )}
      </div>
    </div>
  );
}

function StubPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Filter,
  Lightbulb,
  MessageSquareQuote,
  Search,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import type {
  OnboardingInsight,
  OnboardingInsightData,
} from '@/lib/admin/queries';

type StatusFilter = 'all' | 'completed' | 'in_progress';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

function topCounts(rows: OnboardingInsight[], pick: (row: OnboardingInsight) => string[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const raw of pick(row)) {
      const value = raw.trim();
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 8);
}

function Kpi({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-black tabular-nums text-gray-900">{value}</p>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-50 text-teal">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">{note}</p>
    </div>
  );
}

function SignalPanel({
  title,
  subtitle,
  icon: Icon,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  icon: typeof Target;
  items: { label: string; count: number }[];
  tone: 'teal' | 'amber' | 'violet';
}) {
  const max = Math.max(...items.map((item) => item.count), 1);
  const colors = {
    teal: 'bg-teal',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
  };
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gray-50 text-gray-700">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="py-5 text-center text-xs text-gray-400">Waiting for more responses</p>
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium text-gray-700" title={item.label}>
                  {item.label}
                </span>
                <span className="font-bold tabular-nums text-gray-400">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-full rounded-full ${colors[tone]}`}
                  style={{ width: `${Math.max(8, (item.count / max) * 100)}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default function OnboardingInsightsClient({
  data,
  generatedAt,
}: {
  data: OnboardingInsightData;
  generatedAt: string;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const completed = data.rows.filter((row) => row.status === 'completed');
  const generatedAtMs = new Date(generatedAt).getTime();
  const lastWeek = data.rows.filter(
    (row) => generatedAtMs - new Date(row.createdAt).getTime() <= 7 * 24 * 60 * 60 * 1000,
  ).length;
  const averageQuestions = completed.length
    ? completed.reduce((sum, row) => sum + row.questionCount, 0) / completed.length
    : 0;
  const interests = useMemo(() => topCounts(completed, (row) => row.interests), [completed]);
  const barriers = useMemo(
    () => topCounts(completed, (row) => row.opportunitySignals.length ? row.opportunitySignals : row.barriers),
    [completed],
  );
  const preferences = useMemo(
    () => topCounts(completed, (row) => row.learningPreferences),
    [completed],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false;
      if (!needle) return true;
      return [
        row.displayName,
        row.email ?? '',
        row.primaryGoal,
        row.desiredOutcome,
        row.summary,
        row.segmentLabel,
        ...row.interests,
        ...row.barriers,
      ].some((value) => value.toLowerCase().includes(needle));
    });
  }, [data.rows, query, status]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          icon={Users}
          label="Conversations"
          value={data.rows.length.toLocaleString()}
          note={`${lastWeek} started in the last 7 days`}
        />
        <Kpi
          icon={CheckCircle2}
          label="Completed"
          value={completed.length.toLocaleString()}
          note={`${data.rows.length ? Math.round((completed.length / data.rows.length) * 100) : 0}% completion rate`}
        />
        <Kpi
          icon={BarChart3}
          label="Avg. depth"
          value={averageQuestions ? averageQuestions.toFixed(1) : '—'}
          note="questions answered per completion"
        />
        <Kpi
          icon={Sparkles}
          label="Goal segments"
          value={new Set(completed.map((row) => row.segmentLabel).filter(Boolean)).size.toString()}
          note="based on stated intent, not demographics"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SignalPanel
          title="What users want"
          subtitle="Most common stated goals and interests"
          icon={Target}
          items={interests}
          tone="teal"
        />
        <SignalPanel
          title="Friction we should solve"
          subtitle="Barriers and unmet support needs"
          icon={Lightbulb}
          items={barriers}
          tone="amber"
        />
        <SignalPanel
          title="How they want to learn"
          subtitle="Formats that help knowledge click"
          icon={BarChart3}
          items={preferences}
          tone="violet"
        />
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search goals, blockers, names…"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-teal focus:ring-2 focus:ring-teal/10"
            />
          </div>
          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1">
            <Filter className="ml-2 h-3.5 w-3.5 text-gray-400" />
            {(['all', 'completed', 'in_progress'] as StatusFilter[]).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  status === value ? 'bg-navy text-white' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {value === 'all' ? 'All' : value === 'completed' ? 'Completed' : 'In progress'}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 sm:ml-auto">{filtered.length} conversations</span>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-12 text-center">
            <MessageSquareQuote className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-3 text-sm font-semibold text-gray-600">No conversations match</p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((row) => (
              <InsightCard key={row.id} row={row} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function InsightCard({ row }: { row: OnboardingInsight }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-teal/30 hover:shadow-md">
      <div className="border-b border-gray-100 px-4 py-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-gray-900">{row.displayName}</h3>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  row.status === 'completed'
                    ? 'bg-teal-50 text-teal'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {row.status === 'completed' ? 'Completed' : `${row.questionCount}/7 · in progress`}
              </span>
              {row.segmentLabel && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  {row.segmentLabel}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-gray-500">{row.email ?? 'No email available'}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[10px] font-medium uppercase text-gray-400">{row.locale}</p>
            <p className="mt-0.5 text-[10px] text-gray-400">{fmtDate(row.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {row.summary ? (
          <p className="text-sm leading-relaxed text-gray-700">{row.summary}</p>
        ) : (
          <p className="text-sm italic text-gray-400">Interview still in progress.</p>
        )}

        {(row.primaryGoal || row.desiredOutcome) && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Primary job</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-700">
                {row.primaryGoal || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Desired win</p>
              <p className="mt-1 line-clamp-3 text-xs font-semibold leading-relaxed text-gray-700">
                {row.desiredOutcome || '—'}
              </p>
            </div>
          </div>
        )}

        {row.verbatimQuote && (
          <blockquote className="relative rounded-xl border-l-2 border-teal bg-teal-50/60 py-3 pl-9 pr-3 text-xs italic leading-relaxed text-gray-700">
            <MessageSquareQuote className="absolute left-3 top-3 h-4 w-4 text-teal" />
            “{row.verbatimQuote}”
          </blockquote>
        )}

        <div className="flex flex-wrap gap-1.5">
          {[...row.interests, ...row.learningPreferences, ...row.barriers]
            .slice(0, 8)
            .map((label, index) => (
              <span
                key={`${label}-${index}`}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                  row.barriers.includes(label)
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600'
                }`}
              >
                {label}
              </span>
            ))}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
          <details className="group min-w-0">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-teal">
              <Clock3 className="h-3.5 w-3.5" />
              Read conversation ({row.transcript.length})
            </summary>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
              {row.transcript.map((message, index) => (
                <div
                  key={`${message.at}-${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <p
                    className={`max-w-[88%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-teal text-white'
                        : 'border border-gray-200 bg-white text-gray-700'
                    }`}
                  >
                    {message.content}
                  </p>
                </div>
              ))}
            </div>
          </details>
          {row.sessionId && (
            <Link
              href={`/admin/students/${row.sessionId}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal hover:text-navy"
            >
              Student
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

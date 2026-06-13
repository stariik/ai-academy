// ============================================================
// /admin/ai-usage — token + cost dashboard across every AI provider.
// Range is driven by ?days= (7 / 30 / 90), defaulting to 30.
// ============================================================

import Link from 'next/link';
import { getAiUsageSummary } from '@/lib/admin/queries';
import UsageBarChart from './_components/UsageBarChart';

export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90] as const;

const fmtUsd = (n: number) => (n >= 100 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`);
const fmtUsd4 = (n: number) => `$${n.toFixed(4)}`;
const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtTokens = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

const FEATURE_LABELS: Record<string, string> = {
  tutor_chat: 'Tutor chat',
  english_guard: 'English guard',
  quiz_grading: 'Quiz grading',
  review_explanation: 'Review re-explain',
  material_translation: 'Material translation',
  lesson_generation: 'Lesson generation',
  outline_detection: 'Outline detection',
  quiz_generation: 'Quiz generation',
  metadata_generation: 'Metadata / review',
  ui_translation: 'UI translation',
  category_image: 'Category images',
};

export default async function AdminAiUsagePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam) as (typeof RANGES)[number])
    ? Number(daysParam)
    : 30;
  const data = await getAiUsageSummary(days);

  if (!data.available) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">AI usage</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          <p className="font-semibold">Usage tracking is not set up yet.</p>
          <p className="mt-1">
            Run <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">migrations/2026-06-12-admin-panel.sql</code>{' '}
            in the Supabase SQL editor to create the{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">ai_usage</code> table. New AI
            calls are logged automatically once it exists.
          </p>
        </div>
      </div>
    );
  }

  const { totals } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI usage</h1>
          <p className="mt-1 text-sm text-gray-500">
            Estimated cost from published per-token prices across Claude, Gemini, Google Translate,
            and Replicate.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {RANGES.map((r) => (
            <Link
              key={r}
              href={`/admin/ai-usage?days=${r}`}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                days === r ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r}d
            </Link>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Total cost
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
            {fmtUsd(totals.costUsd)}
          </p>
          <p className="mt-1 text-xs text-gray-500">over {days} days</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Calls</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
            {fmtNum(totals.calls)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {totals.failures > 0 ? `${fmtNum(totals.failures)} failed` : 'all succeeded'}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Input tokens
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
            {fmtTokens(totals.inputTokens)}
          </p>
          <p className="mt-1 text-xs text-gray-500">{fmtTokens(totals.cacheReadTokens)} cached</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Output tokens
          </p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
            {fmtTokens(totals.outputTokens)}
          </p>
          <p className="mt-1 text-xs text-gray-500">generated</p>
        </div>
      </div>

      {/* Daily cost chart */}
      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Daily cost</h2>
        <UsageBarChart data={data.byDay} />
      </section>

      {/* By feature + by model */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">By feature</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2">Feature</th>
                  <th className="px-3 py-2 text-right">Calls</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.byFeature.map((f) => (
                  <tr key={f.feature} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {FEATURE_LABELS[f.feature] ?? f.feature}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(f.calls)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                      {fmtTokens(f.inputTokens + f.outputTokens)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {fmtUsd4(f.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">By model</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2">Model</th>
                  <th className="px-3 py-2 text-right">Calls</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.byModel.map((m) => (
                  <tr key={`${m.provider}/${m.model}`} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-gray-900">{m.model}</p>
                      <p className="text-[11px] uppercase tracking-wide text-gray-400">
                        {m.provider}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(m.calls)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                      {fmtTokens(m.inputTokens + m.outputTokens)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {fmtUsd4(m.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Top spenders */}
      {data.topSessions.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Top students by AI spend</h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-3 py-2 text-right">Calls</th>
                  <th className="px-3 py-2 text-right">Tokens</th>
                  <th className="px-4 py-2 text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.topSessions.map((s) => (
                  <tr key={s.sessionId} className="border-t border-gray-100">
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/students/${s.sessionId}`}
                        className="font-medium text-navy hover:text-teal"
                      >
                        {s.displayName ?? 'Unknown'}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtNum(s.calls)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                      {fmtTokens(s.tokens)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums">
                      {fmtUsd4(s.costUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Recent calls */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent calls</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-3 py-2">Feature</th>
                <th className="px-3 py-2">Model</th>
                <th className="px-3 py-2 text-right">In / Out</th>
                <th className="px-3 py-2 text-right">ms</th>
                <th className="px-4 py-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((r) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-xs text-gray-500">
                    {new Date(r.createdAt).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      {!r.success && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                      {FEATURE_LABELS[r.feature] ?? r.feature}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{r.model}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600">
                    {fmtTokens(r.inputTokens)} / {fmtTokens(r.outputTokens)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-400">
                    {r.durationMs ?? '—'}
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {fmtUsd4(r.costUsd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

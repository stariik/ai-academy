// ============================================================
// /admin — dashboard. KPIs, 7-day activity, AI spend, recent events.
// Server component: data comes straight from the admin query layer.
// ============================================================

import Link from 'next/link';
import { getOverview } from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

const fmtUsd = (n: number) =>
  n >= 100 ? `$${Math.round(n)}` : `$${n.toFixed(2)}`;
const fmtNum = (n: number) => n.toLocaleString('en-US');
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function KpiCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </>
  );
  const cls = 'block rounded-xl border border-gray-200 bg-white p-4 sm:p-5';
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-teal/50 hover:shadow-sm`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export default async function AdminDashboardPage() {
  const data = await getOverview();
  const { totals, week, ai } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          What is happening across students, courses, and AI spend.
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Engaged learners"
          value={fmtNum(totals.engagedStudents)}
          sub={`${fmtNum(totals.registeredUsers)} registered · ${fmtNum(totals.totalSessions)} sessions total`}
          href="/admin/students"
        />
        <KpiCard
          label="Active this week"
          value={fmtNum(week.activeStudents)}
          sub="sessions with lesson activity"
          href="/admin/students"
        />
        <KpiCard
          label="Enrollments"
          value={fmtNum(totals.enrollments)}
          sub={`+${fmtNum(week.enrollments)} this week`}
        />
        <KpiCard
          label="AI cost (7d)"
          value={ai.available ? fmtUsd(ai.cost7d) : '—'}
          sub={
            ai.available
              ? `${fmtNum(ai.calls7d)} calls · ${fmtUsd(ai.cost30d)} in 30d`
              : 'run the ai_usage migration'
          }
          href="/admin/ai-usage"
        />
        <KpiCard
          label="Courses"
          value={fmtNum(totals.courses)}
          sub={`${fmtNum(totals.lessonsPublished)}/${fmtNum(totals.lessonsTotal)} lessons published`}
          href="/admin/courses"
        />
        <KpiCard
          label="Quiz attempts"
          value={fmtNum(totals.quizAttempts)}
          sub={`+${fmtNum(week.quizAttempts)} this week`}
          href="/admin/analytics"
        />
        <KpiCard
          label="Leads"
          value={fmtNum(totals.leads)}
          sub={`+${fmtNum(week.leads)} this week`}
          href="/admin/leads"
        />
        <KpiCard
          label="AI tokens (7d)"
          value={ai.available ? fmtNum(ai.tokens7d) : '—'}
          sub="input + output"
          href="/admin/ai-usage"
        />
      </div>

      {!ai.available && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Token tracking is not active yet — run{' '}
          <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">
            migrations/2026-06-12-admin-panel.sql
          </code>{' '}
          in the Supabase SQL editor to create the <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">ai_usage</code> table
          and price columns.
        </div>
      )}

      {totals.emptySessions > 0 && (
        <p className="text-xs text-gray-400">
          Note: a guest <span className="font-medium text-gray-500">session</span> is created
          whenever anyone opens a lesson page (including bots and your own testing), so the raw
          session total runs far ahead of real learners.{' '}
          <span className="font-medium text-gray-500">{fmtNum(totals.emptySessions)}</span> of{' '}
          {fmtNum(totals.totalSessions)} sessions never engaged — &ldquo;Engaged learners&rdquo; above
          counts only sessions with real lesson, chat, or quiz activity.
        </p>
      )}

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent enrollments</h2>
          </header>
          <div className="divide-y divide-gray-50">
            {data.recentEnrollments.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No enrollments yet</p>
            )}
            {data.recentEnrollments.map((e) => (
              <div key={e.id} className="px-4 py-2.5">
                <p className="truncate text-sm font-medium text-gray-900">{e.courseTitle}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                  <span className="truncate">{e.email ?? 'unknown user'}</span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase">
                    {e.source}
                  </span>
                  <span className="ml-auto shrink-0">{fmtDate(e.createdAt)}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">New students</h2>
            <Link href="/admin/students" className="text-xs font-medium text-teal hover:text-navy">
              View all →
            </Link>
          </header>
          <div className="divide-y divide-gray-50">
            {data.recentStudents.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No students yet</p>
            )}
            {data.recentStudents.map((s) => (
              <Link
                key={s.id}
                href={`/admin/students/${s.id}`}
                className="block px-4 py-2.5 transition hover:bg-gray-50"
              >
                <p className="truncate text-sm font-medium text-gray-900">{s.displayName}</p>
                <p className="mt-0.5 flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate">{s.email ?? 'guest session'}</span>
                  <span className="shrink-0">{fmtDate(s.createdAt)}</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white">
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">Recent leads</h2>
            <Link href="/admin/leads" className="text-xs font-medium text-teal hover:text-navy">
              View all →
            </Link>
          </header>
          <div className="divide-y divide-gray-50">
            {data.recentLeads.length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No leads yet</p>
            )}
            {data.recentLeads.map((l) => (
              <div key={l.id} className="px-4 py-2.5">
                <p className="truncate text-sm font-medium text-gray-900">{l.contact}</p>
                <p className="mt-0.5 flex items-center justify-between gap-2 text-xs text-gray-500">
                  <span className="truncate">
                    {l.ageGroup} · {l.topics.slice(0, 2).join(', ') || '—'}
                  </span>
                  <span className="shrink-0">{fmtDate(l.createdAt)}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

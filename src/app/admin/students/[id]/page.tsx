// ============================================================
// /admin/students/[id] — full picture of one student session:
// profile, badges, enrollments (grant/revoke), lesson progress,
// quiz attempts, review queue, and AI usage attributable to them.
// ============================================================

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminDb, getStudentDetail } from '@/lib/admin/queries';
import EnrollmentManager from './_components/EnrollmentManager';
import PaymentsPanel, { type PaymentRow } from './_components/PaymentsPanel';

export const dynamic = 'force-dynamic';

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums text-gray-900">{value}</p>
    </div>
  );
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-teal-50 text-teal border border-teal/20',
  in_progress: 'bg-amber-50 text-amber-700 border border-amber-200',
  not_started: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getStudentDetail(id);
  if (!student) notFound();

  // Course list for the grant-enrollment picker.
  const { data: courseRows } = await adminDb()
    .from('courses')
    .select('id, title')
    .order('title');
  const courses = (courseRows ?? []) as { id: string; title: string }[];

  // Payment history (only exists for account-linked students).
  let payments: PaymentRow[] = [];
  if (student.userId) {
    const { data: paymentRows } = await adminDb()
      .from('payments')
      .select('id, course_id, category_slug, amount_cents, currency, status, created_at')
      .eq('user_id', student.userId)
      .order('created_at', { ascending: false });
    const titleById = new Map(courses.map((c) => [c.id, c.title]));
    payments = ((paymentRows ?? []) as {
      id: string;
      course_id: string | null;
      category_slug: string | null;
      amount_cents: number;
      currency: string;
      status: string;
      created_at: string;
    }[]).map((r) => ({
      id: r.id,
      // Exactly one of course_id / category_slug is set (payments_target_ck).
      courseTitle: r.course_id
        ? titleById.get(r.course_id) ?? r.course_id
        : `${r.category_slug} — full bundle`,
      amountCents: r.amount_cents,
      currency: r.currency,
      status: r.status,
      createdAt: r.created_at,
    }));
  }

  const p = student.profile;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/students" className="text-xs font-semibold text-teal hover:text-navy">
          ← All students
        </Link>
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{student.displayName}</h1>
          <p className="text-sm text-gray-500">
            {student.email ?? 'guest session (no account linked)'}
          </p>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Session <span className="font-mono">{student.sessionId}</span> · joined{' '}
          {fmtDate(student.createdAt)} · last active {fmtDateTime(student.lastActiveAt)}
        </p>
      </div>

      {/* Profile stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="XP" value={(p?.totalXp ?? 0).toLocaleString()} />
        <Stat label="Streak" value={p ? `${p.currentStreak}d (best ${p.longestStreak})` : '—'} />
        <Stat label="Quizzes" value={String(p?.totalQuizzes ?? 0)} />
        <Stat label="Avg score" value={p && p.totalQuizzes > 0 ? `${p.averageScore}%` : '—'} />
        <Stat label="Time spent" value={p ? `${p.totalTimeSpentMinutes} min` : '—'} />
        <Stat
          label="AI cost"
          value={student.ai.available ? `$${student.ai.costUsd.toFixed(2)}` : '—'}
        />
      </div>

      {student.onboarding && (
        <section className="overflow-hidden rounded-xl border border-teal/20 bg-white">
          <header className="flex flex-col gap-2 border-b border-gray-100 bg-teal-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal">
                WALL-E onboarding
              </p>
              <h2 className="mt-0.5 text-sm font-semibold text-gray-900">
                What this student wants
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {student.onboarding.segmentLabel && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  {student.onboarding.segmentLabel}
                </span>
              )}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  student.onboarding.status === 'completed'
                    ? 'bg-teal-100 text-teal'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {student.onboarding.status === 'completed'
                  ? `${student.onboarding.questionCount} answers`
                  : `${student.onboarding.questionCount}/7 · in progress`}
              </span>
            </div>
          </header>
          <div className="space-y-4 p-4">
            {student.onboarding.summary && (
              <p className="text-sm leading-relaxed text-gray-700">
                {student.onboarding.summary}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Primary goal
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-700">
                  {student.onboarding.primaryGoal || 'Not clear yet'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Desired outcome
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-gray-700">
                  {student.onboarding.desiredOutcome || 'Not clear yet'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                ...student.onboarding.learningPreferences,
                ...student.onboarding.barriers,
              ].map((label, index) => (
                <span
                  key={`${label}-${index}`}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    student.onboarding?.barriers.includes(label)
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
            {student.onboarding.verbatimQuote && (
              <blockquote className="rounded-xl border-l-2 border-teal bg-teal-50/50 px-4 py-3 text-xs italic leading-relaxed text-gray-700">
                “{student.onboarding.verbatimQuote}”
              </blockquote>
            )}
            {student.onboarding.transcript.length > 0 && (
              <details>
                <summary className="cursor-pointer text-xs font-semibold text-teal hover:text-navy">
                  Read onboarding conversation ({student.onboarding.transcript.length} messages)
                </summary>
                <div className="mt-3 max-h-80 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
                  {student.onboarding.transcript.map((message, index) => (
                    <div
                      key={`${message.at}-${index}`}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <p
                        className={`max-w-[86%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
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
            )}
          </div>
        </section>
      )}

      {/* Weak/strong topics + badges */}
      {(p?.weakTopics.length || p?.strongTopics.length || student.badges.length) ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Weak topics</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p?.weakTopics.length ? (
                p.weakTopics.map((t) => (
                  <span
                    key={t.topic}
                    className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-700"
                  >
                    {t.topic} · {Math.round(t.score)}%
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">None recorded</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">Strong topics</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {p?.strongTopics.length ? (
                p.strongTopics.map((t) => (
                  <span
                    key={t.topic}
                    className="rounded-full border border-teal/20 bg-teal-50 px-2 py-0.5 text-xs text-teal"
                  >
                    {t.topic} · {Math.round(t.score)}%
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">None recorded</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Badges ({student.badges.length}) · review due: {student.reviewQueueDue}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {student.badges.length ? (
                student.badges.map((b) => (
                  <span
                    key={b.code}
                    title={fmtDate(b.earnedAt)}
                    className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                  >
                    {b.code.replace(/_/g, ' ')}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">No badges yet</span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Enrollments */}
      <EnrollmentManager
        sessionId={student.sessionId}
        hasAccount={Boolean(student.userId)}
        enrollments={student.enrollments}
        courses={courses}
      />

      {/* Payments + refunds */}
      <PaymentsPanel payments={payments} />

      {/* Lesson progress */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Lesson progress ({student.progress.length})
          </h2>
        </header>
        {student.progress.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No lessons started yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2">Lesson</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Page</th>
                  <th className="px-3 py-2 text-right">Time</th>
                  <th className="px-4 py-2 text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {student.progress.map((row) => (
                  <tr key={row.lessonId} className="border-t border-gray-100">
                    <td className="max-w-md px-4 py-2.5">
                      <p className="truncate font-medium text-gray-900">{row.lessonTitle}</p>
                      {row.courseTitle && (
                        <p className="truncate text-xs text-gray-400">{row.courseTitle}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[row.status] ?? STATUS_BADGE.not_started}`}
                      >
                        {row.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{row.currentPage}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-gray-600">
                      {row.timeSpentMinutes} min
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                      {fmtDateTime(row.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quiz attempts */}
      <section className="rounded-xl border border-gray-200 bg-white">
        <header className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            Quiz attempts (last {student.quizAttempts.length})
          </h2>
        </header>
        {student.quizAttempts.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-400">No quiz attempts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-4 py-2">Lesson</th>
                  <th className="px-3 py-2 text-right">Score</th>
                  <th className="px-3 py-2 text-right">Result</th>
                  <th className="px-4 py-2 text-right">When</th>
                </tr>
              </thead>
              <tbody>
                {student.quizAttempts.map((a) => (
                  <tr key={a.id} className="border-t border-gray-100">
                    <td className="max-w-md truncate px-4 py-2.5 font-medium text-gray-900">
                      {a.lessonTitle}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{a.percentage}%</td>
                    <td className="px-3 py-2.5 text-right">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          a.passed
                            ? 'bg-teal-50 text-teal'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {a.passed ? 'passed' : 'failed'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                      {fmtDateTime(a.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AI usage footnote */}
      {student.ai.available && student.ai.calls > 0 && (
        <p className="text-xs text-gray-400">
          AI usage attributed to this session: {student.ai.calls.toLocaleString()} calls ·{' '}
          {student.ai.tokens.toLocaleString()} tokens · ${student.ai.costUsd.toFixed(4)} estimated.
        </p>
      )}
    </div>
  );
}

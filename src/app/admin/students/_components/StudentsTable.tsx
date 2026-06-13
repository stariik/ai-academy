'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { StudentListItem } from '@/lib/admin/queries';

type SortKey = 'lastActiveAt' | 'totalXp' | 'lessonsCompleted' | 'averageScore' | 'createdAt';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'lastActiveAt', label: 'Last active' },
  { key: 'totalXp', label: 'XP' },
  { key: 'lessonsCompleted', label: 'Lessons done' },
  { key: 'averageScore', label: 'Avg score' },
  { key: 'createdAt', label: 'Joined' },
];

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });

type Segment = 'active' | 'registered' | 'all';

export default function StudentsTable({ students }: { students: StudentListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('lastActiveAt');
  // Default to "active" so the 300+ empty bot/test sessions don't drown the
  // real learners. Counts shown on the segmented control make the gap explicit.
  const [segment, setSegment] = useState<Segment>('active');

  const counts = useMemo(
    () => ({
      active: students.filter((s) => s.hasActivity).length,
      registered: students.filter((s) => s.email).length,
      all: students.length,
    }),
    [students],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = students;
    if (segment === 'active') list = list.filter((s) => s.hasActivity);
    else if (segment === 'registered') list = list.filter((s) => s.email);
    if (q) {
      list = list.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          (s.email ?? '').toLowerCase().includes(q) ||
          s.sessionId.toLowerCase().startsWith(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'lastActiveAt' || sort === 'createdAt') {
        return b[sort].localeCompare(a[sort]);
      }
      return b[sort] - a[sort];
    });
  }, [students, query, sort, segment]);

  return (
    <div className="space-y-4">
      {/* Segmented filter — make the empty-session gap explicit */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {([
            ['active', `Active (${counts.active})`],
            ['registered', `Registered (${counts.registered})`],
            ['all', `All sessions (${counts.all})`],
          ] as [Segment, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSegment(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                segment === key ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or session id…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal-100 sm:max-w-xs"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400 sm:ml-auto">{rows.length} shown</span>
      </div>

      {segment === 'all' && (
        <p className="text-xs text-gray-400">
          &ldquo;All sessions&rdquo; includes anonymous guest rows minted by lesson-page visits
          (bots, your own testing). Most never engaged — use{' '}
          <span className="font-medium text-gray-500">Active</span> for real learners.
        </p>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wider text-gray-500">
            <tr>
              <th className="px-4 py-2.5">Student</th>
              <th className="px-3 py-2.5 text-right">XP</th>
              <th className="px-3 py-2.5 text-right">Streak</th>
              <th className="px-3 py-2.5 text-right">Lessons</th>
              <th className="px-3 py-2.5 text-right">Quizzes</th>
              <th className="px-3 py-2.5 text-right">Avg %</th>
              <th className="px-3 py-2.5 text-right">Courses</th>
              <th className="px-4 py-2.5 text-right">Last active</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  No students match.
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr
                key={s.sessionId}
                onClick={() => router.push(`/admin/students/${s.sessionId}`)}
                className="cursor-pointer border-t border-gray-100 transition hover:bg-teal-50/40"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{s.displayName}</p>
                  <p className="text-xs text-gray-500">
                    {s.email ?? <span className="italic text-gray-400">guest</span>}
                  </p>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{s.totalXp.toLocaleString()}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {s.currentStreak > 0 ? `${s.currentStreak}🔥` : '—'}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {s.lessonsCompleted}
                  {s.lessonsInProgress > 0 && (
                    <span className="text-xs text-gray-400"> +{s.lessonsInProgress}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{s.totalQuizzes}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  {s.totalQuizzes > 0 ? (
                    <span
                      className={
                        s.averageScore >= 75
                          ? 'font-semibold text-teal'
                          : s.averageScore >= 50
                            ? 'font-semibold text-amber-600'
                            : 'font-semibold text-red-500'
                      }
                    >
                      {s.averageScore}%
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{s.enrollments || '—'}</td>
                <td className="px-4 py-3 text-right text-xs text-gray-500">
                  {fmtDate(s.lastActiveAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

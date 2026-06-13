'use client';

// Grant / revoke course access for one student. Enrollments are keyed
// by auth user, so this section is read-only for guest sessions.

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Enrollment = {
  id: string;
  courseId: string;
  courseTitle: string;
  source: string;
  createdAt: string;
};

export default function EnrollmentManager({
  sessionId,
  hasAccount,
  enrollments,
  courses,
}: {
  sessionId: string;
  hasAccount: boolean;
  enrollments: Enrollment[];
  courses: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enrolledIds = new Set(enrollments.map((e) => e.courseId));
  const grantable = courses.filter((c) => !enrolledIds.has(c.id));

  const grant = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${sessionId}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'grant_failed');
      }
      setSelected('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'grant_failed');
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (enrollmentId: string, courseTitle: string) => {
    if (!confirm(`Revoke access to "${courseTitle}" for this student?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${sessionId}/enrollments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'revoke_failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'revoke_failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white">
      <header className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">
          Course access ({enrollments.length})
        </h2>
      </header>

      {!hasAccount ? (
        <p className="px-4 py-6 text-sm text-gray-400">
          This is a guest session with no registered account — course access can only be granted
          once the student signs up.
        </p>
      ) : (
        <div className="p-4">
          {enrollments.length > 0 && (
            <ul className="mb-4 space-y-2">
              {enrollments.map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{e.courseTitle}</p>
                    <p className="text-xs text-gray-400">
                      via {e.source} ·{' '}
                      {new Date(e.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => revoke(e.id, e.courseTitle)}
                    disabled={busy}
                    className="shrink-0 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={busy || grantable.length === 0}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:max-w-sm"
            >
              <option value="">
                {grantable.length === 0 ? 'Enrolled in every course' : 'Grant access to a course…'}
              </option>
              {grantable.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <button
              onClick={grant}
              disabled={busy || !selected}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-light disabled:bg-gray-300"
            >
              {busy ? 'Working…' : 'Grant access'}
            </button>
          </div>

          {error && <p className="mt-2 text-xs text-red-600">Failed: {error}</p>}
        </div>
      )}
    </section>
  );
}

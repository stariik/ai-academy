'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type PassRate = {
  lessonId: string;
  lessonTitle: string;
  courseId: string | null;
  attempts: number;
  passed: number;
  passRate: number;
  averagePercentage: number;
};

type DropOff = {
  lessonId: string;
  lessonTitle: string;
  totalStudents: number;
  completedLesson: number;
  stuckOnPage: { page: number; count: number }[];
};

type CourseStat = {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  fullCompleters: number;
  averageMinutes: number | null;
};

type Analytics = {
  passRates: PassRate[];
  dropOff: DropOff[];
  courseStats: CourseStat[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) {
          setError('ვერ ჩაიტვირთა');
          return;
        }
        setData(await res.json());
      } catch {
        setError('ვერ ჩაიტვირთა');
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 text-center">
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 flex justify-center">
        <div className="h-10 w-10 border-4 border-gray-200 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div>
          <Link href="/admin" className="text-teal hover:text-navy text-xs font-bold">
            ← Back to admin
          </Link>
          <h1 className="text-3xl font-black text-navy mt-2">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Where students struggle · what to rewrite · how long courses take.
          </p>
        </div>

        {/* Course completion stats */}
        <section>
          <h2 className="text-lg font-black text-navy mb-3">Course completion</h2>
          {data.courseStats.length === 0 ? (
            <EmptyCard message="No course data yet." />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2">Course</th>
                    <th className="text-right px-4 py-2">Lessons</th>
                    <th className="text-right px-4 py-2">Completed by</th>
                    <th className="text-right px-4 py-2">Avg. time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courseStats.map((c) => (
                    <tr key={c.courseId} className="border-t border-gray-100">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/courses/${c.courseId}`}
                          className="font-bold text-navy hover:text-teal"
                        >
                          {c.courseTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">{c.totalLessons}</td>
                      <td className="px-4 py-3 text-right">{c.fullCompleters}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {c.averageMinutes !== null ? `${c.averageMinutes} min` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Lesson pass rates */}
        <section>
          <h2 className="text-lg font-black text-navy mb-1">Lesson pass rates</h2>
          <p className="text-xs text-gray-500 mb-3">
            Sorted by attempts desc, then pass-rate asc — "tough lessons with real traffic" rise to the top.
          </p>
          {data.passRates.length === 0 ? (
            <EmptyCard message="No quiz attempts yet." />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2">Lesson</th>
                    <th className="text-right px-4 py-2">Attempts</th>
                    <th className="text-right px-4 py-2">Passed</th>
                    <th className="text-right px-4 py-2">Pass rate</th>
                    <th className="text-right px-4 py-2">Avg. %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.passRates.map((r) => (
                    <tr key={r.lessonId} className="border-t border-gray-100">
                      <td className="px-4 py-3 max-w-md">
                        <p className="font-bold text-navy truncate">{r.lessonTitle}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{r.lessonId}</p>
                      </td>
                      <td className="px-4 py-3 text-right">{r.attempts}</td>
                      <td className="px-4 py-3 text-right">{r.passed}</td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-bold ${
                            r.passRate < 50
                              ? 'text-red-500'
                              : r.passRate < 75
                              ? 'text-orange-500'
                              : 'text-teal'
                          }`}
                        >
                          {r.passRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{r.averagePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Page drop-off */}
        <section>
          <h2 className="text-lg font-black text-navy mb-1">Lesson drop-off</h2>
          <p className="text-xs text-gray-500 mb-3">
            Lessons ranked by non-completion count. "Stuck on" shows the pages students last reached.
          </p>
          {data.dropOff.length === 0 ? (
            <EmptyCard message="No lesson progress recorded yet." />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-2">Lesson</th>
                    <th className="text-right px-4 py-2">Students</th>
                    <th className="text-right px-4 py-2">Completed</th>
                    <th className="text-left px-4 py-2">Stuck on</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dropOff.map((r) => {
                    const completionPct =
                      r.totalStudents > 0
                        ? Math.round((r.completedLesson / r.totalStudents) * 100)
                        : 0;
                    return (
                      <tr key={r.lessonId} className="border-t border-gray-100">
                        <td className="px-4 py-3 max-w-md">
                          <p className="font-bold text-navy truncate">{r.lessonTitle}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{r.lessonId}</p>
                        </td>
                        <td className="px-4 py-3 text-right">{r.totalStudents}</td>
                        <td className="px-4 py-3 text-right">
                          {r.completedLesson}{' '}
                          <span className="text-xs text-gray-400">({completionPct}%)</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {r.stuckOnPage.length === 0 ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : (
                              r.stuckOnPage.map((p) => (
                                <span
                                  key={p.page}
                                  className="text-[10px] font-bold bg-red-50 text-red-600 rounded-full px-2 py-0.5"
                                >
                                  p.{p.page} · {p.count}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
      {message}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import type { LeaderboardEntry } from '@/types';

export default function LeaderboardPage() {
  const params = useParams<{ courseId: string }>();
  const courseId = params?.courseId;
  const { sessionId } = useSession();

  const [course, setCourse] = useState<{ id: string; title: string } | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;
    async function load() {
      try {
        const res = await fetch(`/api/leaderboard/${courseId}`);
        const data = await res.json();
        setCourse(data.course ?? null);
        setEntries(Array.isArray(data.entries) ? data.entries : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          href={`/courses/${courseId}`}
          className="text-xs font-bold text-navy-100 hover:text-teal no-underline inline-flex items-center gap-1 mb-4"
        >
          ← {course?.title ?? 'კურსი'}
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">🏆</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-navy leading-tight">ლიდერბორდი</h1>
            {course && <p className="text-sm text-navy-100">{course.title}</p>}
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cyan-50 p-10 text-center">
            <p className="text-sm text-navy-100">ჯერ არავინ მიიღო XP ამ კურსში. შენ შეიძლება იყო პირველი!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-cyan-50 overflow-hidden">
            {entries.map((e) => {
              const isMe = e.sessionId === sessionId;
              const medal = e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : null;
              return (
                <div
                  key={e.sessionId}
                  className={`flex items-center gap-4 p-4 border-b border-cyan-50 last:border-b-0 ${
                    isMe ? 'bg-cyan-50/60' : ''
                  }`}
                >
                  <div className="w-10 text-center font-black text-navy text-lg">
                    {medal ?? `#${e.rank}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy truncate">
                      {e.displayName}
                      {isMe && <span className="ml-2 text-[10px] text-teal font-black">შენ</span>}
                    </p>
                    <p className="text-[11px] text-navy-100">{e.lessonsCompleted} დასრ. გაკვეთილი</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black text-teal">{e.xp.toLocaleString()}</p>
                    <p className="text-[10px] text-navy-100 font-semibold uppercase">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

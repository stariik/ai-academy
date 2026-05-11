'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BADGES, type BadgeCode } from '@/lib/gamification/badges';

type Snapshot = {
  student: { displayName: string };
  gamification: { totalXp: number; currentStreak: number; longestStreak: number };
  totals: {
    completed: number;
    inProgress: number;
    totalQuizzes: number;
    averageScore: number;
    totalMinutes: number;
  };
  weekly: { quizzesThisWeek: number; averageScoreThisWeek: number | null };
  weakTopics: { topic: string; score: number }[];
  strongTopics: { topic: string; score: number }[];
  courses: { id: string; title: string; totalLessons: number; done: number; inProgress: number; pct: number }[];
  recentAttempts: {
    id: string;
    lessonId: string;
    lessonTitle: string;
    percentage: number;
    passed: boolean;
    createdAt: string;
  }[];
  badges: { code: string; earnedAt: string }[];
};

export default function SharePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const res = await fetch(`/api/share/${token}`);
        if (!res.ok) {
          setError(res.status === 404 ? 'ბმული არასწორი ან გაუქმებულია.' : 'ვერ ჩაიტვირთა.');
          return;
        }
        const data = await res.json();
        setSnapshot(data);
      } catch {
        setError('ვერ ჩაიტვირთა.');
      }
    }
    load();
  }, [token]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-cyan-50 p-10 text-center max-w-md">
          <p className="text-5xl mb-3">🔒</p>
          <h1 className="text-xl font-black text-navy mb-1">ბმული მიუწვდომელია</h1>
          <p className="text-sm text-navy-100">{error}</p>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  const s = snapshot;
  const hours = Math.floor(s.totals.totalMinutes / 60);
  const mins = s.totals.totalMinutes % 60;
  const timeLabel =
    hours > 0 ? `${hours} სთ ${mins} წთ` : `${s.totals.totalMinutes} წუთი`;

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Header */}
      <section className="bg-navy text-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          <p className="text-xs uppercase tracking-wider text-cyan font-bold mb-2">
            AI Academy · პროგრესი (მხოლოდ ნახვა)
          </p>
          <h1 className="text-3xl sm:text-4xl font-black">{s.student.displayName}</h1>
          <p className="text-sm text-white/70 mt-1">
            ეს ბმული აჩვენებს მოსწავლის პროგრესს. მხოლოდ ნახვის რეჟიმი.
          </p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* This week digest */}
        <section className="bg-gradient-to-r from-teal to-cyan text-white rounded-2xl p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-wider font-bold text-white/80 mb-1">
            ბოლო 7 დღე
          </p>
          <h2 className="text-xl sm:text-2xl font-black mb-3">ყოველკვირეული შეჯამება</h2>
          <div className="grid grid-cols-3 gap-3">
            <Stat label="ქვიზი" value={s.weekly.quizzesThisWeek} />
            <Stat
              label="საშ. ქულა"
              value={s.weekly.averageScoreThisWeek !== null ? `${s.weekly.averageScoreThisWeek}%` : '—'}
            />
            <Stat label="სერია" value={`🔥 ${s.gamification.currentStreak}`} />
          </div>
        </section>

        {/* Totals */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="XP" value={s.gamification.totalXp.toLocaleString()} />
          <StatCard label="დასრულებული" value={s.totals.completed} sub="გაკვეთილი" />
          <StatCard label="ქვიზები" value={s.totals.totalQuizzes} sub="სულ" />
          <StatCard label="სწავლის დრო" value={timeLabel} />
        </section>

        {/* Courses */}
        {s.courses.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-black text-navy mb-3">აქტიური კურსები</h2>
            <div className="space-y-2">
              {s.courses.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-cyan-50 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-bold text-navy">{c.title}</p>
                    <span className="text-xs font-black text-teal">{c.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-cyan-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal to-cyan"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-navy-100 mt-1.5">
                    {c.done}/{c.totalLessons} გაკვეთილი დასრულებული
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Weak topics */}
        {s.weakTopics.length > 0 && (
          <section className="bg-white rounded-2xl border border-cyan-50 p-5">
            <h2 className="text-base font-black text-navy mb-3">🎯 სუსტი თემები</h2>
            <ul className="space-y-2">
              {s.weakTopics.slice(0, 6).map((t) => (
                <li key={t.topic} className="flex items-center justify-between text-sm">
                  <span className="text-navy">{t.topic}</span>
                  <span className="text-[11px] font-bold text-red-500">{Math.round(t.score)}%</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Recent quizzes */}
        {s.recentAttempts.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-black text-navy mb-3">ბოლო ქვიზები</h2>
            <div className="bg-white rounded-2xl border border-cyan-50 overflow-hidden">
              {s.recentAttempts.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-3 ${
                    i < s.recentAttempts.length - 1 ? 'border-b border-cyan-50' : ''
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      a.passed ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {a.percentage}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy truncate">{a.lessonTitle}</p>
                    <p className="text-[10px] text-navy-100">
                      {new Date(a.createdAt).toLocaleDateString('ka-GE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Badges */}
        {s.badges.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-black text-navy mb-3">ბეჯები</h2>
            <div className="flex flex-wrap gap-2">
              {s.badges.map((b) => {
                const def = BADGES[b.code as BadgeCode];
                if (!def) return null;
                return (
                  <div
                    key={b.code}
                    className="bg-white rounded-xl border border-cyan-50 px-3 py-2 flex items-center gap-2"
                    title={def.description}
                  >
                    <span className="text-xl">{def.icon}</span>
                    <span className="text-xs font-bold text-navy">{def.title}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <p className="text-[10px] text-navy-100 text-center pt-6">
          AI Academy · ეს ბმული შეიძლება ნებისმიერ დროს გაუქმდეს სტუდენტის მიერ.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-white/80">{label}</p>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-cyan-50 p-4">
      <p className="text-2xl font-black text-navy leading-none">{value}</p>
      {sub && <p className="text-[10px] text-navy-100 mt-1 uppercase tracking-wider font-semibold">{sub}</p>}
      <p className="text-xs text-teal font-bold mt-2">{label}</p>
    </div>
  );
}

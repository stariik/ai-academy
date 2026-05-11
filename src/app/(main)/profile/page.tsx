'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useSession } from '@/hooks/useSession';
import type { Course, Lesson, LessonProgress, StudentProfile, UserBadge } from '@/types';
import { BADGES, type BadgeCode } from '@/lib/gamification/badges';
import { ShareProgressCard } from '@/components/profile/ShareProgressCard';

type RecentAttempt = {
  id: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  createdAt: string;
};

const GENDER_LABELS: Record<string, string> = {
  female: 'ქალი',
  male: 'კაცი',
  other: 'სხვა',
  prefer_not_say: 'არ მითითებია',
};

const AGE_LABELS: Record<string, string> = {
  '13-17': '13–17 წელი',
  '18-24': '18–24 წელი',
  '25-34': '25–34 წელი',
  '35-44': '35–44 წელი',
  '45+': '45+ წელი',
};

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { sessionId } = useSession();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [reviewDueCount, setReviewDueCount] = useState(0);
  const [recentAttempts, setRecentAttempts] = useState<RecentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [lessonsRes, coursesRes, progressRes, profileRes, badgesRes, reviewRes, attemptsRes] = await Promise.all([
          fetch('/api/lessons?status=published'),
          fetch('/api/courses'),
          fetch('/api/progress'),
          fetch('/api/profile'),
          fetch('/api/badges'),
          fetch('/api/review?count=1'),
          fetch('/api/quiz-attempts?limit=5'),
        ]);
        const [lessonsData, coursesData, progressData, profileData, badgesData, reviewData, attemptsData] = await Promise.all([
          lessonsRes.json(),
          coursesRes.json(),
          progressRes.json(),
          profileRes.json(),
          badgesRes.json(),
          reviewRes.json(),
          attemptsRes.json(),
        ]);
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setProgress(Array.isArray(progressData) ? progressData : []);
        setProfile(profileData?.id ? profileData : null);
        setBadges(Array.isArray(badgesData) ? badgesData : []);
        setReviewDueCount(typeof reviewData?.dueCount === 'number' ? reviewData.dueCount : 0);
        setRecentAttempts(Array.isArray(attemptsData) ? attemptsData : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [sessionId]);

  const progressById = useMemo(() => {
    const m = new Map<string, LessonProgress>();
    progress.forEach((p) => m.set(p.lessonId, p));
    return m;
  }, [progress]);

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const inProgressCount = progress.filter((p) => p.status === 'in_progress').length;
  const totalMinutes = Math.round(progress.reduce((sum, p) => sum + (p.timeSpentSeconds || 0), 0) / 60);

  const enrolledCourses = useMemo(() => {
    return courses
      .map((c) => {
        const cLessons = lessons.filter((l) => l.courseId === c.id);
        const done = cLessons.filter((l) => progressById.get(l.id)?.status === 'completed').length;
        const inProgress = cLessons.filter((l) => progressById.get(l.id)?.status === 'in_progress').length;
        const pct = cLessons.length > 0 ? Math.round((done / cLessons.length) * 100) : 0;
        return { course: c, total: cLessons.length, done, inProgress, pct, active: done + inProgress > 0 };
      })
      .filter((x) => x.active)
      .sort((a, b) => b.pct - a.pct);
  }, [courses, lessons, progressById]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const initials = (user.displayName || user.email || user.phone || '?').charAt(0).toUpperCase();

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden bg-navy text-white">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, rgba(10,196,224,0.3) 0, transparent 45%), radial-gradient(circle at 80% 70%, rgba(9,146,194,0.3) 0, transparent 45%)',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-cyan to-teal text-navy font-black text-3xl sm:text-4xl flex items-center justify-center shadow-2xl">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-4xl font-black truncate">
                {user.displayName || 'სტუდენტი'}
              </h1>
              <p className="text-sm text-white/70 mt-1 truncate">
                {user.email || user.phone}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {user.ageGroup && (
                  <span className="text-[11px] font-bold bg-white/10 border border-white/20 rounded-full px-3 py-1">
                    {AGE_LABELS[user.ageGroup] || user.ageGroup}
                  </span>
                )}
                {user.gender && (
                  <span className="text-[11px] font-bold bg-white/10 border border-white/20 rounded-full px-3 py-1">
                    {GENDER_LABELS[user.gender] || user.gender}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                signOut();
                router.push('/');
              }}
              className="text-sm font-bold border border-white/30 px-5 py-2.5 rounded-full hover:bg-white/10 transition"
            >
              გასვლა
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Daily review CTA */}
        <Link
          href="/review"
          className={`block rounded-2xl p-5 sm:p-6 border-2 transition no-underline ${
            reviewDueCount > 0
              ? 'bg-gradient-to-r from-teal to-cyan border-teal text-white hover:-translate-y-0.5 shadow-lg shadow-teal/20'
              : 'bg-white border-cyan-50 text-navy hover:border-cyan'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="text-3xl">{reviewDueCount > 0 ? '🔥' : '✨'}</div>
            <div className="flex-1 min-w-0">
              <p className={`text-base sm:text-lg font-black ${reviewDueCount > 0 ? 'text-white' : 'text-navy'}`}>
                {reviewDueCount > 0 ? `${reviewDueCount} კითხვა მოსამზადებელია` : 'დღევანდელი გამეორება'}
              </p>
              <p className={`text-xs ${reviewDueCount > 0 ? 'text-white/80' : 'text-navy-100'}`}>
                {reviewDueCount > 0 ? 'გაიარე 5-წუთიანი გამეორება და გაიმყარე ცოდნა' : 'გამეორებული ქვიზის კითხვები ამ ეკრანზე გამოჩნდება'}
              </p>
            </div>
            <svg className={`h-5 w-5 ${reviewDueCount > 0 ? 'text-white' : 'text-teal'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* XP + Streak row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-gradient-to-br from-navy to-teal rounded-2xl p-5 text-white">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">XP</p>
            <p className="text-3xl sm:text-4xl font-black mt-1">{(profile?.totalXp ?? 0).toLocaleString()}</p>
            <p className="text-xs text-white/70 mt-1">დაგროვილი გამოცდილება</p>
          </div>
          <div className="bg-white rounded-2xl border border-cyan-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-100">სერია</p>
            <p className="text-3xl sm:text-4xl font-black text-navy mt-1">
              🔥 {profile?.currentStreak ?? 0}
            </p>
            <p className="text-xs text-navy-100 mt-1">ყოველდღიური დღე</p>
          </div>
          <div className="bg-white rounded-2xl border border-cyan-50 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-navy-100">უგრძესი სერია</p>
            <p className="text-3xl sm:text-4xl font-black text-navy mt-1">{profile?.longestStreak ?? 0}</p>
            <p className="text-xs text-navy-100 mt-1">დღე ზედიზედ</p>
          </div>
        </div>

        {/* Badges */}
        <section>
          <h2 className="text-xl sm:text-2xl font-black text-navy mb-3">ბეჯები</h2>
          {badges.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cyan-50 p-6 text-sm text-navy-100">
              ჯერ არ მიგიღია ბეჯი — დაასრულე გაკვეთილი და აიღე შენი პირველი!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {badges.map((b) => {
                const def = BADGES[b.badgeCode as BadgeCode];
                if (!def) return null;
                return (
                  <div key={b.id} className="bg-white rounded-2xl border border-cyan-50 p-4 text-center">
                    <div className="text-3xl mb-2">{def.icon}</div>
                    <p className="text-sm font-bold text-navy leading-tight">{def.title}</p>
                    <p className="text-[10px] text-navy-100 mt-1 leading-tight">{def.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="დასრულებული" value={completedCount} sub="გაკვეთილი" accent="from-teal to-cyan" />
          <StatCard label="მიმდინარე" value={inProgressCount} sub="გაკვეთილი" accent="from-navy to-teal" />
          <StatCard label="ქვიზები" value={profile?.totalQuizzes ?? 0} sub="ნაცადი" accent="from-cyan to-teal-light" />
          <StatCard
            label="საშ. ქულა"
            value={profile?.averageScore && profile.averageScore > 0 ? Math.round(profile.averageScore) : '—'}
            sub="%"
            accent="from-navy-light to-navy"
          />
        </div>

        {/* Time spent */}
        {totalMinutes > 0 && (
          <div className="bg-white rounded-2xl border border-cyan-50 p-5 sm:p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cream to-cream-light flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6 text-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-navy-100 font-semibold uppercase tracking-wide">სწავლის დრო</p>
              <p className="text-xl font-black text-navy">
                {totalMinutes >= 60
                  ? `${Math.floor(totalMinutes / 60)} სთ ${totalMinutes % 60} წთ`
                  : `${totalMinutes} წუთი`}
              </p>
            </div>
          </div>
        )}

        {/* Share progress with parent / teacher */}
        <ShareProgressCard />

        {/* Weak + strong topics */}
        {(profile?.weakTopics?.length || profile?.strongTopics?.length) ? (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-cyan-50 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🎯</span>
                <h2 className="text-lg font-black text-navy">სუსტი თემები</h2>
              </div>
              {profile?.weakTopics?.length ? (
                <ul className="space-y-2">
                  {profile.weakTopics.slice(0, 6).map((t) => (
                    <li key={t.topic} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-navy font-medium truncate">{t.topic}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="h-1.5 w-16 bg-red-100 rounded-full overflow-hidden">
                          <span
                            className="block h-full bg-red-400"
                            style={{ width: `${Math.min(100, Math.max(0, t.score))}%` }}
                          />
                        </span>
                        <span className="text-[11px] font-bold text-red-500 w-8 text-right">
                          {Math.round(t.score)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-navy-100">ჯერ არ აღმოჩენილა სუსტი თემები — გააგრძელე!</p>
              )}
              {profile?.weakTopics?.length ? (
                <Link
                  href="/review"
                  className="inline-block mt-4 text-xs font-bold text-teal hover:text-navy no-underline"
                >
                  სუსტი თემების გამეორება →
                </Link>
              ) : null}
            </div>

            <div className="bg-white rounded-2xl border border-cyan-50 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">💪</span>
                <h2 className="text-lg font-black text-navy">ძლიერი თემები</h2>
              </div>
              {profile?.strongTopics?.length ? (
                <ul className="space-y-2">
                  {profile.strongTopics.slice(0, 6).map((t) => (
                    <li key={t.topic} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-navy font-medium truncate">{t.topic}</span>
                      <span className="flex items-center gap-2 flex-shrink-0">
                        <span className="h-1.5 w-16 bg-teal/20 rounded-full overflow-hidden">
                          <span
                            className="block h-full bg-teal"
                            style={{ width: `${Math.min(100, Math.max(0, t.score))}%` }}
                          />
                        </span>
                        <span className="text-[11px] font-bold text-teal w-8 text-right">
                          {Math.round(t.score)}%
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-navy-100">ძლიერი თემები ქვიზების შემდეგ გამოჩნდება.</p>
              )}
            </div>
          </section>
        ) : null}

        {/* Recent quiz attempts */}
        {recentAttempts.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-black text-navy mb-3">ბოლო ქვიზები</h2>
            <div className="bg-white rounded-2xl border border-cyan-50 overflow-hidden">
              {recentAttempts.map((a, i) => (
                <Link
                  key={a.id}
                  href={`/student/lesson/${a.lessonId}`}
                  className={`flex items-center gap-3 p-4 no-underline transition hover:bg-cyan-50/60 ${
                    i < recentAttempts.length - 1 ? 'border-b border-cyan-50' : ''
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                      a.passed ? 'bg-teal/10 text-teal' : 'bg-red-50 text-red-500'
                    }`}
                  >
                    {a.percentage}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy truncate">{a.lessonTitle}</p>
                    <p className="text-[11px] text-navy-100">
                      {a.passed ? 'ჩაბარდა' : 'არ ჩაბარდა'} · {formatRelative(a.createdAt)}
                    </p>
                  </div>
                  <svg className="h-4 w-4 text-navy-100 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <section>
            <h2 className="text-xl sm:text-2xl font-black text-navy mb-3">ჩემი ინტერესები</h2>
            <div className="flex flex-wrap gap-2">
              {user.interests.map((i) => (
                <span
                  key={i}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white border-2 border-cyan-50 text-navy"
                >
                  {i}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Enrolled courses */}
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-navy">ჩემი კურსები</h2>
              <p className="text-sm text-teal mt-0.5 font-medium">
                {enrolledCourses.length > 0 ? `${enrolledCourses.length} აქტიური კურსი` : 'ჯერ არ დაგიწყია'}
              </p>
            </div>
            <Link href="/courses" className="text-sm font-bold text-teal hover:text-navy transition">
              ყველა კურსი →
            </Link>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cyan-50 p-10 text-center">
              <p className="text-base font-bold text-navy mb-1">ჯერ არ ხარ ჩართული კურსში</p>
              <p className="text-sm text-navy-100 mb-5">აირჩიე კურსი და დაიწყე სწავლა</p>
              <Link
                href="/courses"
                className="inline-block bg-gradient-to-r from-teal to-cyan text-white font-bold px-6 py-3 rounded-full no-underline hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal/30 transition"
              >
                კურსების ნახვა
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {enrolledCourses.map(({ course, total, done, pct }) => (
                <div
                  key={course.id}
                  className="group bg-white rounded-2xl border border-cyan-50 hover:border-cyan hover:shadow-xl hover:shadow-navy/10 transition-all p-5"
                >
                  <Link href={`/courses/${course.id}`} className="no-underline">
                    <h3 className="font-bold text-navy line-clamp-2 group-hover:text-teal">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-xs text-navy-100 line-clamp-2 mt-1">{course.description}</p>
                    )}
                    <div className="mt-4">
                      <div className="h-2 bg-cyan-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal to-cyan transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-2">
                        <span className="text-navy-100 font-medium">
                          {done}/{total} გაკვეთილი
                        </span>
                        <span className="text-teal font-bold">{pct}%</span>
                      </div>
                    </div>
                  </Link>
                  <Link
                    href={`/leaderboard/${course.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-teal hover:text-navy no-underline mt-3"
                  >
                    🏆 ლიდერბორდი →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-cyan-50 p-4 sm:p-5">
      <div className={`h-1 w-10 rounded-full bg-gradient-to-r ${accent} mb-3`} />
      <p className="text-2xl sm:text-3xl font-black text-navy leading-none">{value}</p>
      {sub && <p className="text-[10px] text-navy-100 mt-1 uppercase tracking-wider font-semibold">{sub}</p>}
      <p className="text-xs text-teal font-bold mt-2">{label}</p>
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'ახლახან';
  if (minutes < 60) return `${minutes} წთ წინ`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} სთ წინ`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} დღის წინ`;
  return new Date(iso).toLocaleDateString('ka-GE');
}

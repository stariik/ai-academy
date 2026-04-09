'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Lesson, Course, LessonProgress, StudentProfile } from '@/types';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  const { sessionId } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [lessonsRes, coursesRes, progressRes, profileRes, recsRes] = await Promise.all([
          fetch('/api/lessons?status=published'),
          fetch('/api/courses'),
          fetch('/api/progress'),
          fetch('/api/profile'),
          fetch('/api/recommendations'),
        ]);
        const [lessonsData, coursesData, progressData, profileData, recsData] = await Promise.all([
          lessonsRes.json(),
          coursesRes.json(),
          progressRes.json(),
          profileRes.json(),
          recsRes.json(),
        ]);
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setProgress(Array.isArray(progressData) ? progressData : []);
        setProfile(profileData?.id ? profileData : null);
        setRecommendations(Array.isArray(recsData) ? recsData : []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
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

  const inProgressLessons = useMemo(
    () =>
      lessons
        .filter((l) => progressById.get(l.id)?.status === 'in_progress')
        .slice(0, 6),
    [lessons, progressById]
  );

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const inProgressCount = progress.filter((p) => p.status === 'in_progress').length;

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    courses.forEach((c) => (c.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    lessons.forEach((l) => (l.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [courses, lessons]);

  const popularCourses = courses.slice(0, 8);

  const filteredLessons = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return lessons
      .filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description?.toLowerCase().includes(q) ||
          l.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [query, lessons]);

  const courseProgress = (courseId: string) => {
    const courseLessons = lessons.filter((l) => l.courseId === courseId);
    if (courseLessons.length === 0) return { pct: 0, done: 0, total: 0 };
    const done = courseLessons.filter((l) => progressById.get(l.id)?.status === 'completed').length;
    return { pct: Math.round((done / courseLessons.length) * 100), done, total: courseLessons.length };
  };

  const lessonProgressPct = (lessonId: string) => {
    const p = progressById.get(lessonId);
    if (!p) return 0;
    if (p.status === 'completed') return 100;
    return Math.min(100, Math.max(0, Math.round(p.scrollPercentage || 0)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy text-white">
        {/* Decorative gradient blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(10,196,224,0.35) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgba(9,146,194,0.35) 0, transparent 45%), radial-gradient(circle at 50% 100%, rgba(246,231,188,0.15) 0, transparent 50%)',
          }}
        />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="inline-flex items-center gap-2 bg-cyan/10 border border-cyan/30 rounded-full px-3 py-1 mb-4">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
            <p className="text-[11px] sm:text-xs uppercase tracking-widest text-cyan font-bold">
              AI Academy
            </p>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] mb-4 max-w-3xl">
            Learn without <span className="text-cream">limits.</span>
          </h1>
          <p className="text-base sm:text-xl text-white/75 max-w-2xl mb-8 leading-relaxed">
            Personalized, AI-powered lessons that adapt to the way you learn. Pick up where you left off or explore something new.
          </p>

          {/* Search */}
          <div className="relative max-w-2xl">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for anything…"
              className="w-full rounded-full bg-white text-navy placeholder:text-navy-100 pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base shadow-2xl shadow-black/30 focus:outline-none focus:ring-4 focus:ring-cyan/50"
              aria-label="Search lessons"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>

            {query && (
              <div className="absolute z-20 mt-2 left-0 right-0 bg-white text-navy rounded-2xl shadow-2xl border border-cyan-50 overflow-hidden">
                {filteredLessons.length === 0 ? (
                  <div className="p-4 text-sm text-navy-100">No lessons match “{query}”.</div>
                ) : (
                  filteredLessons.map((l) => (
                    <Link
                      key={l.id}
                      href={`/student/lesson/${l.id}`}
                      className="flex items-start gap-3 p-3 hover:bg-cyan-50 border-b border-cyan-50 last:border-0 no-underline"
                    >
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan to-teal text-white flex items-center justify-center flex-shrink-0 font-bold">
                        {l.title.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-navy">{l.title}</p>
                        <p className="text-xs text-navy-100 line-clamp-1">{l.description}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Stat strip */}
          {profile && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl">
              <StatPill label="Completed" value={completedCount.toString()} accent="text-cream" />
              <StatPill label="In Progress" value={inProgressCount.toString()} accent="text-cyan" />
              <StatPill label="Quizzes" value={profile.totalQuizzes.toString()} accent="text-cyan-light" />
              <StatPill
                label="Avg Score"
                value={profile.averageScore > 0 ? `${Math.round(profile.averageScore)}%` : '—'}
                accent="text-cream"
              />
            </div>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* CONTINUE LEARNING */}
        {inProgressLessons.length > 0 && (
          <Section
            title="Continue learning"
            subtitle="Pick up right where you left off"
          >
            <HScroll>
              {inProgressLessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/student/lesson/${l.id}`}
                  className="group snap-start flex-shrink-0 w-72 bg-white rounded-2xl border border-cyan-50 hover:shadow-2xl hover:shadow-navy/10 hover:-translate-y-1 hover:border-cyan transition-all overflow-hidden"
                >
                  <div className="h-28 bg-gradient-to-br from-navy via-teal to-cyan relative">
                    <div className="absolute inset-0 opacity-20"
                      style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, #F6E7BC 0, transparent 50%)' }} />
                    <div className="absolute inset-0 flex items-center justify-center text-cream text-4xl font-black drop-shadow-lg">
                      {l.title.charAt(0)}
                    </div>
                    <span className="absolute top-2 right-2 text-[10px] bg-cream text-navy px-2 py-0.5 rounded-full font-bold uppercase tracking-wide shadow-md">
                      In progress
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-navy line-clamp-2 group-hover:text-teal transition">
                      {l.title}
                    </h3>
                    <p className="text-xs text-navy-100 line-clamp-2 mt-1 mb-3">{l.description}</p>
                    <div className="h-1.5 bg-cyan-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal to-cyan transition-all"
                        style={{ width: `${lessonProgressPct(l.id)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-teal mt-1.5 font-bold">
                      {lessonProgressPct(l.id)}% complete
                    </p>
                  </div>
                </Link>
              ))}
            </HScroll>
          </Section>
        )}

        {/* RECOMMENDED */}
        {recommendations.length > 0 && (
          <Section
            title="Recommended for you"
            subtitle="Based on what you've been learning"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.slice(0, 6).map((l) => (
                <Link
                  key={l.id}
                  href={`/student/lesson/${l.id}`}
                  className="group bg-white rounded-2xl border border-cyan-50 hover:shadow-xl hover:shadow-navy/10 hover:border-cyan hover:-translate-y-1 transition-all p-5"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-navy to-teal flex items-center justify-center text-cream font-black text-lg flex-shrink-0 shadow-md">
                      {l.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-navy line-clamp-2 group-hover:text-teal">
                        {l.title}
                      </h3>
                      <p className="text-[11px] text-teal mt-0.5 capitalize font-semibold">{l.difficulty}</p>
                    </div>
                  </div>
                  <p className="text-xs text-navy-100 line-clamp-2 mb-3">{l.description}</p>
                  <div className="flex items-center justify-between text-[11px] pt-3 border-t border-cyan-50">
                    <span className="text-navy-100 font-medium">{l.estimatedDurationMinutes} min</span>
                    <span className="text-teal font-bold group-hover:translate-x-1 transition">
                      Start →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* CATEGORIES */}
        {categories.length > 0 && (
          <Section
            title="Browse by category"
            subtitle="Find topics that interest you"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((c, i) => (
                <div
                  key={c.name}
                  className="bg-white rounded-2xl border border-cyan-50 hover:border-cyan hover:shadow-lg hover:shadow-navy/10 hover:-translate-y-1 transition-all p-4 cursor-pointer group"
                >
                  <div className={`h-11 w-11 rounded-xl mb-3 flex items-center justify-center text-cream font-black shadow-md group-hover:scale-110 transition ${categoryColor(i)}`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-bold text-sm text-navy capitalize line-clamp-1">{c.name}</p>
                  <p className="text-xs text-teal mt-0.5 font-semibold">{c.count} {c.count === 1 ? 'item' : 'items'}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* POPULAR COURSES */}
        {popularCourses.length > 0 && (
          <Section
            title="Popular courses"
            subtitle="Top picks from AI Academy"
            action={<Link href="/student" className="text-sm font-bold text-teal hover:text-navy transition">See all →</Link>}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularCourses.map((c, i) => {
                const { pct, done, total } = courseProgress(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/student/course/${c.id}`}
                    className="group bg-white rounded-2xl border border-cyan-50 hover:shadow-2xl hover:shadow-navy/15 hover:-translate-y-1 hover:border-cyan transition-all overflow-hidden flex flex-col"
                  >
                    <div className={`h-32 relative ${courseCover(i)}`}>
                      <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #F6E7BC 0, transparent 60%)' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-cream text-5xl font-black drop-shadow-lg">
                          {c.title.charAt(0)}
                        </span>
                      </div>
                      {pct > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/25">
                          <div className="h-full bg-cream" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-sm text-navy line-clamp-2 group-hover:text-teal">
                        {c.title}
                      </h3>
                      {c.description && (
                        <p className="text-xs text-navy-100 line-clamp-2 mt-1">{c.description}</p>
                      )}
                      <div className="mt-auto pt-3 flex items-center justify-between text-[11px]">
                        <span className="text-navy-100 font-medium">{total} lessons</span>
                        {pct > 0 ? (
                          <span className="font-bold text-teal">{done}/{total} done</span>
                        ) : (
                          <span className="font-bold bg-cream text-navy px-2 py-0.5 rounded-full">NEW</span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* EMPTY STATE */}
        {courses.length === 0 && lessons.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-cyan-50">
            <p className="text-xl font-bold text-navy mb-2">No lessons yet</p>
            <p className="text-sm text-navy-100">Content will appear here once it&apos;s published.</p>
          </div>
        )}

        {/* CTA STRIP */}
        <section className="relative rounded-3xl bg-navy p-8 sm:p-12 text-white text-center shadow-2xl shadow-navy/30 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 10% 20%, rgba(10,196,224,0.35) 0, transparent 45%), radial-gradient(circle at 90% 80%, rgba(246,231,188,0.20) 0, transparent 45%)',
            }}
          />
          <div className="relative">
            <h2 className="text-2xl sm:text-4xl font-black mb-2">
              Ready to <span className="text-cyan">level up</span>?
            </h2>
            <p className="text-sm sm:text-base text-white/80 mb-6 max-w-xl mx-auto">
              Explore the full library and find your next learning adventure.
            </p>
            <Link
              href="/student"
              className="inline-block bg-cream text-navy font-bold px-7 py-3.5 rounded-full hover:scale-105 hover:shadow-xl hover:shadow-cyan/30 transition no-underline"
            >
              Browse all courses
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-navy tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-teal mt-1 font-medium">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function HScroll({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-4 sm:mx-0">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-2 scrollbar-hide">
        {children}
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3.5 border border-white/20 hover:border-cyan/50 transition">
      <p className={`text-2xl sm:text-3xl font-black ${accent}`}>{value}</p>
      <p className="text-[10px] sm:text-xs text-white/70 mt-0.5 uppercase tracking-widest font-semibold">{label}</p>
    </div>
  );
}

function categoryColor(i: number) {
  const colors = [
    'bg-gradient-to-br from-navy to-teal',
    'bg-gradient-to-br from-teal to-cyan',
    'bg-gradient-to-br from-cyan to-teal',
    'bg-gradient-to-br from-navy-light to-navy',
    'bg-gradient-to-br from-navy to-cyan',
    'bg-gradient-to-br from-teal to-navy-light',
    'bg-gradient-to-br from-cyan-light to-teal',
    'bg-gradient-to-br from-navy to-teal-light',
  ];
  return colors[i % colors.length];
}

function courseCover(i: number) {
  const covers = [
    'bg-gradient-to-br from-navy via-teal to-cyan',
    'bg-gradient-to-br from-teal via-cyan to-teal-light',
    'bg-gradient-to-br from-navy-light via-navy to-teal',
    'bg-gradient-to-br from-cyan via-teal to-navy',
    'bg-gradient-to-br from-navy to-cyan-light',
    'bg-gradient-to-br from-teal-light via-teal to-navy',
    'bg-gradient-to-br from-navy via-navy-light to-teal',
    'bg-gradient-to-br from-cyan to-navy',
  ];
  return covers[i % covers.length];
}

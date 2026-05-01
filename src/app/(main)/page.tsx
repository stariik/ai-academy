'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Lesson, Course, LessonProgress } from '@/types';
import { useSession } from '@/hooks/useSession';
import { CATEGORIES } from '@/lib/constants/categories';

export default function Home() {
  const { sessionId } = useSession();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const [lessonsRes, coursesRes, progressRes] = await Promise.all([
          fetch('/api/lessons?status=published'),
          fetch('/api/courses'),
          fetch('/api/progress'),
        ]);
        const [lessonsData, coursesData, progressData] = await Promise.all([
          lessonsRes.json(),
          coursesRes.json(),
          progressRes.json(),
        ]);
        setLessons(Array.isArray(lessonsData) ? lessonsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setProgress(Array.isArray(progressData) ? progressData : []);
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
        .slice(0, 8),
    [lessons, progressById]
  );

  const filteredCourses = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [query, courses]);

  const categoryRails = useMemo(() => {
    const categoryNames = new Set<string>();
    CATEGORIES.forEach((category) => categoryNames.add(category));
    courses.forEach((course) => getCourseCategories(course).forEach((category) => categoryNames.add(category)));

    return Array.from(categoryNames)
      .map((category) => ({
        category,
        courses: courses.filter((course) => getCourseCategories(course).includes(category)),
      }))
      .filter((rail) => rail.courses.length > 0);
  }, [courses]);

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
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(10,196,224,0.35) 0, transparent 45%), radial-gradient(circle at 85% 70%, rgba(9,146,194,0.35) 0, transparent 45%), radial-gradient(circle at 50% 100%, rgba(246,231,188,0.15) 0, transparent 50%)',
          }}
        />
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
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.1] mb-4 max-w-3xl">
            ისწავლე <span className="text-cream">უსაზღვროდ.</span>
          </h1>
          <p className="text-base sm:text-xl text-white/75 max-w-2xl mb-8 leading-relaxed">
            პერსონალიზებული, AI-ზე დაფუძნებული კურსები, რომლებიც შენს სწავლის სტილს ერგება.
          </p>

          {/* Live search */}
          <div className="relative max-w-2xl">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="მოძებნე კურსი…"
              className="w-full rounded-full bg-white text-navy placeholder:text-navy-100 pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base shadow-2xl shadow-black/30 focus:outline-none focus:ring-4 focus:ring-cyan/50"
              aria-label="კურსის ძებნა"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* CONTINUE LEARNING — hidden while searching */}
        {!query.trim() && inProgressLessons.length > 0 && (
          <Section
            title="განაგრძე სწავლა"
            subtitle="დაბრუნდი იქ, სადაც გაჩერდი"
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
                      მიმდინარე
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
                      {lessonProgressPct(l.id)}% დასრულებული
                    </p>
                  </div>
                </Link>
              ))}
            </HScroll>
          </Section>
        )}

        {/* COURSES */}
        <Section
          title={query.trim() ? 'ძებნის შედეგი' : 'კურსები'}
          subtitle={query.trim() ? `ნაპოვნია ${filteredCourses.length} კურსი` : 'აირჩიე კურსი და დაიწყე სწავლა'}
          action={
            !query.trim() && courses.length > 8 ? (
              <Link href="/courses" className="text-sm font-bold text-teal hover:text-navy transition">
                ყველა კურსი →
              </Link>
            ) : null
          }
        >
          {filteredCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cyan-50">
              <p className="text-base font-bold text-navy mb-1">
                {query.trim() ? 'კურსი ვერ მოიძებნა' : 'კურსები ჯერ არ არის'}
              </p>
              <p className="text-sm text-navy-100">
                {query.trim() ? 'სცადე სხვა საძიებო სიტყვა.' : 'კურსები მალე გამოჩნდება.'}
              </p>
            </div>
          ) : !query.trim() && categoryRails.length > 0 ? (
            <div className="space-y-8">
              {categoryRails.map((rail) => (
                <CategoryCourseRail
                  key={rail.category}
                  title={rail.category}
                  courses={rail.courses}
                  courseProgress={courseProgress}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredCourses.map((c, i) => {
                const { pct, done, total } = courseProgress(c.id);
                return (
                  <CourseCard
                    key={c.id}
                    course={c}
                    coverIndex={i}
                    pct={pct}
                    done={done}
                    total={total}
                  />
                );
              })}
            </div>
          )}
        </Section>
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

function CategoryCourseRail({
  title,
  courses,
  courseProgress,
}: {
  title: string;
  courses: Course[];
  courseProgress: (courseId: string) => { pct: number; done: number; total: number };
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollRail = (direction: 'left' | 'right') => {
    railRef.current?.scrollBy({
      left: direction === 'left' ? -340 : 340,
      behavior: 'smooth',
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-base sm:text-xl font-black text-navy truncate">{title}</h3>
          <p className="text-xs sm:text-sm text-teal font-medium">
            {courses.length} კურსი
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollRail('left')}
            className="h-9 w-9 rounded-full border border-cyan-50 bg-white text-navy hover:border-cyan hover:text-teal transition flex items-center justify-center"
            aria-label="წინა კურსები"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollRail('right')}
            className="h-9 w-9 rounded-full border border-cyan-50 bg-white text-navy hover:border-cyan hover:text-teal transition flex items-center justify-center"
            aria-label="შემდეგი კურსები"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="-mx-4 sm:mx-0">
        <div
          ref={railRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4 sm:px-0 pb-3 scrollbar-hide scroll-smooth"
        >
          {courses.map((course, index) => {
            const { pct, done, total } = courseProgress(course.id);
            return (
              <CourseCard
                key={course.id}
                course={course}
                coverIndex={index}
                pct={pct}
                done={done}
                total={total}
                className="snap-start flex-shrink-0 w-72 sm:w-80"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CourseCard({
  course,
  coverIndex,
  pct,
  done,
  total,
  className = '',
}: {
  course: Course;
  coverIndex: number;
  pct: number;
  done: number;
  total: number;
  className?: string;
}) {
  return (
    <Link
      href={`/courses/${course.id}`}
      className={`group bg-white rounded-2xl border border-cyan-50 hover:shadow-2xl hover:shadow-navy/15 hover:-translate-y-1 hover:border-cyan transition-all overflow-hidden flex flex-col ${className}`}
    >
      <div className={`h-32 relative ${courseCover(coverIndex)}`}>
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 30%, #F6E7BC 0, transparent 60%)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-cream text-5xl font-black drop-shadow-lg">
            {course.title.charAt(0)}
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
          {course.title}
        </h3>
        {course.description && (
          <p className="text-xs text-navy-100 line-clamp-2 mt-1">{course.description}</p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between gap-3 text-[11px]">
          <span className="text-navy-100 font-medium">{total} გაკვეთილი</span>
          {pct > 0 ? (
            <span className="font-bold text-teal whitespace-nowrap">{done}/{total} დასრულდა</span>
          ) : (
            <span className="font-bold bg-cream text-navy px-2 py-0.5 rounded-full">ახალი</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function getCourseCategories(course: Course) {
  if (course.tags?.length) return course.tags;

  const title = course.title.toLowerCase();
  const matches = [
    {
      category: CATEGORIES[5],
      keywords: ['ages', 'kids', 'children', 'storytelling'],
    },
    {
      category: CATEGORIES[6],
      keywords: ['creative', 'image', 'design', 'figma', 'music', 'audio', 'canva', 'firefly', 'ui ux'],
    },
    {
      category: CATEGORIES[4],
      keywords: ['coding', 'code', 'frontend', 'backend', 'database', 'api', 'server'],
    },
    {
      category: CATEGORIES[2],
      keywords: ['marketing', 'ads', 'seo', 'email', 'copywriting', 'social media', 'landing page'],
    },
    {
      category: CATEGORIES[1],
      keywords: ['prompt', 'prompting'],
    },
    {
      category: CATEGORIES[7],
      keywords: ['agent', 'chatbot'],
    },
    {
      category: CATEGORIES[0],
      keywords: ['what is ai', 'ai in everyday', 'machine learning', 'deep learning', 'ai tools', 'fundamentals'],
    },
  ];

  return [matches.find(({ keywords }) => keywords.some((keyword) => title.includes(keyword)))?.category ?? CATEGORIES[0]];
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

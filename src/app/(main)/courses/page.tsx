'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import type { Course, Lesson, LessonProgress } from '@/types';

type Difficulty = 'beginner' | 'intermediate' | 'advanced';
type SortKey = 'newest' | 'popular' | 'title' | 'duration';
type DurationBucket = 'short' | 'medium' | 'long';

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'დამწყები',
  intermediate: 'საშუალო',
  advanced: 'რთული',
};

const DURATION_LABELS: Record<DurationBucket, string> = {
  short: '< 1 საათი',
  medium: '1–3 საათი',
  long: '3+ საათი',
};

function CoursesPageInner() {
  const searchParams = useSearchParams();
  const { sessionId } = useSession();

  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    new Set(searchParams.get('cat') ? [searchParams.get('cat')!] : [])
  );
  const [selectedDiffs, setSelectedDiffs] = useState<Set<Difficulty>>(new Set());
  const [selectedDurations, setSelectedDurations] = useState<Set<DurationBucket>>(new Set());
  const [sort, setSort] = useState<SortKey>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [cRes, lRes, pRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/lessons?status=published'),
          fetch('/api/progress'),
        ]);
        const [cData, lData, pData] = await Promise.all([cRes.json(), lRes.json(), pRes.json()]);
        setCourses(Array.isArray(cData) ? cData : []);
        setLessons(Array.isArray(lData) ? lData : []);
        setProgress(Array.isArray(pData) ? pData : []);
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

  const courseMeta = useMemo(() => {
    const map = new Map<
      string,
      { total: number; done: number; durationMin: number; difficulty: Difficulty | null }
    >();
    courses.forEach((c) => {
      const cLessons = lessons.filter((l) => l.courseId === c.id);
      const total = cLessons.length;
      const done = cLessons.filter((l) => progressById.get(l.id)?.status === 'completed').length;
      const durationMin = cLessons.reduce((s, l) => s + (l.estimatedDurationMinutes || 0), 0);
      // Most common difficulty
      const diffCount: Record<string, number> = {};
      cLessons.forEach((l) => (diffCount[l.difficulty] = (diffCount[l.difficulty] || 0) + 1));
      const difficulty = (Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0]?.[0] as Difficulty) || null;
      map.set(c.id, { total, done, durationMin, difficulty });
    });
    return map;
  }, [courses, lessons, progressById]);

  const allCategories = useMemo(() => {
    const counts = new Map<string, number>();
    courses.forEach((c) => (c.tags || []).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [courses]);

  const durationBucket = (min: number): DurationBucket => {
    if (min < 60) return 'short';
    if (min < 180) return 'medium';
    return 'long';
  };

  const filtered = useMemo(() => {
    let list = [...courses];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedCats.size > 0) {
      list = list.filter((c) => c.tags?.some((t) => selectedCats.has(t)));
    }
    if (selectedDiffs.size > 0) {
      list = list.filter((c) => {
        const d = courseMeta.get(c.id)?.difficulty;
        return d && selectedDiffs.has(d);
      });
    }
    if (selectedDurations.size > 0) {
      list = list.filter((c) => {
        const min = courseMeta.get(c.id)?.durationMin || 0;
        return selectedDurations.has(durationBucket(min));
      });
    }

    switch (sort) {
      case 'title':
        list.sort((a, b) => a.title.localeCompare(b.title, 'ka'));
        break;
      case 'duration':
        list.sort((a, b) => (courseMeta.get(b.id)?.durationMin || 0) - (courseMeta.get(a.id)?.durationMin || 0));
        break;
      case 'popular':
        list.sort((a, b) => (courseMeta.get(b.id)?.total || 0) - (courseMeta.get(a.id)?.total || 0));
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [courses, courseMeta, query, selectedCats, selectedDiffs, selectedDurations, sort]);

  const toggle = <T,>(set: Set<T>, setter: (s: Set<T>) => void, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };

  const clearAll = () => {
    setSelectedCats(new Set());
    setSelectedDiffs(new Set());
    setSelectedDurations(new Set());
    setQuery('');
  };

  const activeFilterCount = selectedCats.size + selectedDiffs.size + selectedDurations.size;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  const Filters = (
    <>
      <FilterGroup title="კატეგორიები">
        {allCategories.length === 0 ? (
          <p className="text-xs text-navy-100">კატეგორიები არ არის</p>
        ) : (
          <div className="space-y-2">
            {allCategories.map((c) => (
              <Checkbox
                key={c.name}
                label={`${c.name} (${c.count})`}
                checked={selectedCats.has(c.name)}
                onChange={() => toggle(selectedCats, setSelectedCats, c.name)}
              />
            ))}
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="სირთულე">
        <div className="space-y-2">
          {(['beginner', 'intermediate', 'advanced'] as Difficulty[]).map((d) => (
            <Checkbox
              key={d}
              label={DIFFICULTY_LABELS[d]}
              checked={selectedDiffs.has(d)}
              onChange={() => toggle(selectedDiffs, setSelectedDiffs, d)}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="ხანგრძლივობა">
        <div className="space-y-2">
          {(['short', 'medium', 'long'] as DurationBucket[]).map((d) => (
            <Checkbox
              key={d}
              label={DURATION_LABELS[d]}
              checked={selectedDurations.has(d)}
              onChange={() => toggle(selectedDurations, setSelectedDurations, d)}
            />
          ))}
        </div>
      </FilterGroup>
    </>
  );

  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Header + search */}
      <section className="bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">ყველა კურსი</h1>
          <p className="text-sm sm:text-base text-white/70 mt-2">
            იპოვე შენთვის შესაფერისი კურსი
          </p>

          <div className="mt-6 relative max-w-2xl">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="მოძებნე კურსი…"
              className="w-full rounded-full bg-white text-navy placeholder:text-navy-100 pl-12 pr-4 py-3 text-sm shadow-xl focus:outline-none focus:ring-4 focus:ring-cyan/40"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Mobile filters toggle + sort */}
        <div className="flex items-center justify-between mb-5 gap-3">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 bg-white border border-cyan-50 rounded-full px-4 py-2.5 text-sm font-bold text-navy hover:border-cyan transition"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            ფილტრები
            {activeFilterCount > 0 && (
              <span className="bg-teal text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="hidden lg:block text-sm text-navy-100 font-medium">
            ნაპოვნია <span className="text-navy font-bold">{filtered.length}</span> კურსი
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-white border border-cyan-50 rounded-full px-4 py-2.5 text-sm font-bold text-navy hover:border-cyan focus:outline-none focus:ring-4 focus:ring-cyan/20 cursor-pointer"
          >
            <option value="newest">ახალი</option>
            <option value="popular">პოპულარული</option>
            <option value="title">სათაური (ა–ჰ)</option>
            <option value="duration">ხანგრძლივობა</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
          {/* Desktop filter sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-white rounded-2xl border border-cyan-50 p-5 sticky top-20">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-black text-navy">ფილტრები</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs font-bold text-teal hover:text-navy transition"
                  >
                    გასუფთავება
                  </button>
                )}
              </div>
              {Filters}
            </div>
          </aside>

          {/* Results */}
          <div>
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-cyan-50">
                <p className="text-lg font-bold text-navy mb-1">კურსი ვერ მოიძებნა</p>
                <p className="text-sm text-navy-100 mb-4">სცადე სხვა ფილტრი ან საძიებო სიტყვა</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-sm font-bold text-teal hover:text-navy transition"
                  >
                    ფილტრების გასუფთავება
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((c, i) => {
                  const meta = courseMeta.get(c.id);
                  const pct = meta && meta.total > 0 ? Math.round((meta.done / meta.total) * 100) : 0;
                  return (
                    <Link
                      key={c.id}
                      href={`/courses/${c.id}`}
                      className="group bg-white rounded-2xl border border-cyan-50 hover:shadow-2xl hover:shadow-navy/15 hover:-translate-y-1 hover:border-cyan transition-all overflow-hidden flex flex-col"
                    >
                      <div className={`h-36 relative ${courseCover(i)}`}>
                        <div
                          className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: 'radial-gradient(circle at 70% 30%, #F6E7BC 0, transparent 60%)',
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-cream text-5xl font-black drop-shadow-lg">
                            {c.title.charAt(0)}
                          </span>
                        </div>
                        {meta?.difficulty && (
                          <span className="absolute top-3 left-3 text-[10px] bg-white/95 text-navy px-2.5 py-1 rounded-full font-bold uppercase tracking-wide shadow-md">
                            {DIFFICULTY_LABELS[meta.difficulty]}
                          </span>
                        )}
                        {pct > 0 && (
                          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/25">
                            <div className="h-full bg-cream" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-bold text-navy line-clamp-2 group-hover:text-teal">
                          {c.title}
                        </h3>
                        {c.description && (
                          <p className="text-xs text-navy-100 line-clamp-2 mt-1">{c.description}</p>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between text-[11px]">
                          <span className="text-navy-100 font-medium">
                            {meta?.total || 0} გაკვეთილი ·{' '}
                            {meta?.durationMin
                              ? meta.durationMin >= 60
                                ? `${Math.round(meta.durationMin / 60)} სთ`
                                : `${meta.durationMin} წთ`
                              : '—'}
                          </span>
                          {pct > 0 ? (
                            <span className="font-bold text-teal">{pct}%</span>
                          ) : (
                            <span className="font-bold bg-cream text-navy px-2 py-0.5 rounded-full">ახალი</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-80 max-w-[85vw] bg-white h-full overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-black text-navy text-lg">ფილტრები</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-cyan-50 transition"
                aria-label="დახურვა"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {Filters}
            <div className="flex gap-2 mt-6 sticky bottom-0 bg-white pt-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAll}
                  className="flex-1 rounded-full border-2 border-cyan-50 text-navy font-bold py-3 text-sm"
                >
                  გასუფთავება
                </button>
              )}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-[2] rounded-full bg-gradient-to-r from-teal to-cyan text-white font-bold py-3 text-sm"
              >
                {filtered.length} კურსის ნახვა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0 pb-5 last:pb-0 border-b last:border-0 border-cyan-50">
      <h3 className="text-xs font-black uppercase tracking-wider text-teal mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <span
        className={`h-4 w-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
          checked ? 'bg-teal border-teal' : 'bg-white border-cyan-50 group-hover:border-cyan'
        }`}
      >
        {checked && (
          <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span className="text-sm text-navy group-hover:text-teal transition">{label}</span>
    </label>
  );
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

export default function CoursesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
        </div>
      }
    >
      <CoursesPageInner />
    </Suspense>
  );
}

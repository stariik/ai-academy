// ============================================================
// /v2 storefront — derives Category[] / Course[] / CourseDetail
// from the real `courses` and `lessons` Supabase tables.
// Visual fields (icon, tone, audience, English name, tagline) come from
// the static CATEGORY_VISUALS map in `./data.ts`.
// All returned strings are already-localized — components do not pick.
// ============================================================

import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { createClient as createAnonClient } from '@supabase/supabase-js';
import {
  getAllCourses,
  getAllLessonsLite,
  getCategoryMeta,
  type CategoryImage,
  type LessonLite,
} from '@/lib/supabase/db';
import { CATEGORIES as CANONICAL_CATEGORIES } from '@/lib/constants/categories';
import {
  CATEGORY_VISUALS,
  pickLocale,
  getCategoryDisplay,
} from './data';
import type {
  Category,
  Course,
  CourseDetail,
  Level,
  Module,
  Lesson as V2Lesson,
} from './data';
import { getDict, type Locale } from './i18n';
import type { Course as RealCourse } from '@/types';

// The storefront only needs the lightweight lesson shape (counts, titles,
// durations) — never content blocks or quiz questions.
type RealLesson = LessonLite;

function firstCanonicalTag(tags: string[]): string | null {
  for (const tag of tags) {
    if (CATEGORY_VISUALS[tag]) return tag;
  }
  return null;
}

function inferLevel(lessons: RealLesson[]): Level {
  if (lessons.length === 0) return 'beginner';
  const counts: Record<Level, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const l of lessons) counts[l.difficulty] = (counts[l.difficulty] ?? 0) + 1;
  let top: Level = 'beginner';
  let max = -1;
  for (const k of Object.keys(counts) as Level[]) {
    if (counts[k] > max) {
      max = counts[k];
      top = k;
    }
  }
  return top;
}

function totalMinutes(lessons: RealLesson[]): number {
  return lessons.reduce((sum, l) => sum + (l.estimatedDurationMinutes ?? 0), 0);
}

function buildCategory(
  nameKa: string,
  locale: Locale,
  coursesInCat: RealCourse[],
  lessonsByCourse: Map<string, RealLesson[]>,
  categoryMeta: Record<string, CategoryImage>,
): Category {
  const visual = CATEGORY_VISUALS[nameKa];
  const display = getCategoryDisplay(nameKa, locale);
  const meta = categoryMeta[visual.slug];
  const totalLessons = coursesInCat.reduce(
    (sum, co) => sum + (lessonsByCourse.get(co.id)?.length ?? 0),
    0,
  );
  return {
    id: visual.slug,
    name: display.name,
    tagline: display.tagline,
    nameKa,
    audience: visual.audience,
    courses: coursesInCat.length,
    lessons: totalLessons,
    // Admin-set bundle price override (₾); when absent the storefront
    // falls back to its derived bundle pricing.
    price: meta?.bundlePriceCents != null ? meta.bundlePriceCents / 100 : undefined,
    retailPrice: meta?.bundleRetailCents != null ? meta.bundleRetailCents / 100 : undefined,
    icon: visual.icon,
    tone: visual.tone,
    imageUrl: meta?.imageUrl ?? null,
  };
}

function buildCourse(
  real: RealCourse,
  locale: Locale,
  lessonsForCourse: RealLesson[],
): Course | null {
  const tag = firstCanonicalTag(real.tags ?? []);
  if (!tag) return null;
  const visual = CATEGORY_VISUALS[tag];
  return {
    id: real.id,
    title: pickLocale(locale, real.title, real.titleEn ?? undefined),
    description: pickLocale(locale, real.description, real.descriptionEn ?? undefined),
    categoryId: visual.slug,
    audience: visual.audience,
    lessons: lessonsForCourse.length,
    hours: Math.max(1, Math.round(totalMinutes(lessonsForCourse) / 60)),
    price: real.priceCents != null ? real.priceCents / 100 : undefined,
    retailPrice:
      real.retailPriceCents != null ? real.retailPriceCents / 100 : undefined,
    level: inferLevel(lessonsForCourse),
    icon: visual.icon,
  };
}

// The public catalog (courses, lessons, category meta) is identical for every
// visitor, so we fetch it with a cookieless anon client and cache the result
// across requests in the Next data cache. That removes 3 DB round-trips from
// every storefront page render while the cache is warm.
//
// unstable_cache serializes its return, so it can't hand back a Map — it returns
// plain arrays and loadAll() builds the per-course index on top (React cache()
// dedupes that within a single render).
//
// revalidate: 300s window; admin writes to courses/pricing can call
// revalidateTag('catalog') to bust it immediately (not wired yet).
const loadCatalog = unstable_cache(
  async () => {
    const supabase = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const [courses, lessons, categoryMeta] = await Promise.all([
      getAllCourses(supabase),
      getAllLessonsLite(supabase, { status: 'published' }),
      getCategoryMeta(supabase),
    ]);
    return { courses, lessons, categoryMeta };
  },
  ['v2-catalog'],
  { revalidate: 300, tags: ['catalog'] },
);

const loadAll = cache(async () => {
  const { courses, lessons, categoryMeta } = await loadCatalog();
  const lessonsByCourse = new Map<string, RealLesson[]>();
  for (const l of lessons) {
    if (!l.courseId) continue;
    const arr = lessonsByCourse.get(l.courseId) ?? [];
    arr.push(l);
    lessonsByCourse.set(l.courseId, arr);
  }
  return { courses, lessons, lessonsByCourse, categoryMeta };
});

export async function getCategories(locale: Locale): Promise<Category[]> {
  const { courses, lessonsByCourse, categoryMeta } = await loadAll();

  // Group real courses by their first canonical tag.
  const byTag = new Map<string, RealCourse[]>();
  for (const co of courses) {
    const tag = firstCanonicalTag(co.tags ?? []);
    if (!tag) continue;
    const arr = byTag.get(tag) ?? [];
    arr.push(co);
    byTag.set(tag, arr);
  }

  // Emit one Category per canonical name, in the canonical order.
  return CANONICAL_CATEGORIES.map((nameKa) =>
    buildCategory(nameKa, locale, byTag.get(nameKa) ?? [], lessonsByCourse, categoryMeta),
  );
}

export async function getCourses(locale: Locale): Promise<Course[]> {
  const { courses, lessonsByCourse } = await loadAll();
  return courses
    .map((co) => buildCourse(co, locale, lessonsByCourse.get(co.id) ?? []))
    .filter((c): c is Course => c !== null);
}

export type LessonMetadata = {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
};

export async function getLessonMetadata(
  id: string,
  locale: Locale,
): Promise<LessonMetadata | null> {
  const { courses, lessons } = await loadAll();
  const lesson = lessons.find((item) => item.id === id);
  if (!lesson?.courseId) return null;
  const course = courses.find((item) => item.id === lesson.courseId);
  if (!course) return null;
  const title = pickLocale(locale, lesson.title, lesson.titleEn ?? undefined);
  const courseTitle = pickLocale(locale, course.title, course.titleEn ?? undefined);
  return {
    id: lesson.id,
    title,
    description:
      locale === 'en'
        ? lesson.descriptionEn?.trim() ||
          `Learn ${title} in the ${courseTitle} course on walle.academy.`
        : lesson.description,
    courseId: course.id,
    courseTitle,
  };
}

export type V2CoursePayload = {
  course: Course;
  category: Category;
  detail: CourseDetail;
  related: Course[];
};

/**
 * The one genuinely free lesson on the platform — the opening lesson of
 * "AI ინსტრუმენტები პრაქტიკაში: ChatGPT, Claude და Gemini". It is the only
 * lesson a signed-out visitor may open.
 *
 * Every other course's first lesson still *presents* as startable in the
 * curriculum (see LessonCard's `isTeaser`), but clicking it opens the purchase
 * rail instead of the lesson, and the server guards reject it outright.
 *
 * ponytail: one hardcoded id beats a schema change for a single row. Promote
 * this to a `lessons.is_free` column the moment a second free lesson is wanted.
 */
export const FREE_LESSON_ID = 'lesson_1776730632601_t3jqpim';

function lessonsAsModule(
  courseSlug: string,
  locale: Locale,
  lessons: RealLesson[],
): Module[] {
  if (lessons.length === 0) return [];
  const dict = getDict(locale);
  const sorted = [...lessons].sort(
    (a, b) => (a.positionInCourse ?? 0) - (b.positionInCourse ?? 0),
  );
  const moduleLessons: V2Lesson[] = sorted.map((l, idx) => ({
    id: l.id,
    numberLabel: (idx + 1).toString().padStart(2, '0'),
    title: pickLocale(locale, l.title, l.titleEn ?? undefined),
    durationMin: l.estimatedDurationMinutes ?? 15,
    isFree: l.id === FREE_LESSON_ID,
    description: pickLocale(locale, l.description, l.descriptionEn ?? undefined),
  }));
  return [
    {
      id: `${courseSlug}-curriculum`,
      title: dict.courseDetail.curriculumEyebrow,
      tagline: dict.courseDetail.curriculumTitle,
      lessons: moduleLessons,
    },
  ];
}

function deriveOutcomes(
  locale: Locale,
  lessons: RealLesson[],
): { title: string; description: string }[] {
  const objectives = lessons
    .flatMap((l) =>
      pickLocale(locale, l.learningObjectives, l.learningObjectivesEn ?? undefined) ?? [],
    )
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 4);
  return objectives.map((o) => ({ title: o, description: '' }));
}

export async function getCoursePayload(
  slug: string,
  locale: Locale,
): Promise<V2CoursePayload | null> {
  const { courses, lessonsByCourse, categoryMeta } = await loadAll();
  const real = courses.find((c) => c.id === slug);
  if (!real) return null;

  const tag = firstCanonicalTag(real.tags ?? []);
  if (!tag) return null;

  const courseLessons = lessonsByCourse.get(real.id) ?? [];
  const course = buildCourse(real, locale, courseLessons);
  if (!course) return null;

  const sameCatCourses = courses.filter(
    (c) => c.id !== real.id && firstCanonicalTag(c.tags ?? []) === tag,
  );
  const related = sameCatCourses
    .map((c) => buildCourse(c, locale, lessonsByCourse.get(c.id) ?? []))
    .filter((c): c is Course => c !== null)
    .slice(0, 4);

  const category = buildCategory(
    tag,
    locale,
    courses.filter((c) => firstCanonicalTag(c.tags ?? []) === tag),
    lessonsByCourse,
    categoryMeta,
  );

  const dict = getDict(locale);
  const isEn = locale === 'en';

  const detail: CourseDetail = {
    tagline: category.tagline,
    longDescription: course.description ?? '',
    walleQuote: isEn
      ? 'I am your tutor for this course. No rush — your pace runs the show. If something is unclear, tap "Explain more simply" and we start over, a different way.'
      : 'მე ვიქნები შენი მასწავლებელი ამ კურსში. არ ვჩქარობ — შენი ტემპი მართავს. თუ რამე გაუგებარია, ვაჭერთ "ახსენი უფრო მარტივად" და ვიწყებთ თავიდან, ახლებურად.',
    outcomes: deriveOutcomes(locale, courseLessons),
    prerequisites: [
      course.level === 'advanced'
        ? isEn
          ? 'Prior hands-on experience with AI'
          : 'წინასწარი გამოცდილება AI-სთან'
        : course.level === 'intermediate'
          ? isEn
            ? 'Familiarity with an AI tool'
            : 'AI-ხელსაწყოს ძირითადი გაცნობა'
          : isEn
            ? 'None — we start from zero'
            : 'არანაირი — დავიწყებთ ნულიდან',
    ],
    whatsIncluded: isEn
      ? [
          `${course.lessons} lessons — lifetime access`,
          'AI tutor 24/7 — Walle never tires',
          'Practical exercises after every lesson',
          'Digital certificate upon completion',
        ]
      : [
          `${course.lessons} ${dict.courseDetail.lessonsLabel} — სამუდამო წვდომა`,
          'AI მასწავლებელი 24/7',
          'პრაქტიკული სავარჯიშოები ყოველი გაკვეთილის ბოლოს',
          'ციფრული სერთიფიკატი დასრულების შემდეგ',
        ],
    modules: lessonsAsModule(real.id, locale, courseLessons),
    retailPrice:
      real.retailPriceCents != null ? real.retailPriceCents / 100 : undefined,
  };

  return { course, category, detail, related };
}

// ============================================================
// /v2 storefront — derives Category[] / Course[] / CourseDetail
// from the real `courses` and `lessons` Supabase tables.
// Visual fields (icon, tone, audience, English name, tagline) come from
// the static CATEGORY_VISUALS map in `./data.ts`.
// ============================================================

import { createClient } from '@/lib/supabase/server';
import { getAllCourses, getAllLessons } from '@/lib/supabase/db';
import { CATEGORIES as CANONICAL_CATEGORIES } from '@/lib/constants/categories';
import { CATEGORY_VISUALS } from './data';
import type { Category, Course, CourseDetail, Level, Module, Lesson as V2Lesson } from './data';
import type { Course as RealCourse, Lesson as RealLesson } from '@/types';

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
  coursesInCat: RealCourse[],
  lessonsByCourse: Map<string, RealLesson[]>,
): Category {
  const visual = CATEGORY_VISUALS[nameKa];
  const totalLessons = coursesInCat.reduce(
    (sum, co) => sum + (lessonsByCourse.get(co.id)?.length ?? 0),
    0,
  );
  return {
    id: visual.slug,
    nameKa,
    nameEn: visual.nameEn,
    taglineKa: visual.taglineKa,
    audience: visual.audience,
    courses: coursesInCat.length,
    lessons: totalLessons,
    icon: visual.icon,
    tone: visual.tone,
  };
}

function buildCourse(
  real: RealCourse,
  lessonsForCourse: RealLesson[],
): Course | null {
  const tag = firstCanonicalTag(real.tags ?? []);
  if (!tag) return null;
  const visual = CATEGORY_VISUALS[tag];
  return {
    id: real.id,
    titleKa: real.title,
    description: real.description,
    categoryId: visual.slug,
    audience: visual.audience,
    lessons: lessonsForCourse.length,
    hours: Math.max(1, Math.round(totalMinutes(lessonsForCourse) / 60)),
    level: inferLevel(lessonsForCourse),
    icon: visual.icon,
  };
}

async function loadAll() {
  const supabase = await createClient();
  const [courses, lessons] = await Promise.all([
    getAllCourses(supabase),
    getAllLessons(supabase, { status: 'published' }),
  ]);
  const lessonsByCourse = new Map<string, RealLesson[]>();
  for (const l of lessons) {
    if (!l.courseId) continue;
    const arr = lessonsByCourse.get(l.courseId) ?? [];
    arr.push(l);
    lessonsByCourse.set(l.courseId, arr);
  }
  return { courses, lessons, lessonsByCourse };
}

export async function getCategories(): Promise<Category[]> {
  const { courses, lessonsByCourse } = await loadAll();

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
    buildCategory(nameKa, byTag.get(nameKa) ?? [], lessonsByCourse),
  );
}

export async function getCourses(): Promise<Course[]> {
  const { courses, lessonsByCourse } = await loadAll();
  return courses
    .map((co) => buildCourse(co, lessonsByCourse.get(co.id) ?? []))
    .filter((c): c is Course => c !== null);
}

export type V2CoursePayload = {
  course: Course;
  category: Category;
  detail: CourseDetail;
  related: Course[];
};

function lessonsAsModule(courseSlug: string, lessons: RealLesson[]): Module[] {
  if (lessons.length === 0) return [];
  const sorted = [...lessons].sort(
    (a, b) => (a.positionInCourse ?? 0) - (b.positionInCourse ?? 0),
  );
  const moduleLessons: V2Lesson[] = sorted.map((l, idx) => ({
    id: l.id,
    numberLabel: (idx + 1).toString().padStart(2, '0'),
    titleKa: l.title,
    durationMin: l.estimatedDurationMinutes ?? 15,
    isFree: idx === 0,
    descriptionKa: l.description || '',
  }));
  return [
    {
      id: `${courseSlug}-curriculum`,
      titleKa: 'კურიკულუმი',
      taglineKa: 'ყველა გაკვეთილი ამ კურსში — შენი ტემპით.',
      lessons: moduleLessons,
    },
  ];
}

function deriveOutcomes(lessons: RealLesson[]): { titleKa: string; descriptionKa: string }[] {
  const objectives = lessons
    .flatMap((l) => l.learningObjectives ?? [])
    .filter((s) => typeof s === 'string' && s.trim().length > 0)
    .slice(0, 4);
  return objectives.map((o) => ({
    titleKa: o,
    descriptionKa: '',
  }));
}

export async function getCoursePayload(slug: string): Promise<V2CoursePayload | null> {
  const { courses, lessonsByCourse } = await loadAll();
  const real = courses.find((c) => c.id === slug);
  if (!real) return null;

  const tag = firstCanonicalTag(real.tags ?? []);
  if (!tag) return null;
  const visual = CATEGORY_VISUALS[tag];

  const courseLessons = lessonsByCourse.get(real.id) ?? [];
  const course = buildCourse(real, courseLessons);
  if (!course) return null;

  const sameCatCourses = courses.filter(
    (c) => c.id !== real.id && firstCanonicalTag(c.tags ?? []) === tag,
  );
  const related = sameCatCourses
    .map((c) => buildCourse(c, lessonsByCourse.get(c.id) ?? []))
    .filter((c): c is Course => c !== null)
    .slice(0, 4);

  const category = buildCategory(
    tag,
    courses.filter((c) => firstCanonicalTag(c.tags ?? []) === tag),
    lessonsByCourse,
  );

  const detail: CourseDetail = {
    taglineKa: visual.taglineKa,
    longDescriptionKa: real.description || '',
    walliQuoteKa:
      'მე ვიქნები შენი მასწავლებელი ამ კურსში. არ ვჩქარობ — შენი ტემპი მართავს. თუ რამე გაუგებარია, ვაჭერთ "ახსენი უფრო მარტივად" და ვიწყებთ თავიდან, ახლებურად.',
    outcomesKa: deriveOutcomes(courseLessons),
    prerequisitesKa: [
      course.level === 'advanced'
        ? 'წინასწარი გამოცდილება AI-სთან'
        : course.level === 'intermediate'
          ? 'AI-ხელსაწყოს ძირითადი გაცნობა'
          : 'არანაირი — დავიწყებთ ნულიდან',
    ],
    whatsIncludedKa: [
      `${course.lessons} გაკვეთილი — სამუდამო წვდომა`,
      'AI მასწავლებელი 24/7 — Walli არ იღლება',
      'პრაქტიკული სავარჯიშოები ყოველი გაკვეთილის ბოლოს',
      'ციფრული სერთიფიკატი დასრულების შემდეგ',
    ],
    modules: lessonsAsModule(real.id, courseLessons),
  };

  return { course, category, detail, related };
}

/**
 * walle.academy — v2 shared types & display helpers
 *
 * Data comes from the existing `courses` + `lessons` Supabase tables (see
 * `./db.ts`). Categories are the 9 canonical strings in
 * `@/lib/constants/categories` — `courses.tags[]` is what assigns a course
 * to a category. Visual fields (icon, tone, audience, English name, tagline)
 * are not in the DB; they live in `CATEGORY_VISUALS` below as static design
 * conventions keyed by the Georgian category name.
 *
 * v2 is bilingual (ka | en). Display strings on the returned types are
 * already-localized at the fetch boundary — components do not need to pick.
 */

import type { Locale } from './i18n';

export type AudienceTag = 'kids' | 'teens' | 'adults' | 'everyone';
export type Tone = 'pulse' | 'heart' | 'amber' | 'violet' | 'indigo';
export type Level = 'beginner' | 'intermediate' | 'advanced';

export type Category = {
  id: string;            // slug derived from the canonical KA name
  name: string;          // localized display name
  tagline: string;       // localized tagline
  nameKa: string;        // canonical KA name (for matching against courses.tags[])
  audience: AudienceTag;
  courses: number;       // derived: # of real courses tagged with this category
  lessons: number;       // derived: # of published lessons across those courses
  price?: number;        // not in real data — kept optional for design
  retailPrice?: number;
  icon: string;
  tone: Tone;
};

export type Course = {
  id: string;            // uuid from courses.id
  title: string;         // localized
  description?: string;  // localized
  categoryId: string;    // slug of the first matching canonical category
  audience: AudienceTag; // inherited from category
  lessons: number;       // derived count
  hours: number;         // derived: ceil(sum(estimatedDurationMinutes) / 60)
  price?: number;        // not in real data
  level: Level;          // most common difficulty across lessons
  icon: string;          // inherited from category
};

export type Lesson = {
  id: string;
  numberLabel: string;
  title: string;
  durationMin: number;
  isFree?: boolean;
  description: string;
};

export type Module = {
  id: string;
  title: string;
  tagline: string;
  lessons: Lesson[];
};

export type Outcome = { title: string; description: string };

export type CourseDetail = {
  tagline: string;
  longDescription: string;
  outcomes: Outcome[];
  prerequisites: string[];
  whatsIncluded: string[];
  walliQuote: string;
  modules: Module[];     // real lessons grouped as a single module
  retailPrice?: number;
};

/* ============================================================
   Per-category visuals (static design conventions, not data)
   Keyed by canonical KA name from src/lib/constants/categories.ts.
   ============================================================ */

export type CategoryVisual = {
  slug: string;
  nameEn: string;
  taglineKa: string;
  taglineEn: string;
  icon: string;
  tone: Tone;
  audience: AudienceTag;
};

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  'AI საფუძვლები': {
    slug: 'ai-foundations',
    nameEn: 'AI Foundations',
    taglineKa: 'სად დავიწყოთ AI-სთან მუშაობა — ნულიდან მოყოლებული.',
    taglineEn: 'Where to start with AI — from zero up.',
    icon: '🧭',
    tone: 'pulse',
    audience: 'everyone',
  },
  'AI პრომპტის ინჟინერია': {
    slug: 'prompt-engineering',
    nameEn: 'Prompt Engineering',
    taglineKa: 'როგორ ვითხოვ AI-სგან ზუსტ შედეგს — ხელოვნება და მეცნიერება.',
    taglineEn: 'How to ask AI for precise results — art and science.',
    icon: '🎯',
    tone: 'indigo',
    audience: 'everyone',
  },
  'AI მარკეტინგი': {
    slug: 'ai-marketing',
    nameEn: 'AI Marketing',
    taglineKa: 'მარკეტინგი, შინაარსი, კამპანიები — AI-ის დახმარებით.',
    taglineEn: 'Marketing, content, and campaigns — with AI on your side.',
    icon: '📈',
    tone: 'heart',
    audience: 'adults',
  },
  'AI და კიბერუსაფრთხოება': {
    slug: 'ai-security',
    nameEn: 'AI & Cybersecurity',
    taglineKa: 'უსაფრთხო მუშაობა AI-ის ეპოქაში.',
    taglineEn: 'Working safely in the age of AI.',
    icon: '🛡️',
    tone: 'violet',
    audience: 'adults',
  },
  'AI კოდინგი და პროგრამირება': {
    slug: 'ai-coding',
    nameEn: 'AI Coding',
    taglineKa: 'შექმენი აპლიკაციები AI-სთან ერთად — Cursor, Claude Code.',
    taglineEn: 'Build apps alongside AI — Cursor, Claude Code.',
    icon: '⚡',
    tone: 'violet',
    audience: 'teens',
  },
  'AI ბავშვებისთვის': {
    slug: 'ai-for-kids',
    nameEn: 'AI for Kids',
    taglineKa: 'სათამაშო გაკვეთილები 6-12 წლის ბავშვებისთვის.',
    taglineEn: 'Playful lessons for kids 6-12.',
    icon: '🎈',
    tone: 'amber',
    audience: 'kids',
  },
  'AI შემოქმედებისთვის და დიზაინი': {
    slug: 'ai-creative',
    nameEn: 'AI for Creators',
    taglineKa: 'AI ხელოვნება, ვიდეო, მუსიკა — შენი იდეებისთვის.',
    taglineEn: 'AI art, video, music — for your ideas.',
    icon: '🎨',
    tone: 'heart',
    audience: 'everyone',
  },
  'AI აგენტები და ჩატბოტების არქიტექტურა': {
    slug: 'ai-agents',
    nameEn: 'AI Agents & Chatbots',
    taglineKa: 'ააწყვე საკუთარი AI აგენტი — არქიტექტურა და პრაქტიკა.',
    taglineEn: 'Build your own AI agent — architecture and practice.',
    icon: '🤖',
    tone: 'indigo',
    audience: 'adults',
  },
  'AI ბიზნეს-სტრატეგია და სამუშაო პროცესები': {
    slug: 'ai-business',
    nameEn: 'AI Business',
    taglineKa: 'AI ბიზნეს-პროცესებში — სტრატეგია, ROI, შესრულება.',
    taglineEn: 'AI in business processes — strategy, ROI, execution.',
    icon: '💼',
    tone: 'pulse',
    audience: 'adults',
  },
};

/* ============================================================
   Locale-aware helpers
   ============================================================ */

/** Pick the EN value when locale='en' and EN is non-empty; otherwise fall back to KA. */
export function pickLocale<T>(locale: Locale, ka: T, en: T | null | undefined): T {
  if (locale === 'en' && en !== null && en !== undefined && en !== '') return en;
  return ka;
}

/** Localized category display name from the canonical KA tag key. */
export function getCategoryDisplay(
  nameKa: string,
  locale: Locale,
): { name: string; tagline: string } {
  const visual = CATEGORY_VISUALS[nameKa];
  if (!visual) return { name: nameKa, tagline: '' };
  return {
    name: locale === 'en' ? visual.nameEn : nameKa,
    tagline: locale === 'en' ? visual.taglineEn : visual.taglineKa,
  };
}

/* ============================================================
   Tone classes — shared with /v2 landing & course detail
   ============================================================ */

export const TONE_CLASSES: Record<
  Tone,
  { iconBg: string; gradient: string; ring: string; text: string; bg: string; chip: string }
> = {
  pulse: {
    iconBg: 'bg-pulse/10',
    gradient: 'bg-gradient-to-br from-pulse/20 via-transparent to-transparent',
    ring: 'border-pulse/40',
    text: 'text-pulse',
    bg: 'bg-pulse',
    chip: 'bg-pulse/15 text-pulse border-pulse/30',
  },
  heart: {
    iconBg: 'bg-heart/10',
    gradient: 'bg-gradient-to-br from-heart/20 via-transparent to-transparent',
    ring: 'border-heart/40',
    text: 'text-heart',
    bg: 'bg-heart',
    chip: 'bg-heart/15 text-heart border-heart/30',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    gradient: 'bg-gradient-to-br from-amber-500/20 via-transparent to-transparent',
    ring: 'border-amber-500/40',
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500',
    chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    gradient: 'bg-gradient-to-br from-violet-500/20 via-transparent to-transparent',
    ring: 'border-violet-500/40',
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500',
    chip: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10',
    gradient: 'bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent',
    ring: 'border-indigo-500/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-500',
    chip: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
  },
};

/* ============================================================
   Display dots used by older LevelSignal-style components.
   New components consume `level` directly via TONE_CLASSES + dict.
   ============================================================ */

export const LEVEL_DOTS: Record<Level, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

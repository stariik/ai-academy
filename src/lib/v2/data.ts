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
  imageUrl?: string | null; // AI-generated cover (Replicate); falls back to icon-on-gradient
};

export type Course = {
  id: string;            // uuid from courses.id
  title: string;         // localized
  description?: string;  // localized
  categoryId: string;    // slug of the first matching canonical category
  audience: AudienceTag; // inherited from category
  lessons: number;       // derived count
  hours: number;         // derived: ceil(sum(estimatedDurationMinutes) / 60)
  price?: number;        // admin-set (courses.price_cents)
  retailPrice?: number;  // admin-set "was" price (courses.retail_price_cents) — struck through
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
  'ხელოვნური ინტელექტის საფუძვლები': {
    slug: 'ai-foundations',
    nameEn: 'AI Fundamentals',
    taglineKa: 'გაიგე, როგორ მუშაობს AI და გამოიყენე ის პრაქტიკაში — ნულიდან.',
    taglineEn: 'Understand how AI works and put it to practical use — from zero.',
    icon: '🧭',
    tone: 'pulse',
    audience: 'everyone',
  },
  'პრომპტ ინჟინერია': {
    slug: 'prompt-engineering',
    nameEn: 'Prompt Engineering',
    taglineKa: 'დაწერე მკაფიო პრომპტები და მიიღე უფრო სასარგებლო შედეგები.',
    taglineEn: 'Write clearer prompts and get more useful AI outputs.',
    icon: '🎯',
    tone: 'indigo',
    audience: 'everyone',
  },
  'AI მარკეტინგი': {
    slug: 'ai-marketing',
    nameEn: 'AI Marketing',
    taglineKa: 'შექმენი კონტენტი, კამპანიები და ანალიზი AI-ის დახმარებით.',
    taglineEn: 'Create content, campaigns, and analysis with AI.',
    icon: '📈',
    tone: 'heart',
    audience: 'adults',
  },
  'AI და კიბერუსაფრთხოება': {
    slug: 'ai-security',
    nameEn: 'AI & Cybersecurity',
    taglineKa: 'დაიცავი მონაცემები, სისტემები და მომხმარებლები AI-ის ეპოქაში.',
    taglineEn: 'Protect data, systems, and users in the age of AI.',
    icon: '🛡️',
    tone: 'violet',
    audience: 'adults',
  },
  'პროგრამირება AI-ით': {
    slug: 'ai-coding',
    nameEn: 'AI Coding & Development',
    taglineKa: 'შექმენი ვებსაიტები, აპები და ავტომატიზაციები AI-სთან ერთად.',
    taglineEn: 'Build websites, apps, and automations alongside AI.',
    icon: '⚡',
    tone: 'violet',
    audience: 'teens',
  },
  'AI ბავშვებისთვის': {
    slug: 'ai-for-kids',
    nameEn: 'AI for Kids',
    taglineKa: 'უსაფრთხო და სახალისო AI სწავლება 6–14 წლისთვის.',
    taglineEn: 'Safe, playful AI learning for ages 6–14.',
    icon: '🎈',
    tone: 'amber',
    audience: 'kids',
  },
  'AI შემოქმედება და დიზაინი': {
    slug: 'ai-creative',
    nameEn: 'AI Creativity & Design',
    taglineKa: 'შექმენი სურათები, დიზაინი, მუსიკა და ისტორიები AI-ით.',
    taglineEn: 'Create images, designs, music, and stories with AI.',
    icon: '🎨',
    tone: 'heart',
    audience: 'everyone',
  },
  'AI აგენტები და ჩატბოტები': {
    slug: 'ai-agents',
    nameEn: 'AI Agents & Chatbots',
    taglineKa: 'ააწყვე სასარგებლო AI აგენტები და ჩატბოტები — იდეიდან ინტეგრაციამდე.',
    taglineEn: 'Build useful AI agents and chatbots — from idea to integration.',
    icon: '🤖',
    tone: 'indigo',
    audience: 'adults',
  },
  'AI ბიზნესისა და პროდუქტიულობისთვის': {
    slug: 'ai-business',
    nameEn: 'AI for Business & Productivity',
    taglineKa: 'დანერგე AI სამუშაო პროცესებში, გუნდებსა და გადაწყვეტილებებში.',
    taglineEn: 'Put AI to work across workflows, teams, and decisions.',
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

/** Resolve a category slug (e.g. 'ai-foundations') to its KA name + visual. */
export function getCategoryBySlug(
  slug: string,
): { nameKa: string; visual: CategoryVisual } | null {
  for (const [nameKa, visual] of Object.entries(CATEGORY_VISUALS)) {
    if (visual.slug === slug) return { nameKa, visual };
  }
  return null;
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

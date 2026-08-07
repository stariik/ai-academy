'use client';

/**
 * walle.academy — course detail page
 *
 * Layout
 *   1. Navbar (sticky, mirrors /v2)
 *   2. Hero — asymmetric: course identity on the left, large Walle with
 *      orbiting badges on the right.
 *   3. Two-column body (lg+):
 *        Main col: outcomes → walle intro → curriculum → free preview →
 *                  reviews → FAQ → related
 *        Side rail: sticky purchase / progress card
 *   4. CTA banner
 *   5. Footer
 *   6. Mobile bottom-bar (sticky; appears only on small screens)
 *   7. "View as" dev toggle (cycles logged-out / not-enrolled / enrolled)
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Check, ChevronRight, Clock, Lock, Play, Sparkles,
  Star, ArrowRight, ArrowLeft, Heart, BookOpen, Users,
  CircleDot, Trophy, Eye, Zap, Loader2,
  ShieldCheck, Award, Infinity as InfinityIcon, MessageCircle, GraduationCap,
} from 'lucide-react';

import { Walle, type WalleState } from '@/components/walle/Walle';
import { EveCover } from '@/components/walle/EveCover';
import { cn } from '@/lib/utils';
import {
  LEVEL_DOTS, TONE_CLASSES,
  type Course, type Category, type CourseDetail, type Lesson,
} from '@/lib/v2/data';
import { V2LocaleProvider, useV2Locale } from '@/lib/v2/i18n/context';
import { Navbar } from '../../../_components/LandingClient';
import type { AuthUser } from '@/lib/auth';
import type { Dict, Locale } from '@/lib/v2/i18n';
import Link from 'next/link';
import {
  redeemPromoCode,
  redeemStatusLabel,
  type RedeemResult,
} from '@/lib/promo-redeem-client';

/* ============================================================
   Enrollment state
   • Authed users: server-provided `enrolledCourseIds` is the source of truth.
     Clicking "Enroll" POSTs to /api/enrollments (source='free' for now;
     promo flow uses /api/promo/redeem which creates its own enrollment).
   • Guests: localStorage stub kept so the marketing demo flows still work.
   ============================================================ */

const ENROLLMENT_KEY = 'ai_academy_enrollments';
type ViewerState = 'guest' | 'logged-in' | 'enrolled';

function readGuestEnrollments(): string[] {
  try {
    const raw = localStorage.getItem(ENROLLMENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeGuestEnrollments(ids: string[]) {
  localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(ids));
}

function readProgress(courseId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${ENROLLMENT_KEY}:${courseId}:progress`);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

/* ============================================================
   Page entry — receives data from the server-side parent page
   ============================================================ */

export default function CourseDetailClient({
  course,
  category,
  detail,
  related,
  dict,
  locale,
  authed,
  authUser,
  enrolledCourseIds,
  completedLessonIds,
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  related: Course[];
  dict: Dict;
  locale: Locale;
  authed: boolean;
  authUser: AuthUser | null;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
}) {
  return (
    <V2LocaleProvider locale={locale} dict={dict}>
      <CoursePage
        course={course}
        category={category}
        detail={detail}
        related={related}
        authed={authed}
        authUser={authUser}
        enrolledCourseIds={enrolledCourseIds}
        completedLessonIds={completedLessonIds}
      />
    </V2LocaleProvider>
  );
}

/* ============================================================
   Main shell
   ============================================================ */

type Audience = Course['audience'];

function CoursePage({
  course,
  category,
  detail,
  related,
  authed,
  authUser,
  enrolledCourseIds,
  completedLessonIds,
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  related: Course[];
  authed: boolean;
  authUser: AuthUser | null;
  enrolledCourseIds: string[];
  completedLessonIds: string[];
}) {
  const { dict, href: localeHref } = useV2Locale();
  // --- view state -----------------------------------------------------------
  const [enrollments, setEnrollments] = React.useState<string[]>(enrolledCourseIds);
  // Authed: server progress (account-wide, cross-device). Guests: localStorage.
  const [progress, setProgress] = React.useState<Set<string>>(
    () => new Set(authed ? completedLessonIds : []),
  );

  React.useEffect(() => {
    if (!authed) {
      setEnrollments(readGuestEnrollments());
      setProgress(readProgress(course.id));
    }
  }, [course.id, authed]);

  const effectiveState: ViewerState = authed
    ? enrollments.includes(course.id)
      ? 'enrolled'
      : 'logged-in'
    : 'guest';

  const isEnrolled = effectiveState === 'enrolled';
  const isLoggedIn = effectiveState !== 'guest';

  // Used by the promo-code redeem flow: the API has already inserted the
  // server-side enrollment row, so we just need to reflect it in client state.
  const addEnrollmentLocally = React.useCallback((courseId: string) => {
    setEnrollments((prev) => (prev.includes(courseId) ? prev : [...prev, courseId]));
  }, []);

  // Every buy/enroll button shares this. It stays true across the redirect to
  // the bank or to login so the spinner never flickers back to "Buy" while the
  // browser is still leaving the page — a second click there is a second order.
  const [busy, setBusy] = React.useState(false);

  const toggleEnrollment = React.useCallback(async () => {
    if (busy) return;

    // Guests can't buy — send them to login first (paid courses only).
    if (!authed && course.price && course.price > 0) {
      setBusy(true);
      window.location.href = localeHref('login');
      return;
    }

    // Guests (no auth) — keep the localStorage demo behaviour for free courses.
    if (!authed) {
      setEnrollments((prev) => {
        const already = prev.includes(course.id);
        const next = already ? prev.filter((x) => x !== course.id) : [...prev, course.id];
        writeGuestEnrollments(next);
        return next;
      });
      return;
    }

    // Authed users: once enrolled, never silently un-enroll from a click.
    // The UI rail only renders the enroll button when isEnrolled=false.
    if (enrollments.includes(course.id)) return;

    // Paid course → Bank of Georgia checkout. Access is granted by the
    // payment callback, so we don't touch local enrollment state here.
    if (course.price && course.price > 0) {
      setBusy(true);
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: course.id, returnPath: localeHref(`courses/${course.id}`) }),
        });
        const data = (await res.json().catch(() => ({}))) as { redirectUrl?: string };
        if (res.ok && data.redirectUrl) {
          window.location.href = data.redirectUrl;
          return;
        }
        console.error('[checkout] failed:', res.status);
      } catch (err) {
        console.error('[checkout] failed:', err);
      }
      setBusy(false);
      return;
    }

    // Free course — optimistic add, then call the API. Rollback on failure.
    setBusy(true);
    setEnrollments((prev) => (prev.includes(course.id) ? prev : [...prev, course.id]));
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
      if (!res.ok) throw new Error('enroll failed');
    } catch (err) {
      console.error('[enroll] failed:', err);
      setEnrollments((prev) => prev.filter((x) => x !== course.id));
    } finally {
      setBusy(false);
    }
  }, [authed, busy, course.id, course.price, enrollments, localeHref]);

  const toggleLessonComplete = React.useCallback(
    (lessonId: string) => {
      const nowDone = !progress.has(lessonId);
      const next = new Set(progress);
      if (nowDone) next.add(lessonId);
      else next.delete(lessonId);
      setProgress(next);

      if (authed) {
        // Persist to the account (same endpoint the lesson player uses),
        // so the checkmark survives devices and browsers.
        void fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId, status: nowDone ? 'completed' : 'in_progress' }),
        }).catch((err) => console.error('[progress] save failed:', err));
      } else {
        localStorage.setItem(
          `${ENROLLMENT_KEY}:${course.id}:progress`,
          JSON.stringify(Array.from(next)),
        );
      }
    },
    [authed, course.id, progress],
  );

  const totalLessons = detail.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = progress.size;
  const progressPct = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  // First free lesson — used by every "preview" CTA on this page.
  // Falls back to the very first lesson if no `isFree` flag was set.
  const previewLessonId = React.useMemo(() => {
    for (const m of detail.modules) {
      for (const l of m.lessons) {
        if (l.isFree) return l.id;
      }
    }
    return detail.modules[0]?.lessons[0]?.id ?? null;
  }, [detail.modules]);
  const previewHref = previewLessonId ? localeHref(`lessons/${previewLessonId}`) : '#curriculum';

  // --- render ---------------------------------------------------------------
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* homeAnchors={false}: this page has no #categories/#courses sections,
          so the bare hashes did nothing when tapped. */}
      <Navbar authUser={authUser} homeAnchors={false} />

      <main className="relative">
        <Hero
          course={course}
          category={category}
          detail={detail}
          isEnrolled={isEnrolled}
          isLoggedIn={isLoggedIn}
          progressPct={progressPct}
          completedCount={completedCount}
          totalLessons={totalLessons}
          previewHref={previewHref}
        />

        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="mx-auto max-w-7xl grid gap-10 lg:gap-14 lg:grid-cols-[1fr_360px]">
            {/* MAIN ───────────────────────────────────── */}
            <div className="min-w-0 space-y-16 sm:space-y-20">
              <CurriculumSection
                course={course}
                category={category}
                detail={detail}
                isEnrolled={isEnrolled}
                isLoggedIn={isLoggedIn}
                progress={progress}
                onToggleLesson={toggleLessonComplete}
              />
              <RelatedCoursesSection related={related} category={category} />
            </div>

            {/* RAIL ───────────────────────────────────── */}
            <aside className="space-y-5">
              <PurchaseCard
                course={course}
                category={category}
                detail={detail}
                isEnrolled={isEnrolled}
                isLoggedIn={isLoggedIn}
                progressPct={progressPct}
                completedCount={completedCount}
                totalLessons={totalLessons}
                onEnroll={toggleEnrollment}
                enrollBusy={busy}
                onPromoRedeemed={addEnrollmentLocally}
                previewHref={previewHref}
              />
              <WalleIntroSection course={course} detail={detail} />
            </aside>
          </div>
        </section>

        <CtaBanner
          course={course}
          isEnrolled={isEnrolled}
          onEnroll={toggleEnrollment}
          enrollBusy={busy}
          previewHref={previewHref}
        />
      </main>

      <Footer />

      <MobileBottomBar
        course={course}
        category={category}
        isEnrolled={isEnrolled}
        progressPct={progressPct}
        onEnroll={toggleEnrollment}
        enrollBusy={busy}
      />

    </div>
  );
}


/* ============================================================
   Hero
   ============================================================ */

function Hero({
  course,
  category,
  detail,
  isEnrolled,
  isLoggedIn,
  progressPct,
  completedCount,
  totalLessons,
  previewHref,
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  progressPct: number;
  completedCount: number;
  totalLessons: number;
  previewHref: string;
}) {
  const { dict, href } = useV2Locale();
  const t = TONE_CLASSES[category.tone];
  const reduced = useReducedMotion();
  const [walleState, setWalleState] = React.useState<WalleState>('idle');

  React.useEffect(() => {
    setWalleState('wave');
    const id = setTimeout(() => setWalleState('idle'), 4200);
    return () => clearTimeout(id);
  }, []);

  return (
    <section className="relative pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-20 px-4 sm:px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 -z-10 bg-starfield opacity-40" aria-hidden />
      <div
        className={cn(
          'absolute top-1/4 -left-20 w-[28rem] h-[28rem] rounded-full blur-3xl -z-10 opacity-50',
          t.gradient,
        )}
        aria-hidden
      />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-pulse/8 blur-3xl -z-10" aria-hidden />

      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb chip */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 sm:mb-8"
        >
          <Link
            href={`${href()}#cat-${category.id}`}
            title={dict.courseDetail.backToCourses}
            className={cn(
              'group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full border bg-card/80 backdrop-blur-sm py-1.5 pl-1.5 pr-4 text-xs font-bold shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md',
              t.ring,
            )}
          >
            {/* tone wash sweeps in on hover */}
            <span
              className={cn('absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100', t.gradient)}
              aria-hidden
            />
            {/* icon bubble — flips to a back arrow on hover */}
            <span className={cn('relative grid h-6 w-6 place-items-center overflow-hidden rounded-full text-[13px] leading-none', t.iconBg)}>
              <span className="col-start-1 row-start-1 transition-all duration-300 group-hover:-translate-y-4 group-hover:opacity-0">
                {category.icon}
              </span>
              <ArrowLeft
                className={cn(
                  'col-start-1 row-start-1 h-3.5 w-3.5 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100',
                  t.text,
                )}
              />
            </span>
            <span className="relative">
              {category.name}
              {/* tone underline draws in on hover */}
              <span
                className={cn(
                  'absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100',
                  t.bg,
                )}
                aria-hidden
              />
            </span>
          </Link>
        </motion.div>

        <div className="grid gap-10 lg:gap-14 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          {/* LEFT — text & meta */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="order-2 lg:order-1 space-y-5 sm:space-y-6"
          >
            {isEnrolled && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-2.5 py-1 text-[11px] font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  {dict.courseDetail.enrolledBadge}
                </span>
              </div>
            )}

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {course.title}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              {detail.longDescription}
            </p>

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <Stat icon={<BookOpen className="w-4 h-4" />} label={`${course.lessons} ${dict.courseDetail.lessonsLabel}`} />
              <Stat icon={<Clock className="w-4 h-4" />} label={`~${course.hours} ${dict.courseDetail.hoursLabel}`} />
            </div>

            {/* Hero CTA — visible on mobile (purchase rail handles desktop) */}
            <div className="lg:hidden pt-2 flex flex-wrap gap-3">
              {isEnrolled ? (
                <a href="#curriculum" className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)]">
                  {dict.courseDetail.heroContinueLesson}
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <Link href={previewHref} className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)]">
                  {dict.courseDetail.heroFreePreview}
                  <Play className="w-4 h-4 fill-current" />
                </Link>
              )}
            </div>

            {/* Enrolled progress mini */}
            {isEnrolled && totalLessons > 0 && (
              <div className="rounded-2xl border border-pulse/30 bg-pulse/5 p-4 max-w-md">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-pulse">{dict.courseDetail.yourProgress}</span>
                  <span className="font-semibold tabular-nums text-foreground">{completedCount}/{totalLessons}</span>
                </div>
                <div className="h-2 rounded-full bg-pulse/15 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={reduced ? { duration: 0 } : { duration: 0.9, ease: 'easeOut' }}
                    className="h-full rounded-full bg-pulse"
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* RIGHT — Walle + orbiting badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.36, 0.64, 1] }}
            className="order-1 lg:order-2 flex items-center justify-center"
          >
            <div className="relative">
              <div
                className={cn(
                  'absolute inset-0 -m-6 rounded-full blur-2xl opacity-60',
                  t.iconBg,
                )}
                aria-hidden
              />
              <Walle size={260} state={walleState} />

              {/* Orbiting course medallion — Eve-head cover with the course icon */}
              <motion.div
                aria-hidden
                animate={reduced ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 w-28 h-24"
              >
                <EveCover
                  icon={<span className="-rotate-6 inline-block">{course.icon}</span>}
                  className="h-full w-full drop-shadow-[0_12px_30px_rgba(0,0,0,0.12)]"
                  iconClassName="text-3xl"
                />
              </motion.div>

              {/* Floating chips */}
              <FloatingPill
                className="-bottom-1 -left-6 sm:-left-12"
                delay={0.3}
                tone={category.tone}
                icon="✨"
                label={dict.courseDetail.aiTeacher}
              />
              <FloatingPill
                className="top-10 -right-10 sm:-right-16"
                delay={0.6}
                tone={category.tone}
                icon="🎯"
                label={`${course.lessons} ${dict.courseDetail.lessonsLabel}`}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <span className="text-pulse flex items-center justify-center">{icon}</span>
      <span className="text-foreground/85 font-semibold">{label}</span>
    </div>
  );
}

function LevelDots({ level, tone }: { level: Course['level']; tone: keyof typeof TONE_CLASSES }) {
  const filled = LEVEL_DOTS[level];
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-colors',
            i <= filled ? TONE_CLASSES[tone].bg : 'bg-muted-foreground/30',
          )}
        />
      ))}
    </span>
  );
}

function FloatingPill({
  className,
  delay,
  tone,
  icon,
  label,
}: {
  className?: string;
  delay: number;
  tone: keyof typeof TONE_CLASSES;
  icon: string;
  label: string;
}) {
  const reduced = useReducedMotion();
  const t = TONE_CLASSES[tone];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.34, 1.36, 0.64, 1] }}
      className={cn('absolute', className)}
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 3.4 + delay, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'rounded-full bg-card border px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
          t.ring,
        )}
      >
        <span>{icon}</span>
        <span className="text-foreground/85">{label}</span>
      </motion.div>
    </motion.div>
  );
}

/* ============================================================
   Walle teacher intro
   ============================================================ */

function WalleIntroSection({ course, detail }: { course: Course; detail: CourseDetail }) {
  const { dict } = useV2Locale();
  const [walleState, setWalleState] = React.useState<WalleState>('idle');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setWalleState('wave');
            setTimeout(() => setWalleState('idle'), 3200);
            obs.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref}>
      <div className="relative overflow-hidden rounded-3xl border border-pulse/25 bg-gradient-to-br from-pulse/8 via-card to-card p-5 sm:p-6">
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-pulse/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full bg-heart/10 blur-3xl" aria-hidden />

        <div className="relative flex flex-col items-center text-center gap-4">
          <div
            onMouseEnter={() => setWalleState('tilt')}
            onMouseLeave={() => setWalleState('idle')}
            className="cursor-pointer"
          >
            <Walle size={108} state={walleState} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
              {dict.courseDetail.walleEyebrow}
            </p>
            <h3
              className="mt-1 text-xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {dict.courseDetail.walleTitle}
            </h3>
          </div>

          <blockquote className="relative text-sm leading-relaxed text-foreground/90 px-1">
            <span
              className="absolute -left-1 -top-2 text-3xl text-pulse/30 leading-none select-none"
              aria-hidden
            >
              &ldquo;
            </span>
            <span className="relative">{detail.walleQuote}</span>
          </blockquote>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {dict.courseDetail.walleIntro}{' '}
            <span className="text-foreground font-semibold">{course.title}</span> — {dict.courseDetail.walleIntroEnd}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Curriculum
   ============================================================ */

// Roman numerals for chapter labels (the path is capped at three chapters).
const PATH_ROMAN = ['I', 'II', 'III'] as const;

// Split the flat lesson list into up to three contiguous chapters, front-loading
// any remainder. The course narrative is always foundations → practice → project
// (see curriculumDescription), so e.g. 4 lessons becomes [2,1,1].
function splitIntoPhases<T>(items: T[]): T[][] {
  const n = items.length;
  if (n === 0) return [];
  const groups = Math.min(3, n);
  const base = Math.floor(n / groups);
  const rem = n % groups;
  const out: T[][] = [];
  let idx = 0;
  for (let g = 0; g < groups; g++) {
    const size = base + (g < rem ? 1 : 0);
    out.push(items.slice(idx, idx + size));
    idx += size;
  }
  return out;
}

function CurriculumSection({
  category,
  detail,
  isEnrolled,
  progress,
  onToggleLesson,
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  progress: Set<string>;
  onToggleLesson: (lessonId: string) => void;
}) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[category.tone];

  // One module holds all lessons (see lessonsAsModule in db.ts). Instead of a
  // flat list, we present them as a guided "learning path" broken into chapters.
  const lessons = detail.modules.flatMap((m) => m.lessons);
  const totalLessons = lessons.length;
  const completed = lessons.filter((l) => progress.has(l.id)).length;
  const pct = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);
  const finished = totalLessons > 0 && completed === totalLessons;

  // The next actionable lesson — the first one the viewer can open and hasn't
  // completed. For guests that's the first free preview; for enrolled students
  // it's where they left off. Drives the pulsing "Next up" marker.
  const nextUpId = React.useMemo(() => {
    for (const l of lessons) {
      if ((isEnrolled || l.isFree) && !progress.has(l.id)) return l.id;
    }
    return null;
  }, [lessons, isEnrolled, progress]);

  // Pair the real lesson chunks with the foundations → practice → project
  // narrative, keeping a running global lesson number across chapters.
  const phaseMeta = [
    { Icon: BookOpen, title: dict.courseDetail.pathFoundationsTitle, tagline: dict.courseDetail.pathFoundationsTagline },
    { Icon: Zap, title: dict.courseDetail.pathPracticeTitle, tagline: dict.courseDetail.pathPracticeTagline },
    { Icon: GraduationCap, title: dict.courseDetail.pathProjectTitle, tagline: dict.courseDetail.pathProjectTagline },
  ];
  const chunks = splitIntoPhases(lessons);
  const meta =
    chunks.length <= 1 ? [phaseMeta[0]]
    : chunks.length === 2 ? [phaseMeta[0], phaseMeta[2]]
    : phaseMeta;
  const phases = chunks.map((chunkLessons, i) => {
    // Global lesson number continues across chapters → prefix-sum of prior chunks.
    const startNumber = chunks.slice(0, i).reduce((acc, c) => acc + c.length, 0);
    return { meta: meta[i], roman: PATH_ROMAN[i], lessons: chunkLessons, startNumber };
  });

  return (
    <section id="curriculum" className="scroll-mt-24">
      <SectionHeader
        eyebrow={dict.courseDetail.curriculumEyebrow}
        title={dict.courseDetail.curriculumTitle}
        description={dict.courseDetail.curriculumDescription}
      />

      {/* Overview ribbon — totals on the left, live progress on the right */}
      <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-border bg-card/60 px-5 py-4 sm:px-6">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <BookOpen className={cn('h-4 w-4', t.text)} />
          <span className="tabular-nums">{totalLessons}</span>
          <span className="font-normal text-muted-foreground">{dict.courseDetail.lessonsLabel}</span>
        </span>
        {isEnrolled && totalLessons > 0 && (
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className={cn('text-sm font-bold tabular-nums', t.text)}>
                {completed}/{totalLessons}
              </p>
              <p className="text-[11px] text-muted-foreground">{dict.courseDetail.yourProgress}</p>
            </div>
            <CurriculumRing pct={pct} tone={category.tone} />
          </div>
        )}
      </div>

      {/* Chapters */}
      <div className="mt-7 space-y-8 sm:space-y-10">
        {phases.map((phase) => (
          <PhaseBlock
            key={phase.roman}
            roman={phase.roman}
            meta={phase.meta}
            lessons={phase.lessons}
            startNumber={phase.startNumber}
            category={category}
            isEnrolled={isEnrolled}
            progress={progress}
            nextUpId={nextUpId}
            onToggleLesson={onToggleLesson}
          />
        ))}

        <FinishCap category={category} finished={finished} />
      </div>
    </section>
  );
}

// Animated, tone-aware progress ring with a centered % label, used in the
// curriculum overview ribbon. (Distinct from the pulse-only rail ProgressRing.)
function CurriculumRing({
  pct,
  tone,
  size = 50,
  stroke = 5,
}: {
  pct: number;
  tone: keyof typeof TONE_CLASSES;
  size?: number;
  stroke?: number;
}) {
  const t = TONE_CLASSES[tone];
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          className={t.text}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={reduced ? { duration: 0 } : { duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <span className={cn('absolute text-[11px] font-bold tabular-nums', t.text)}>{pct}%</span>
    </span>
  );
}

// One chapter of the learning path: a header (icon node, label, tagline, totals,
// optional progress) followed by its lessons rendered along a connecting spine.
function PhaseBlock({
  roman,
  meta,
  lessons,
  startNumber,
  category,
  isEnrolled,
  progress,
  nextUpId,
  onToggleLesson,
}: {
  roman: string;
  meta: { Icon: typeof BookOpen; title: string; tagline: string };
  lessons: Lesson[];
  startNumber: number;
  category: Category;
  isEnrolled: boolean;
  progress: Set<string>;
  nextUpId: string | null;
  onToggleLesson: (lessonId: string) => void;
}) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[category.tone];
  const { Icon } = meta;
  const phaseMin = lessons.reduce((acc, l) => acc + l.durationMin, 0);
  const phaseDone = lessons.filter((l) => progress.has(l.id)).length;
  const allDone = lessons.length > 0 && phaseDone === lessons.length;

  return (
    <div>
      {/* Chapter header */}
      <div className="flex items-center gap-3.5">
        <span
          className={cn(
            'grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors',
            allDone ? cn(t.bg, 'text-primary-foreground') : cn(t.iconBg, t.text),
          )}
        >
          {allDone ? <Check className="h-5 w-5" strokeWidth={2.6} /> : <Icon className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn('text-[10px] font-bold uppercase tracking-[0.22em]', t.text)}>
            {dict.courseDetail.pathPhaseLabel} {roman}
          </p>
          <h3 className="text-lg font-bold leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            {meta.title}
          </h3>
        </div>
        <span className="hidden shrink-0 text-right text-[11px] text-muted-foreground sm:block">
          <span className="font-semibold tabular-nums text-foreground/80">{lessons.length}</span>{' '}
          {dict.courseDetail.lessonsLabel}
          <span className="px-1 opacity-40">·</span>~
          <span className="font-semibold tabular-nums text-foreground/80">{phaseMin}</span>{' '}
          {dict.courseDetail.durationMinutes}
        </span>
      </div>
      <p className="mt-1.5 pl-[3.625rem] text-sm text-muted-foreground">{meta.tagline}</p>

      {/* Lessons along the spine */}
      <ol className="mt-3">
        {lessons.map((l, i) => (
          <LessonCard
            key={l.id}
            lesson={l}
            number={startNumber + i + 1}
            isFirst={i === 0}
            isLast={i === lessons.length - 1}
            category={category}
            isEnrolled={isEnrolled}
            isCompleted={progress.has(l.id)}
            isNextUp={l.id === nextUpId}
            onToggleComplete={() => onToggleLesson(l.id)}
          />
        ))}
      </ol>
    </div>
  );
}

// A single lesson on the path: spine node (number / check / lock / next-up play)
// plus a card that surfaces the lesson description and its start/review CTA.
function LessonCard({
  lesson,
  number,
  isFirst,
  isLast,
  category,
  isEnrolled,
  isCompleted,
  isNextUp,
  onToggleComplete,
}: {
  lesson: Lesson;
  number: number;
  isFirst: boolean;
  isLast: boolean;
  category: Category;
  isEnrolled: boolean;
  isCompleted: boolean;
  isNextUp: boolean;
  onToggleComplete: () => void;
}) {
  const { href, dict } = useV2Locale();
  const t = TONE_CLASSES[category.tone];
  const isLocked = !isEnrolled && !lesson.isFree;
  const accessible = isEnrolled || lesson.isFree;
  const isPreview = lesson.isFree && !isEnrolled;

  const card = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isNextUp && (
            <span className={cn('mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary-foreground', t.bg)}>
              <Sparkles className="h-2.5 w-2.5" />
              {dict.courseDetail.pathNextUp}
            </span>
          )}
          <p className={cn('text-sm font-bold leading-snug sm:text-[0.95rem]', isCompleted && 'text-muted-foreground line-through decoration-1')}>
            {lesson.title}
          </p>
        </div>
        {accessible ? (
          <span
            className={cn(
              'grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300 group-hover:scale-110 group-hover:brightness-105',
              isNextUp ? cn(t.bg, 'text-primary-foreground') : cn(t.iconBg, t.text),
            )}
            aria-hidden
          >
            {isPreview ? (
              <Play className="h-3.5 w-3.5 fill-current" />
            ) : (
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            )}
          </span>
        ) : (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground/50" aria-hidden>
            <Lock className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {lesson.description && (
        <p className={cn('mt-1.5 text-xs leading-relaxed text-muted-foreground', isLocked ? 'line-clamp-1' : 'line-clamp-2')}>
          {lesson.description}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {lesson.durationMin} {dict.courseDetail.durationMinutes}
        </span>
        {lesson.isFree && (
          <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', t.chip)}>
            <Eye className="h-3 w-3" />
            {dict.courseDetail.freeLessonBadge}
          </span>
        )}
        {accessible && (
          <span className={cn('ml-auto inline-flex items-center gap-1 font-bold transition-all group-hover:gap-1.5', isCompleted ? t.text : 'text-foreground')}>
            {isCompleted ? dict.courseDetail.lessonReview : dict.courseDetail.lessonStart}
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </>
  );

  return (
    <li className="relative flex gap-3.5 sm:gap-4">
      {/* Spine node + connector */}
      <div className="relative flex w-11 shrink-0 items-center justify-center">
        <span
          aria-hidden
          className={cn(
            'absolute left-1/2 w-px -translate-x-1/2',
            isFirst ? 'top-1/2' : 'top-0',
            isLast ? 'bottom-1/2' : 'bottom-0',
            isCompleted ? t.bg : 'bg-border',
          )}
        />
        <button
          type="button"
          onClick={isEnrolled ? onToggleComplete : undefined}
          aria-label={isCompleted ? dict.courseDetail.markIncomplete : dict.courseDetail.markComplete}
          disabled={!isEnrolled}
          className={cn(
            'relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums transition-all',
            isCompleted
              ? cn(t.bg, 'text-primary-foreground')
              : isLocked
                ? 'bg-muted text-muted-foreground/70'
                : isNextUp
                  ? cn(t.bg, 'text-primary-foreground shadow-[0_0_0_4px_var(--pulse-glow)]')
                  : cn(t.iconBg, t.text, isEnrolled && 'cursor-pointer hover:brightness-95'),
          )}
        >
          {isCompleted ? (
            <Check className="h-4 w-4" strokeWidth={2.6} />
          ) : isLocked ? (
            <Lock className="h-3.5 w-3.5" />
          ) : isNextUp ? (
            <Play className="h-3.5 w-3.5 fill-current" />
          ) : (
            number.toString().padStart(2, '0')
          )}
        </button>
      </div>

      {/* Card */}
      {accessible ? (
        <Link
          href={href(`lessons/${lesson.id}`)}
          className={cn(
            'group my-1.5 flex-1 rounded-2xl border bg-card p-3.5 transition-all duration-300 sm:p-4',
            isNextUp ? cn(t.ring, 'shadow-[0_10px_30px_-18px_var(--pulse-glow)]') : 'border-border',
            'hover:-translate-y-0.5 hover:border-transparent hover:shadow-[0_16px_36px_-22px_var(--pulse-glow)]',
          )}
        >
          {card}
        </Link>
      ) : (
        <div className="my-1.5 flex-1 rounded-2xl border border-dashed border-border bg-card/40 p-3.5 sm:p-4">
          {card}
        </div>
      )}
    </li>
  );
}

// Goal marker at the end of the path — turns celebratory once every lesson is done.
function FinishCap({ category, finished }: { category: Category; finished: boolean }) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[category.tone];
  return (
    <div className="flex items-center gap-3.5">
      <span
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-2xl transition-colors',
          finished ? cn(t.bg, 'text-primary-foreground') : cn('border-2 border-dashed bg-card', t.ring, t.text),
        )}
      >
        {finished ? <Trophy className="h-5 w-5" /> : <Award className="h-5 w-5" />}
      </span>
      <div className="min-w-0">
        <h3 className="text-base font-bold leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          {dict.courseDetail.pathFinishTitle}
        </h3>
        <p className="text-xs text-muted-foreground">{dict.courseDetail.pathFinishDesc}</p>
      </div>
    </div>
  );
}

/* ============================================================
   Related courses
   ============================================================ */

function RelatedCoursesSection({ related, category: cat }: { related: Course[]; category: Category }) {
  const { dict } = useV2Locale();
  if (related.length === 0) return null;
  return (
    <section>
      <SectionHeader
        eyebrow={dict.courseDetail.relatedEyebrowContinue}
        title={dict.courseDetail.relatedTitle}
      />

      <div className="mt-8 sm:mt-10 -mx-4 sm:mx-0 px-4 sm:px-0 flex sm:grid gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible sm:grid-cols-2 pb-2 sm:pb-0 snap-x">
        {related.map((co, i) => (
          <RelatedCourseCard key={co.id} course={co} category={cat} index={i} />
        ))}
      </div>
    </section>
  );
}

// Related course card — mirrors the catalog's clean, price-forward CourseCard so
// the whole site speaks one visual language: tone icon chip + discount badge,
// title/description, audience·level·pace chips, and an always-visible price next
// to a round tone CTA. Same lift + tone glow + accent-ring hover.
function RelatedCourseCard({
  course: co,
  category: c,
  index,
}: {
  course: Course;
  category: Category;
  index: number;
}) {
  const { dict, href } = useV2Locale();
  const t = TONE_CLASSES[c.tone];
  const isFree = !(typeof co.price === 'number' && co.price > 0);
  const hasRetail =
    !isFree &&
    typeof co.retailPrice === 'number' &&
    typeof co.price === 'number' &&
    co.retailPrice > co.price;
  const discount = hasRetail
    ? Math.round(((co.retailPrice! - co.price!) / co.retailPrice!) * 100)
    : 0;
  const save = hasRetail ? co.retailPrice! - co.price! : 0;
  const minPerLesson = co.lessons > 0 ? Math.max(1, Math.round((co.hours * 60) / co.lessons)) : 0;

  return (
    <motion.a
      href={href(`courses/${co.id}`)}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card p-4 sm:p-5',
        'w-[260px] flex-shrink-0 snap-start sm:w-auto sm:flex-shrink',
        'transition-all duration-300 ease-out transform-gpu',
        'hover:-translate-y-2 hover:border-transparent hover:shadow-[0_26px_52px_-22px_var(--pulse-glow)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {/* Soft tone glow + accent ring — same as the catalog card */}
      <div
        className={cn(
          'pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full blur-3xl opacity-[0.13] transition-opacity duration-500 group-hover:opacity-30',
          t.bg,
        )}
        aria-hidden
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          t.ring,
        )}
        aria-hidden
      />

      {/* Top — icon chip · discount */}
      <div className="relative flex items-start justify-between gap-2">
        <span
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6',
            t.iconBg,
          )}
          aria-hidden
        >
          {co.icon}
        </span>
        {discount > 0 && (
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums text-primary-foreground shadow-sm',
              t.bg,
            )}
          >
            −{discount}%
          </span>
        )}
      </div>

      {/* Title */}
      <h4
        className="relative mt-3.5 text-[16px] sm:text-[17px] font-bold leading-snug tracking-tight line-clamp-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {co.title}
      </h4>

      {/* Description */}
      {co.description && (
        <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {co.description}
        </p>
      )}

      {/* Meta chips — audience · level · pace */}
      <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground/70">
          <span className={cn('h-1.5 w-1.5 rounded-full', t.bg)} aria-hidden />
          {dict.audienceTag[co.audience]}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground/70">
          <LevelDots level={co.level} tone={c.tone} />
          {dict.level[co.level]}
        </span>
        {minPerLesson > 0 && (
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground/70">
            ~{minPerLesson} {dict.courseCard.minPerLesson}
          </span>
        )}
      </div>

      {/* Footer — always-visible, price-forward */}
      <div className="relative mt-auto pt-3.5">
        <div className="border-t border-dashed border-border/80 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10.5px] text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{co.lessons}</span>
              {' '}{dict.courseCard.lessonsShort}
              <span className="px-1 opacity-40">·</span>
              ~<span className="font-bold tabular-nums text-foreground">{co.hours}</span>
              {dict.courseCard.hoursShort}
            </span>
            {save > 0 && (
              <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold', t.chip)}>
                {dict.catalog.bundleSave} ₾{save}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-end justify-between gap-3">
            {isFree ? (
              <span
                className={cn('text-[20px] font-bold leading-none tracking-tight', t.text)}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {dict.courseCard.free}
              </span>
            ) : (
              <span className="inline-flex items-baseline gap-1.5">
                <span
                  className="text-[22px] font-bold leading-none tabular-nums"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  ₾{co.price}
                </span>
                {hasRetail && (
                  <span className="text-[12px] tabular-nums text-muted-foreground line-through">
                    ₾{co.retailPrice}
                  </span>
                )}
              </span>
            )}

            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary-foreground shadow-sm',
                'transition-all duration-300 ease-out',
                t.bg,
                'group-hover:scale-110 group-hover:brightness-105 group-hover:shadow-[0_8px_20px_-4px_var(--pulse-glow)]',
              )}
              aria-hidden
            >
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </div>
    </motion.a>
  );
}

/* ============================================================
   Sticky purchase rail (desktop)
   ============================================================ */

function PurchaseCard({
  course,
  category,
  detail,
  isEnrolled,
  isLoggedIn,
  progressPct,
  completedCount,
  totalLessons,
  onEnroll,
  enrollBusy,
  onPromoRedeemed,
  previewHref,
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  progressPct: number;
  completedCount: number;
  totalLessons: number;
  onEnroll: () => void;
  enrollBusy: boolean;
  onPromoRedeemed: (courseId: string) => void;
  previewHref: string;
}) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[category.tone];
  const hasPrice = typeof course.price === 'number' && course.price > 0;
  const retail = detail.retailPrice ?? 0;
  const discount =
    hasPrice && retail > course.price!
      ? Math.round(((retail - course.price!) / retail) * 100)
      : 0;

  return (
    <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-[0_16px_48px_-12px_rgba(0,0,0,0.10)]">
      {/* Top tone bar */}
      <div className={cn('h-1.5 w-full', t.bg)} aria-hidden />

      {/* Soft tone glow behind the hero */}
      <div
        className={cn(
          'absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl opacity-20 pointer-events-none',
          t.bg,
        )}
        aria-hidden
      />

      {isEnrolled ? (
        <EnrolledRailContent
          course={course}
          progressPct={progressPct}
          completedCount={completedCount}
          totalLessons={totalLessons}
          tone={category.tone}
        />
      ) : (
        <BuyRailContent
          course={course}
          detail={detail}
          discount={discount}
          hasPrice={hasPrice}
          tone={category.tone}
          isLoggedIn={isLoggedIn}
          onEnroll={onEnroll}
          enrollBusy={enrollBusy}
          onPromoRedeemed={onPromoRedeemed}
          previewHref={previewHref}
        />
      )}

      {/* What's included — icon rows */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-3">
          {dict.courseDetail.whatsIncludedLabel}
        </p>
        <ul className="space-y-2.5">
          {detail.whatsIncluded.map((item, i) => {
            const Icon = INCLUDED_ICONS[i % INCLUDED_ICONS.length];
            return (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span
                  className={cn(
                    'flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center',
                    t.iconBg,
                    t.text,
                  )}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
                </span>
                <span className="text-foreground/90 leading-snug">{item}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Prerequisites */}
      {detail.prerequisites.length > 0 && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-border pt-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-2">
            {dict.courseDetail.prerequisitesLabel}
          </p>
          <ul className="space-y-1.5">
            {detail.prerequisites.map((p) => (
              <li key={p} className="flex items-start gap-2 text-xs text-foreground/80">
                <CircleDot className="flex-shrink-0 w-3 h-3 mt-0.5 text-muted-foreground" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bundle cross-sell */}
      {!isEnrolled && <BundleCrossSell category={category} />}
    </div>
  );
}

const INCLUDED_ICONS = [BookOpen, MessageCircle, Sparkles, GraduationCap, Zap];

function TrustPill({
  icon: Icon,
  children,
  tone,
}: {
  icon: typeof ShieldCheck;
  children: React.ReactNode;
  tone: keyof typeof TONE_CLASSES;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <div className="flex items-center gap-2.5 text-xs">
      <span className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center', t.iconBg, t.text)}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.4} />
      </span>
      <span className="text-foreground/85 leading-snug">{children}</span>
    </div>
  );
}

function BundleCrossSell({ category }: { category: Category }) {
  const { dict, href } = useV2Locale();
  const t = TONE_CLASSES[category.tone];
  return (
    <Link
      href={`${href()}#cat-${category.id}`}
      className={cn(
        'group block mx-5 sm:mx-6 mb-5 sm:mb-6 rounded-2xl border-2 border-dashed p-4 transition-all duration-300 ease-out',
        t.ring,
        'hover:-translate-y-1 hover:shadow-[0_14px_32px_-16px_var(--pulse-glow)]',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex-shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center', t.iconBg)}>
          {category.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-muted-foreground">
              {dict.courseDetail.bundleLabel}
            </p>
            <span className={cn('inline-flex items-center rounded-full text-[10px] font-bold px-1.5 py-0.5 border', t.chip)}>
              −40%
            </span>
          </div>
          <p
            className="mt-0.5 text-sm font-bold leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dict.courseDetail.bundleWholeCategory}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span className="font-bold text-foreground tabular-nums">{category.courses}</span> {dict.courseDetail.bundleCoursesUnit}
            <span className="opacity-50"> · </span>
            {dict.courseDetail.bundleForever}
          </p>
        </div>
        <ArrowRight className={cn('flex-shrink-0 w-4 h-4 transition-transform group-hover:translate-x-1', t.text)} />
      </div>
    </Link>
  );
}

function CoursePromoExpandable({
  courseId,
  onSuccess,
}: {
  courseId: string;
  onSuccess: (courseId: string) => void;
}) {
  const { dict } = useV2Locale();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<RedeemResult | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const r = await redeemPromoCode(trimmed, courseId);
      setResult(r);
      if (r.status === 'ok' || r.status === 'already_enrolled') {
        // Flip the page to enrolled state — the redeem RPC already
        // inserted the server-side row.
        onSuccess(r.courseId ?? courseId);
        setCode('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const success = result && (result.status === 'ok' || result.status === 'already_enrolled');

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs font-semibold text-muted-foreground hover:text-pulse transition-colors"
        >
          {dict.promo.courseHasCodeCta} →
        </button>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-foreground">{dict.promo.courseHeading}</p>
            <button
              type="button"
              onClick={() => { setOpen(false); setResult(null); }}
              className="text-[10px] text-muted-foreground hover:text-foreground"
            >
              {dict.promo.courseHasCodeHide}
            </button>
          </div>
          <form onSubmit={submit} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={dict.promo.inputPlaceholder}
              aria-label={dict.promo.inputLabel}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-pulse/40 focus:border-pulse/40"
            />
            <button
              type="submit"
              disabled={submitting || !code.trim()}
              className="px-3 py-2 text-sm font-bold rounded-lg bg-pulse text-primary-foreground disabled:opacity-50 transition-all"
            >
              {submitting ? '…' : dict.promo.submit}
            </button>
          </form>
          {result && (
            <p
              className={cn(
                'mt-2 text-xs font-medium',
                success ? 'text-green-700' : 'text-red-600',
              )}
            >
              {redeemStatusLabel(result.status, dict)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BuyRailContent({
  course,
  detail,
  discount,
  hasPrice,
  tone,
  isLoggedIn,
  onEnroll,
  enrollBusy,
  onPromoRedeemed,
  previewHref,
}: {
  course: Course;
  detail: CourseDetail;
  discount: number;
  hasPrice: boolean;
  tone: keyof typeof TONE_CLASSES;
  isLoggedIn: boolean;
  onEnroll: () => void;
  enrollBusy: boolean;
  onPromoRedeemed: (courseId: string) => void;
  previewHref: string;
}) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[tone];
  return (
    <div className="relative px-5 sm:px-6 pt-6 pb-5">
      {/* Price hero */}
      <div className="flex items-end gap-2.5 flex-wrap">
        {hasPrice ? (
          <>
            <span
              className="text-[56px] font-black tabular-nums leading-[0.9]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ₾{course.price}
            </span>
            <div className="flex flex-col items-start gap-1 pb-1.5">
              {detail.retailPrice && detail.retailPrice > (course.price ?? 0) && (
                <span className="text-sm text-muted-foreground line-through tabular-nums leading-none">
                  ₾{detail.retailPrice}
                </span>
              )}
              {discount > 0 && (
                <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest', t.chip)}>
                  −{discount}% {dict.courseDetail.discountSuffix}
                </span>
              )}
            </div>
          </>
        ) : (
          <span
            className="text-[56px] font-black leading-[0.9]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dict.courseDetail.free}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {hasPrice ? dict.courseDetail.priceOnceForever : dict.courseDetail.freeFirstLessonNote}
      </p>

      {/* Social proof */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Users className={cn('w-3.5 h-3.5', t.text)} />
          <span className="font-bold tabular-nums">2,400+</span>
          <span className="text-muted-foreground">{dict.courseDetail.studentsUnit}</span>
        </span>
        <span className="text-muted-foreground/40">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="font-bold tabular-nums">4.8</span>
          <span className="text-muted-foreground">/ 5</span>
        </span>
      </div>

      {/* Primary CTA — full-bleed, glow, prominent */}
      <button
        type="button"
        onClick={onEnroll}
        disabled={enrollBusy}
        className="group/cta mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pulse text-primary-foreground h-14 text-base font-bold shadow-[0_12px_30px_var(--pulse-glow)] hover:shadow-[0_18px_45px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-70 disabled:translate-y-0 disabled:active:scale-100"
      >
        {enrollBusy ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{hasPrice ? dict.catalog.bundleRedirecting : dict.catalog.bundleProcessing}</span>
          </>
        ) : (
          <>
            <span>
              {hasPrice
                ? `${dict.courseDetail.ctaBuyPrefix}₾${course.price}`
                : isLoggedIn
                  ? dict.courseDetail.ctaStartLearning
                  : dict.courseDetail.ctaStartFree}
            </span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover/cta:translate-x-1" />
          </>
        )}
      </button>

      {/* Secondary inline CTA — jumps straight into the first free lesson. */}
      <Link
        href={previewHref}
        className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-pulse transition-colors"
      >
        <Play className="w-3 h-3 fill-current" />
        <span>
          {dict.courseDetail.previewInlinePrefix}<span className="underline underline-offset-2">{dict.courseDetail.previewInlineLink}</span>
        </span>
      </Link>

      {/* Promo code expandable — only for users who haven't enrolled yet */}
      {isLoggedIn && (
        <CoursePromoExpandable courseId={course.id} onSuccess={onPromoRedeemed} />
      )}

      {/* Trust pills */}
      <div className="mt-5 rounded-2xl bg-muted/40 p-3 space-y-2.5">
        <TrustPill icon={InfinityIcon} tone={tone}>
          {dict.courseDetail.trustLifetimeBuy}
        </TrustPill>
        <TrustPill icon={ShieldCheck} tone={tone}>
          {dict.courseDetail.trustRefund}
        </TrustPill>
        <TrustPill icon={Award} tone={tone}>
          {dict.courseDetail.trustCertificateComplete}
        </TrustPill>
      </div>
    </div>
  );
}

function EnrolledRailContent({
  course,
  progressPct,
  completedCount,
  totalLessons,
  tone,
}: {
  course: Course;
  progressPct: number;
  completedCount: number;
  totalLessons: number;
  tone: keyof typeof TONE_CLASSES;
}) {
  const { dict } = useV2Locale();
  const reduced = useReducedMotion();
  return (
    <div className="relative px-5 sm:px-6 pt-6 pb-5">
      <div className="flex items-center gap-3">
        <ProgressRing pct={progressPct} tone={tone} />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
            {dict.courseDetail.youAreEnrolled}
          </p>
          <p
            className="text-base font-bold mt-0.5 truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {course.title}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/40 p-3.5">
        <p className="text-[11px] text-muted-foreground mb-1.5">{dict.courseDetail.progressLabel}</p>
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="tabular-nums">
            {completedCount}/{totalLessons}
          </span>
          <span className="tabular-nums text-pulse">{progressPct}%</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-pulse/15 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={reduced ? { duration: 0 } : { duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full bg-pulse"
          />
        </div>
      </div>

      <a
        href="#curriculum"
        className="group/cta mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pulse text-primary-foreground h-14 text-base font-bold shadow-[0_12px_30px_var(--pulse-glow)] hover:shadow-[0_18px_45px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
      >
        <span>{dict.courseDetail.heroContinueLesson}</span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover/cta:translate-x-1" />
      </a>
    </div>
  );
}

function ProgressRing({ pct, tone }: { pct: number; tone: keyof typeof TONE_CLASSES }) {
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (circ * pct) / 100;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90 flex-shrink-0">
      <circle cx="28" cy="28" r={radius} className="fill-none stroke-muted" strokeWidth="4" />
      <motion.circle
        cx="28"
        cy="28"
        r={radius}
        className="fill-none stroke-pulse"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  );
}

/* ============================================================
   CTA banner
   ============================================================ */

function CtaBanner({
  course,
  isEnrolled,
  onEnroll,
  enrollBusy,
  previewHref,
}: {
  course: Course;
  isEnrolled: boolean;
  onEnroll: () => void;
  enrollBusy: boolean;
  previewHref: string;
}) {
  const { dict } = useV2Locale();
  return (
    <section className="px-4 sm:px-6 pb-16 sm:pb-24">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-pulse/40 bg-card p-8 sm:p-12">
          <div className="absolute inset-0 -z-10 opacity-50 bg-starfield" aria-hidden />
          <div className="absolute -bottom-12 -right-12 w-72 h-72 rounded-full bg-pulse/20 blur-3xl" aria-hidden />
          <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-heart/15 blur-3xl" aria-hidden />

          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4 text-center md:text-left">
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {isEnrolled ? dict.courseDetail.ctaBannerEnrolledTitle : dict.courseDetail.ctaBannerTitle}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
                {isEnrolled
                  ? dict.courseDetail.ctaBannerEnrolledDesc
                  : dict.courseDetail.ctaBannerDesc}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {isEnrolled ? (
                  <a
                    href="#curriculum"
                    className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                  >
                    {dict.courseDetail.heroContinueLesson}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <>
                    <button
                      onClick={onEnroll}
                      disabled={enrollBusy}
                      className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:translate-y-0"
                    >
                      {enrollBusy ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {course.price && course.price > 0
                            ? dict.catalog.bundleRedirecting
                            : dict.catalog.bundleProcessing}
                        </>
                      ) : (
                        <>
                          {course.price && course.price > 0 ? `${dict.courseDetail.ctaBuyPrefix}₾${course.price}` : dict.courseDetail.ctaStartFree}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                    <Link
                      href={previewHref}
                      className="text-sm font-bold text-pulse hover:underline"
                    >
                      {dict.courseDetail.tryFirst}
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Walle size={180} state={isEnrolled ? 'dance' : 'wave'} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Mobile bottom bar
   ============================================================ */

function MobileBottomBar({
  course,
  category,
  isEnrolled,
  progressPct,
  onEnroll,
  enrollBusy,
}: {
  course: Course;
  category: Category;
  isEnrolled: boolean;
  progressPct: number;
  onEnroll: () => void;
  enrollBusy: boolean;
}) {
  const { dict } = useV2Locale();
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.36, 0.64, 1] }}
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 backdrop-blur-md bg-background/90 border-t border-border safe-area-bottom"
    >
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {isEnrolled ? (
            <>
              <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">{dict.courseDetail.progressLabel}</p>
              <div className="mt-0.5 h-1.5 rounded-full bg-pulse/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-pulse transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{progressPct}% {dict.courseDetail.percentComplete}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">{dict.courseDetail.priceLabel}</p>
              <p className="text-lg font-bold tabular-nums leading-none mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {course.price && course.price > 0 ? `₾${course.price}` : dict.courseDetail.free}
              </p>
            </>
          )}
        </div>
        {isEnrolled ? (
          <a
            href="#curriculum"
            className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-[0_8px_24px_var(--pulse-glow)]"
          >
            {dict.courseDetail.continueShort}
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            disabled={enrollBusy}
            className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-[0_8px_24px_var(--pulse-glow)] disabled:opacity-70"
          >
            {enrollBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {dict.courseDetail.startShort}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ============================================================
   Footer
   ============================================================ */

function Footer() {
  const { dict, href } = useV2Locale();
  return (
    <footer className="border-t border-border bg-muted/30 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Link href={href()} className="inline-flex items-center gap-2">
            <Walle size={32} state="idle" noShadow />
            <span className="text-base font-bold">{dict.meta.brandName}</span>
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href={href()} className="text-muted-foreground hover:text-foreground">{dict.courseDetail.footerHome}</Link>
            <Link href={`${href()}#categories`} className="text-muted-foreground hover:text-foreground">{dict.courseDetail.footerCategories}</Link>
            <Link href={`${href()}#courses`} className="text-muted-foreground hover:text-foreground">{dict.courseDetail.footerCourses}</Link>
          </nav>
          <p className="text-xs text-muted-foreground">© 2026 {dict.meta.brandName}</p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   Section header (shared)
   ============================================================ */

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="space-y-2.5 max-w-2xl">
      <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold">{eyebrow}</p>
      <h2
        className="text-2xl sm:text-3xl font-bold tracking-tight leading-[1.15]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{description}</p>
      )}
    </header>
  );
}

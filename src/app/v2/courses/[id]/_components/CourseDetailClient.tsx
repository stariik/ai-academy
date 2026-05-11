'use client';

/**
 * walle.school — course detail page
 *
 * Layout
 *   1. Navbar (sticky, mirrors /v2)
 *   2. Hero — asymmetric: course identity on the left, large Walli with
 *      orbiting badges on the right.
 *   3. Two-column body (lg+):
 *        Main col: outcomes → walli intro → curriculum → free preview →
 *                  reviews → FAQ → related
 *        Side rail: sticky purchase / progress card
 *   4. CTA banner
 *   5. Footer
 *   6. Mobile bottom-bar (sticky; appears only on small screens)
 *   7. "View as" dev toggle (cycles logged-out / not-enrolled / enrolled)
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Check, ChevronDown, ChevronRight, Clock, Lock, Play, Sparkles,
  Star, ArrowRight, ArrowLeft, Heart, BookOpen, Users,
  CircleDot, Trophy, Eye, X, Zap,
  ShieldCheck, Award, Infinity as InfinityIcon, MessageCircle, GraduationCap,
} from 'lucide-react';

import { Walli, type WalliState } from '@/components/walli/Walli';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import {
  AUDIENCE_LABEL, LEVEL_LABEL, LEVEL_DOTS, TONE_CLASSES,
  type Course, type Category, type CourseDetail, type Module, type Lesson,
} from '@/lib/v2/data';

/* ============================================================
   Mock enrollment (until real auth + DB lands)
   ============================================================ */

const ENROLLMENT_KEY = 'ai_academy_enrollments';
const VIEW_AS_KEY = 'ai_academy_view_as';
type ViewAs = 'guest' | 'logged-in' | 'enrolled';

function readEnrollments(): string[] {
  try {
    const raw = localStorage.getItem(ENROLLMENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function writeEnrollments(ids: string[]) {
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
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  related: Course[];
}) {
  return <CoursePage course={course} category={category} detail={detail} related={related} />;
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
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  related: Course[];
}) {
  // --- view state -----------------------------------------------------------
  const { user } = useAuth();
  const [viewAs, setViewAs] = React.useState<ViewAs | null>(null);
  const [enrollments, setEnrollments] = React.useState<string[]>([]);
  const [progress, setProgress] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    setEnrollments(readEnrollments());
    setProgress(readProgress(course.id));
    const stored = localStorage.getItem(VIEW_AS_KEY) as ViewAs | null;
    setViewAs(stored ?? (user ? 'logged-in' : 'guest'));
  }, [course.id, user]);

  const effectiveState: ViewAs =
    viewAs ?? (user ? (enrollments.includes(course.id) ? 'enrolled' : 'logged-in') : 'guest');

  const isEnrolled = effectiveState === 'enrolled';
  const isLoggedIn = effectiveState !== 'guest';

  const toggleEnrollment = React.useCallback(() => {
    setEnrollments((prev) => {
      const next = prev.includes(course.id)
        ? prev.filter((x) => x !== course.id)
        : [...prev, course.id];
      writeEnrollments(next);
      return next;
    });
  }, [course.id]);

  const toggleLessonComplete = React.useCallback(
    (lessonId: string) => {
      setProgress((prev) => {
        const next = new Set(prev);
        if (next.has(lessonId)) next.delete(lessonId);
        else next.add(lessonId);
        localStorage.setItem(
          `${ENROLLMENT_KEY}:${course.id}:progress`,
          JSON.stringify(Array.from(next)),
        );
        return next;
      });
    },
    [course.id],
  );

  const totalLessons = detail.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = progress.size;
  const progressPct = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  // --- render ---------------------------------------------------------------
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

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
        />

        <section className="px-4 sm:px-6 pb-20 sm:pb-28">
          <div className="mx-auto max-w-7xl grid gap-10 lg:gap-14 lg:grid-cols-[1fr_360px]">
            {/* MAIN ───────────────────────────────────── */}
            <div className="min-w-0 space-y-16 sm:space-y-20">
              <OutcomesSection detail={detail} category={category} />
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
              />
              <WalliIntroSection course={course} detail={detail} />
            </aside>
          </div>
        </section>

        <CtaBanner course={course} isEnrolled={isEnrolled} onEnroll={toggleEnrollment} />
      </main>

      <Footer />

      <MobileBottomBar
        course={course}
        category={category}
        isEnrolled={isEnrolled}
        progressPct={progressPct}
        onEnroll={toggleEnrollment}
      />

      <ViewAsToggle
        viewAs={effectiveState}
        onChange={(v) => {
          setViewAs(v);
          localStorage.setItem(VIEW_AS_KEY, v);
          if (v === 'enrolled' && !enrollments.includes(course.id)) {
            const next = [...enrollments, course.id];
            setEnrollments(next);
            writeEnrollments(next);
          }
          if (v !== 'enrolled' && enrollments.includes(course.id)) {
            const next = enrollments.filter((x) => x !== course.id);
            setEnrollments(next);
            writeEnrollments(next);
          }
        }}
      />
    </div>
  );
}

/* ============================================================
   Navbar — minimal, mirrors /v2 visual shell
   ============================================================ */

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all',
        scrolled
          ? 'backdrop-blur-md bg-background/80 border-b border-border'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between h-16">
        <a href="/v2" className="flex items-center gap-2">
          <Walli size={36} state="idle" noShadow />
          <div>
            <p className="text-base font-bold leading-none tracking-tight">walle.school</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-1">AI ქართულად</p>
          </div>
        </a>

        <a
          href="/v2#courses"
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ყველა კურსი
        </a>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="/v2#"
            className="hidden sm:inline-flex text-sm font-semibold px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            შესვლა
          </a>
          <a
            href="/v2#"
            className="inline-flex text-sm font-semibold rounded-full bg-pulse text-primary-foreground px-4 py-2 hover:shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
          >
            რეგისტრაცია
          </a>
        </div>
      </div>
    </header>
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
}: {
  course: Course;
  category: Category;
  detail: CourseDetail;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  progressPct: number;
  completedCount: number;
  totalLessons: number;
}) {
  const t = TONE_CLASSES[category.tone];
  const reduced = useReducedMotion();
  const [walliState, setWalliState] = React.useState<WalliState>('idle');

  React.useEffect(() => {
    setWalliState('wave');
    const id = setTimeout(() => setWalliState('idle'), 4200);
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
          <a
            href={`/v2#cat-${category.id}`}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-bold transition-all hover:-translate-x-0.5',
              t.ring,
            )}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className={t.text}>{category.icon}</span>
            <span>{category.nameKa}</span>
          </a>
        </motion.div>

        <div className="grid gap-10 lg:gap-14 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          {/* LEFT — text & meta */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="order-2 lg:order-1 space-y-5 sm:space-y-6"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold', t.chip)}>
                <Sparkles className="w-3.5 h-3.5" />
                {LEVEL_LABEL[course.level]}
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-card/80 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {AUDIENCE_LABEL[course.audience]}
              </span>
              {isEnrolled && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-2.5 py-1 text-[11px] font-bold">
                  <Trophy className="w-3.5 h-3.5" />
                  ჩარიცხული
                </span>
              )}
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {course.titleKa}
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
              {detail.longDescriptionKa}
            </p>

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
              <Stat icon={<BookOpen className="w-4 h-4" />} label={`${course.lessons} გაკვეთილი`} />
              <Stat icon={<Clock className="w-4 h-4" />} label={`~${course.hours} საათი`} />
              <Stat icon={<LevelDots level={course.level} tone={category.tone} />} label={LEVEL_LABEL[course.level]} />
              <Stat icon={<Users className="w-4 h-4" />} label="2,400+ მოსწავლე" />
            </div>

            {/* Hero CTA — visible on mobile (purchase rail handles desktop) */}
            <div className="lg:hidden pt-2 flex flex-wrap gap-3">
              {isEnrolled ? (
                <a href="#curriculum" className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)]">
                  გააგრძელე გაკვეთილი
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <a href="#preview" className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)]">
                  უფასო გასინჯვა
                  <Play className="w-4 h-4 fill-current" />
                </a>
              )}
            </div>

            {/* Enrolled progress mini */}
            {isEnrolled && totalLessons > 0 && (
              <div className="rounded-2xl border border-pulse/30 bg-pulse/5 p-4 max-w-md">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-pulse">შენი პროგრესი</span>
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

          {/* RIGHT — Walli + orbiting badges */}
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
              <Walli size={260} state={walliState} />

              {/* Orbiting course-icon medallion */}
              <motion.div
                aria-hidden
                animate={reduced ? undefined : { y: [0, -10, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                className={cn(
                  'absolute -top-3 -right-3 w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border bg-card shadow-[0_12px_30px_rgba(0,0,0,0.10)]',
                  t.ring,
                )}
              >
                <span className="-rotate-6">{course.icon}</span>
              </motion.div>

              {/* Floating chips */}
              <FloatingPill
                className="-bottom-1 -left-6 sm:-left-12"
                delay={0.3}
                tone={category.tone}
                icon="✨"
                label="AI მასწავლებელი"
              />
              <FloatingPill
                className="top-10 -right-10 sm:-right-16"
                delay={0.6}
                tone={category.tone}
                icon="🎯"
                label={`${course.lessons} გაკვეთილი`}
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
   Outcomes
   ============================================================ */

function OutcomesSection({ detail, category }: { detail: CourseDetail; category: Category }) {
  const t = TONE_CLASSES[category.tone];
  if (detail.outcomesKa.length === 0) return null;
  return (
    <section>
      <div className="mb-4 sm:mb-5">
        <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">რას ისწავლი</p>
        <h2
          className="mt-1.5 text-base sm:text-lg font-bold tracking-tight leading-snug"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ოთხი რეალური უნარი — და ერთი ნაკლები საფიქრალი.
        </h2>
      </div>

      <div className="grid gap-2.5 sm:gap-3 grid-cols-2 lg:grid-cols-4 items-start">
        {detail.outcomesKa.map((o, i) => (
          <motion.div
            key={o.titleKa}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.35, delay: i * 0.05, ease: 'easeOut' }}
            className="group relative"
          >
            {/* Static card — always occupies the grid cell so the row never grows on hover. */}
            <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 transition-opacity duration-200 group-hover:opacity-0">
              <div className={cn('inline-flex items-center justify-center w-7 h-7 rounded-lg mb-2', t.iconBg, t.text)}>
                <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
              </div>
              <h3
                className="text-xs sm:text-sm font-bold leading-snug line-clamp-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {o.titleKa}
              </h3>
              {o.descriptionKa && (
                <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {o.descriptionKa}
                </p>
              )}
            </div>

            {/* Expanded overlay — absolute, doesn't affect the grid; appears on hover. */}
            <div
              className="pointer-events-none absolute top-0 left-0 right-0 rounded-xl border border-pulse/40 bg-card p-3.5 sm:p-4 opacity-0 scale-95 origin-top shadow-[0_18px_50px_rgba(0,0,0,0.14)] transition-all duration-300 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-[1.12] group-hover:z-20"
            >
              <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg mb-2.5', t.iconBg, t.text)}>
                <Check className="w-4 h-4" strokeWidth={2.8} />
              </div>
              <h3
                className="text-sm font-bold leading-snug"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {o.titleKa}
              </h3>
              {o.descriptionKa && (
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {o.descriptionKa}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ============================================================
   Walli teacher intro
   ============================================================ */

function WalliIntroSection({ course, detail }: { course: Course; detail: CourseDetail }) {
  const [walliState, setWalliState] = React.useState<WalliState>('idle');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setWalliState('wave');
            setTimeout(() => setWalliState('idle'), 3200);
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
            onMouseEnter={() => setWalliState('tilt')}
            onMouseLeave={() => setWalliState('idle')}
            className="cursor-pointer"
          >
            <Walli size={108} state={walliState} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
              შენი მასწავლებელი
            </p>
            <h3
              className="mt-1 text-xl font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              გაიცანით Walli
            </h3>
          </div>

          <blockquote className="relative text-sm leading-relaxed text-foreground/90 px-1">
            <span
              className="absolute -left-1 -top-2 text-3xl text-pulse/30 leading-none select-none"
              aria-hidden
            >
              "
            </span>
            <span className="relative">{detail.walliQuoteKa}</span>
          </blockquote>

          <p className="text-xs text-muted-foreground leading-relaxed">
            გაკვეთილში ნებისმიერ წერტილში მკითხე — ვუპასუხებ ისე, როგორც გესაჭიროება.{' '}
            <span className="text-foreground font-semibold">{course.titleKa}</span> — ერთად დავიწყოთ.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Curriculum
   ============================================================ */

function CurriculumSection({
  course,
  category,
  detail,
  isEnrolled,
  isLoggedIn,
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
  const [openModuleId, setOpenModuleId] = React.useState<string | null>(detail.modules[0]?.id ?? null);

  return (
    <section id="curriculum" className="scroll-mt-24">
      <SectionHeader
        eyebrow="კურიკულუმი"
        title={`${detail.modules.length} მოდული, ${course.lessons} გაკვეთილი`}
        description="სამი ნაბიჯი — საფუძვლები, პრაქტიკა, შენი პროექტი. ყოველი გაკვეთილი ცოცხალი დიალოგი ჩვენს შორის."
      />

      <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-4">
        {detail.modules.map((m, i) => (
          <ModuleCard
            key={m.id}
            module={m}
            index={i}
            category={category}
            open={openModuleId === m.id}
            onToggle={() => setOpenModuleId(openModuleId === m.id ? null : m.id)}
            isEnrolled={isEnrolled}
            isLoggedIn={isLoggedIn}
            progress={progress}
            onToggleLesson={onToggleLesson}
          />
        ))}
      </div>
    </section>
  );
}

function ModuleCard({
  module,
  index,
  category,
  open,
  onToggle,
  isEnrolled,
  isLoggedIn,
  progress,
  onToggleLesson,
}: {
  module: Module;
  index: number;
  category: Category;
  open: boolean;
  onToggle: () => void;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  progress: Set<string>;
  onToggleLesson: (lessonId: string) => void;
}) {
  const t = TONE_CLASSES[category.tone];
  const totalMin = module.lessons.reduce((acc, l) => acc + l.durationMin, 0);
  const completedInModule = module.lessons.filter((l) => progress.has(l.id)).length;
  const allComplete = completedInModule === module.lessons.length && module.lessons.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
      className={cn(
        'overflow-hidden rounded-2xl border bg-card transition-colors',
        open ? 'border-pulse/40' : 'border-border hover:border-pulse/25',
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left p-4 sm:p-5 flex items-center gap-4"
        aria-expanded={open}
      >
        <div
          className={cn(
            'flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-base font-bold tabular-nums',
            allComplete && isEnrolled ? 'bg-pulse text-primary-foreground' : cn(t.iconBg, t.text),
          )}
        >
          {allComplete && isEnrolled ? <Check className="w-5 h-5" strokeWidth={2.6} /> : (index + 1).toString().padStart(2, '0')}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold leading-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {module.titleKa}
          </h3>
          <div className="mt-1 flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
            <span>{module.lessons.length} გაკვეთილი</span>
            <span className="opacity-50">·</span>
            <span>~{Math.round(totalMin / 60 * 10) / 10} საათი</span>
            {isEnrolled && (
              <>
                <span className="opacity-50">·</span>
                <span className="font-bold text-pulse tabular-nums">
                  {completedInModule}/{module.lessons.length}
                </span>
              </>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            'flex-shrink-0 w-5 h-5 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 border-t border-border">
              {module.taglineKa && (
                <p className="text-xs text-muted-foreground italic mb-3 mt-3">{module.taglineKa}</p>
              )}
              <ul className="divide-y divide-border/60">
                {module.lessons.map((l) => (
                  <LessonRow
                    key={l.id}
                    lesson={l}
                    category={category}
                    isEnrolled={isEnrolled}
                    isLoggedIn={isLoggedIn}
                    isCompleted={progress.has(l.id)}
                    onToggleComplete={() => onToggleLesson(l.id)}
                  />
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function LessonRow({
  lesson,
  category,
  isEnrolled,
  isLoggedIn,
  isCompleted,
  onToggleComplete,
}: {
  lesson: Lesson;
  category: Category;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  isCompleted: boolean;
  onToggleComplete: () => void;
}) {
  const t = TONE_CLASSES[category.tone];
  const isLocked = !isEnrolled && !lesson.isFree;

  return (
    <li className="group relative flex items-center gap-3 py-3 px-1">
      {/* Number / status */}
      <button
        type="button"
        onClick={isEnrolled ? onToggleComplete : undefined}
        aria-label={isCompleted ? 'მონიშნე დაუსრულებლად' : 'მონიშნე დასრულებულად'}
        disabled={!isEnrolled}
        className={cn(
          'flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold tabular-nums transition-all',
          isCompleted
            ? 'bg-pulse text-primary-foreground'
            : isLocked
              ? 'bg-muted text-muted-foreground/70'
              : cn('bg-muted text-foreground', isEnrolled && 'group-hover:bg-pulse/20 group-hover:text-pulse cursor-pointer'),
        )}
      >
        {isCompleted ? <Check className="w-4 h-4" strokeWidth={2.6} /> : isLocked ? <Lock className="w-3.5 h-3.5" /> : lesson.numberLabel}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm sm:text-[0.95rem] font-semibold leading-snug truncate',
          isCompleted && 'text-muted-foreground line-through decoration-1 decoration-pulse/40',
        )}>
          {lesson.titleKa}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {lesson.durationMin} წთ
          </span>
          {lesson.isFree && (
            <>
              <span className="opacity-40">·</span>
              <span className={cn('inline-flex items-center gap-1 font-bold rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest', t.chip, 'border')}>
                <Eye className="w-3 h-3" />
                უფასო
              </span>
            </>
          )}
        </p>
      </div>

      {(isEnrolled || lesson.isFree) ? (
        <button
          type="button"
          className={cn(
            'flex-shrink-0 inline-flex items-center gap-1 text-xs font-bold rounded-full px-2.5 py-1 transition-all',
            isCompleted
              ? 'text-pulse hover:gap-1.5'
              : 'text-foreground hover:text-pulse hover:gap-1.5',
          )}
        >
          {isCompleted ? 'გადახედვა' : 'დაწყება'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <span className="flex-shrink-0 text-[11px] font-semibold text-muted-foreground">—</span>
      )}
    </li>
  );
}

/* ============================================================
   Related courses
   ============================================================ */

function RelatedCoursesSection({ related, category: cat }: { related: Course[]; category: Category }) {
  if (related.length === 0) return null;
  return (
    <section>
      <SectionHeader
        eyebrow="გააგრძელე"
        title="სხვა კურსები ამავე კატეგორიიდან"
      />

      <div className="mt-8 sm:mt-10 -mx-4 sm:mx-0 px-4 sm:px-0 flex sm:grid gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible sm:grid-cols-2 pb-2 sm:pb-0 snap-x">
        {related.map((co, i) => {
          const t = TONE_CLASSES[cat.tone];
          return (
            <motion.a
              key={co.id}
              href={`/v2/courses/${co.id}`}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: i * 0.06 }}
              className="group flex-shrink-0 sm:flex-shrink w-[280px] sm:w-auto rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:border-pulse/40 hover:shadow-[0_12px_40px_var(--pulse-glow)] transition-all snap-start"
            >
              <div className={cn('relative aspect-[16/9] flex items-center justify-center', t.gradient)}>
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-3xl', t.iconBg)}>
                  {co.icon}
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <h4 className="text-base font-bold leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
                  {co.titleKa}
                </h4>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{co.lessons} გაკვეთილი · ~{co.hours} სთ</span>
                  <span className="font-bold tabular-nums">₾{co.price}</span>
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
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
}) {
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
        />
      )}

      {/* What's included — icon rows */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-3">
          რა შედის
        </p>
        <ul className="space-y-2.5">
          {detail.whatsIncludedKa.map((item, i) => {
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
      {detail.prerequisitesKa.length > 0 && (
        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-border pt-5">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold mb-2">
            წინაპირობები
          </p>
          <ul className="space-y-1.5">
            {detail.prerequisitesKa.map((p) => (
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
  const t = TONE_CLASSES[category.tone];
  return (
    <a
      href="/v2#pricing"
      className={cn(
        'group block mx-5 sm:mx-6 mb-5 sm:mb-6 rounded-2xl border-2 border-dashed p-4 transition-all',
        t.ring,
        'hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]',
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn('flex-shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center', t.iconBg)}>
          {category.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-muted-foreground">
              ბანდლი
            </p>
            <span className={cn('inline-flex items-center rounded-full text-[10px] font-bold px-1.5 py-0.5 border', t.chip)}>
              −40%
            </span>
          </div>
          <p
            className="mt-0.5 text-sm font-bold leading-tight truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            მთელი კატეგორია
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            <span className="font-bold text-foreground tabular-nums">{category.courses}</span> კურსი
            <span className="opacity-50"> · </span>
            სამუდამოდ
          </p>
        </div>
        <ArrowRight className={cn('flex-shrink-0 w-4 h-4 transition-transform group-hover:translate-x-1', t.text)} />
      </div>
    </a>
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
}: {
  course: Course;
  detail: CourseDetail;
  discount: number;
  hasPrice: boolean;
  tone: keyof typeof TONE_CLASSES;
  isLoggedIn: boolean;
  onEnroll: () => void;
}) {
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
                  −{discount}% ფასდაკლება
                </span>
              )}
            </div>
          </>
        ) : (
          <span
            className="text-[56px] font-black leading-[0.9]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            უფასოდ
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {hasPrice ? 'ერთხელ. სამუდამოდ შენია.' : '1-ლი გაკვეთილი ხელმისაწვდომია ახლავე.'}
      </p>

      {/* Social proof */}
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <Users className={cn('w-3.5 h-3.5', t.text)} />
          <span className="font-bold tabular-nums">2,400+</span>
          <span className="text-muted-foreground">მოსწავლე</span>
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
        className="group/cta mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-pulse text-primary-foreground h-14 text-base font-bold shadow-[0_12px_30px_var(--pulse-glow)] hover:shadow-[0_18px_45px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
      >
        <span>
          {isLoggedIn
            ? 'დაიწყე სწავლა'
            : hasPrice
              ? `შეიძინე — ₾${course.price}`
              : 'დაიწყე უფასოდ'}
        </span>
        <ArrowRight className="w-5 h-5 transition-transform group-hover/cta:translate-x-1" />
      </button>

      {/* Secondary inline CTA */}
      <a
        href="#curriculum"
        className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-pulse transition-colors"
      >
        <Play className="w-3 h-3 fill-current" />
        <span>
          ან <span className="underline underline-offset-2">გასინჯე 1-ლი გაკვეთილი</span>
        </span>
      </a>

      {/* Trust pills */}
      <div className="mt-5 rounded-2xl bg-muted/40 p-3 space-y-2.5">
        <TrustPill icon={InfinityIcon} tone={tone}>
          სამუდამო წვდომა — ერთხელ ყიდულობ
        </TrustPill>
        <TrustPill icon={ShieldCheck} tone={tone}>
          7 დღე — უპირობო თანხის დაბრუნება
        </TrustPill>
        <TrustPill icon={Award} tone={tone}>
          ციფრული სერთიფიკატი დასრულებაზე
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
  const reduced = useReducedMotion();
  return (
    <div className="relative px-5 sm:px-6 pt-6 pb-5">
      <div className="flex items-center gap-3">
        <ProgressRing pct={progressPct} tone={tone} />
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
            შენ ხარ ჩარიცხული
          </p>
          <p
            className="text-base font-bold mt-0.5 truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {course.titleKa}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-muted/40 p-3.5">
        <p className="text-[11px] text-muted-foreground mb-1.5">პროგრესი</p>
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
        <span>გააგრძელე გაკვეთილი</span>
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
}: {
  course: Course;
  isEnrolled: boolean;
  onEnroll: () => void;
}) {
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
                {isEnrolled ? 'მზად ხარ გაგრძელებისთვის?' : 'გავაგრძელოთ ერთად?'}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
                {isEnrolled
                  ? 'დაბრუნდი იქ, სადაც შეჩერდი — Walli გელის. ყოველი გაკვეთილი — ერთი ნაბიჯით უფრო ახლოს.'
                  : 'ერთხელ ყიდულობ. სამუდამოდ შენია. პირველი გაკვეთილი — უფასოდ. დანარჩენი — შენი ტემპით.'}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                {isEnrolled ? (
                  <a
                    href="#curriculum"
                    className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                  >
                    გააგრძელე გაკვეთილი
                    <ArrowRight className="w-4 h-4" />
                  </a>
                ) : (
                  <>
                    <button
                      onClick={onEnroll}
                      className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                    >
                      {course.price && course.price > 0 ? `შეიძინე — ₾${course.price}` : 'დაიწყე უფასოდ'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <a
                      href="#preview"
                      className="text-sm font-bold text-pulse hover:underline"
                    >
                      ჯერ გავსინჯო
                    </a>
                  </>
                )}
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Walli size={180} state={isEnrolled ? 'dance' : 'wave'} />
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
}: {
  course: Course;
  category: Category;
  isEnrolled: boolean;
  progressPct: number;
  onEnroll: () => void;
}) {
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
              <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">პროგრესი</p>
              <div className="mt-0.5 h-1.5 rounded-full bg-pulse/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-pulse transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">{progressPct}% დასრულებული</p>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">ფასი</p>
              <p className="text-lg font-bold tabular-nums leading-none mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                {course.price && course.price > 0 ? `₾${course.price}` : 'უფასოდ'}
              </p>
            </>
          )}
        </div>
        {isEnrolled ? (
          <a
            href="#curriculum"
            className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-[0_8px_24px_var(--pulse-glow)]"
          >
            გააგრძელე
            <ArrowRight className="w-4 h-4" />
          </a>
        ) : (
          <button
            type="button"
            onClick={onEnroll}
            className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold whitespace-nowrap shadow-[0_8px_24px_var(--pulse-glow)]"
          >
            <Zap className="w-4 h-4" />
            დაიწყე
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
  return (
    <footer className="border-t border-border bg-muted/30 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <a href="/v2" className="inline-flex items-center gap-2">
            <Walli size={32} state="idle" noShadow />
            <span className="text-base font-bold">walle.school</span>
          </a>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <a href="/v2" className="text-muted-foreground hover:text-foreground">მთავარი</a>
            <a href="/v2#categories" className="text-muted-foreground hover:text-foreground">კატეგორიები</a>
            <a href="/v2#courses" className="text-muted-foreground hover:text-foreground">კურსები</a>
            <a href="/v2#pricing" className="text-muted-foreground hover:text-foreground">ფასები</a>
          </nav>
          <p className="text-xs text-muted-foreground">© 2026 walle.school</p>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   View-as toggle (dev tool)
   ============================================================ */

function ViewAsToggle({
  viewAs,
  onChange,
}: {
  viewAs: ViewAs;
  onChange: (v: ViewAs) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const labels: Record<ViewAs, string> = {
    guest: 'სტუმარი',
    'logged-in': 'შესული',
    enrolled: 'ჩარიცხული',
  };

  return (
    <div className="fixed left-3 bottom-3 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="mb-2 rounded-2xl border border-border bg-card shadow-[0_12px_40px_rgba(0,0,0,0.10)] p-2 w-52"
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-2 pt-1 pb-2">
              დემო რეჟიმი
            </p>
            {(['guest', 'logged-in', 'enrolled'] as ViewAs[]).map((v) => (
              <button
                key={v}
                onClick={() => {
                  onChange(v);
                  setOpen(false);
                }}
                className={cn(
                  'w-full text-left flex items-center justify-between px-2 py-2 rounded-lg text-sm transition-colors',
                  viewAs === v ? 'bg-pulse/10 text-pulse font-bold' : 'hover:bg-muted',
                )}
              >
                <span>{labels[v]}</span>
                {viewAs === v && <Check className="w-4 h-4" strokeWidth={2.6} />}
              </button>
            ))}
            <p className="text-[10px] text-muted-foreground px-2 pt-2 pb-1">
              მხოლოდ დროებითი — სანამ ნამდვილი auth ჩაირთვება.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'rounded-full bg-card/95 backdrop-blur-md border border-border shadow-[0_8px_24px_rgba(0,0,0,0.10)] px-3.5 py-2 text-xs font-bold inline-flex items-center gap-2 hover:border-pulse/40 transition-colors',
        )}
      >
        {open ? <X className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">ხედი:</span>
        <span className="text-pulse">{labels[viewAs]}</span>
      </button>
    </div>
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

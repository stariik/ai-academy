'use client';

/**
 * walle.school — public landing page (v2 rebuild)
 *
 * Sections:
 *   1. Navbar (sticky, transparent → solid on scroll, mobile menu)
 *   2. Hero (Walli + headline + audience pills + floating category chips)
 *   3. Categories overview (5 cards: AI Essentials, Business, Creative, Kids, Vibe Coding)
 *   4. Courses by category (each category as a row with 4 course cards, h-scroll on mobile)
 *   5. How it works (3 steps, each with a small Walli in the relevant state)
 *   6. Audience pillars (For Kids / Teens / Adults)
 *   7. Pricing teaser (single course vs category bundle, with -40% bundle highlight)
 *   8. Final CTA banner (Walli waving)
 *   9. Footer (full nav, language switch, social)
 *
 * Georgian-first. English glyphs sit alongside but Georgian leads. FiraGO is queued
 * for pre-flight; current rendering uses system Georgian fallback.
 */

import * as React from 'react';
import { Walli } from '@/components/walli/Walli';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';

/* ============================================================
   Data
   ============================================================ */

type AudienceTag = 'kids' | 'teens' | 'adults' | 'everyone';
type Tone = 'pulse' | 'heart' | 'amber' | 'violet' | 'indigo';

type Category = {
  id: string;
  nameKa: string;
  nameEn: string;
  taglineKa: string;
  audience: AudienceTag;
  courses: number;
  lessons: number;
  price: number;
  retailPrice: number;
  icon: string;
  tone: Tone;
};

type Course = {
  id: string;
  titleKa: string;
  categoryId: string;
  audience: AudienceTag;
  lessons: number;
  hours: number;
  price: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  icon: string;
};

const CATEGORIES: Category[] = [
  {
    id: 'ai-essentials',
    nameKa: 'AI საფუძვლები',
    nameEn: 'AI Essentials',
    taglineKa: 'სად დავიწყოთ AI-სთან მუშაობა — ნულიდან მოყოლებული.',
    audience: 'everyone',
    courses: 5,
    lessons: 60,
    price: 79,
    retailPrice: 145,
    icon: '🧭',
    tone: 'pulse',
  },
  {
    id: 'ai-for-business',
    nameKa: 'AI ბიზნესისთვის',
    nameEn: 'AI for Business',
    taglineKa: 'მარკეტინგი, გაყიდვები, ავტომატიზაცია — AI-ს დახმარებით.',
    audience: 'adults',
    courses: 8,
    lessons: 96,
    price: 119,
    retailPrice: 232,
    icon: '💼',
    tone: 'indigo',
  },
  {
    id: 'creative-tools',
    nameKa: 'შემოქმედებითი ხელსაწყოები',
    nameEn: 'Creative Tools',
    taglineKa: 'AI ხელოვნება, ვიდეო, მუსიკა — შენი იდეებისთვის.',
    audience: 'everyone',
    courses: 6,
    lessons: 72,
    price: 99,
    retailPrice: 174,
    icon: '🎨',
    tone: 'heart',
  },
  {
    id: 'kids-ai',
    nameKa: 'AI პატარებისთვის',
    nameEn: 'Kids AI',
    taglineKa: 'სათამაშო გაკვეთილები 6-12 წლის ბავშვებისთვის.',
    audience: 'kids',
    courses: 5,
    lessons: 50,
    price: 69,
    retailPrice: 109,
    icon: '🎈',
    tone: 'amber',
  },
  {
    id: 'vibe-coding',
    nameKa: 'Vibe Coding',
    nameEn: 'Vibe Coding',
    taglineKa: 'შექმენი აპლიკაციები AI-სთან ერთად — Cursor, Claude Code.',
    audience: 'teens',
    courses: 4,
    lessons: 64,
    price: 89,
    retailPrice: 156,
    icon: '⚡',
    tone: 'violet',
  },
];

const COURSES: Course[] = [
  // AI Essentials
  { id: 'what-is-ai', titleKa: 'რა არის AI?', categoryId: 'ai-essentials', audience: 'everyone', lessons: 6, hours: 2, price: 19, level: 'beginner', icon: '✨' },
  { id: 'chatgpt-basics', titleKa: 'ChatGPT საფუძვლები', categoryId: 'ai-essentials', audience: 'everyone', lessons: 12, hours: 4, price: 29, level: 'beginner', icon: '💬' },
  { id: 'prompt-engineering', titleKa: 'Prompt Engineering', categoryId: 'ai-essentials', audience: 'everyone', lessons: 14, hours: 5, price: 35, level: 'intermediate', icon: '🎯' },
  { id: 'ai-ethics', titleKa: 'AI ეთიკა და უსაფრთხოება', categoryId: 'ai-essentials', audience: 'everyone', lessons: 8, hours: 3, price: 25, level: 'beginner', icon: '🛡️' },

  // AI for Business
  { id: 'ai-marketing', titleKa: 'AI მარკეტინგისთვის', categoryId: 'ai-for-business', audience: 'adults', lessons: 16, hours: 6, price: 45, level: 'intermediate', icon: '📈' },
  { id: 'ai-sales', titleKa: 'AI გაყიდვების გუნდისთვის', categoryId: 'ai-for-business', audience: 'adults', lessons: 12, hours: 4, price: 39, level: 'intermediate', icon: '💼' },
  { id: 'ai-automation', titleKa: 'ავტომატიზაცია AI-ით', categoryId: 'ai-for-business', audience: 'adults', lessons: 14, hours: 5, price: 49, level: 'advanced', icon: '⚙️' },
  { id: 'ai-presentations', titleKa: 'AI პრეზენტაციებისთვის', categoryId: 'ai-for-business', audience: 'adults', lessons: 8, hours: 3, price: 29, level: 'beginner', icon: '📊' },

  // Creative Tools
  { id: 'midjourney', titleKa: 'Midjourney გზამკვლევი', categoryId: 'creative-tools', audience: 'everyone', lessons: 10, hours: 4, price: 29, level: 'beginner', icon: '🖼️' },
  { id: 'video-ai', titleKa: 'ვიდეო AI-ით', categoryId: 'creative-tools', audience: 'everyone', lessons: 12, hours: 5, price: 39, level: 'intermediate', icon: '🎬' },
  { id: 'ai-music', titleKa: 'AI მუსიკისთვის', categoryId: 'creative-tools', audience: 'everyone', lessons: 8, hours: 3, price: 25, level: 'beginner', icon: '🎵' },
  { id: 'photoshop-ai', titleKa: 'Photoshop AI ფუნქციები', categoryId: 'creative-tools', audience: 'everyone', lessons: 14, hours: 5, price: 35, level: 'intermediate', icon: '🎨' },

  // Kids AI
  { id: 'what-is-robot', titleKa: 'რა არის რობოტი?', categoryId: 'kids-ai', audience: 'kids', lessons: 8, hours: 2, price: 19, level: 'beginner', icon: '🤖' },
  { id: 'learn-with-ai', titleKa: 'ვისწავლოთ AI-სთან', categoryId: 'kids-ai', audience: 'kids', lessons: 10, hours: 3, price: 22, level: 'beginner', icon: '🌟' },
  { id: 'ai-games', titleKa: 'AI თამაშის ფორმით', categoryId: 'kids-ai', audience: 'kids', lessons: 12, hours: 3, price: 22, level: 'beginner', icon: '🎮' },
  { id: 'my-ai-friend', titleKa: 'ჩემი AI მეგობარი', categoryId: 'kids-ai', audience: 'kids', lessons: 8, hours: 2, price: 19, level: 'beginner', icon: '🎈' },

  // Vibe Coding
  { id: 'first-app-cursor', titleKa: 'პირველი აპი Cursor-ით', categoryId: 'vibe-coding', audience: 'teens', lessons: 12, hours: 5, price: 35, level: 'beginner', icon: '⚡' },
  { id: 'claude-code-school', titleKa: 'Claude Code სკოლისთვის', categoryId: 'vibe-coding', audience: 'teens', lessons: 14, hours: 6, price: 39, level: 'intermediate', icon: '🧠' },
  { id: 'website-chatgpt', titleKa: 'ვებსაიტი ChatGPT-ით', categoryId: 'vibe-coding', audience: 'teens', lessons: 16, hours: 6, price: 45, level: 'intermediate', icon: '🌐' },
  { id: 'ai-bot-creation', titleKa: 'AI ბოტის შექმნა', categoryId: 'vibe-coding', audience: 'teens', lessons: 14, hours: 6, price: 49, level: 'advanced', icon: '🤖' },
];

const TONE_CLASSES: Record<Tone, { iconBg: string; gradient: string; ring: string; text: string }> = {
  pulse: {
    iconBg: 'bg-pulse/10',
    gradient: 'bg-gradient-to-br from-pulse/20 via-transparent to-transparent',
    ring: 'border-pulse/40',
    text: 'text-pulse',
  },
  heart: {
    iconBg: 'bg-heart/10',
    gradient: 'bg-gradient-to-br from-heart/20 via-transparent to-transparent',
    ring: 'border-heart/40',
    text: 'text-heart',
  },
  amber: {
    iconBg: 'bg-amber-500/10',
    gradient: 'bg-gradient-to-br from-amber-500/20 via-transparent to-transparent',
    ring: 'border-amber-500/40',
    text: 'text-amber-600 dark:text-amber-400',
  },
  violet: {
    iconBg: 'bg-violet-500/10',
    gradient: 'bg-gradient-to-br from-violet-500/20 via-transparent to-transparent',
    ring: 'border-violet-500/40',
    text: 'text-violet-600 dark:text-violet-400',
  },
  indigo: {
    iconBg: 'bg-indigo-500/10',
    gradient: 'bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent',
    ring: 'border-indigo-500/40',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
};

const AUDIENCE_LABEL: Record<AudienceTag, string> = {
  everyone: 'ყველასთვის',
  kids: 'ბავშვები',
  teens: 'ახალგაზრდები',
  adults: 'უფროსები',
};

const LEVEL_LABEL = {
  beginner: 'საწყისი',
  intermediate: 'საშუალო',
  advanced: 'მაღალი',
};

/* ============================================================
   Page
   ============================================================ */

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <CategoriesOverview />
        <CoursesByCategory />
        <HowItWorks />
        <AudienceSection />
        <PricingTeaser />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}

/* ============================================================
   Navbar
   ============================================================ */

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_LINKS = [
    { label: 'კატეგორიები', href: '#categories' },
    { label: 'კურსები', href: '#courses' },
    { label: 'როგორ მუშაობს', href: '#how' },
    { label: 'ფასები', href: '#pricing' },
  ];

  return (
    <>
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

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            <a
              href="#"
              className="hidden sm:inline-flex text-sm font-semibold px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              შესვლა
            </a>
            <a
              href="#"
              className="hidden sm:inline-flex text-sm font-semibold rounded-full bg-pulse text-primary-foreground px-4 py-2 hover:shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              რეგისტრაცია
            </a>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileMenu links={NAV_LINKS} onClose={() => setMobileOpen(false)} />}
    </>
  );
}

function LanguageSwitcher() {
  const [lang, setLang] = React.useState<'KA' | 'EN'>('KA');
  return (
    <div className="hidden sm:flex items-center text-[11px] font-bold rounded-full border border-border bg-card overflow-hidden">
      {(['KA', 'EN'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            'px-2 py-1 transition-colors',
            lang === l
              ? 'bg-pulse text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function MobileMenu({
  links,
  onClose,
}: {
  links: { label: string; href: string }[];
  onClose: () => void;
}) {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background/98 backdrop-blur-md md:hidden flex flex-col">
      <div className="flex items-center justify-between px-4 h-16 border-b border-border">
        <a href="/v2" className="flex items-center gap-2" onClick={onClose}>
          <Walli size={32} state="idle" noShadow />
          <span className="text-base font-bold">walle.school</span>
        </a>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="p-2 rounded-lg hover:bg-muted text-foreground"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="flex-1 flex flex-col px-6 py-6 gap-1 overflow-y-auto">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.href}
            onClick={onClose}
            className="py-4 border-b border-border text-2xl font-bold hover:text-pulse transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {l.label}
          </a>
        ))}

        <div className="mt-8 space-y-3">
          <a
            href="#"
            className="block text-center rounded-full bg-pulse text-primary-foreground px-5 py-3.5 text-base font-bold shadow-[0_4px_16px_var(--pulse-glow)]"
          >
            რეგისტრაცია
          </a>
          <a
            href="#"
            className="block text-center text-base font-semibold text-foreground hover:text-pulse transition-colors py-2"
          >
            შესვლა
          </a>
        </div>
      </nav>
    </div>
  );
}

/* ============================================================
   Hero
   ============================================================ */

function useHeroWalliSize() {
  const [size, setSize] = React.useState(240);
  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 380) setSize(180);
      else if (w < 640) setSize(220);
      else if (w < 1024) setSize(240);
      else setSize(280);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

function Hero() {
  const walliSize = useHeroWalliSize();

  return (
    <section className="relative pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-32 px-4 sm:px-6">
      <div className="absolute inset-0 -z-10 bg-starfield opacity-50" aria-hidden />
      <div className="absolute top-1/4 left-0 w-96 h-96 rounded-full bg-pulse/10 blur-3xl -z-10" aria-hidden />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-heart/10 blur-3xl -z-10" aria-hidden />

      <div className="mx-auto max-w-7xl grid gap-10 lg:gap-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        {/* Walli first on mobile, second on desktop */}
        <div className="order-1 lg:order-2 flex items-center justify-center">
          <div className="relative">
            <Walli size={walliSize} state="wave" />

            {/* Floating category chips */}
            <FloatingChip className="-top-2 -left-4 sm:-left-12" delay="0s" tone="pulse">
              <span>🧭</span>
              <span>AI საფუძვლები</span>
            </FloatingChip>
            <FloatingChip className="top-12 -right-2 sm:-right-12" delay="0.6s" tone="heart">
              <span>🎨</span>
              <span>შემოქმედება</span>
            </FloatingChip>
            <FloatingChip className="-bottom-2 left-6 sm:left-2" delay="1.2s" tone="amber">
              <span>🎈</span>
              <span>ბავშვებისთვის</span>
            </FloatingChip>
          </div>
        </div>

        <div className="order-2 lg:order-1 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 text-pulse px-3 py-1.5 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" />
            ქართული AI აკადემია
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            შენი პირადი{' '}
            <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
              AI მასწავლებელი
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Walli ასწავლის ქართულად — შენი ტემპით, არასოდეს იღლება. ბავშვებიდან პროფესიონალებამდე,
            კურსი ყველასთვის მოიძებნება.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
            <a
              href="#categories"
              className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              კატეგორიების ნახვა
              <span aria-hidden>→</span>
            </a>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-6 py-3 text-sm font-bold text-foreground hover:border-pulse/40 transition-colors"
            >
              უფასო გაკვეთილი
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-3">
            <span className="text-xs text-muted-foreground">აგებული ყველასთვის:</span>
            <AudiencePill>ბავშვები 6-12</AudiencePill>
            <AudiencePill>ახალგაზრდები</AudiencePill>
            <AudiencePill>უფროსები</AudiencePill>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingChip({
  children,
  className,
  delay,
  tone,
}: {
  children: React.ReactNode;
  className?: string;
  delay: string;
  tone: 'pulse' | 'heart' | 'amber';
}) {
  const ring =
    tone === 'pulse' ? 'border-pulse/30' : tone === 'heart' ? 'border-heart/30' : 'border-amber-500/30';
  const glow =
    tone === 'pulse'
      ? 'shadow-[0_4px_16px_var(--pulse-glow)]'
      : tone === 'heart'
        ? 'shadow-[0_4px_16px_var(--heart-glow)]'
        : 'shadow-[0_4px_16px_rgba(245,158,11,0.20)]';
  return (
    <div
      className={cn('absolute float', className)}
      style={{ animationDelay: delay }}
    >
      <div
        className={cn(
          'rounded-full bg-card border px-3 py-1.5 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 whitespace-nowrap',
          ring,
          glow,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function AudiencePill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
      {children}
    </span>
  );
}

/* ============================================================
   Categories Overview
   ============================================================ */

function CategoriesOverview() {
  return (
    <section id="categories" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="კატეგორიები"
          title="აირჩიე გზა, რომელიც შენ გერგება"
          description="ხუთი კატეგორია, ყველა ასაკისთვის. იყიდე ცალკე კურსი, ან მთელი კატეგორია 40%-იანი ფასდაკლებით — სამუდამო წვდომით."
        />

        <div className="mt-10 sm:mt-14 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category: c }: { category: Category }) {
  const t = TONE_CLASSES[c.tone];
  return (
    <a
      href={`#cat-${c.id}`}
      className="group relative rounded-3xl border border-border bg-card p-6 sm:p-7 transition-all hover:-translate-y-1 hover:border-pulse/40 hover:shadow-[0_12px_40px_var(--pulse-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden"
    >
      <div
        className={cn(
          'absolute inset-0 -z-10 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity',
          t.gradient,
        )}
        aria-hidden
      />

      <div className="flex items-start justify-between mb-6">
        <div
          className={cn(
            'flex items-center justify-center w-14 h-14 rounded-2xl text-3xl',
            t.iconBg,
          )}
        >
          {c.icon}
        </div>
        <AudienceBadge audience={c.audience} />
      </div>

      <h3 className="text-xl font-bold leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
        {c.nameKa}
      </h3>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">
        {c.nameEn}
      </p>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.taglineKa}</p>

      <div className="mt-6 flex items-end justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-bold text-foreground tabular-nums">{c.courses}</span> კურსი
          </span>
          <span className="opacity-50">·</span>
          <span>
            <span className="font-bold text-foreground tabular-nums">{c.lessons}</span> გაკვეთილი
          </span>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            ბანდლი
          </div>
          <div className="text-base font-bold tabular-nums">₾{c.price}</div>
        </div>
      </div>

      <div
        className={cn(
          'mt-5 inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3',
          t.text,
        )}
      >
        გადახედვა
        <span aria-hidden>→</span>
      </div>
    </a>
  );
}

function AudienceBadge({ audience }: { audience: AudienceTag }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border bg-background/60 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
      {AUDIENCE_LABEL[audience]}
    </span>
  );
}

/* ============================================================
   Courses by category
   ============================================================ */

function CoursesByCategory() {
  return (
    <section id="courses" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="კურსები"
          title="დაიწყე იქიდან, რაც ყველაზე მეტად გაინტერესებს"
          description="ყოველი კატეგორიიდან ოთხი ყველაზე პოპულარული კურსი. ყველა მათგანი — ქართულად, AI მასწავლებლით, შენი ტემპით."
        />

        <div className="mt-10 sm:mt-14 space-y-12 sm:space-y-16">
          {CATEGORIES.map((c) => (
            <CategoryCourseRow key={c.id} category={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCourseRow({ category: c }: { category: Category }) {
  const courses = COURSES.filter((co) => co.categoryId === c.id).slice(0, 4);
  const t = TONE_CLASSES[c.tone];

  return (
    <div id={`cat-${c.id}`}>
      {/* Row header */}
      <div className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-2xl sm:text-3xl',
              t.iconBg,
            )}
          >
            {c.icon}
          </div>
          <div className="min-w-0">
            <h3
              className="text-xl sm:text-2xl font-bold leading-tight truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {c.nameKa}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {c.courses} კურსი · {c.lessons} გაკვეთილი
            </p>
          </div>
        </div>
        <a
          href={`#cat-${c.id}`}
          className={cn(
            'hidden sm:inline-flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-all hover:gap-3',
            t.text,
          )}
        >
          ყველას ნახვა
          <span aria-hidden>→</span>
        </a>
      </div>

      {/* Course cards — h-scroll on mobile, grid on desktop */}
      <div className="flex sm:grid gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4 -mx-4 px-4 sm:mx-0 sm:px-0 pb-3 sm:pb-0 snap-x">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} category={c} />
        ))}
      </div>

      {/* Mobile-only "view all" */}
      <div className="sm:hidden mt-3">
        <a href={`#cat-${c.id}`} className={cn('inline-flex items-center gap-1.5 text-sm font-bold', t.text)}>
          ყველას ნახვა →
        </a>
      </div>
    </div>
  );
}

function CourseCard({ course: co, category: c }: { course: Course; category: Category }) {
  const t = TONE_CLASSES[c.tone];

  return (
    <a
      href="#"
      className="group flex-shrink-0 sm:flex-shrink w-[260px] sm:w-auto flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:-translate-y-1 hover:border-pulse/40 hover:shadow-[0_12px_40px_var(--pulse-glow)] transition-all snap-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div
        className={cn(
          'relative aspect-[16/10] flex items-center justify-center bg-card',
          t.gradient,
        )}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-sm',
            t.iconBg,
          )}
        >
          {co.icon}
        </div>
        <div className="absolute top-3 right-3">
          <AudienceBadge audience={co.audience} />
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-5">
        <h4 className="text-base font-bold leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
          {co.titleKa}
        </h4>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
          <span>{co.lessons} გაკვეთილი</span>
          <span className="opacity-50">·</span>
          <span>~{co.hours} საათი</span>
          <span className="opacity-50">·</span>
          <span>{LEVEL_LABEL[co.level]}</span>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 flex items-center justify-between border-t border-border pt-3 sm:pt-4">
        <span className="text-base font-bold tabular-nums">₾{co.price}</span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-bold transition-all group-hover:gap-2',
            t.text,
          )}
        >
          ნახვა
          <span aria-hidden>→</span>
        </span>
      </div>
    </a>
  );
}

/* ============================================================
   How It Works
   ============================================================ */

function HowItWorks() {
  return (
    <section id="how" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="როგორ მუშაობს"
          title="სამი ნაბიჯი — მერე უკვე შენ ხარ მგზავრობაში"
        />

        <div className="mt-10 sm:mt-14 grid gap-5 md:grid-cols-3">
          <Step
            number="01"
            walliState="idle"
            title="აირჩიე გზა"
            description="ხუთი კატეგორია, ყველა ასაკისთვის. იყიდე ცალკე კურსი, ან მთელი კატეგორია 40%-იანი ფასდაკლებით."
          />
          <Step
            number="02"
            walliState="wave"
            title="Walli ასწავლის"
            description="სასაუბრო გაკვეთილები ქართულად. შეცდომაზე — ნაზად ხსნის. სწორ პასუხზე — აღნიშნავს."
          />
          <Step
            number="03"
            walliState="dance"
            title="შეაგროვე ბარათები"
            description="ყოველ დასრულებულ გაკვეთილზე — ულამაზესი ბარათი ბიბლიოთეკაში. გაუზიარე ოჯახს."
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  walliState,
  title,
  description,
}: {
  number: string;
  walliState: 'idle' | 'wave' | 'dance';
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-3xl border border-border bg-card p-6 sm:p-7 hover:border-pulse/40 hover:-translate-y-1 hover:shadow-[0_8px_30px_var(--pulse-glow)] transition-all">
      <div
        className="absolute top-6 right-6 text-5xl font-black text-pulse/15 tabular-nums leading-none"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {number}
      </div>
      <div className="mb-4 inline-block">
        <Walli size={72} state={walliState} noShadow />
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

/* ============================================================
   Audience Section (For Kids / Teens / Adults)
   ============================================================ */

function AudienceSection() {
  return (
    <section id="audiences" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/30">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="ვისთვის ვაგებთ"
          title="ერთი ხელსაწყო, სამი ცხოვრება"
          description="walle.school ერგება ყველას — მაგრამ მოარგებს თავის თავს იმის მიხედვით, ვინ ხარ."
        />

        <div className="mt-10 sm:mt-14 grid gap-5 md:grid-cols-3">
          <AudienceCard
            ageBand="6-12"
            title="ბავშვები"
            tagline="თამაშით ვისწავლოთ AI"
            features={[
              'სასიამოვნო, თამაშის ფორმა',
              'მშობელი ხედავს პროგრესს',
              'უსაფრთხო, რეკლამის გარეშე',
            ]}
            tone="amber"
          />
          <AudienceCard
            ageBand="13-17"
            title="ახალგაზრდები"
            tagline="AI სკოლისთვის და მეტი"
            features={[
              'AI სკოლის დავალებებისთვის',
              'კოდირება AI-სთან ერთად',
              'ლიდერბორდი თანატოლებთან',
            ]}
            tone="violet"
            highlighted
          />
          <AudienceCard
            ageBand="18+"
            title="უფროსები"
            tagline="AI სამსახურისთვის"
            features={[
              'AI მარკეტინგი და ბიზნესი',
              'პრაქტიკული პროექტები',
              'სერთიფიკატები',
            ]}
            tone="pulse"
          />
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  ageBand,
  title,
  tagline,
  features,
  tone,
  highlighted,
}: {
  ageBand: string;
  title: string;
  tagline: string;
  features: string[];
  tone: Tone;
  highlighted?: boolean;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <a
      href="#"
      className={cn(
        'group relative rounded-3xl border bg-card p-6 sm:p-8 hover:-translate-y-1 hover:shadow-[0_12px_40px_var(--pulse-glow)] transition-all overflow-hidden',
        highlighted ? 'border-pulse/40' : 'border-border hover:border-pulse/40',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 -z-10 rounded-3xl transition-opacity',
          t.gradient,
          highlighted ? 'opacity-30' : 'opacity-0 group-hover:opacity-30',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
          t.iconBg,
          t.text,
        )}
      >
        {ageBand} წელი
      </div>

      <h3 className="mt-4 text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>

      <ul className="mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-pulse/15 text-pulse flex items-center justify-center text-[10px] font-bold">
              ✓
            </span>
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          'mt-7 inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3',
          t.text,
        )}
      >
        გაიგე მეტი
        <span aria-hidden>→</span>
      </div>
    </a>
  );
}

/* ============================================================
   Pricing Teaser
   ============================================================ */

function PricingTeaser() {
  return (
    <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeader
          eyebrow="ფასები"
          title="იყიდე ცალკე ან მთელი კატეგორია"
          description="არცერთი გამოწერა. ერთხელ ყიდულობ — სამუდამოდ შენია. კატეგორიის ბანდლი ავტომატურად მოიცავს მომავალ კურსებს."
          align="center"
        />

        <div className="mt-10 sm:mt-14 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              ცალკე კურსი
            </p>
            <p
              className="mt-3 text-4xl font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ₾19<span className="text-base font-medium text-muted-foreground">-დან</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">თითო კურსი — სამუდამო წვდომა</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {['სრული წვდომა კურსზე', 'ყოველდღიური განმეორება', 'AI მასწავლებელი 24/7'].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-pulse/15 text-pulse flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-7 block text-center rounded-full bg-card border border-border px-5 py-3 text-sm font-bold hover:border-pulse/40 transition-colors"
            >
              კურსების ნახვა
            </a>
          </div>

          <div className="relative rounded-3xl border-2 border-pulse bg-card p-6 sm:p-8 shadow-[0_12px_40px_var(--pulse-glow)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-pulse text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
              <span>💎</span>
              საუკეთესო ფასი
            </div>

            <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
              კატეგორიის ბანდლი
            </p>
            <p
              className="mt-3 text-4xl font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              ₾79<span className="text-base font-medium text-muted-foreground">-დან</span>
            </p>
            <p className="mt-1 text-sm">
              <span className="line-through text-muted-foreground">₾145</span>{' '}
              <span className="text-pulse font-bold">−40% ფასდაკლება</span>
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {[
                'მთელი კატეგორიის კურსები',
                'მომავალი კურსები ჩართულია',
                'ერთი გადახდა — სამუდამო წვდომა',
                'AI მასწავლებელი 24/7',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-pulse text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="font-medium">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-7 block text-center rounded-full bg-pulse text-primary-foreground px-5 py-3 text-sm font-bold hover:shadow-[0_8px_30px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              ბანდლების ნახვა
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   CTA Banner
   ============================================================ */

function CtaBanner() {
  return (
    <section className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-pulse/40 bg-card p-8 sm:p-12">
          <div className="absolute inset-0 -z-10 opacity-50 bg-starfield" aria-hidden />
          <div
            className="absolute -bottom-12 -right-12 w-72 h-72 rounded-full bg-pulse/20 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -top-8 -left-8 w-48 h-48 rounded-full bg-heart/15 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-4 text-center md:text-left">
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                მზად ხარ AI-ს სამყაროსთვის?
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0">
                დაიწყე უფასოდ. პირველი გაკვეთილი ჩემგან — შემდეგ შენი არჩევანია.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3 text-sm font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                >
                  უფასოდ დაწყება
                  <span aria-hidden>→</span>
                </a>
                <a
                  href="#categories"
                  className="text-sm font-bold text-pulse hover:underline"
                >
                  კურსების ნახვა
                </a>
              </div>
            </div>
            <div className="flex justify-center md:justify-end">
              <Walli size={180} state="wave" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   Footer
   ============================================================ */

function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div>
            <a href="/v2" className="inline-flex items-center gap-2 mb-4">
              <Walli size={32} state="idle" noShadow />
              <span className="text-base font-bold">walle.school</span>
            </a>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              ქართული AI აკადემია. Walli ასწავლის ქართულად — ბავშვებს, ახალგაზრდებს, უფროსებს.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <SocialIcon href="#" label="Facebook">f</SocialIcon>
              <SocialIcon href="#" label="Instagram">ig</SocialIcon>
              <SocialIcon href="#" label="YouTube">yt</SocialIcon>
            </div>
          </div>

          <FooterColumn
            title="კატეგორიები"
            links={CATEGORIES.map((c) => ({ label: c.nameKa, href: `#cat-${c.id}` }))}
          />
          <FooterColumn
            title="პროდუქტი"
            links={[
              { label: 'კურსები', href: '#courses' },
              { label: 'ფასები', href: '#pricing' },
              { label: 'მშობლებისთვის', href: '#audiences' },
              { label: 'უფასო გასინჯვა', href: '#' },
            ]}
          />
          <FooterColumn
            title="კომპანია"
            links={[
              { label: 'ჩვენ შესახებ', href: '#' },
              { label: 'კონტაქტი', href: '#' },
              { label: 'პრივატულობა', href: '#' },
              { label: 'წესები', href: '#' },
            ]}
          />
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2026 walle.school · ყველა უფლება დაცულია</p>
          <div className="flex items-center gap-1.5">
            <button className="font-bold text-foreground">ქართული</button>
            <span className="opacity-50">/</span>
            <button className="hover:text-foreground transition-colors">English</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-foreground/80 hover:text-pulse transition-colors"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialIcon({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-xs font-bold text-muted-foreground hover:border-pulse/40 hover:text-pulse transition-colors"
    >
      {children}
    </a>
  );
}

/* ============================================================
   Section Header (shared)
   ============================================================ */

function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}) {
  return (
    <header
      className={cn(
        'space-y-3 max-w-2xl',
        align === 'center' && 'mx-auto text-center',
      )}
    >
      <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold">{eyebrow}</p>
      <h2
        className="text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      {description && (
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}

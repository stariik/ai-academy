'use client';

import * as React from 'react';
import { Walli } from '@/components/walli/Walli';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  TONE_CLASSES,
  type Category,
  type Course,
} from '@/lib/v2/data';

/* ============================================================
   Top-level shell
   ============================================================ */

export default function LandingClient({
  categories,
  courses,
}: {
  categories: Category[];
  courses: Course[];
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <CatalogSection categories={categories} courses={courses} />
        <HowItWorks />
        <AudienceSection />
        <PricingTeaser />
        <CtaBanner />
      </main>
      <Footer categories={categories} />
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
          'sticky top-0 z-40 transition-all duration-300',
          scrolled
            ? 'backdrop-blur-md bg-background/85 border-b border-border shadow-[0_4px_24px_-16px_rgba(0,0,0,0.18)]'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3 h-14 sm:h-16">
          <a href="/v2" className="flex items-center gap-2 shrink-0 min-w-0">
            <Walli size={32} state="idle" noShadow />
            <div className="leading-tight min-w-0">
              <p className="text-sm sm:text-base font-bold tracking-tight truncate">walle.school</p>
              <p className="hidden sm:block text-[10px] text-muted-foreground -mt-0.5">AI ქართულად</p>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-semibold">
            {NAV_LINKS.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="relative text-muted-foreground hover:text-foreground transition-colors py-1.5 after:absolute after:left-0 after:right-0 after:bottom-0 after:mx-auto after:h-[2px] after:w-0 after:rounded-full after:bg-pulse after:transition-[width] after:duration-300 hover:after:w-full"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <a
                href="#"
                className="text-sm font-semibold px-2.5 py-1.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                შესვლა
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-semibold rounded-full bg-pulse text-primary-foreground px-4 py-2 hover:shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
              >
                რეგისტრაცია
                <span aria-hidden>→</span>
              </a>
            </div>

            <div className="md:hidden flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Menu"
                className="p-2 rounded-lg hover:bg-muted text-foreground"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && <MobileMenu links={NAV_LINKS} onClose={() => setMobileOpen(false)} />}
    </>
  );
}

function LanguageSwitcher({ full = false }: { full?: boolean }) {
  const [lang, setLang] = React.useState<'KA' | 'EN'>('KA');
  return (
    <div
      className={cn(
        'inline-flex items-center font-bold rounded-full border border-border bg-card overflow-hidden',
        full ? 'text-sm' : 'text-[11px]',
      )}
    >
      {(['KA', 'EN'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            'transition-colors',
            full ? 'px-3.5 py-1.5' : 'px-2 py-1',
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
      <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16 border-b border-border">
        <a href="/v2" className="flex items-center gap-2" onClick={onClose}>
          <Walli size={32} state="idle" noShadow />
          <span className="text-sm sm:text-base font-bold tracking-tight">walle.school</span>
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

      <nav className="flex-1 flex flex-col px-5 sm:px-6 py-6 gap-1 overflow-y-auto">
        {links.map((l, i) => (
          <a
            key={l.label}
            href={l.href}
            onClick={onClose}
            className="group flex items-center justify-between py-4 border-b border-border text-2xl font-bold hover:text-pulse transition-colors"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>{l.label}</span>
            <span
              aria-hidden
              className="text-base text-muted-foreground/60 group-hover:text-pulse group-hover:translate-x-0.5 transition-all"
            >
              →
            </span>
            <span className="sr-only">{i + 1}</span>
          </a>
        ))}

        <div className="mt-8 space-y-3">
          <a
            href="#"
            className="block text-center rounded-full bg-pulse text-primary-foreground px-5 py-3.5 text-base font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:shadow-[0_8px_24px_var(--pulse-glow)] transition-shadow"
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

        <div className="mt-auto pt-6 flex items-center justify-between border-t border-border">
          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-bold">
            ენა
          </span>
          <LanguageSwitcher full />
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
      if (w < 380) setSize(160);
      else if (w < 640) setSize(200);
      else if (w < 1024) setSize(240);
      else if (w < 1280) setSize(280);
      else setSize(320);
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
    <section className="relative pt-8 pb-14 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-28 px-4 sm:px-6 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-starfield opacity-40" aria-hidden />
      <div
        className="absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-pulse/15 blur-3xl -z-10 lg:block hidden"
        aria-hidden
      />
      <div
        className="absolute -bottom-20 -left-20 w-[320px] h-[320px] rounded-full bg-heart/10 blur-3xl -z-10"
        aria-hidden
      />

      <div className="mx-auto max-w-7xl grid gap-8 sm:gap-10 lg:gap-16 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div className="order-1 lg:order-2 flex items-center justify-center">
          <div className="relative">
            {/* Soft radial glow grounding the mascot */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-br from-pulse/25 via-pulse/5 to-transparent blur-2xl scale-[1.15] -z-10"
              aria-hidden
            />
            <Walli size={walliSize} state="wave" />

            <FloatingChip className="-top-1 -left-2 sm:-left-10 lg:-left-14" delay="0s" tone="pulse">
              <span>🧭</span>
              <span>AI საფუძვლები</span>
            </FloatingChip>
            <FloatingChip className="top-14 -right-1 sm:-right-10 lg:-right-14" delay="0.6s" tone="heart">
              <span>🎨</span>
              <span>შემოქმედება</span>
            </FloatingChip>
            <FloatingChip className="-bottom-1 left-4 sm:left-0 lg:-left-4" delay="1.2s" tone="amber">
              <span>🎈</span>
              <span>ბავშვებისთვის</span>
            </FloatingChip>
          </div>
        </div>

        <div className="order-2 lg:order-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 text-pulse px-3 py-1.5 text-xs font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" />
            ქართული AI აკადემია
          </div>

          <h1
            className="mt-5 sm:mt-6 text-[42px] sm:text-[56px] lg:text-7xl xl:text-[80px] font-bold leading-[1.08] tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            შენი პირადი{' '}
            <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
              AI მასწავლებელი
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Walli ასწავლის ქართულად — შენი ტემპით, არასოდეს იღლება. ბავშვებიდან პროფესიონალებამდე,
            კურსი ყველასთვის მოიძებნება.
          </p>

          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-3">
            <a
              href="#categories"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3.5 text-sm sm:text-[15px] font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              კატეგორიების ნახვა
              <span aria-hidden>→</span>
            </a>
            <a
              href="#categories"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-card border border-border px-6 py-3.5 text-sm sm:text-[15px] font-bold text-foreground hover:border-pulse/40 hover:bg-pulse/5 transition-colors"
            >
              <span
                aria-hidden
                className="flex items-center justify-center w-5 h-5 rounded-full bg-pulse/15 text-pulse text-[10px] group-hover:bg-pulse group-hover:text-primary-foreground transition-colors"
              >
                ▶
              </span>
              უფასო გაკვეთილი
            </a>
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-3 max-w-md mx-auto lg:mx-0 divide-x divide-border border-y border-border py-3">
            <div className="text-center lg:text-left lg:px-4 first:lg:px-0">
              <p
                className="text-lg sm:text-xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                2.4K+
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                მოსწავლე
              </p>
            </div>
            <div className="text-center lg:px-4">
              <p
                className="text-lg sm:text-xl font-bold tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                9
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                კატეგორია
              </p>
            </div>
            <div className="text-center lg:text-left lg:px-4">
              <p
                className="text-lg sm:text-xl font-bold tabular-nums inline-flex items-center gap-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                4.8
                <span className="text-amber-500 text-base">★</span>
              </p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                შეფასება
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-2">
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium">
              აგებული ყველასთვის:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <AudiencePill>ბავშვები 6-12</AudiencePill>
              <AudiencePill>ახალგაზრდები</AudiencePill>
              <AudiencePill>უფროსები</AudiencePill>
            </div>
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
    <div className={cn('absolute float', className)} style={{ animationDelay: delay }}>
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
   Catalog — magazine-style category tiles + course sliders
   ============================================================ */

const LEVEL_LABEL_INLINE = {
  beginner: 'საწყისი',
  intermediate: 'საშუალო',
  advanced: 'მაღალი',
} as const;

function CatalogSection({
  categories,
  courses,
}: {
  categories: Category[];
  courses: Course[];
}) {
  const withCourses = categories.filter((c) => c.courses > 0);

  return (
    <section id="categories" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-pulse" />
            კატალოგი
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ცხრა გზა,{' '}
            <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
              ერთი მასწავლებელი
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            დაიწყე ნებისმიერი წერტილიდან. ჩამოატარე კატეგორიები, აღმოაჩინე კურსები — ყველა ერთ ნაკადში.
          </p>
        </div>
      </div>

      {/* Category slider */}
      <div className="mt-10 sm:mt-14">
        <CategorySlider categories={categories} />
      </div>

      {/* Per-category course sliders */}
      {withCourses.length === 0 ? (
        <div className="mx-auto max-w-3xl mt-12 sm:mt-16 px-4 sm:px-6">
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center">
            <p className="text-sm sm:text-base font-bold">
              ჯერ კურსები არ არის — მალე გამოჩნდება.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-16 sm:mt-20 space-y-14 sm:space-y-20">
          {withCourses.map((c, i) => (
            <CourseSliderRow
              key={c.id}
              category={c}
              courses={courses.filter((co) => co.categoryId === c.id)}
              rowIndex={i}
              totalRows={withCourses.length}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategorySlider({ categories }: { categories: Category[] }) {
  return (
    <HorizontalSlider ariaLabel="კატეგორიების სლაიდერი">
      {categories.map((c, i) => (
        <CategoryMiniCard key={c.id} category={c} index={i} total={categories.length} />
      ))}
    </HorizontalSlider>
  );
}

/* ============================================================
   HorizontalSlider — reusable slider primitive
   ============================================================ */

function HorizontalSlider({
  children,
  ariaLabel,
}: {
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const pointerIdRef = React.useRef<number | null>(null);
  const movedRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startScrollRef = React.useRef(0);
  const suppressClickRef = React.useRef(false);
  const [isGrabbing, setIsGrabbing] = React.useState(false);
  const [canL, setCanL] = React.useState(false);
  const [canR, setCanR] = React.useState(true);

  const update = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const tolerance = 4;
    setCanL(el.scrollLeft > tolerance);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - tolerance);
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update]);

  const slide = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('[data-slide-item]');
    const gapPx = 20;
    const step = card ? card.offsetWidth + gapPx : el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  /* ─── click-and-drag scrolling (mouse only — touch uses native scroll) ─── */

  const rafId = React.useRef(0);
  const pendingScroll = React.useRef(0);
  const hasPending = React.useRef(false);

  const flush = React.useCallback(() => {
    hasPending.current = false;
    const el = scrollerRef.current;
    if (el) el.scrollLeft = pendingScroll.current;
  }, []);

  // Threshold (px) before we consider a pointer-down → drag. Below this it's a click.
  const DRAG_THRESHOLD = 6;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    // Stop the browser's native HTML5 drag on <a> children from stealing the
    // pointer before we can decide click-vs-drag. preventDefault on pointerdown
    // suppresses both text selection and the implicit native drag image.
    e.preventDefault();
    pointerIdRef.current = e.pointerId;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
    // Capture immediately so subsequent moves always reach us, even if the
    // mouse leaves the card or scroller bounds. Clicks still fire on the
    // original target (the <a>), so non-drag clicks navigate normally.
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    if (!movedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      movedRef.current = true;
      setIsGrabbing(true);
    }
    // Coalesce scroll writes to one per animation frame for buttery drag.
    pendingScroll.current = startScrollRef.current - dx;
    if (!hasPending.current) {
      hasPending.current = true;
      rafId.current = requestAnimationFrame(flush);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const el = scrollerRef.current;
    const wasDrag = movedRef.current;
    pointerIdRef.current = null;
    movedRef.current = false;

    if (el) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    }

    if (wasDrag) {
      setIsGrabbing(false);
      if (hasPending.current) {
        cancelAnimationFrame(rafId.current);
        flush();
      }
      // Mark next click for suppression so a card link doesn't fire after drag.
      suppressClickRef.current = true;
    }
  };

  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  };

  return (
    <div
      className="group/slider relative mx-auto max-w-7xl px-4 sm:px-6"
      aria-label={ariaLabel}
      role="region"
    >
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        className={cn(
          // touch-manipulation lets the browser handle native touch scrolling
          // (both axes), while our JS only takes over for mouse click-drag.
          // touch-pan-y alone blocks horizontal touch swipes — slider becomes
          // un-swipeable on mobile.
          'overflow-x-auto scrollbar-hide select-none touch-manipulation overscroll-x-contain',
          // `overflow-x: auto` silently clips overflow-y too (CSS spec), which
          // crops the top of cards that lift on hover. Padding + matching
          // negative margin reserves vertical room for hover transforms + glow
          // shadows without shifting layout — buttons and section margins are
          // unaffected because the scroller's outer box stays the same size.
          'py-10 -my-10',
          // Snap is disabled while dragging so movement is pixel-perfect;
          // it re-engages on release so the slider settles on the nearest card.
          isGrabbing ? 'cursor-grabbing' : 'snap-x snap-mandatory md:cursor-grab',
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-4 sm:gap-5">{children}</div>
      </div>

      <SliderButton direction="prev" visible={canL} onClick={() => slide(-1)} />
      <SliderButton direction="next" visible={canR} onClick={() => slide(1)} />
    </div>
  );
}

function SliderButton({
  direction,
  visible,
  onClick,
}: {
  direction: 'prev' | 'next';
  visible: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'prev' ? 'წინა' : 'შემდეგი'}
      tabIndex={visible ? 0 : -1}
      className={cn(
        // hidden on touch, shown from md+
        'hidden md:flex absolute top-[42%] -translate-y-1/2 z-20',
        'items-center justify-center w-12 h-12 rounded-full',
        'bg-card/90 backdrop-blur-md border border-border',
        'shadow-[0_8px_24px_rgba(0,0,0,0.10)]',
        'text-foreground transition-all duration-200 ease-out',
        'hover:bg-pulse hover:border-pulse hover:text-primary-foreground',
        'hover:scale-110 hover:shadow-[0_12px_30px_var(--pulse-glow)]',
        'active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2',
        direction === 'prev' ? 'left-3 lg:left-6' : 'right-3 lg:right-6',
        visible
          ? 'opacity-0 group-hover/slider:opacity-100 group-focus-within/slider:opacity-100'
          : 'opacity-0 pointer-events-none',
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={direction === 'prev' ? 'rotate-180' : ''}
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </button>
  );
}

function CategoryMiniCard({
  category: c,
  index,
}: {
  category: Category;
  index: number;
  total: number;
}) {
  const t = TONE_CLASSES[c.tone];
  const num = (index + 1).toString().padStart(2, '0');
  const disabled = c.courses === 0;
  const href = disabled ? '#' : `#cat-${c.id}`;

  return (
    <a
      href={href}
      aria-disabled={disabled}
      data-slide-item
      draggable={false}
      className={cn(
        'group snap-start shrink-0 relative overflow-hidden rounded-[24px] sm:rounded-[28px] border transition-all duration-300 ease-out',
        'w-[180px] sm:w-[220px] lg:w-[240px] aspect-[3/4] bg-card',
        disabled
          ? 'opacity-40 pointer-events-none border-border'
          : 'border-border hover:-translate-y-2 hover:border-transparent hover:shadow-[0_24px_60px_-20px_var(--pulse-glow)]',
      )}
    >
      {/* Color-tinted base layer */}
      <div className={cn('absolute inset-0 -z-10 opacity-60', t.iconBg)} aria-hidden />

      {/* Soft color blob — drifts on hover */}
      <div
        className={cn(
          'absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl transition-all duration-700 ease-out',
          t.bg,
          'opacity-40 group-hover:opacity-90 group-hover:-translate-x-4 group-hover:translate-y-4',
        )}
        aria-hidden
      />

      {/* Subtle inner ring on hover */}
      <div
        className={cn(
          'absolute inset-0 rounded-[28px] ring-2 ring-inset transition-opacity duration-300',
          t.ring,
          'opacity-0 group-hover:opacity-100',
        )}
        aria-hidden
      />

      {/* TOP: floating icon medallion + oversized numeral */}
      <div className="relative h-1/2 p-4 sm:p-5 lg:p-6 flex items-start justify-between">
        <div
          className={cn(
            'flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl text-2xl sm:text-3xl lg:text-[34px]',
            'bg-card border border-border shadow-[0_8px_24px_rgba(0,0,0,0.08)]',
            'transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]',
          )}
        >
          {c.icon}
        </div>
        <span
          className={cn(
            'text-[44px] sm:text-[56px] lg:text-[64px] font-black tabular-nums leading-none select-none',
            t.text,
            'opacity-25 group-hover:opacity-40 transition-opacity',
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {num}
        </span>
      </div>

      {/* BOTTOM: title block (always anchored) */}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 lg:p-6 space-y-1.5 sm:space-y-2">
        <h3
          className="text-[15px] sm:text-lg lg:text-xl font-bold leading-tight tracking-tight line-clamp-2"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {c.nameKa}
        </h3>
        <p className="text-[10px] sm:text-[11px] lg:text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[2.4em]">
          {c.taglineKa}
        </p>

        <div className="pt-2 sm:pt-3 flex items-center justify-between border-t border-border/70">
          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium">
            {c.courses > 0 ? (
              <>
                <span className="font-bold text-foreground tabular-nums">{c.courses}</span> კურსი
                <span className="opacity-50"> · </span>
                <span className="font-bold text-foreground tabular-nums">{c.lessons}</span> გაკ.
              </>
            ) : (
              <span className="italic opacity-70">მალე</span>
            )}
          </span>
          {c.courses > 0 && (
            <span
              className={cn(
                'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm sm:text-base font-bold transition-all duration-300',
                t.bg,
                'text-primary-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0',
              )}
            >
              →
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

function CourseSliderRow({
  category: c,
  courses,
  rowIndex,
  totalRows,
}: {
  category: Category;
  courses: Course[];
  rowIndex: number;
  totalRows: number;
}) {
  const t = TONE_CLASSES[c.tone];
  if (courses.length === 0) return null;
  const num = (rowIndex + 1).toString().padStart(2, '0');
  const denom = totalRows.toString().padStart(2, '0');

  return (
    <div id={`cat-${c.id}`} className="scroll-mt-20">
      {/* Row header with editorial numeral */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 mb-5 sm:mb-7 flex items-end justify-between gap-3 sm:gap-4">
        <div className="flex items-end gap-3 sm:gap-5 min-w-0">
          <span
            className={cn(
              'shrink-0 text-[28px] sm:text-4xl lg:text-5xl font-bold tabular-nums leading-none select-none',
              t.text,
              'opacity-30',
            )}
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {num}
          </span>
          <div className="min-w-0 pb-0.5 sm:pb-1">
            <h3
              className="text-lg sm:text-2xl lg:text-3xl font-bold leading-[1.15] tracking-tight line-clamp-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span className={cn('mr-1.5 sm:mr-2', t.text)}>{c.icon}</span>
              {c.nameKa}
            </h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">
              <span className="font-bold text-foreground tabular-nums">{c.courses}</span> კურსი
              <span className="opacity-50"> · </span>
              <span className="font-bold text-foreground tabular-nums">{c.lessons}</span> გაკვეთილი
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-[10px] uppercase tracking-[0.22em] text-muted-foreground font-bold tabular-nums shrink-0">
          {num} / {denom}
        </span>
      </div>

      {/* Course slider */}
      <HorizontalSlider ariaLabel={`${c.nameKa} — კურსების სლაიდერი`}>
        {courses.map((co) => (
          <div
            key={co.id}
            data-slide-item
            className="snap-start shrink-0 w-[220px] sm:w-[260px] lg:w-[300px]"
          >
            <CourseCard course={co} category={c} />
          </div>
        ))}
      </HorizontalSlider>
    </div>
  );
}

function CourseCard({ course: co, category: c }: { course: Course; category: Category }) {
  const t = TONE_CLASSES[c.tone];

  return (
    <a
      href={`/v2/courses/${co.id}`}
      draggable={false}
      className="group relative block h-full flex flex-col rounded-3xl border border-border bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_24px_60px_-20px_var(--pulse-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {/* Hover ring */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-inset transition-opacity duration-300',
          t.ring,
          'opacity-0 group-hover:opacity-100',
        )}
        aria-hidden
      />

      {/* Cover: tone-tinted with floating icon medallion */}
      <div className={cn('relative aspect-[4/3] overflow-hidden', t.iconBg)}>
        <div className={cn('absolute inset-0 -z-10', t.gradient)} aria-hidden />
        <div
          className={cn(
            'absolute -bottom-12 -right-10 w-40 h-40 sm:w-44 sm:h-44 rounded-full blur-3xl transition-all duration-700',
            t.bg,
            'opacity-30 group-hover:opacity-70 group-hover:translate-x-2 group-hover:-translate-y-2',
          )}
          aria-hidden
        />

        {/* Floating medallion */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn(
              'flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl sm:rounded-3xl text-4xl sm:text-5xl lg:text-6xl',
              'bg-card border border-border/80 shadow-[0_12px_30px_rgba(0,0,0,0.10)]',
              'transition-all duration-500 ease-out group-hover:scale-110 group-hover:rotate-6',
            )}
          >
            {co.icon}
          </div>
        </div>

        {/* Level signal bars + label */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 inline-flex items-center gap-1.5 rounded-full bg-card/85 backdrop-blur-sm border border-border/60 px-2 py-1 sm:px-2.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
          <LevelSignal level={co.level} tone={c.tone} />
          <span className="text-foreground/85">{LEVEL_LABEL_INLINE[co.level]}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col">
        <h4
          className="text-sm sm:text-base lg:text-lg font-bold leading-snug line-clamp-2 min-h-[2.6em]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {co.titleKa}
        </h4>

        {/* Meta pills */}
        <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5 flex-wrap">
          <MetaPill>{co.lessons} გაკვ.</MetaPill>
          <MetaPill>~{co.hours} სთ</MetaPill>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 sm:px-5 sm:pb-5 flex items-center justify-between border-t border-border pt-3 sm:pt-4">
        {typeof co.price === 'number' && co.price > 0 ? (
          <span className="text-sm sm:text-base font-bold tabular-nums">₾{co.price}</span>
        ) : (
          <span className={cn('text-[10px] font-bold uppercase tracking-widest', t.text)}>
            უფასოდ
          </span>
        )}
        <span
          className={cn(
            'flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all duration-300 text-sm sm:text-base',
            'border-border bg-card text-foreground',
            'group-hover:bg-pulse group-hover:border-pulse group-hover:text-primary-foreground group-hover:shadow-[0_8px_20px_var(--pulse-glow)]',
          )}
        >
          →
        </span>
      </div>
    </a>
  );
}

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted text-foreground/80 px-2.5 py-1 text-[10px] font-bold tracking-wide">
      {children}
    </span>
  );
}

function LevelSignal({
  level,
  tone,
}: {
  level: Course['level'];
  tone: Category['tone'];
}) {
  const t = TONE_CLASSES[tone];
  const active = (need: Course['level'][]) => need.includes(level);
  return (
    <span className="inline-flex items-end gap-[2px] h-3" aria-hidden>
      <span
        className={cn(
          'w-[3px] rounded-sm transition-colors h-[40%]',
          t.bg,
        )}
      />
      <span
        className={cn(
          'w-[3px] rounded-sm transition-colors h-[65%]',
          active(['intermediate', 'advanced']) ? t.bg : 'bg-foreground/25',
        )}
      />
      <span
        className={cn(
          'w-[3px] rounded-sm transition-colors h-full',
          active(['advanced']) ? t.bg : 'bg-foreground/25',
        )}
      />
    </span>
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

        <div className="relative mt-10 sm:mt-14 grid gap-4 sm:gap-5 md:grid-cols-3">
          {/* Subtle connector behind cards on md+ */}
          <div
            className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-px -z-10 bg-gradient-to-r from-transparent via-border to-transparent"
            aria-hidden
          />
          <Step
            number="01"
            tone="pulse"
            walliState="idle"
            title="აირჩიე გზა"
            description="ცხრა კატეგორია, AI საფუძვლებიდან აგენტებამდე — შენთვის საჭირო კურსი მოიძებნება."
          />
          <Step
            number="02"
            tone="heart"
            walliState="wave"
            title="Walli ასწავლის"
            description="სასაუბრო გაკვეთილები ქართულად. შეცდომაზე — ნაზად ხსნის. სწორ პასუხზე — აღნიშნავს."
          />
          <Step
            number="03"
            tone="amber"
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
  tone,
}: {
  number: string;
  walliState: 'idle' | 'wave' | 'dance';
  title: string;
  description: string;
  tone: keyof typeof TONE_CLASSES;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <div
      className={cn(
        'group relative rounded-3xl border border-border bg-card p-5 sm:p-7 transition-all duration-300',
        'hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_var(--pulse-glow)]',
        'hover:border-transparent',
      )}
    >
      {/* Tone-tinted soft halo behind Walli */}
      <div
        className={cn(
          'absolute -top-6 -left-6 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500',
          t.bg,
        )}
        aria-hidden
      />
      {/* Tone-tinted hover ring */}
      <div
        className={cn(
          'absolute inset-0 rounded-3xl ring-2 ring-inset opacity-0 group-hover:opacity-100 transition-opacity duration-300',
          t.ring,
        )}
        aria-hidden
      />

      <div
        className={cn(
          'absolute top-5 sm:top-6 right-5 sm:right-6 text-4xl sm:text-5xl font-black tabular-nums leading-none transition-opacity',
          t.text,
          'opacity-20 group-hover:opacity-40',
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {number}
      </div>
      <div className="relative mb-3 sm:mb-4 inline-block">
        <Walli size={68} state={walliState} noShadow />
      </div>
      <h3
        className="text-lg sm:text-xl font-bold mb-2 leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

/* ============================================================
   Audience Section
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
            features={['სასიამოვნო, თამაშის ფორმა', 'მშობელი ხედავს პროგრესს', 'უსაფრთხო, რეკლამის გარეშე']}
            tone="amber"
          />
          <AudienceCard
            ageBand="13-17"
            title="ახალგაზრდები"
            tagline="AI სკოლისთვის და მეტი"
            features={['AI სკოლის დავალებებისთვის', 'კოდირება AI-სთან ერთად', 'ლიდერბორდი თანატოლებთან']}
            tone="violet"
            highlighted
          />
          <AudienceCard
            ageBand="18+"
            title="უფროსები"
            tagline="AI სამსახურისთვის"
            features={['AI მარკეტინგი და ბიზნესი', 'პრაქტიკული პროექტები', 'სერთიფიკატები']}
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
  tone: keyof typeof TONE_CLASSES;
  highlighted?: boolean;
}) {
  const t = TONE_CLASSES[tone];
  return (
    <a
      href="#"
      className={cn(
        'group relative rounded-3xl border bg-card p-5 sm:p-7 lg:p-8 transition-all duration-300 overflow-hidden',
        'hover:-translate-y-1.5 hover:shadow-[0_18px_50px_-16px_var(--pulse-glow)]',
        highlighted
          ? 'border-2 border-pulse/50 lg:scale-[1.02]'
          : 'border border-border hover:border-pulse/40',
      )}
    >
      {highlighted && (
        <div className="absolute -top-px left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-b-full bg-pulse text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap shadow-[0_4px_16px_var(--pulse-glow)]">
          <span>★</span>
          ყველაზე პოპულარული
        </div>
      )}

      <div
        className={cn(
          'absolute inset-0 -z-10 rounded-3xl transition-opacity',
          t.gradient,
          highlighted ? 'opacity-40' : 'opacity-0 group-hover:opacity-30',
        )}
        aria-hidden
      />

      <div
        className={cn(
          'inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
          t.iconBg,
          t.text,
          highlighted && 'mt-3 sm:mt-4',
        )}
      >
        {ageBand} წელი
      </div>

      <h3
        className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold leading-tight"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{tagline}</p>

      <ul className="mt-5 sm:mt-6 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <span
              className={cn(
                'flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                t.iconBg,
                t.text,
              )}
            >
              ✓
            </span>
            <span className="text-foreground/85">{f}</span>
          </li>
        ))}
      </ul>

      <div
        className={cn(
          'mt-6 sm:mt-7 inline-flex items-center gap-2 text-sm font-bold transition-all group-hover:gap-3',
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
          {/* Bundle card — first on mobile (conversion priority), right on desktop */}
          <div className="order-1 md:order-2 relative rounded-3xl border-2 border-pulse bg-card p-6 pt-8 sm:p-8 sm:pt-10 shadow-[0_18px_50px_-12px_var(--pulse-glow)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] whitespace-nowrap shadow-[0_4px_16px_var(--pulse-glow)]">
              <span>💎</span>
              საუკეთესო ფასი
            </div>

            <p className="text-[10px] uppercase tracking-widest text-pulse font-bold">
              კატეგორიის ბანდლი
            </p>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-2 flex-wrap">
              <p
                className="text-[44px] sm:text-5xl font-bold tabular-nums leading-none bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ₾79
              </p>
              <span className="text-sm font-medium text-muted-foreground">-დან</span>
              <span className="inline-flex items-center rounded-full bg-pulse/15 text-pulse border border-pulse/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
                −40%
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="line-through">₾145</span> — დაზოგე ₾66
            </p>
            <ul className="mt-5 sm:mt-6 space-y-2.5 text-sm">
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
              className="mt-6 sm:mt-7 inline-flex items-center justify-center gap-2 w-full rounded-full bg-pulse text-primary-foreground px-5 py-3.5 text-sm font-bold shadow-[0_8px_24px_var(--pulse-glow)] hover:shadow-[0_12px_36px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
            >
              ბანდლების ნახვა
              <span aria-hidden>→</span>
            </a>
          </div>

          {/* Solo course card */}
          <div className="order-2 md:order-1 rounded-3xl border border-border bg-card p-6 sm:p-8 hover:border-pulse/40 transition-colors">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              ცალკე კურსი
            </p>
            <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
              <p
                className="text-[44px] sm:text-5xl font-bold tabular-nums leading-none"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ₾19
              </p>
              <span className="text-sm font-medium text-muted-foreground">-დან</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">თითო კურსი — სამუდამო წვდომა</p>
            <ul className="mt-5 sm:mt-6 space-y-2.5 text-sm">
              {['სრული წვდომა კურსზე', 'ყოველდღიური განმეორება', 'AI მასწავლებელი 24/7'].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-pulse/15 text-pulse flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="text-foreground/85">{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="mt-6 sm:mt-7 inline-flex items-center justify-center gap-2 w-full rounded-full bg-card border border-border px-5 py-3.5 text-sm font-bold hover:border-pulse/40 hover:bg-pulse/5 transition-colors"
            >
              კურსების ნახვა
              <span aria-hidden>→</span>
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
    <section className="py-14 sm:py-20 lg:py-24 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-pulse/40 bg-card p-6 sm:p-10 lg:p-12">
          <div className="absolute inset-0 -z-10 opacity-50 bg-starfield" aria-hidden />
          <div
            className="absolute -bottom-16 -right-16 w-72 h-72 rounded-full bg-pulse/25 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute -top-10 -left-10 w-48 h-48 rounded-full bg-heart/15 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-6 sm:gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="text-center md:text-left">
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                მზად ხარ{' '}
                <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
                  AI-ს სამყაროსთვის?
                </span>
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground max-w-lg mx-auto md:mx-0 leading-relaxed">
                დაიწყე უფასოდ. პირველი გაკვეთილი ჩემგან — შემდეგ შენი არჩევანია.
              </p>
              <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-center md:justify-start gap-3">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-pulse text-primary-foreground px-6 py-3.5 text-sm sm:text-[15px] font-bold shadow-[0_8px_30px_var(--pulse-glow)] hover:shadow-[0_12px_40px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
                >
                  უფასოდ დაწყება
                  <span aria-hidden>→</span>
                </a>
                <a
                  href="#categories"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-card border border-border px-6 py-3.5 text-sm sm:text-[15px] font-bold text-foreground hover:border-pulse/40 hover:bg-pulse/5 transition-colors"
                >
                  კურსების ნახვა
                </a>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground inline-flex items-center gap-1.5 md:justify-start justify-center w-full">
                <span className="text-pulse">✓</span>
                გადახდის გარეშე · გაუქმდება ნებისმიერ დროს
              </p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Walli size={140} state="wave" className="sm:hidden" />
              <Walli size={180} state="wave" className="hidden sm:block lg:hidden" />
              <Walli size={210} state="wave" className="hidden lg:block" />
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

function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 lg:py-16">
        <div className="grid gap-8 sm:gap-10 grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <a href="/v2" className="inline-flex items-center gap-2 mb-3 sm:mb-4">
              <Walli size={32} state="idle" noShadow />
              <span className="text-base font-bold tracking-tight">walle.school</span>
            </a>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              ქართული AI აკადემია. Walli ასწავლის ქართულად — ბავშვებს, ახალგაზრდებს, უფროსებს.
            </p>
            <div className="mt-4 sm:mt-5 flex items-center gap-2">
              <SocialIcon href="#" label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M13.5 21v-8h2.5l.5-3h-3V8c0-1 .3-1.5 1.5-1.5H16.5V4h-2.2c-2.4 0-3.3 1.3-3.3 3.3V10H9v3h2v8h2.5z" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="3.5" />
                  <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
                </svg>
              </SocialIcon>
              <SocialIcon href="#" label="YouTube">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M21.6 7.2c-.2-.9-.9-1.6-1.8-1.8C18.1 5 12 5 12 5s-6.1 0-7.8.4c-.9.2-1.6.9-1.8 1.8C2 8.9 2 12 2 12s0 3.1.4 4.8c.2.9.9 1.6 1.8 1.8C5.9 19 12 19 12 19s6.1 0 7.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8zM10 15V9l5 3-5 3z" />
                </svg>
              </SocialIcon>
            </div>
          </div>

          <FooterColumn
            title="კატეგორიები"
            links={categories.map((c) => ({ label: c.nameKa, href: `/v2#cat-${c.id}` }))}
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

        <div className="mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 walle.school · ყველა უფლება დაცულია</p>
          <div className="flex items-center gap-1.5">
            <button className="font-bold text-foreground hover:text-pulse transition-colors">
              ქართული
            </button>
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
      <h4 className="text-[11px] uppercase tracking-[0.18em] text-foreground font-bold mb-3 sm:mb-4">
        {title}
      </h4>
      <ul className="space-y-2 sm:space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="text-foreground/70 hover:text-pulse transition-colors leading-snug"
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
      className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:border-pulse hover:text-pulse hover:bg-pulse/5 transition-all"
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
      <p
        className={cn(
          'text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2',
          align === 'left' && 'before:content-[""] before:block before:h-1 before:w-6 before:rounded-full before:bg-pulse',
        )}
      >
        {eyebrow}
      </p>
      <h2
        className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]"
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

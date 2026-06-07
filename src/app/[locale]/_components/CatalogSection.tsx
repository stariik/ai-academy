'use client';

/* ============================================================
   CatalogSection — "Expedition Terminal"

   The catalog rebuilt as Walli's departure hall:
   · Categories are planet cards — the cover art is a circular
     "planet" in a dashed orbit ring; a tone-colored moon orbits
     it on hover.
   · Each course row is a mission console — patch thumbnail,
     mono position readout, floating edge arrows.
   · Courses are mission dossiers — corner viewfinder brackets,
     telemetry strip, level meter, and a tone-colored launch bar
     that slides up on hover.

   One Slider primitive powers every row: pointer drag with click
   suppression, scroll-snap, keyboard arrows, a segmented tick
   rail, a live `02 / 09` counter and an IntersectionObserver
   stagger reveal. Theme-aware via design tokens only.
   ============================================================ */

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  TONE_CLASSES,
  type Category,
  type Course,
  type Tone,
} from '@/lib/v2/data';
import { useV2Locale } from '@/lib/v2/i18n/context';

const pad = (n: number) => String(n).padStart(2, '0');

/* ============================================================
   Section shell
   ============================================================ */

export function CatalogSection({
  categories,
  courses,
}: {
  categories: Category[];
  courses: Course[];
}) {
  const { dict } = useV2Locale();
  const withCourses = categories.filter((c) => c.courses > 0);

  return (
    <section id="categories" className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-3 max-w-2xl">
          <p className="text-xs uppercase tracking-[0.22em] text-pulse font-bold inline-flex items-center gap-2">
            <span className="h-1 w-6 rounded-full bg-pulse" />
            {dict.catalog.eyebrow}
          </p>
          <h2
            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dict.catalog.titleBefore}{' '}
            <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
              {dict.catalog.titleHighlight}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {dict.catalog.description}
          </p>
        </div>
      </div>

      <div className="mt-10 sm:mt-12">
        <CategorySlider categories={categories} />
      </div>

      {withCourses.length === 0 ? (
        <div className="mx-auto max-w-3xl mt-12 sm:mt-16 px-4 sm:px-6">
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center">
            <p className="text-sm sm:text-base font-bold">{dict.catalog.emptyState}</p>
          </div>
        </div>
      ) : (
        <div id="courses" className="mt-16 sm:mt-24 space-y-14 sm:space-y-20 scroll-mt-20">
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

/* ============================================================
   Slider — the one primitive behind every row

   Console layout: a heading bar (left slot + counter + arrows),
   the scroller itself, then a segmented tick rail. The whole
   block reveals with a stagger the first time it scrolls into
   view (CSS in globals.css under `.reveal-row`).
   ============================================================ */

function Slider({
  children,
  ariaLabel,
  heading,
  tone = 'pulse',
}: {
  children: React.ReactNode;
  ariaLabel?: string;
  /** Left side of the console bar (category identity, row label…). */
  heading?: React.ReactNode;
  /** Accents the tick rail + counter so each row keeps its category color. */
  tone?: Tone;
}) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[tone];
  const total = React.Children.count(children);

  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [canL, setCanL] = React.useState(false);
  const [canR, setCanR] = React.useState(true);
  const [hasOverflow, setHasOverflow] = React.useState(false);
  // Console readout — `idx` is the first visible card, `fillEnd` the last.
  const [readout, setReadout] = React.useState({ idx: 0, fillEnd: 1 });
  const [shown, setShown] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  /** Distance between two card starts — measured, not assumed. */
  const stepSize = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 0;
    const items = el.querySelectorAll<HTMLElement>('[data-slide-item]');
    if (items.length >= 2) return items[1].offsetLeft - items[0].offsetLeft;
    return items[0]?.offsetWidth ?? el.clientWidth * 0.8;
  }, []);

  const update = React.useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const tolerance = 4;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const atEnd = el.scrollLeft >= maxScroll - tolerance;
    setCanL(el.scrollLeft > tolerance);
    setCanR(!atEnd);
    setHasOverflow(maxScroll > tolerance);

    const step = stepSize();
    if (step > 0) {
      const idx = Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / step)));
      const visible = Math.max(1, Math.round(el.clientWidth / step));
      setReadout({ idx, fillEnd: atEnd ? total : Math.min(total, idx + visible) });
    }
  }, [stepSize, total]);

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

  // Stagger reveal the first time the row enters the viewport.
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const slide = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = stepSize() || el.clientWidth * 0.8;
    el.scrollBy({ left: step * dir, behavior: 'smooth' });
  };

  /* ----- mouse drag-to-scroll (touch uses native scrolling) ----- */
  const pointerIdRef = React.useRef<number | null>(null);
  const movedRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startScrollRef = React.useRef(0);
  const suppressClickRef = React.useRef(false);
  const [isGrabbing, setIsGrabbing] = React.useState(false);
  const rafId = React.useRef(0);
  const pendingScroll = React.useRef(0);
  const hasPending = React.useRef(false);
  const DRAG_THRESHOLD = 6;

  const flush = React.useCallback(() => {
    hasPending.current = false;
    const el = scrollerRef.current;
    if (el) el.scrollLeft = pendingScroll.current;
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    // No preventDefault()/setPointerCapture() yet — both suppress the click
    // on child <a>s. Applied only once the drag threshold is crossed.
    pointerIdRef.current = e.pointerId;
    movedRef.current = false;
    startXRef.current = e.clientX;
    startScrollRef.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    const dx = e.clientX - startXRef.current;
    if (!movedRef.current) {
      if (Math.abs(dx) < DRAG_THRESHOLD) return;
      movedRef.current = true;
      setIsGrabbing(true);
      const el = scrollerRef.current;
      if (el) {
        try {
          el.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      e.preventDefault();
    }
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

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      slide(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      slide(-1);
    }
  };

  return (
    <div
      ref={rootRef}
      className="mx-auto max-w-7xl px-4 sm:px-6"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      {/* Console bar — identity on the left, live position readout right */}
      <div
        className={cn(
          'mb-4 sm:mb-5 flex items-end justify-between gap-3 sm:gap-4',
          'transition-all duration-700 ease-out',
          shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
        )}
      >
        <div className="min-w-0 flex-1">{heading}</div>

        {hasOverflow && (
          <span
            className="inline-flex items-baseline gap-1 font-mono text-[11px] font-semibold tabular-nums text-muted-foreground shrink-0 pb-0.5"
            aria-hidden
          >
            <span className={t.text}>{pad(readout.idx + 1)}</span>
            <span className="opacity-50">/</span>
            <span>{pad(total)}</span>
          </span>
        )}
      </div>

      <div className="relative">
        <div
          ref={scrollerRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={onClickCapture}
          onDragStart={(e) => e.preventDefault()}
          className={cn(
            'overflow-x-auto scrollbar-hide select-none touch-manipulation overscroll-x-contain',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/50 rounded-2xl',
            // Negative margin + padding gives cards generous headroom so
            // hover lifts and glow shadows never clip against the scroll box.
            'py-14 -my-14 px-6 -mx-6 scroll-px-6',
            isGrabbing ? 'cursor-grabbing' : 'snap-x snap-mandatory md:cursor-grab',
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className={cn('flex gap-4 sm:gap-5 reveal-row', shown && 'is-shown')}>
            {children}
          </div>
        </div>

        {/* Edge fades — sit mostly over the bleed gutter (the scroller's
            negative margin), so cards dissolve at the row edge instead of
            getting a "shadow" painted over them. Only on a scrollable side. */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 -left-6 z-10 w-10 sm:w-12',
            'bg-gradient-to-r from-background from-35% to-transparent transition-opacity duration-300',
            canL ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 -right-6 z-10 w-10 sm:w-12',
            'bg-gradient-to-l from-background from-35% to-transparent transition-opacity duration-300',
            canR ? 'opacity-100' : 'opacity-0',
          )}
        />

        {/* Edge arrows — always visible, floating astride the row's outer
            edges (fully outside the cards on wide screens). At an end of the
            row they dim instead of disappearing, so position never jumps. */}
        {hasOverflow && (
          <>
            <EdgeArrow direction="prev" disabled={!canL} onClick={() => slide(-1)} label={dict.slider.prev} />
            <EdgeArrow direction="next" disabled={!canR} onClick={() => slide(1)} label={dict.slider.next} />
          </>
        )}
      </div>

      {/* Segmented tick rail — one tick per card, filled through the last
          visible one. The native scrollbar is hidden, this is the gauge. */}
      {hasOverflow && (
        <div className="mt-4 flex justify-center" aria-hidden>
          <div className="flex w-36 sm:w-52 gap-1">
            {Array.from({ length: total }, (_, i) => (
              <span
                key={i}
                className={cn(
                  'h-[3px] flex-1 rounded-full transition-colors duration-300',
                  i < readout.fillEnd ? t.bg : 'bg-border',
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Edge arrow — a floating round key astride the row's outer edge. Straddles
// the content edge on narrow screens and sits fully outside the cards from
// ~1400px up. Always rendered; ends of the row dim it instead of hiding it.
function EdgeArrow({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'absolute top-1/2 -translate-y-1/2 z-20',
        'flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full',
        'bg-card/95 backdrop-blur-md border border-border',
        'shadow-[0_10px_30px_rgba(0,0,0,0.14)]',
        'text-foreground transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        direction === 'prev'
          ? 'left-1 sm:left-0 sm:-translate-x-1/2 min-[1400px]:translate-x-0 min-[1400px]:-left-16'
          : 'right-1 sm:right-0 sm:translate-x-1/2 min-[1400px]:translate-x-0 min-[1400px]:-right-16',
        disabled
          ? 'opacity-30 scale-90 cursor-default'
          : cn(
              'hover:bg-pulse hover:border-pulse hover:text-primary-foreground',
              'hover:scale-110 hover:shadow-[0_14px_36px_var(--pulse-glow)]',
              'active:scale-95',
            ),
      )}
    >
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={cn('transition-transform duration-200', direction === 'prev' ? 'rotate-180' : '')}
      >
        <path d="M5 12h14M13 5l7 7-7 7" />
      </svg>
    </button>
  );
}

/* ============================================================
   Category slider — planet cards
   ============================================================ */

function CategorySlider({ categories }: { categories: Category[] }) {
  const { dict } = useV2Locale();

  return (
    <Slider
      ariaLabel={dict.slider.ariaCategory}
      heading={
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" aria-hidden />
          {dict.navbar.categories}
          <span className="tabular-nums opacity-60">· {pad(categories.length)}</span>
        </span>
      }
    >
      {categories.map((c, i) => (
        <div
          key={c.id}
          data-slide-item
          className="snap-start shrink-0 w-[190px] sm:w-[225px] lg:w-[245px]"
        >
          <PlanetCard category={c} index={i} />
        </div>
      ))}
    </Slider>
  );
}

// Planet card — the category artwork is a circular "planet" wrapped in a
// dashed orbit ring with a small tone-colored moon. Hovering sets the moon
// in motion, lifts the card and warms the planet's glow. Empty categories
// show a grayscale planet with a "soon" badge on the orbit.
function PlanetCard({ category: c, index }: { category: Category; index: number }) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[c.tone];
  const num = pad(index + 1);
  const disabled = c.courses === 0;
  const hasImage = Boolean(c.imageUrl);

  return (
    <a
      href={disabled ? '#' : `#cat-${c.id}`}
      aria-disabled={disabled}
      draggable={false}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[24px] border border-border bg-card px-4 pt-7 pb-5 text-center',
        'transition-all duration-300 ease-out transform-gpu',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        disabled
          ? 'opacity-50 pointer-events-none'
          : 'hover:-translate-y-2 hover:shadow-[0_18px_42px_-16px_var(--pulse-glow)]',
      )}
    >
      {/* Faint dot grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-line) 1.1px, transparent 1.1px)',
          backgroundSize: '13px 13px',
        }}
        aria-hidden
      />

      {/* Index code, quiet in the corner */}
      <span className="absolute left-3.5 top-3 font-mono text-[9px] font-bold tracking-[0.2em] text-muted-foreground/70">
        {num}
      </span>

      {/* ── Planet + orbit assembly ── */}
      <div className="relative mx-auto h-[104px] w-[104px] sm:h-[120px] sm:w-[120px]">
        {/* Atmosphere glow behind the planet */}
        <div
          className={cn(
            'absolute inset-0 rounded-full blur-2xl opacity-25 transition-opacity duration-500 group-hover:opacity-60',
            t.bg,
          )}
          aria-hidden
        />

        {/* Orbit ring + moon — the whole ring spins on hover so the moon orbits */}
        <div
          className={cn(
            'absolute -inset-2.5 rounded-full border border-dashed transition-opacity duration-300',
            t.ring,
            'opacity-50 group-hover:opacity-100 group-hover:animate-[spin_7s_linear_infinite]',
          )}
          aria-hidden
        >
          <span
            className={cn(
              'absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full',
              t.bg,
              'shadow-[0_0_8px_var(--pulse-glow)]',
            )}
          />
        </div>

        {/* The planet itself */}
        <div
          className={cn(
            'relative h-full w-full overflow-hidden rounded-full border border-border',
            'transition-transform duration-300 ease-out group-hover:scale-[1.05]',
            disabled && 'grayscale',
          )}
        >
          {hasImage ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.imageUrl as string}
                alt=""
                aria-hidden
                draggable={false}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Terminator shadow — gives the sphere its 3D day/night side */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle at 32% 28%, transparent 45%, rgba(0,0,0,0.38) 100%)',
                }}
                aria-hidden
              />
            </>
          ) : (
            <div className={cn('grid h-full w-full place-items-center', t.iconBg)}>
              <span className="text-4xl sm:text-[44px]" aria-hidden>
                {c.icon}
              </span>
            </div>
          )}
        </div>

        {/* SOON badge sits on the orbit for empty categories */}
        {disabled && (
          <span
            className={cn(
              'absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-dashed px-2 py-0.5',
              'font-mono text-[9px] font-black uppercase tracking-[0.24em] bg-card',
              t.ring,
              t.text,
            )}
          >
            {dict.catalog.soon}
          </span>
        )}
      </div>

      {/* ── Name + tagline ── */}
      <h3
        className="relative mt-4 text-[15px] sm:text-base font-bold leading-tight tracking-tight line-clamp-2 min-h-[2.4em]"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {c.name}
      </h3>
      <p className="relative mt-1.5 text-[10px] sm:text-[11px] leading-relaxed text-muted-foreground line-clamp-2 min-h-[2.8em]">
        {c.tagline}
      </p>

      {/* ── Counts footer ── */}
      <div className="relative mt-auto pt-3.5 border-t border-border/70 flex items-center justify-center gap-1.5">
        {c.courses > 0 ? (
          <>
            <span className="font-mono text-[10px] text-muted-foreground">
              <span className="font-bold tabular-nums text-foreground">{c.courses}</span>{' '}
              {dict.catalog.coursesUnit}
              <span className="px-1 opacity-40">·</span>
              <span className="font-bold tabular-nums text-foreground">{c.lessons}</span>{' '}
              {dict.catalog.lessonsUnitShort}
            </span>
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground',
                t.bg,
                'opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0',
              )}
              aria-hidden
            >
              →
            </span>
          </>
        ) : (
          <span className="font-mono text-[10px] italic text-muted-foreground/70">
            {dict.catalog.soon}
          </span>
        )}
      </div>
    </a>
  );
}

/* ============================================================
   Course rows — mission console + dossier cards
   ============================================================ */

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
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[c.tone];
  if (courses.length === 0) return null;
  const num = pad(rowIndex + 1);
  const denom = pad(totalRows);
  const hasImage = Boolean(c.imageUrl);

  return (
    <div id={`cat-${c.id}`} className="scroll-mt-24">
      <Slider
        tone={c.tone}
        ariaLabel={`${c.name} — ${dict.slider.ariaCourses}`}
        heading={
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Mission patch — category image, or icon on tone wash */}
            <span
              className={cn(
                'relative grid h-11 w-11 sm:h-14 sm:w-14 shrink-0 place-items-center overflow-hidden rounded-2xl border',
                t.ring,
                !hasImage && t.iconBg,
              )}
              aria-hidden
            >
              {hasImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl as string}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 bg-black/15" />
                </>
              ) : (
                <span className="text-xl sm:text-2xl">{c.icon}</span>
              )}
            </span>

            <div className="min-w-0">
              <p className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <span className={cn('tabular-nums', t.text)}>{num}</span>
                <span className="opacity-50"> / {denom}</span>
                <span className="px-1.5 opacity-40">·</span>
                <span className="tabular-nums text-foreground">{c.courses}</span> {dict.catalog.coursesUnit}
                <span className="px-1.5 opacity-40">·</span>
                <span className="tabular-nums text-foreground">{c.lessons}</span> {dict.catalog.lessonsUnit}
              </p>
              <h3
                className="mt-0.5 text-lg sm:text-2xl font-bold leading-tight tracking-tight truncate"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {c.name}
              </h3>
            </div>
          </div>
        }
      >
        {courses.map((co, i) => (
          <div
            key={co.id}
            data-slide-item
            className="snap-start shrink-0 w-[240px] sm:w-[270px] lg:w-[295px]"
          >
            <DossierCard course={co} category={c} index={i} />
          </div>
        ))}
      </Slider>
    </div>
  );
}

// Mission dossier — telemetry strip up top (index, level meter), display-font
// title, audience + pace chips, mono stats, and a tone launch bar that slides
// up over the footer on hover. Corner viewfinder brackets lock in on hover.
function DossierCard({
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
  const code = pad(index + 1);
  const isFree = !(typeof co.price === 'number' && co.price > 0);
  // Approximate pace — hours is a ceil'd total, hence the "~".
  const minPerLesson = co.lessons > 0 ? Math.max(1, Math.round((co.hours * 60) / co.lessons)) : 0;

  return (
    <a
      href={href(`courses/${co.id}`)}
      draggable={false}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-border bg-card p-5',
        'transition-all duration-300 ease-out transform-gpu',
        'hover:-translate-y-1.5 hover:shadow-[0_18px_42px_-16px_var(--pulse-glow)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {/* Corner viewfinder brackets — lock outward on hover */}
      {(['left-3 top-3 border-l-2 border-t-2 rounded-tl group-hover:left-2 group-hover:top-2',
         'right-3 top-3 border-r-2 border-t-2 rounded-tr group-hover:right-2 group-hover:top-2',
         'left-3 bottom-3 border-l-2 border-b-2 rounded-bl group-hover:left-2 group-hover:bottom-2',
         'right-3 bottom-3 border-r-2 border-b-2 rounded-br group-hover:right-2 group-hover:bottom-2',
      ] as const).map((pos) => (
        <span
          key={pos}
          className={cn(
            'pointer-events-none absolute h-3.5 w-3.5 transition-all duration-300',
            t.ring,
            'opacity-35 group-hover:opacity-100',
            pos,
          )}
          aria-hidden
        />
      ))}

      {/* Soft tone glow, top-right */}
      <div
        className={cn(
          'pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-45',
          t.bg,
        )}
        aria-hidden
      />

      {/* Faint dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage: 'radial-gradient(var(--grid-line) 1.1px, transparent 1.1px)',
          backgroundSize: '13px 13px',
        }}
        aria-hidden
      />

      {/* Scanline sweep on hover */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -inset-y-12 -left-1/3 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-all duration-700 ease-out group-hover:left-[130%] group-hover:opacity-100" />
      </div>

      {/* Watermark index */}
      <span
        className={cn(
          'pointer-events-none absolute right-4 top-2 select-none font-mono text-[54px] font-black leading-none tabular-nums opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.14]',
          t.text,
        )}
        aria-hidden
      >
        {code}
      </span>

      {/* Telemetry strip */}
      <div className="relative flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-[0.22em] text-muted-foreground">
          №{code}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/40 px-2 py-1 text-[8.5px] font-bold uppercase tracking-widest backdrop-blur-sm">
          <LevelMeter level={co.level} tone={c.tone} />
          <span className="text-foreground/70">{dict.level[co.level]}</span>
        </span>
      </div>

      {/* Title */}
      <h4
        className="relative mt-4 text-[17px] sm:text-lg font-bold leading-snug tracking-tight line-clamp-2"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {co.title}
      </h4>

      {/* Description */}
      {co.description && (
        <p className="relative mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
          {co.description}
        </p>
      )}

      {/* Audience + pace chips */}
      <div className="relative mt-3.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground/70">
          <span className={cn('h-1.5 w-1.5 rounded-full', t.bg)} aria-hidden />
          {dict.audienceTag[co.audience]}
        </span>
        {minPerLesson > 0 && (
          <span className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-foreground/70">
            ~{minPerLesson} {dict.courseCard.minPerLesson}
          </span>
        )}
      </div>

      {/* Footer — mono stats + price; fades as the launch bar slides over it */}
      <div className="relative mt-auto flex items-center justify-between gap-2 border-t border-dashed border-border/80 pt-3.5 transition-opacity duration-200 group-hover:opacity-0">
        <span className="font-mono text-[10.5px] text-muted-foreground">
          <span className="font-bold tabular-nums text-foreground">{co.lessons}</span>
          {' '}{dict.courseCard.lessonsShort}
          <span className="px-1 opacity-40">·</span>
          ~<span className="font-bold tabular-nums text-foreground">{co.hours}</span>
          {dict.courseCard.hoursShort}
        </span>
        {isFree ? (
          <span className={cn('text-[10px] font-bold uppercase tracking-widest', t.text)}>
            {dict.courseCard.free}
          </span>
        ) : (
          <span className="text-sm font-bold tabular-nums">₾{co.price}</span>
        )}
      </div>

      {/* Launch bar — slides up from the bottom edge on hover/focus */}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 z-10',
          'translate-y-full transition-transform duration-300 ease-out',
          'group-hover:translate-y-0 group-focus-visible:translate-y-0',
        )}
        aria-hidden
      >
        <div
          className={cn(
            'flex h-[44px] items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-foreground',
            t.bg,
          )}
        >
          {dict.courseCard.open}
          <span>→</span>
        </div>
      </div>
    </a>
  );
}

// Three ascending telemetry bars — filled through the course level.
function LevelMeter({ level, tone }: { level: Course['level']; tone: Tone }) {
  const t = TONE_CLASSES[tone];
  const active = (need: Course['level'][]) => need.includes(level);
  return (
    <span className="inline-flex items-end gap-[2px] h-3" aria-hidden>
      <span className={cn('w-[3px] rounded-sm h-[40%]', t.bg)} />
      <span
        className={cn(
          'w-[3px] rounded-sm h-[65%]',
          active(['intermediate', 'advanced']) ? t.bg : 'bg-foreground/25',
        )}
      />
      <span
        className={cn(
          'w-[3px] rounded-sm h-full',
          active(['advanced']) ? t.bg : 'bg-foreground/25',
        )}
      />
    </span>
  );
}

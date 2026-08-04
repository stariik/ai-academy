'use client';

/* ============================================================
   CatalogSection — the storefront catalog

   A clean, conversion-focused catalog (no themed chrome):
   · CategorySlider — one bundle card per category: cover art,
     rating, what's-included checklist, prominent price + buy CTA.
   · CourseSliderRow — a labelled row per category; each course is
     a CourseCard with audience/level/pace chips and an
     always-visible, price-forward footer + tone CTA.

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

/* Bundle pricing — a category is sold as one bundle (all its courses, lifetime
   access). An admin-set price on the category (category_images.bundle_price_cents,
   surfaced as `category.price` / `category.retailPrice`) wins; otherwise we
   derive a friendly, deterministic bundle price from the catalog size: each
   course is nominally ₾49, the whole bundle goes at ~40% off (matching the
   course-detail bundle deal), rounded to a clean ₾x9. Pure function of the
   category, so it's stable across renders. */
const PER_COURSE_PRICE = 49;
function bundlePricing(c: Pick<Category, 'courses' | 'price' | 'retailPrice'>) {
  if (typeof c.price === 'number' && c.price > 0) {
    const bundle = c.price;
    const retail = c.retailPrice && c.retailPrice > bundle ? c.retailPrice : bundle;
    return {
      retail,
      bundle,
      save: retail - bundle,
      pct: retail > bundle ? Math.round((1 - bundle / retail) * 100) : 0,
    };
  }
  const retail = Math.max(PER_COURSE_PRICE, c.courses * PER_COURSE_PRICE);
  const bundle = Math.max(19, Math.round((retail * 0.6) / 10) * 10 - 1);
  return { retail, bundle, save: retail - bundle, pct: Math.round((1 - bundle / retail) * 100) };
}

/* Rating — identical numbers on nine cards read as fake, so we derive a
   believable, deterministic rating per category from its id. Stable across
   renders; swap for a real metric when we have one. */
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}
function bundleRating(id: string) {
  return (46 + (hashStr(id) % 4)) / 10; // 4.6 – 4.9
}

/* localStorage key shared with the course pages — guests "own" courses here
   until they sign in. Keep in sync with CourseDetailClient's ENROLLMENT_KEY. */
const GUEST_ENROLL_KEY = 'ai_academy_enrollments';

/* Bundle store — lets the deeply-nested PlanetCard open the buy dialog and
   read ownership without threading props through the Slider's children. */
type BundleStore = {
  isOwned: (category: Category) => boolean;
  isCourseOwned: (courseId: string) => boolean;
  openBuy: (category: Category) => void;
};
const BundleCtx = React.createContext<BundleStore | null>(null);
const useBundle = () => React.useContext(BundleCtx);

/* ============================================================
   Section shell
   ============================================================ */

export function CatalogSection({
  categories,
  courses,
  authed = false,
  enrolledCourseIds = [],
}: {
  categories: Category[];
  courses: Course[];
  authed?: boolean;
  enrolledCourseIds?: string[];
}) {
  const { dict, href } = useV2Locale();
  const withCourses = categories.filter((c) => c.courses > 0);

  // category id → its course ids (a bundle = all of them).
  const coursesByCat = React.useMemo(() => {
    const m = new Map<string, string[]>();
    for (const co of courses) {
      const arr = m.get(co.categoryId) ?? [];
      arr.push(co.id);
      m.set(co.categoryId, arr);
    }
    return m;
  }, [courses]);

  const [owned, setOwned] = React.useState<Set<string>>(() => new Set(enrolledCourseIds));
  const [activeBundle, setActiveBundle] = React.useState<Category | null>(null);

  // Guests: the server can't read localStorage, so hydrate ownership here.
  React.useEffect(() => {
    if (authed) return;
    try {
      const raw = localStorage.getItem(GUEST_ENROLL_KEY);
      if (raw) setOwned(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, [authed]);

  const isOwned = React.useCallback(
    (category: Category) => {
      const ids = coursesByCat.get(category.id) ?? [];
      return ids.length > 0 && ids.every((id) => owned.has(id));
    },
    [coursesByCat, owned],
  );

  // Buy / grant the whole bundle:
  //   paid + guest  → login first (they can't buy signed out)
  //   paid + authed → BOG checkout; access is granted by the payment callback,
  //                   so we don't touch local ownership here
  //   free + authed → POST the bundle route (optimistic, rollback on failure)
  //   free + guest  → localStorage demo behaviour
  const grantBundle = React.useCallback(
    async (category: Category) => {
      const ids = coursesByCat.get(category.id) ?? [];
      if (ids.length === 0) return;

      // Paid == an admin-set bundle price, which is exactly what the server
      // will charge. The derived fallback price is display-only and never sold.
      const paid = (category.price ?? 0) > 0;

      if (paid && !authed) {
        window.location.href = href('login');
        return;
      }

      if (paid) {
        // Throw on failure: the dialog turns that into its error state. If we
        // swallowed it, it would show "purchased" for a buy that never happened.
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: category.id, returnPath: href() }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          redirectUrl?: string;
          error?: string;
        };
        if (!res.ok || !data.redirectUrl) {
          console.error('[bundle] checkout failed:', res.status, data.error);
          throw new Error(data.error ?? 'checkout_failed');
        }
        window.location.href = data.redirectUrl;
        return;
      }

      setOwned((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });

      if (authed) {
        try {
          const res = await fetch('/api/enrollments/bundle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryId: category.id }),
          });
          if (!res.ok) throw new Error('bundle enroll failed');
        } catch (err) {
          console.error('[bundle] enroll failed:', err);
          setOwned((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => next.delete(id));
            return next;
          });
          throw err;
        }
      } else {
        try {
          const raw = localStorage.getItem(GUEST_ENROLL_KEY);
          const cur = raw ? (JSON.parse(raw) as string[]) : [];
          localStorage.setItem(
            GUEST_ENROLL_KEY,
            JSON.stringify(Array.from(new Set([...cur, ...ids]))),
          );
        } catch {
          /* ignore */
        }
      }
    },
    [authed, coursesByCat, href],
  );

  const store = React.useMemo<BundleStore>(
    () => ({ isOwned, isCourseOwned: (id) => owned.has(id), openBuy: setActiveBundle }),
    [isOwned, owned],
  );

  return (
    <BundleCtx.Provider value={store}>
    <section id="categories" className="pt-6 pb-12 sm:pt-12 sm:pb-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-3 max-w-3xl">
          {/* Two lines: the highlight is always its own line. The container
              is max-w-3xl rather than 2xl because at lg the heading is 48px
              and "უსაზღვრო შესაძლებლობები" is wider than 672px on its own,
              which split it across a third line. */}
          <h2
            className="text-[20px] sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.12]"
            style={{ fontFamily: 'var(--font-caps)' }}
          >
            {dict.catalog.titleBefore}{' '}
            <span className="block bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
              {dict.catalog.titleHighlight}
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            {dict.catalog.description}
          </p>
        </div>
      </div>

      <div className="mt-7 sm:mt-12">
        <CategorySlider categories={categories} />
      </div>

      {withCourses.length === 0 ? (
        <div className="mx-auto max-w-3xl mt-12 sm:mt-16 px-4 sm:px-6">
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 sm:p-14 text-center">
            <p className="text-sm sm:text-base font-bold">{dict.catalog.emptyState}</p>
          </div>
        </div>
      ) : (
        <div id="courses" className="mt-11 sm:mt-24 space-y-10 sm:space-y-20 scroll-mt-20">
          {withCourses.map((c) => (
            <CourseSliderRow
              key={c.id}
              category={c}
              courses={courses.filter((co) => co.categoryId === c.id)}
            />
          ))}
        </div>
      )}
    </section>

      <BundleDialog
        category={activeBundle}
        authed={authed}
        owned={activeBundle ? isOwned(activeBundle) : false}
        onConfirm={grantBundle}
        onClose={() => setActiveBundle(null)}
      />
    </BundleCtx.Provider>
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
          <div className={cn('flex gap-3 sm:gap-5 reveal-row', shown && 'is-shown')}>
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
        'flex items-center justify-center h-9 w-9 sm:h-12 sm:w-12 rounded-full',
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
   Category slider — bundle cards
   ============================================================ */

function CategorySlider({ categories }: { categories: Category[] }) {
  const { dict } = useV2Locale();

  return (
    <Slider
      ariaLabel={dict.slider.ariaCategory}
      heading={
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" aria-hidden />
          {dict.navbar.categories}
          <span className="tabular-nums opacity-60">· {pad(categories.length)}</span>
        </span>
      }
    >
      {categories.map((c) => (
        <div
          key={c.id}
          data-slide-item
          className="snap-start shrink-0 w-[204px] sm:w-[228px] lg:w-[240px]"
        >
          <BundleCard category={c} />
        </div>
      ))}
    </Slider>
  );
}

// Bundle card — a holographic "collector card" for each category bundle.
// Tracks the cursor for a subtle 3D tilt and sweeps a foil shine across the
// surface, on-theme with the platform's collectible lesson cards. Still does
// the selling: cover image, rating, checklist, price + buy CTA, guarantee.
function BundleCard({ category: c }: { category: Category }) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[c.tone];
  const disabled = c.courses === 0;
  const hasImage = Boolean(c.imageUrl);
  const anchor = disabled ? undefined : `#cat-${c.id}`;
  const price = disabled ? null : bundlePricing(c);
  const rating = disabled ? null : bundleRating(c.id);
  const bundle = useBundle();
  const owned = !disabled && (bundle?.isOwned(c) ?? false);

  const cardRef = React.useRef<HTMLDivElement>(null);
  const sheenRef = React.useRef<HTMLDivElement>(null);

  // Cursor-driven 3D tilt + foil position. Mutates style directly (no React
  // state) so it stays smooth — mousemove fires constantly. Mouse-only, so it
  // never interferes with touch scrolling or the slider's drag.
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.transform = `rotateX(${(0.5 - py) * 5}deg) rotateY(${(px - 0.5) * 5}deg) scale(1.01)`;
    const s = sheenRef.current;
    if (s) {
      s.style.setProperty('--mx', `${px * 100}%`);
      s.style.setProperty('--my', `${py * 100}%`);
      s.style.opacity = '1';
    }
  };
  const onEnter = () => {
    if (cardRef.current) cardRef.current.style.transition = 'transform 0.1s ease-out';
  };
  const onLeave = () => {
    const el = cardRef.current;
    if (el) {
      el.style.transition = 'transform 0.5s ease-out';
      el.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    }
    if (sheenRef.current) sheenRef.current.style.opacity = '0';
  };

  return (
    <div className="h-full [perspective:1100px]">
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={cn(
          'group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card',
          'transform-gpu will-change-transform [transform-style:preserve-3d]',
          'shadow-sm transition-shadow duration-300',
          disabled ? 'opacity-70' : 'hover:shadow-[0_26px_52px_-26px_var(--pulse-glow)]',
        )}
      >
        {/* Cover image + identity (the explore tap target) */}
        <a
          href={anchor}
          aria-disabled={disabled}
          aria-label={c.name}
          draggable={false}
          tabIndex={disabled ? -1 : undefined}
          className={cn(
            'block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-inset',
            disabled && 'pointer-events-none',
          )}
        >
          {/* Cover banner — the artwork is the hero, and it carries the price.
              Putting price + discount on the scrim buys a much bigger image
              for no extra card height. */}
          <div className={cn('relative h-28 sm:h-36 w-full overflow-hidden', !hasImage && t.iconBg, disabled && 'grayscale')}>
            {hasImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.imageUrl as string}
                alt=""
                draggable={false}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center">
                <span className="text-5xl" aria-hidden>{c.icon}</span>
              </div>
            )}
            {/* Scrim — the price sits on this, so it has to stay readable over
                any artwork, light or dark. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />

            {/* Discount / soon badge */}
            {price ? (
              price.pct > 0 && (
                <span className={cn('absolute left-2 top-2 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold text-primary-foreground shadow-md', t.bg)}>
                  −{price.pct}%
                </span>
              )
            ) : (
              <span className={cn('absolute left-2 top-2 inline-flex items-center rounded-md bg-card/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-sm', t.text)}>
                {dict.catalog.soon}
              </span>
            )}

            {/* Rating chip — moved up top now that the price owns the bottom */}
            {rating !== null && (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 17.3 6.2 21l1.5-6.6L2 9.2l6.8-.6L12 2l3.2 6.6 6.8.6-5.7 5.2L17.8 21z" />
                </svg>
                {rating.toFixed(1)}
              </span>
            )}

            {/* Price on the artwork — the loudest thing on the card */}
            {price && (
              <div className="absolute inset-x-2.5 bottom-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                <span
                  className="text-[23px] sm:text-[26px] font-bold leading-tight tabular-nums text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.55)]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  ₾{price.bundle}
                </span>
                {price.save > 0 && (
                  <span className="text-[12px] tabular-nums text-white/70 line-through [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
                    ₾{price.retail}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Name — min-h keeps one- and two-line names aligned across a row */}
          <div className="px-3.5 pt-3 sm:px-4 sm:pt-3.5">
            <h3
              className="text-[14px] font-bold leading-tight tracking-tight line-clamp-2 min-h-[2.4em]"
              style={{ fontFamily: 'var(--font-caps)' }}
            >
              {c.name}
            </h3>
          </div>
        </a>

        {/* What's included */}
        {price && (
          <ul className="mt-2 sm:mt-3 space-y-1 sm:space-y-1.5 px-3 sm:px-4">
            {[
              `${c.courses} ${dict.catalog.coursesUnit} · ${c.lessons} ${dict.catalog.lessonsUnit}`,
              dict.courseDetail.trustLifetime,
              dict.courseDetail.trustCertificate,
            ].map((item, i) => (
              <li
                key={item}
                className={cn(
                  'items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] text-foreground/85',
                  // Lifetime + certificate are identical on every card. On a
                  // phone they're 40px of noise; the counts do the selling.
                  i === 0 ? 'flex' : 'hidden sm:flex',
                )}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0', t.text)} aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        )}

        {/* ── Footer: soon · owned · price + buy ── */}
        {disabled ? (
          <div className="mt-auto px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                t.ring,
                t.text,
              )}
            >
              {dict.catalog.soon}
            </span>
          </div>
        ) : owned ? (
          <div className="mt-auto px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-5 sm:pt-4">
            <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold', t.text)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {dict.catalog.bundleOwned}
            </span>
            {/* Owned → continue into the courses */}
            <a
              href={anchor}
              draggable={false}
              className={cn(
                'mt-2.5 flex h-10 items-center justify-center gap-1.5 rounded-xl border text-[13px] font-bold',
                'transition-all duration-200 ease-out',
                t.ring,
                t.text,
                'hover:bg-foreground/[0.03] active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {dict.catalog.bundleStart}
              <span aria-hidden>→</span>
            </a>
          </div>
        ) : price ? (
          <div className="mt-auto px-3.5 pb-3.5 pt-3 sm:px-4 sm:pb-5">
            {/* Buy button — opens the bundle dialog */}
            <button
              type="button"
              onClick={() => bundle?.openBuy(c)}
              className={cn(
                'flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-bold text-primary-foreground',
                'transition-all duration-200 ease-out',
                t.bg,
                'hover:brightness-105 active:scale-[0.99]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {dict.catalog.bundleCta}
              <span aria-hidden>→</span>
            </button>

          </div>
        ) : null}

        {/* Holographic foil sheen — follows the cursor, fades in on hover */}
        <div
          ref={sheenRef}
          aria-hidden
          className="pointer-events-none absolute inset-0 z-40 rounded-2xl opacity-0 mix-blend-soft-light transition-opacity duration-200"
          style={{
            backgroundImage:
              'radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,255,255,0.4), rgba(255,255,255,0) 38%), radial-gradient(circle at var(--mx,50%) var(--my,50%), rgba(255,86,180,0.22), rgba(86,170,255,0.18) 28%, rgba(160,86,255,0) 55%)',
          }}
        />
        {/* Inner edge light — gives the foil a crisp rim */}
        <div className="pointer-events-none absolute inset-0 z-30 rounded-2xl ring-1 ring-inset ring-white/10" aria-hidden />
      </div>
    </div>
  );
}

/* ============================================================
   Course rows — labelled category row + course cards
   ============================================================ */

function CourseSliderRow({
  category: c,
  courses,
}: {
  category: Category;
  courses: Course[];
}) {
  const { dict } = useV2Locale();
  const t = TONE_CLASSES[c.tone];
  if (courses.length === 0) return null;
  const hasImage = Boolean(c.imageUrl);

  return (
    <div id={`cat-${c.id}`} className="scroll-mt-24">
      <Slider
        tone={c.tone}
        ariaLabel={`${c.name} — ${dict.slider.ariaCourses}`}
        heading={
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Mission patch — category image, or icon on tone wash */}
            <span
              className={cn(
                'relative grid h-10 w-10 sm:h-14 sm:w-14 shrink-0 place-items-center overflow-hidden rounded-xl sm:rounded-2xl border',
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
                <span className="text-lg sm:text-2xl">{c.icon}</span>
              )}
            </span>

            <div className="min-w-0">
              <p className="font-mono text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <span className="tabular-nums text-foreground">{c.courses}</span> {dict.catalog.coursesUnit}
                <span className="px-1.5 opacity-40">·</span>
                <span className="tabular-nums text-foreground">{c.lessons}</span> {dict.catalog.lessonsUnit}
              </p>
              <h3
                className="mt-0.5 text-[15px] sm:text-2xl font-bold leading-tight tracking-tight truncate"
                style={{ fontFamily: 'var(--font-caps)' }}
              >
                {c.name}
              </h3>
            </div>
          </div>
        }
      >
        {courses.map((co) => (
          <div
            key={co.id}
            data-slide-item
            className="snap-start shrink-0 w-[216px] sm:w-[248px] lg:w-[268px]"
          >
            <CourseCard course={co} category={c} />
          </div>
        ))}
      </Slider>
    </div>
  );
}

// Course card — a clean, price-forward product card. Tone icon chip + a bold
// discount badge up top, display-font title and description, audience/level/pace
// chips, then an always-visible footer that puts the price front and centre
// (never hidden on hover) above a single outlined CTA. The only decoration is
// a soft tone glow + an accent ring that warm up on hover. Tokens only.
function CourseCard({
  course: co,
  category: c,
}: {
  course: Course;
  category: Category;
}) {
  const { dict, href } = useV2Locale();
  const t = TONE_CLASSES[c.tone];
  const owned = useBundle()?.isCourseOwned(co.id) ?? false;
  const isFree = !(typeof co.price === 'number' && co.price > 0);
  // Admin-set "was" price → struck retail + discount %, mirroring the course
  // detail page. Only shown when a retail price genuinely exceeds the current one.
  const hasRetail =
    !isFree &&
    typeof co.retailPrice === 'number' &&
    typeof co.price === 'number' &&
    co.retailPrice > co.price;
  const discount = hasRetail
    ? Math.round(((co.retailPrice! - co.price!) / co.retailPrice!) * 100)
    : 0;

  return (
    <a
      href={href(`courses/${co.id}`)}
      draggable={false}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-[18px] sm:rounded-[20px] border border-border bg-card p-4',
        'transition-all duration-300 ease-out transform-gpu',
        'hover:-translate-y-2 hover:border-transparent hover:shadow-[0_26px_52px_-22px_var(--pulse-glow)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      {/* Soft tone glow, top-right — intensifies on hover */}
      <div
        className={cn(
          'pointer-events-none absolute -top-14 -right-14 h-40 w-40 rounded-full blur-3xl opacity-[0.13] transition-opacity duration-500 group-hover:opacity-30',
          t.bg,
        )}
        aria-hidden
      />
      {/* Tone accent ring — fades in on hover for a premium edge */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[20px] ring-1 ring-inset opacity-0 transition-opacity duration-300 group-hover:opacity-100',
          t.ring,
        )}
        aria-hidden
      />

      {/* Discount ribbon. Absolute, so a full-price card starts straight at
          the title instead of reserving an empty row for it. */}
      {!owned && discount > 0 && (
        <span
          className={cn(
            'absolute right-3 top-3 z-10 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums text-primary-foreground shadow-sm',
            t.bg,
          )}
        >
          −{discount}%
        </span>
      )}

      {/* Title — the anchor of the card, and now shown in full: no clamp, so
          a long name never ends in an ellipsis. The description came out to
          pay for the extra lines. The category icon chip that used to sit
          above it is gone too: every card in a row is the same category, and
          the row header already shows it. */}
      <h4
        className={cn(
          'relative text-[17px] sm:text-[18px] font-bold leading-snug tracking-tight',
          // Keeps the text clear of the discount ribbon in the corner.
          !owned && discount > 0 && 'pr-12',
        )}
        style={{ fontFamily: 'var(--font-caps)' }}
      >
        {co.title}
      </h4>

      {/* One readable meta line replaces three 9px uppercase chips. The
          audience chip is gone with them — it's inherited from the category,
          so it was identical on every card in the row. */}
      <div className="relative mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-muted-foreground">
        <LevelMeter level={co.level} tone={c.tone} />
        <span className="font-semibold text-foreground/85">{dict.level[co.level]}</span>
        <span className="opacity-40">·</span>
        <span>
          <span className="font-bold tabular-nums text-foreground/85">{co.lessons}</span>{' '}
          {dict.courseCard.lessonsShort}
        </span>
      </div>

      {/* Footer — price, then one clear action */}
      <div className="relative mt-auto pt-3.5">
        <div className="border-t border-dashed border-border/80 pt-3">
          {owned ? (
            <span className={cn('flex items-center gap-1.5 text-[15px] font-bold', t.text)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
              {dict.catalog.bundleOwned}
            </span>
          ) : isFree ? (
            <span
              className={cn('block text-[21px] font-bold leading-none tracking-tight', t.text)}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {dict.courseCard.free}
            </span>
          ) : (
            // Price and struck retail only. The "save ₾40" chip is gone — the
            // −% ribbon and the struck price already say it twice.
            <span className="flex items-baseline gap-1.5">
              <span
                className="text-[23px] font-bold leading-none tabular-nums"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                ₾{co.price}
              </span>
              {hasRetail && (
                <span className="text-[12.5px] tabular-nums text-muted-foreground line-through">
                  ₾{co.retailPrice}
                </span>
              )}
            </span>
          )}

          {/* Outlined, not filled: this is navigation. The filled tone button
              stays reserved for "buy" on the bundle cards. */}
          <span
            className={cn(
              'mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border text-[13px] font-bold',
              'transition-colors duration-200',
              // Tone tint + tone border/text. Static classes from TONE_CLASSES
              // only — Tailwind can't see a class built by interpolation.
              t.iconBg,
              t.ring,
              t.text,
              'group-hover:bg-foreground/[0.06]',
            )}
            aria-hidden
          >
            {dict.courseCard.open}
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </span>
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

/* ============================================================
   Bundle buy dialog — a focused confirm sheet for "get the bundle".
   Phases: idle → processing → done (or error). Accessible: Esc to close,
   backdrop click, body-scroll lock, primary action auto-focused. On phones
   it rises as a bottom sheet; on larger screens it's a centered card.
   ============================================================ */

function BundleDialog({
  category,
  authed,
  owned,
  onConfirm,
  onClose,
}: {
  category: Category | null;
  authed: boolean;
  owned: boolean;
  onConfirm: (category: Category) => Promise<void>;
  onClose: () => void;
}) {
  const { dict } = useV2Locale();
  const [phase, setPhase] = React.useState<'idle' | 'processing' | 'done' | 'error'>('idle');
  const confirmRef = React.useRef<HTMLButtonElement>(null);

  // Reset the phase whenever a new bundle opens (already-owned opens at "done").
  React.useEffect(() => {
    if (category) setPhase(owned ? 'done' : 'idle');
  }, [category, owned]);

  // Esc to close, lock body scroll, focus the primary action.
  React.useEffect(() => {
    if (!category) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = window.setTimeout(() => confirmRef.current?.focus(), 40);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(id);
    };
  }, [category, onClose]);

  if (!category) return null;

  const c = category;
  const t = TONE_CLASSES[c.tone];
  const price = bundlePricing(c);
  const rating = bundleRating(c.id);
  const hasImage = Boolean(c.imageUrl);
  const busy = phase === 'processing';
  // An admin-set bundle price means this is a real purchase: the button buys,
  // and onConfirm hands off to BOG (or to login) rather than granting anything.
  const paid = (c.price ?? 0) > 0;

  const handleConfirm = async () => {
    setPhase('processing');
    try {
      await onConfirm(c);
      // A paid bundle is navigating away to the bank right now — nothing is
      // owned until the payment callback says so, so stay on the spinner
      // instead of flashing "the bundle is yours" at someone who hasn't paid.
      if (!paid) setPhase('done');
    } catch {
      setPhase('error');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={c.name}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-sm animate-[bundleOverlayIn_0.2s_ease-out]"
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-md overflow-hidden rounded-t-[28px] sm:rounded-[28px] border border-border bg-card shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] animate-[bundleSheetIn_0.3s_cubic-bezier(0.16,1,0.3,1)]">
        {/* Tone top bar */}
        <div className={cn('h-1.5 w-full', t.bg)} aria-hidden />

        {/* Soft tone glow */}
        <div
          className={cn('pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full blur-3xl opacity-20', t.bg)}
          aria-hidden
        />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label={dict.catalog.bundleCancel}
          className="absolute right-3.5 top-3.5 z-10 grid h-8 w-8 place-items-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {phase === 'done' ? (
          /* ── Success ── */
          <div className="relative px-6 pb-7 pt-8 text-center">
            <div
              className={cn(
                'mx-auto grid h-16 w-16 place-items-center rounded-full text-primary-foreground',
                t.bg,
                'animate-[bundlePop_0.34s_cubic-bezier(0.16,1,0.3,1)]',
              )}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h3 className="mt-4 text-xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              {dict.catalog.bundleDoneTitle}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{dict.catalog.bundleDoneDesc}</p>

            <a
              href={`#cat-${c.id}`}
              onClick={onClose}
              className={cn(
                'mt-6 flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground',
                t.bg,
                'transition-all hover:brightness-105 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {dict.catalog.bundleStart}
              <span aria-hidden>→</span>
            </a>
            {!authed && (
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                {dict.catalog.bundleGuestNote}
              </p>
            )}
          </div>
        ) : (
          /* ── Confirm ── */
          <div className="relative">
            {/* Cover banner — big, centered category image */}
            <div className={cn('relative h-40 w-full overflow-hidden', !hasImage && t.iconBg)}>
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl as string}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center">
                  <span className="text-6xl" aria-hidden>
                    {c.icon}
                  </span>
                </div>
              )}
              {/* Fade the bottom into the card so the text below sits cleanly */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-card" />
            </div>

            {/* Identity — centered under the cover */}
            <div className="relative px-6 pt-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {dict.catalog.bundleEyebrow}
              </p>
              <h3 className="mt-0.5 text-xl font-bold leading-tight tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {c.name}
              </h3>
              <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={t.text} aria-hidden>
                  <path d="M12 17.3 6.2 21l1.5-6.6L2 9.2l6.8-.6L12 2l3.2 6.6 6.8.6-5.7 5.2L17.8 21z" />
                </svg>
                <span className="font-semibold tabular-nums text-foreground">{rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 pb-6 pt-5">

            {/* Order summary — itemised value stack */}
            <div className="mt-6 rounded-2xl border border-border bg-background/40 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-foreground/85">
                  <span className="font-semibold text-foreground">{c.courses}</span> {dict.catalog.coursesUnit}
                  <span className="px-1 opacity-40">·</span>
                  <span className="font-semibold text-foreground">{c.lessons}</span> {dict.catalog.lessonsUnit}
                </span>
                {price.save > 0 && (
                  <span className="shrink-0 tabular-nums text-muted-foreground line-through">₾{price.retail}</span>
                )}
              </div>

              {[dict.courseDetail.trustLifetime, dict.courseDetail.trust24x7, dict.courseDetail.trustCertificate].map((f) => (
                <div key={f} className="mt-2.5 flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 text-foreground/85">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={cn('shrink-0', t.text)} aria-hidden>
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {f}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {dict.catalog.bundleIncluded}
                  </span>
                </div>
              ))}

              <div className="my-3.5 border-t border-border" />

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-semibold">{dict.courseDetail.priceLabel}</span>
                <span className="text-[26px] font-bold leading-none tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                  ₾{price.bundle}
                </span>
              </div>
              {price.save > 0 && (
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className={cn('text-xs font-semibold', t.text)}>
                    {dict.catalog.bundleSave} ₾{price.save}
                  </span>
                  <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-bold', t.chip)}>
                    −{price.pct}%
                  </span>
                </div>
              )}
            </div>

            {phase === 'error' && (
              <p className="mt-4 rounded-xl border border-heart/40 bg-heart/10 px-3 py-2 text-center text-xs font-semibold text-heart">
                {dict.catalog.bundleErrorRetry}
              </p>
            )}

            {/* Primary action — price in the button */}
            <button
              ref={confirmRef}
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className={cn(
                'mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-primary-foreground',
                t.bg,
                'transition-all hover:brightness-105 active:scale-[0.99] disabled:opacity-70 disabled:active:scale-100',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              )}
            >
              {busy ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {paid ? dict.catalog.bundleRedirecting : dict.catalog.bundleProcessing}
                </>
              ) : (
                <>
                  {paid ? dict.catalog.bundleBuy : dict.catalog.bundleConfirm}
                  <span className="opacity-70">·</span>
                  <span className="tabular-nums">₾{price.bundle}</span>
                </>
              )}
            </button>

            {/* Dismissing is the close button top-right, the backdrop, or Esc. */}

            {!authed && (
              <p className="mt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
                {dict.catalog.bundleGuestNote}
              </p>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

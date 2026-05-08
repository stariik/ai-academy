'use client';

import * as React from 'react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Walli, type WalliState } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';

const WALLI_STATES: WalliState[] = ['idle', 'wave', 'spin', 'tilt', 'dance', 'sleep'];

const PALETTE = [
  { name: 'Canvas', token: '--canvas', usage: '65% · main background' },
  { name: 'Surface', token: '--surface', usage: '15% · cards, modals, nav' },
  { name: 'Foreground', token: '--foreground', usage: '10% · body text, icons' },
  { name: 'Pulse', token: '--pulse', usage: '7% · primary accent, focus, CTA' },
  { name: 'Heart', token: '--heart', usage: '3% · streaks, errors, milestones' },
  { name: 'Border', token: '--border', usage: 'utility · soft seams' },
  { name: 'Muted FG', token: '--muted-foreground', usage: 'utility · secondary text' },
];

const RADIUS = [
  { name: 'sm', token: '--radius-sm', px: '10px' },
  { name: 'md', token: '--radius-md', px: '12px' },
  { name: 'lg', token: '--radius-lg', px: '16px' },
  { name: 'xl', token: '--radius-xl', px: '20px' },
];

const SIZE_SCALE: { px: number; label: string; use: string }[] = [
  { px: 28, label: 'Chip', use: 'header, badges' },
  { px: 56, label: 'Inline', use: 'cards, lists' },
  { px: 96, label: 'Feature', use: 'callouts' },
  { px: 180, label: 'Hero', use: 'page entry' },
];

/**
 * Step the hero mascot down on small viewports so it doesn't crowd the H1.
 * SSR default keeps a tablet-leaning size — server output looks balanced before hydration.
 */
function useResponsiveWalliSize() {
  const [size, setSize] = React.useState(190);
  React.useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 380) setSize(140);
      else if (w < 640) setSize(170);
      else if (w < 1024) setSize(190);
      else setSize(220);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

export default function DesignShowcase() {
  const heroSize = useResponsiveWalliSize();

  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans">
      <div className="bg-starfield absolute inset-0 -z-10 opacity-60" aria-hidden />

      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Walli size={32} state="idle" noShadow />

            <div>
              <p className="text-sm font-semibold leading-none tracking-tight">walle.school</p>
              <p className="text-[11px] text-muted-foreground">design system · v0.1</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">theme</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-16 space-y-16 sm:space-y-24">
        {/* Hero */}
        <section className="grid gap-8 sm:gap-12 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-pulse font-semibold">
              Step 1 · Foundation
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Eve aesthetic, <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-pulse via-pulse-soft to-pulse bg-clip-text text-transparent">
                kid-friendly motion
              </span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-prose">
              Tokens, theme provider, mascot. Toggle the theme top-right to see the circular
              reveal. Every primitive we add lands on this page.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-pulse/30 bg-pulse/10 text-pulse px-3 py-1.5 text-xs font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" />
                Design tokens live
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                Tailwind v4 · shadcn-ready
              </span>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <Walli size={heroSize} state="idle" />
          </div>
        </section>

        {/* Palette */}
        <Section
          eyebrow="01 · Palette"
          title="Five colors, one expression"
          description="Single accent (Pulse Cyan) carries every interactive state. Heart Pink shows up only for streaks, errors, and celebrations — keeping the energy where it matters."
        >
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {PALETTE.map((c) => (
              <div
                key={c.token}
                className="group rounded-2xl border border-border bg-card p-4 transition-all hover:border-pulse/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_var(--pulse-glow)]"
              >
                <div
                  className="h-20 w-full rounded-xl border border-border/60"
                  style={{ background: `var(${c.token})` }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <code className="text-[10px] text-muted-foreground font-mono">{c.token}</code>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.usage}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section
          eyebrow="02 · Typography"
          title="Display · Body · Mono"
          description="Space Grotesk for display headlines, Geist for body, Geist Mono for code. Base 17px, line-height 1.6, generous spacing for kid-friendly readability."
        >
          <div className="space-y-6 rounded-3xl border border-border bg-card p-6 sm:p-8">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Display · Space Grotesk
              </span>
              <p
                className="mt-1 text-4xl sm:text-5xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Learn AI with Walli
              </p>
            </div>
            <div className="border-t border-border pt-6">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Body · Geist Sans
              </span>
              <p className="mt-2 text-base sm:text-lg leading-relaxed">
                Walli is a small, curious droid with one big glowing eye. She blinks, floats, and
                gets excited when you answer correctly — and tilts her head sympathetically when
                you don&apos;t.
              </p>
            </div>
            <div className="border-t border-border pt-6">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Mono · Geist Mono
              </span>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-sm font-mono">
                <code>{`<Walli state="dance" size={120} />`}</code>
              </pre>
            </div>
          </div>
        </Section>

        {/* Walli — states */}
        <Section
          eyebrow="03 · Walli — states"
          title="One eye, many feelings"
          description="Six states cover the whole product surface. Click a card to preview, or auto-cycle to watch them in sequence."
        >
          <WalliPlayground />
        </Section>

        {/* Walli — sizing */}
        <Section
          eyebrow="04 · Walli — sizing"
          title="One mascot, every scale"
          description="From a 28px nav chip to a 180px page hero. The eye stays expressive; the body holds proportions."
        >
          <SizeScaleStrip />
        </Section>

        {/* Walli — in context */}
        <Section
          eyebrow="05 · Walli — in context"
          title="How she shows up in the product"
          description="Real surfaces, real reactions. Try the quiz card — correct answers celebrate, wrong ones get gentle empathy."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <QuizDemoCard />
            <WelcomeCard />
            <StreakCard />
            <EmptyStateCard />
          </div>
        </Section>

        {/* Radius + glow + motion */}
        <Section
          eyebrow="06 · Surfaces, glow, motion"
          title="Soft corners, gentle aura, spring-eased entrances"
          description="Kid-friendly radius scale (10–20px). Cyan glow signals interactivity. Heart Pink reserved for celebrations."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Radius</p>
              <div className="grid grid-cols-4 gap-3">
                {RADIUS.map((r) => (
                  <div key={r.name} className="text-center">
                    <div
                      className="aspect-square w-full bg-pulse/15 border border-pulse/30"
                      style={{ borderRadius: `var(${r.token})` }}
                    />
                    <p className="mt-2 text-xs font-semibold">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.px}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Glow</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card border border-pulse/40 p-5 glow-cyan flex items-center justify-center">
                  <span className="text-sm font-semibold text-pulse">Cyan glow</span>
                </div>
                <div className="rounded-2xl bg-card border border-heart/40 p-5 glow-pink flex items-center justify-center">
                  <span className="text-sm font-semibold text-heart">Heart glow</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted p-5 flex items-center justify-center">
                <span className="h-3 w-3 rounded-full bg-pulse glow-pulse mr-2" />
                <span className="text-sm text-muted-foreground">Pulse aura · idle indicators</span>
              </div>
            </div>
          </div>
        </Section>

        {/* Up next */}
        <Section
          eyebrow="Up next"
          title="Step 2 — primitives"
          description="Button, Card, Input, Badge, Modal — landing here next. Then we move to the landing page."
        >
          <div className="grid gap-3 sm:grid-cols-3">
            {['Button', 'Card', 'Input', 'Badge', 'Modal', 'Nav'].map((p) => (
              <div
                key={p}
                className="rounded-2xl border border-dashed border-border bg-card/40 p-5 text-center text-sm text-muted-foreground"
              >
                <span className="font-mono text-xs">&lt;{p} /&gt;</span>
                <p className="mt-1 text-[11px]">coming next</p>
              </div>
            ))}
          </div>
        </Section>

        <footer className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
          walle.school · design system showcase · keep this page bookmarked while we build
        </footer>
      </main>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-pulse font-semibold">
          {eyebrow}
        </p>
        <h2
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">{description}</p>
        )}
      </header>
      {children}
    </section>
  );
}

function WalliPlayground() {
  const [state, setState] = React.useState<WalliState>('idle');
  const [key, setKey] = React.useState(0);
  const [autoCycle, setAutoCycle] = React.useState(false);

  const trigger = (s: WalliState) => {
    setState(s);
    setKey((k) => k + 1);
  };

  React.useEffect(() => {
    if (!autoCycle) return;
    const id = window.setInterval(() => {
      setState((current) => {
        const i = WALLI_STATES.indexOf(current);
        return WALLI_STATES[(i + 1) % WALLI_STATES.length];
      });
      setKey((k) => k + 1);
    }, 3200);
    return () => window.clearInterval(id);
  }, [autoCycle]);

  const caption = STATE_CAPTIONS[state];

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(280px,360px)_1fr] items-start">
      <div className="relative rounded-3xl border border-border bg-card p-8 sm:p-12 flex items-center justify-center min-h-[280px] mx-auto w-full max-w-sm md:max-w-none">
        <Walli key={key} state={state} size={180} />
        {caption && (
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 max-w-[55%] animate-fade-in">
            <div className="rounded-2xl rounded-br-sm border border-pulse/40 bg-pulse/10 px-3 py-2 text-xs sm:text-sm font-semibold text-pulse shadow-[0_4px_16px_var(--pulse-glow)]">
              {caption}
            </div>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">States</p>
          <button
            onClick={() => setAutoCycle((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              autoCycle
                ? 'border-pulse/60 bg-pulse/10 text-pulse'
                : 'border-border bg-card text-muted-foreground hover:border-pulse/40 hover:text-pulse',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                autoCycle ? 'bg-pulse glow-pulse' : 'bg-muted-foreground',
              )}
            />
            {autoCycle ? 'Auto-cycling' : 'Auto-cycle'}
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {WALLI_STATES.map((s) => (
            <button
              key={s}
              onClick={() => trigger(s)}
              className={cn(
                'group relative rounded-2xl border bg-card p-4 text-left transition-all',
                'hover:-translate-y-0.5 hover:border-pulse/40 hover:shadow-[0_8px_30px_var(--pulse-glow)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                state === s
                  ? 'border-pulse/60 shadow-[0_0_0_1px_var(--pulse),0_8px_30px_var(--pulse-glow)]'
                  : 'border-border',
              )}
            >
              <p className="text-sm font-semibold capitalize">{s}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {STATE_DESCRIPTIONS[s]}
              </p>
              {state === s && (
                <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-bold text-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-pulse glow-pulse" />
                  live
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground pt-1">
          Honors{' '}
          <code className="font-mono text-[10px] bg-muted rounded px-1 py-0.5">
            prefers-reduced-motion
          </code>{' '}
          — animations gracefully fall back to a static pose.
        </p>
      </div>
    </div>
  );
}

function SizeScaleStrip() {
  // Largest size sets the row height so smaller mascots bottom-align cleanly.
  const rowHeight = 200;
  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-end gap-6 sm:gap-10 overflow-x-auto pb-2 -mx-2 px-2">
        {SIZE_SCALE.map((s) => (
          <div key={s.px} className="flex flex-col items-center flex-shrink-0">
            <div
              className="flex items-end justify-center"
              style={{ height: rowHeight, width: Math.max(s.px, 80) }}
            >
              <Walli size={s.px} noShadow />
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs font-semibold">{s.label}</p>
              <p className="text-[10px] text-muted-foreground font-mono">{s.px}px</p>
              <p className="text-[10px] text-muted-foreground hidden sm:block max-w-[120px]">
                {s.use}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Scroll horizontally on small screens to compare every scale.
      </p>
    </div>
  );
}

function QuizDemoCard() {
  const [walliState, setWalliState] = React.useState<WalliState>('idle');
  const [walliKey, setWalliKey] = React.useState(0);
  const [picked, setPicked] = React.useState<'correct' | 'wrong' | null>(null);

  const handleAnswer = (kind: 'correct' | 'wrong') => {
    if (picked) return;
    setPicked(kind);
    setWalliState(kind === 'correct' ? 'spin' : 'tilt');
    setWalliKey((k) => k + 1);
    if (kind === 'correct') {
      window.setTimeout(() => setWalliState('idle'), 1400);
    }
  };

  const reset = () => {
    setPicked(null);
    setWalliState('idle');
    setWalliKey((k) => k + 1);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <Walli key={walliKey} state={walliState} size={56} noShadow />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
            Quiz preview
          </p>
          <p className="font-semibold leading-snug">
            Which color carries every interactive state in the Eve palette?
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          onClick={() => handleAnswer('correct')}
          disabled={!!picked}
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            picked === 'correct'
              ? 'border-pulse bg-pulse/10 text-pulse shadow-[0_0_0_1px_var(--pulse),0_8px_30px_var(--pulse-glow)]'
              : picked
                ? 'border-border bg-card text-muted-foreground opacity-60'
                : 'border-border bg-card hover:border-pulse/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_var(--pulse-glow)]',
          )}
        >
          Pulse Cyan
        </button>
        <button
          onClick={() => handleAnswer('wrong')}
          disabled={!!picked}
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm font-semibold text-left transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            picked === 'wrong'
              ? 'border-heart bg-heart/10 text-heart shadow-[0_0_0_1px_var(--heart),0_8px_30px_var(--heart-glow)]'
              : picked
                ? 'border-border bg-card text-muted-foreground opacity-60'
                : 'border-border bg-card hover:border-pulse/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_var(--pulse-glow)]',
          )}
        >
          Heart Pink
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 min-h-[20px]">
        {picked === 'correct' && (
          <p className="text-xs text-pulse font-semibold">
            Nice — Pulse carries every CTA &amp; focus state.
          </p>
        )}
        {picked === 'wrong' && (
          <p className="text-xs text-heart font-semibold">
            Heart Pink is reserved for streaks and celebrations.
          </p>
        )}
        {picked && (
          <button
            onClick={reset}
            className="text-[11px] font-semibold text-muted-foreground hover:text-pulse ml-auto whitespace-nowrap"
          >
            try again →
          </button>
        )}
      </div>
    </div>
  );
}

function WelcomeCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-pulse/30 bg-card p-5 sm:p-6 flex items-center gap-4">
      <div
        aria-hidden
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 0% 50%, var(--pulse-glow) 0%, transparent 60%)',
        }}
      />
      <div className="relative flex-shrink-0">
        <Walli state="wave" size={64} noShadow />
      </div>
      <div className="relative min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Lesson start</p>
        <p className="font-semibold mt-0.5">Hi, I&apos;m Walli! Ready to learn?</p>
        <p className="text-xs text-muted-foreground mt-0.5">state · wave · greeting</p>
      </div>
    </div>
  );
}

function StreakCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-heart/30 bg-card p-5 sm:p-6 flex items-center gap-4">
      <div
        aria-hidden
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 100% 50%, var(--heart-glow) 0%, transparent 60%)',
        }}
      />
      <div className="relative flex-shrink-0">
        <Walli state="dance" size={64} noShadow />
      </div>
      <div className="relative min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-heart font-semibold">
          7-day streak
        </p>
        <p className="font-semibold mt-0.5">You&apos;re on fire!</p>
        <p className="text-xs text-muted-foreground mt-0.5">state · dance · milestone</p>
      </div>
    </div>
  );
}

function EmptyStateCard() {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 flex items-center gap-4">
      <div className="flex-shrink-0 opacity-80">
        <Walli state="sleep" size={64} noShadow />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Empty state</p>
        <p className="font-semibold mt-0.5">No lessons today — come back tomorrow.</p>
        <p className="text-xs text-muted-foreground mt-0.5">state · sleep · idle</p>
      </div>
    </div>
  );
}

const STATE_DESCRIPTIONS: Record<WalliState, string> = {
  idle: 'Default · float + blink',
  wave: 'Lesson start · greeting',
  spin: 'Correct answer · celebration',
  tilt: 'Wrong answer · gentle empathy',
  dance: 'Streak milestone · victory',
  sleep: 'Empty state · come back later',
};

const STATE_CAPTIONS: Record<WalliState, string> = {
  idle: '',
  wave: 'Hi there!',
  spin: 'Nice work!',
  tilt: 'Almost — try again',
  dance: '7-day streak!',
  sleep: 'Zzz...',
};

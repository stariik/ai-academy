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

export default function DesignShowcase() {
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
            <Walli size={220} state="idle" />
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

        {/* Walli states */}
        <Section
          eyebrow="03 · Walli — the mascot"
          title="One eye, many feelings"
          description="Six states cover the whole product surface. Click any card to preview that state."
        >
          <WalliPlayground />
        </Section>

        {/* Radius + glow + motion */}
        <Section
          eyebrow="04 · Surfaces, glow, motion"
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

  const trigger = (s: WalliState) => {
    setState(s);
    setKey((k) => k + 1);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[auto_1fr] items-start">
      <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 flex items-center justify-center min-h-[280px] mx-auto w-full max-w-sm lg:max-w-none lg:w-auto">
        <Walli key={key} state={state} size={180} />
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

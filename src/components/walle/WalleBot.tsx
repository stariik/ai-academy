'use client';

// ============================================================
// Walle, bottom-right. A floating guide whose one job is to turn
// "I don't know where to start" into an ordered plan of real courses.
//
// One question on screen at a time — not a chat log. The question and its
// answers share a single scroll box (never scroll up to re-read the ask),
// answered questions collapse into one strip, and a single-choice tap
// submits itself. Stateless by design: nothing is persisted, so
// logged-out visitors get the full experience.
// ============================================================

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Pencil,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { Walle, type WalleState } from '@/components/walle/Walle';
import { cn } from '@/lib/utils';
import { isLocale, type Locale } from '@/lib/v2/i18n';
import type {
  OnboardingAnswer,
  OnboardingQuestion,
  OnboardingRoadmapStep,
} from '@/lib/onboarding';

type Phase = 'intro' | 'interview' | 'complete';

type Turn = {
  acknowledgement: string;
  complete: boolean;
  question: OnboardingQuestion | null;
  roadmap: OnboardingRoadmapStep[] | null;
  closing: string | null;
};

// The server runs 4–7 questions. 6 is the honest midpoint to pace the bar
// against — it fills steadily instead of promising a count we won't hit.
const PACE = 6;

const COPY = {
  en: {
    open: 'Open Walle, your learning guide',
    close: 'Close',
    restart: 'Start over',
    nudge: 'New here? I’ll build your learning plan in 2 minutes.',
    name: 'walle',
    roleIdle: 'your learning guide',
    roleThinking: 'thinking…',
    roleDone: 'your plan is ready',
    greeting: 'Hi 👋 I’m Walle.',
    pitch: 'Tell me what you want to get better at, and I’ll turn it into a plan — which course to start with, and what comes next.',
    start: 'Build my plan',
    answered: (n: number) => (n === 1 ? '1 answer so far' : `${n} answers so far`),
    pickHint: (max: number) => `pick up to ${max}`,
    ownWords: 'Type my own answer',
    placeholder: 'In your own words…',
    sendLabel: 'Send answer',
    continue: 'Continue',
    error: 'I lost the signal for a second. Your answers are safe — try again.',
    retry: 'Try again',
    thinking: 'Walle is thinking…',
    roadmapTitle: 'Your roadmap',
    startStep: 'Start',
    browseAll: 'Browse all courses',
  },
  ka: {
    open: 'გახსენი Walle, შენი სასწავლო გზამკვლევი',
    close: 'დახურვა',
    restart: 'თავიდან დაწყება',
    nudge: 'პირველად ხარ? 2 წუთში სასწავლო გეგმას აგიწყობ.',
    name: 'walle',
    roleIdle: 'შენი სასწავლო გზამკვლევი',
    roleThinking: 'ვფიქრობ…',
    roleDone: 'შენი გეგმა მზადაა',
    greeting: 'გამარჯობა 👋 მე Walle ვარ.',
    pitch: 'მითხარი, რა გაინტერესებს და მე დაგეხმარები სასწავლო გეგმის შედგენაში',
    start: 'ჩემი გეგმის აწყობა',
    answered: (n: number) => `${n} პასუხი`,
    pickHint: (max: number) => `აირჩიე მაქსიმუმ ${max}`,
    ownWords: 'ჩემი პასუხის აკრეფა',
    placeholder: 'შენი სიტყვებით…',
    sendLabel: 'პასუხის გაგზავნა',
    continue: 'გაგრძელება',
    error: 'კავშირი წამით დავკარგე. პასუხები შენახულია — გთხოვ, კიდევ სცადო.',
    retry: 'ხელახლა ცდა',
    thinking: 'Walle ფიქრობს…',
    roadmapTitle: 'შენი გზამკვლევი',
    startStep: 'დაწყება',
    browseAll: 'ყველა კურსი',
  },
} satisfies Record<Locale, Record<string, unknown>>;

type Copy = (typeof COPY)['en'];

const NUDGE_KEY = 'walle-bot-nudge-seen';

export default function WalleBot() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const locale: Locale = isLocale(segments[0] ?? '') ? (segments[0] as Locale) : 'ka';
  const section = segments[1] ?? '';
  // Public storefront only — inside a lesson the tutor chat already is Walle.
  const visible = ['', 'courses', 'about', 'contact'].includes(section);
  // Course detail pages carry a sticky mobile buy bar; step over it.
  const overBuyBar = section === 'courses' && Boolean(segments[2]);

  const T = COPY[locale];
  const reducedMotion = useReducedMotion();

  const [open, setOpen] = React.useState(false);
  const [nudge, setNudge] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>('intro');
  const [answers, setAnswers] = React.useState<OnboardingAnswer[]>([]);
  const [ack, setAck] = React.useState('');
  const [closing, setClosing] = React.useState('');
  const [question, setQuestion] = React.useState<OnboardingQuestion | null>(null);
  const [roadmap, setRoadmap] = React.useState<OnboardingRoadmapStep[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [freeText, setFreeText] = React.useState('');
  const [thinking, setThinking] = React.useState(false);
  const [error, setError] = React.useState('');
  const [historyOpen, setHistoryOpen] = React.useState(false);
  // Chip questions hide the keyboard until asked for — one clear way in.
  const [writing, setWriting] = React.useState(false);

  const bodyRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const advanceRef = React.useRef(0);

  const textMode = question?.kind === 'text' || writing;

  // One gentle wave per tab, only if they haven't opened him yet.
  React.useEffect(() => {
    if (!visible || open) return;
    if (sessionStorage.getItem(NUDGE_KEY)) return;
    const timer = window.setTimeout(() => setNudge(true), 6000);
    return () => window.clearTimeout(timer);
  }, [visible, open]);

  const dismissNudge = React.useCallback(() => {
    setNudge(false);
    sessionStorage.setItem(NUDGE_KEY, '1');
  }, []);

  // Escape closes; on phones the panel is full-screen, so lock the page behind it.
  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const phone = !window.matchMedia('(min-width: 640px)').matches;
    const previous = document.body.style.overflow;
    if (phone) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      if (phone) document.body.style.overflow = previous;
    };
  }, [open]);

  React.useEffect(() => () => window.clearTimeout(advanceRef.current), []);

  // Every question is a fresh card, so land at its top — never mid-list.
  React.useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [question?.id, phase, reducedMotion]);

  React.useEffect(() => {
    if (!open || !textMode) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [open, textMode, question?.id]);

  const runTurn = React.useCallback(
    async (nextAnswers: OnboardingAnswer[]): Promise<Turn> => {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, answers: nextAnswers }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'turn_failed');
      return data as Turn;
    },
    [locale],
  );

  const start = async () => {
    if (thinking) return;
    setThinking(true);
    setError('');
    setPhase('interview');
    try {
      const result = await runTurn([]);
      setAck(result.acknowledgement || '');
      setQuestion(result.question);
      if (result.complete) {
        setRoadmap(result.roadmap ?? []);
        setClosing(result.closing || '');
        setPhase('complete');
      }
    } catch {
      setError(T.error);
    } finally {
      setThinking(false);
    }
  };

  const send = async (optionIds: string[], text: string) => {
    if (!question || thinking) return;
    const labels = optionIds
      .map((id) => question.options.find((option) => option.id === id)?.label)
      .filter((label): label is string => Boolean(label));
    const displayText = [...labels, text.trim()].filter(Boolean).join(' · ');
    if (!displayText) return;

    const answer: OnboardingAnswer = {
      questionId: question.id,
      question: question.text,
      kind: question.kind,
      selectedOptionIds: optionIds,
      selectedLabels: labels,
      freeText: text.trim(),
      displayText,
      answeredAt: new Date().toISOString(),
    };
    const nextAnswers = [...answers, answer];
    const previousAnswers = answers;
    const previousQuestion = question;

    // Optimistic: the strip and the bar move the instant they answer.
    setAnswers(nextAnswers);
    setQuestion(null);
    setSelected([]);
    setFreeText('');
    setWriting(false);
    setThinking(true);
    setError('');
    try {
      const result = await runTurn(nextAnswers);
      setAck(result.acknowledgement || '');
      if (result.complete) {
        setRoadmap(result.roadmap ?? []);
        setClosing(result.closing || '');
        setPhase('complete');
      } else {
        setQuestion(result.question);
      }
    } catch {
      setAnswers(previousAnswers);
      setQuestion(previousQuestion);
      setError(T.error);
    } finally {
      setThinking(false);
    }
  };

  const pick = (id: string) => {
    if (!question || thinking) return;
    if (question.kind === 'single') {
      setSelected([id]);
      // Let the tick render before the card flips — confirms what registered.
      // freeText rides along so a tap never discards what they already typed.
      window.clearTimeout(advanceRef.current);
      advanceRef.current = window.setTimeout(() => send([id], freeText), 190);
      return;
    }
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      const max = question.maxSelections ?? 2;
      return current.length >= max ? [...current.slice(1), id] : [...current, id];
    });
  };

  // Number keys pick options on desktop; the badge on each row is the hint.
  const pickRef = React.useRef(pick);
  React.useEffect(() => {
    pickRef.current = pick;
  });
  React.useEffect(() => {
    if (!open || !question || thinking || textMode) return;
    const options = question.options;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const option = options[Number(event.key) - 1];
      if (!option) return;
      event.preventDefault();
      pickRef.current(option.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, question, thinking, textMode]);

  const restart = () => {
    window.clearTimeout(advanceRef.current);
    setPhase('intro');
    setAnswers([]);
    setAck('');
    setClosing('');
    setQuestion(null);
    setRoadmap([]);
    setSelected([]);
    setFreeText('');
    setWriting(false);
    setHistoryOpen(false);
    setError('');
  };

  if (!visible) return null;

  const minPick = question?.kind === 'multi' ? (question.minSelections ?? 1) : 1;
  const canSend = textMode
    ? freeText.trim().length >= 2 || selected.length >= minPick
    : selected.length >= minPick;

  const walleState: WalleState = thinking
    ? 'tilt'
    : phase === 'complete'
      ? 'dance'
      : phase === 'intro'
        ? 'wave'
        : 'idle';
  const status = thinking ? T.roleThinking : phase === 'complete' ? T.roleDone : T.roleIdle;
  // A sliver on question one, so the bar reads as "started" rather than "empty".
  const progress =
    phase === 'complete' ? 1 : Math.min((answers.length + 0.4) / PACE, 0.92);
  // The panel takes the launcher's place. Its anchor is sm-only: on phones the
  // panel is inset-0 full-screen, and a bottom-* class would override that.
  const launcherAnchor = overBuyBar ? 'bottom-24 lg:bottom-6' : 'bottom-5 sm:bottom-6';
  const panelAnchor = overBuyBar ? 'sm:bottom-24 lg:bottom-6' : 'sm:bottom-6';

  return (
    <>
      {/* ---------- Launcher ---------- */}
      <div
        className={cn(
          'fixed right-4 z-50 flex flex-row-reverse items-end gap-2 sm:right-6',
          launcherAnchor,
          open && 'hidden',
        )}
      >
        <motion.button
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            dismissNudge();
          }}
          aria-label={open ? T.close : T.open}
          aria-expanded={open}
          whileHover={reducedMotion ? undefined : { y: -3, scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
          className="group relative grid h-16 w-16 shrink-0 place-items-center rounded-full border border-border bg-card/90 shadow-[0_10px_30px_var(--pulse-glow)] backdrop-blur-xl transition-colors hover:border-pulse/60"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-pulse/10 opacity-0 transition-opacity group-hover:opacity-100"
          />
          <Walle state={nudge || open ? 'wave' : 'idle'} size={46} noShadow label="Walle" />
          {!open && (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 grid h-5 w-5 place-items-center rounded-full bg-pulse text-primary-foreground shadow-[0_0_0_3px_var(--background)]"
            >
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          )}
        </motion.button>

        <AnimatePresence>
          {nudge && !open && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.94 }}
              className="relative mb-1 max-w-[min(15rem,calc(100vw-6.5rem))] rounded-2xl rounded-br-md border border-border bg-card/95 px-3.5 py-2.5 pr-8 text-xs font-medium leading-relaxed text-foreground shadow-xl backdrop-blur-xl"
            >
              <button
                type="button"
                onClick={dismissNudge}
                aria-label={T.close}
                className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
              <button type="button" onClick={() => { setOpen(true); dismissNudge(); }} className="text-left">
                {T.nudge}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------- Panel ---------- */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={T.open}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            style={{ originX: 1, originY: 1 }}
            className={cn(
              'fixed inset-0 z-50 flex flex-col overflow-hidden border-border bg-card shadow-2xl',
              'sm:inset-auto sm:right-6 sm:h-[min(40rem,calc(100dvh-7.5rem))] sm:w-[24.5rem] sm:rounded-[1.75rem] sm:border',
              'lg:w-[26rem]',
              panelAnchor,
            )}
          >
            {/* Header */}
            <div className="relative flex shrink-0 items-center gap-2.5 border-b border-border bg-gradient-to-r from-pulse/10 via-transparent to-heart/10 px-3.5 py-2.5">
              <Walle state={walleState} size={34} noShadow label="Walle" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black lowercase leading-none">{T.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full', thinking ? 'bg-heart' : 'bg-pulse')} />
                  {status}
                </p>
              </div>
              {phase !== 'intro' && (
                <button
                  type="button"
                  onClick={restart}
                  aria-label={T.restart}
                  title={T.restart}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={T.close}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Progress hairline — no fake "of 7", it just fills as they go */}
            {phase !== 'intro' && (
              <div className="h-[3px] shrink-0 bg-muted">
                <motion.div
                  className="h-full rounded-r-full bg-pulse"
                  initial={false}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: 'spring', stiffness: 160, damping: 26 }}
                />
              </div>
            )}

            {/* Answered so far — one row, expands on demand */}
            {phase !== 'intro' && answers.length > 0 && (
              <History
                answers={answers}
                open={historyOpen}
                label={T.answered(answers.length)}
                onToggle={() => setHistoryOpen((value) => !value)}
              />
            )}

            {/* Body — exactly one thing to read at a time */}
            <div
              ref={bodyRef}
              aria-live="polite"
              className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5"
            >
              {phase === 'intro' ? (
                <Intro copy={T} onStart={start} pending={thinking} reducedMotion={!!reducedMotion} />
              ) : phase === 'complete' ? (
                <Complete copy={T} closing={closing} steps={roadmap} locale={locale} onNavigate={() => setOpen(false)} />
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  {thinking ? (
                    <Thinking key="thinking" label={T.thinking} echo={answers[answers.length - 1]?.displayText} />
                  ) : question ? (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.22 }}
                    >
                      {ack && (
                        <p className="text-[11.5px] leading-relaxed text-muted-foreground">{ack}</p>
                      )}
                      <h3 className="mt-1.5 text-[15px] font-bold leading-snug text-foreground">
                        {question.text}
                      </h3>
                      {question.helper && (
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {question.helper}
                        </p>
                      )}
                      {question.kind === 'multi' && (
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-pulse">
                          {T.pickHint(question.maxSelections ?? 2)}
                        </p>
                      )}
                      {question.kind !== 'text' && (
                        <Options question={question} selected={selected} onPick={pick} />
                      )}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              )}

              {error && (
                <div className="mt-3 rounded-2xl border border-heart/40 bg-heart/5 px-3.5 py-3 text-xs leading-relaxed text-foreground">
                  {error}
                  {!question && (
                    <button
                      type="button"
                      onClick={start}
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-pulse"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {T.retry}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer — only appears when there is something left to confirm */}
            {phase === 'interview' && question && !thinking && (
              <div className="shrink-0 border-t border-border bg-card px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5">
                {textMode ? (
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      rows={1}
                      value={freeText}
                      onChange={(event) => {
                        onGrow(event.currentTarget);
                        setFreeText(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          if (canSend) send(selected, freeText);
                        }
                      }}
                      placeholder={question.placeholder || T.placeholder}
                      className="max-h-[104px] min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-[13px] leading-snug outline-none transition placeholder:text-muted-foreground focus:border-pulse"
                    />
                    <button
                      type="button"
                      onClick={() => send(selected, freeText)}
                      disabled={!canSend}
                      aria-label={T.sendLabel}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pulse text-primary-foreground shadow-[0_6px_18px_var(--pulse-glow)] transition enabled:hover:-translate-y-0.5 disabled:opacity-35"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                ) : question.kind === 'multi' ? (
                  <button
                    type="button"
                    onClick={() => send(selected, freeText)}
                    disabled={!canSend}
                    className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-pulse text-sm font-bold text-primary-foreground shadow-[0_6px_18px_var(--pulse-glow)] transition enabled:hover:-translate-y-0.5 disabled:opacity-35"
                  >
                    {T.continue}
                    {selected.length > 0 && (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary-foreground/20 text-[11px]">
                        {selected.length}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWriting(true)}
                    className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full text-[11.5px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-3 w-3" />
                    {T.ownWords}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================ */

function onGrow(element: HTMLTextAreaElement) {
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 104)}px`;
}

function Intro({
  copy,
  onStart,
  pending,
  reducedMotion,
}: {
  copy: Copy;
  onStart: () => void;
  pending: boolean;
  reducedMotion: boolean;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-1 text-center">
      <motion.div
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Walle state="wave" size={112} label="Walle" />
      </motion.div>

      <h2 className="mt-4 text-lg font-black">{copy.greeting}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.pitch}</p>

      <button
        type="button"
        onClick={onStart}
        disabled={pending}
        className="group mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-pulse px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_28px_var(--pulse-glow)] transition hover:-translate-y-0.5 disabled:opacity-60"
      >
        {pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {copy.start}
        {!pending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
      </button>
    </div>
  );
}

function History({
  answers,
  open,
  label,
  onToggle,
}: {
  answers: OnboardingAnswer[];
  open: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className="shrink-0 border-b border-border bg-muted/30">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <Check className="h-3 w-3 text-pulse" strokeWidth={3} />
        {label}
        <ChevronDown
          className={cn('ml-auto h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="max-h-44 space-y-1.5 overflow-y-auto px-4 pb-2.5"
          >
            {answers.map((answer) => (
              <li key={answer.questionId} className="border-l-2 border-border pl-2.5">
                <p className="truncate text-[10px] leading-snug text-muted-foreground">
                  {answer.question}
                </p>
                <p className="text-[11.5px] font-semibold leading-snug text-foreground">
                  {answer.displayText}
                </p>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function Options({
  question,
  selected,
  onPick,
}: {
  question: OnboardingQuestion;
  selected: string[];
  onPick: (id: string) => void;
}) {
  // Short, description-free labels tile two-up — halves the height of the list.
  const twoUp =
    question.options.length > 3 &&
    question.options.every((option) => !option.description && option.label.length <= 22);

  return (
    <div className={cn('mt-3', twoUp ? 'grid grid-cols-2 gap-1.5' : 'space-y-1.5')}>
      {question.options.map((option, index) => {
        const active = selected.includes(option.id);
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(option.id)}
            className={cn(
              'flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition',
              active
                ? 'border-pulse bg-pulse/10'
                : 'border-border bg-background hover:border-pulse/50 hover:bg-pulse/5',
              // An odd tail tile spans the row instead of leaving a gap.
              twoUp && index === question.options.length - 1 && question.options.length % 2 === 1
                ? 'col-span-2'
                : '',
            )}
          >
            {option.emoji && (
              <span className="shrink-0 text-[15px] leading-none">{option.emoji}</span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-[12.5px] font-semibold leading-snug">{option.label}</span>
              {option.description && (
                <span className="mt-0.5 line-clamp-2 block text-[10.5px] leading-snug text-muted-foreground">
                  {option.description}
                </span>
              )}
            </span>
            {/* One badge, two jobs: keyboard hint until picked, then the tick. */}
            <span
              className={cn(
                'grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] font-bold tabular-nums transition',
                active
                  ? 'border-pulse bg-pulse text-primary-foreground'
                  : 'border-border text-muted-foreground',
              )}
            >
              {active ? (
                <Check className="h-2.5 w-2.5" strokeWidth={4} />
              ) : (
                <span className="hidden sm:block">{index + 1}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Thinking({ label, echo }: { label: string; echo?: string }) {
  return (
    <motion.div
      key="thinking"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {echo && (
        <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-pulse px-3 py-1.5 text-[12px] font-medium leading-snug text-primary-foreground">
          {echo}
        </p>
      )}
      <div className={cn('flex items-center gap-2 text-[11px] font-medium text-muted-foreground', echo && 'mt-3')}>
        <span className="flex items-center gap-1" aria-hidden>
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="h-1.5 w-1.5 rounded-full bg-pulse"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: index * 0.14 }}
            />
          ))}
        </span>
        {label}
      </div>
    </motion.div>
  );
}

function Complete({
  copy,
  closing,
  steps,
  locale,
  onNavigate,
}: {
  copy: Copy;
  closing: string;
  steps: OnboardingRoadmapStep[];
  locale: Locale;
  onNavigate: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      {closing && (
        <p className="mb-3 text-[12px] leading-relaxed text-muted-foreground">{closing}</p>
      )}

      <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-pulse" />
        {copy.roadmapTitle}
      </p>

      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.courseId} className="relative flex gap-2.5">
            <div className="flex shrink-0 flex-col items-center">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-pulse text-[10px] font-black text-primary-foreground shadow-[0_0_0_3px_var(--pulse-glow)]">
                {index + 1}
              </span>
              {index < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <Link
              href={`/${locale}/courses/${step.courseId}`}
              onClick={onNavigate}
              className="group min-w-0 flex-1 rounded-xl border border-border bg-background p-2.5 transition hover:border-pulse/60 hover:bg-pulse/5"
            >
              <p className="flex items-baseline gap-2 text-[13px] font-bold leading-snug">
                <span className="min-w-0 flex-1">{step.title}</span>
                {step.when && (
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {step.when}
                  </span>
                )}
              </p>
              {step.why && (
                <p className="mt-1 line-clamp-2 text-[10.5px] leading-relaxed text-muted-foreground">
                  {step.why}
                </p>
              )}
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-bold text-pulse">
                {copy.startStep}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={`/${locale}#courses`}
        onClick={onNavigate}
        className="mt-3 inline-flex w-full items-center justify-center rounded-full border border-border py-2.5 text-xs font-bold text-muted-foreground transition hover:border-pulse/50 hover:text-foreground"
      >
        {copy.browseAll}
      </Link>
    </motion.div>
  );
}

'use client';

// ============================================================
// Walle, bottom-right. A floating guide whose one job is to turn
// "I don't know where to start" into an ordered plan of real courses.
//
// Stateless by design: the transcript lives in this component, nothing is
// persisted, so logged-out visitors get the full experience.
// ============================================================

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  Clock3,
  MessageCircleHeart,
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
  OnboardingTranscriptMessage,
} from '@/lib/onboarding';

type Phase = 'intro' | 'interview' | 'complete';

const MAX_QUESTIONS = 7;

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
    time: '2 minutes',
    questions: '4–7 questions',
    honest: 'No wrong answers',
    start: 'Build my plan',
    selectHint: (max: number) => `Choose up to ${max}`,
    ownWords: 'Or type it yourself…',
    sendLabel: 'Send answer',
    continue: 'Continue',
    error: 'I lost the signal for a second. Your answers are safe — try again.',
    retry: 'Try again',
    thinking: 'Walle is thinking…',
    step: (n: number) => `Question ${n} of ${MAX_QUESTIONS}`,
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
    time: '2 წუთი',
    questions: '4–7 კითხვა',
    honest: 'არასწორი პასუხი არ არსებობს',
    start: 'ჩემი გეგმის აწყობა',
    selectHint: (max: number) => `აირჩიე მაქსიმუმ ${max}`,
    ownWords: 'ან შენი სიტყვებით დაწერე…',
    sendLabel: 'პასუხის გაგზავნა',
    continue: 'გაგრძელება',
    error: 'კავშირი წამით დავკარგე. პასუხები შენახულია — გთხოვ, კიდევ სცადო.',
    retry: 'ხელახლა ცდა',
    thinking: 'Walle ფიქრობს…',
    step: (n: number) => `კითხვა ${n} / ${MAX_QUESTIONS}`,
    roadmapTitle: 'შენი გზამკვლევი',
    startStep: 'დაწყება',
    browseAll: 'ყველა კურსი',
  },
} satisfies Record<Locale, Record<string, unknown>>;

const NUDGE_KEY = 'walle-bot-nudge-seen';

function nowMessage(
  role: OnboardingTranscriptMessage['role'],
  content: string,
): OnboardingTranscriptMessage {
  return { role, content, at: new Date().toISOString() };
}

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
  const [messages, setMessages] = React.useState<OnboardingTranscriptMessage[]>([]);
  const [answers, setAnswers] = React.useState<OnboardingAnswer[]>([]);
  const [question, setQuestion] = React.useState<OnboardingQuestion | null>(null);
  const [roadmap, setRoadmap] = React.useState<OnboardingRoadmapStep[]>([]);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [freeText, setFreeText] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

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

  React.useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [messages, pending, phase, roadmap, reducedMotion]);

  React.useEffect(() => {
    if (open && question?.kind === 'text') {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 260);
      return () => window.clearTimeout(timer);
    }
  }, [open, question?.id, question?.kind]);

  const runTurn = React.useCallback(
    async (nextAnswers: OnboardingAnswer[]) => {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, answers: nextAnswers }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'turn_failed');
      return data as {
        complete: boolean;
        question: OnboardingQuestion | null;
        roadmap: OnboardingRoadmapStep[] | null;
        assistantMessage: OnboardingTranscriptMessage;
      };
    },
    [locale],
  );

  const start = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    setPhase('interview');
    setMessages([nowMessage('assistant', `${T.greeting}\n\n${T.pitch}`)]);
    try {
      const result = await runTurn([]);
      setMessages((current) => [...current, result.assistantMessage]);
      setQuestion(result.question);
      if (result.complete) {
        setRoadmap(result.roadmap ?? []);
        setPhase('complete');
      }
    } catch {
      setError(T.error);
    } finally {
      setPending(false);
    }
  };

  const canSubmit = React.useMemo(() => {
    if (!question || pending) return false;
    if (question.kind === 'text') return freeText.trim().length >= 2;
    const minimum = question.kind === 'multi' ? (question.minSelections ?? 1) : 1;
    return selected.length >= minimum || freeText.trim().length >= 2;
  }, [question, pending, selected.length, freeText]);

  const submit = async () => {
    if (!question || !canSubmit || pending) return;
    const labels = selected
      .map((id) => question.options.find((option) => option.id === id)?.label)
      .filter((label): label is string => Boolean(label));
    const displayText = [...labels, freeText.trim()].filter(Boolean).join(' · ');
    const answer: OnboardingAnswer = {
      questionId: question.id,
      question: question.text,
      kind: question.kind,
      selectedOptionIds: selected,
      selectedLabels: labels,
      freeText: freeText.trim(),
      displayText,
      answeredAt: new Date().toISOString(),
    };
    const nextAnswers = [...answers, answer];
    const previousMessages = messages;
    const previousQuestion = question;

    setMessages([...messages, nowMessage('user', displayText)]);
    setQuestion(null);
    setSelected([]);
    setFreeText('');
    setPending(true);
    setError('');
    try {
      const result = await runTurn(nextAnswers);
      setAnswers(nextAnswers);
      setMessages((current) => [...current, result.assistantMessage]);
      if (result.complete) {
        setRoadmap(result.roadmap ?? []);
        setPhase('complete');
      } else {
        setQuestion(result.question);
      }
    } catch {
      setMessages(previousMessages);
      setQuestion(previousQuestion);
      setError(T.error);
    } finally {
      setPending(false);
    }
  };

  const toggleOption = (id: string) => {
    if (!question || pending) return;
    if (question.kind === 'single') {
      setSelected((current) => (current[0] === id ? [] : [id]));
      return;
    }
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      const max = question.maxSelections ?? 2;
      return current.length >= max ? [...current.slice(1), id] : [...current, id];
    });
  };

  const restart = () => {
    setPhase('intro');
    setMessages([]);
    setAnswers([]);
    setQuestion(null);
    setRoadmap([]);
    setSelected([]);
    setFreeText('');
    setError('');
  };

  if (!visible) return null;

  const walleState: WalleState = pending
    ? 'tilt'
    : phase === 'complete'
      ? 'dance'
      : phase === 'intro'
        ? 'wave'
        : 'idle';
  const status = pending ? T.roleThinking : phase === 'complete' ? T.roleDone : T.roleIdle;
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
              'sm:inset-auto sm:right-6 sm:h-[min(38rem,calc(100dvh-9rem))] sm:w-[24rem] sm:rounded-[1.75rem] sm:border',
              'lg:w-[26rem]',
              panelAnchor,
            )}
          >
            {/* Header */}
            <div className="relative flex shrink-0 items-center gap-3 border-b border-border bg-gradient-to-r from-pulse/10 via-transparent to-heart/10 px-4 py-3">
              <Walle state={walleState} size={38} noShadow label="Walle" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black lowercase leading-none">{T.name}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full', pending ? 'bg-heart' : 'bg-pulse')} />
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

            {/* Progress */}
            {phase !== 'intro' && (
              <div className="flex shrink-0 gap-1 px-4 pt-3">
                {Array.from({ length: MAX_QUESTIONS }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-all duration-500',
                      phase === 'complete' || index < answers.length
                        ? 'bg-pulse'
                        : index === answers.length
                          ? 'bg-pulse/35'
                          : 'bg-muted',
                    )}
                  />
                ))}
              </div>
            )}

            {/* Body */}
            <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {phase === 'intro' ? (
                <Intro copy={T} onStart={start} pending={pending} reducedMotion={!!reducedMotion} />
              ) : (
                <>
                  {messages.map((message, index) => (
                    <Bubble
                      key={`${message.at}-${index}`}
                      message={message}
                      latest={index === messages.length - 1}
                      walleState={walleState}
                    />
                  ))}
                  {pending && <Typing label={T.thinking} />}
                  {phase === 'complete' && roadmap.length > 0 && (
                    <Roadmap
                      copy={T}
                      steps={roadmap}
                      locale={locale}
                      onNavigate={() => setOpen(false)}
                    />
                  )}
                </>
              )}

              {error && (
                <div className="rounded-2xl border border-heart/40 bg-heart/5 px-3.5 py-3 text-xs leading-relaxed text-foreground">
                  {error}
                </div>
              )}
            </div>

            {/* Composer */}
            {phase === 'interview' && question && !pending && (
              <Composer
                copy={T}
                question={question}
                selected={selected}
                freeText={freeText}
                canSubmit={canSubmit}
                inputRef={inputRef}
                onToggle={toggleOption}
                onFreeText={setFreeText}
                onSubmit={submit}
              />
            )}

            {phase === 'interview' && !question && error && (
              <div className="shrink-0 border-t border-border p-3">
                <button
                  type="button"
                  onClick={start}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-pulse text-sm font-bold text-primary-foreground"
                >
                  <RefreshCw className="h-4 w-4" />
                  {T.retry}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================ */

type Copy = (typeof COPY)['en'];

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
        <Walle state="wave" size={116} label="Walle" />
      </motion.div>

      <h2 className="mt-4 text-lg font-black">{copy.greeting}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.pitch}</p>

      {/* <div className="mt-4 flex flex-wrap justify-center gap-1.5">
        {[
          [Clock3, copy.time],
          [MessageCircleHeart, copy.questions],
          [Sparkles, copy.honest],
        ].map(([Icon, label]) => {
          const C = Icon as typeof Clock3;
          return (
            <span
              key={String(label)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/45 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground"
            >
              <C className="h-3 w-3 text-pulse" />
              {String(label)}
            </span>
          );
        })}
      </div> */}

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

function Bubble({
  message,
  latest,
  walleState,
}: {
  message: OnboardingTranscriptMessage;
  latest: boolean;
  walleState: WalleState;
}) {
  const assistant = message.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn('flex items-end gap-2', assistant ? 'justify-start' : 'justify-end')}
    >
      {assistant && (
        <div className="w-7 shrink-0">
          <Walle state={latest ? walleState : 'idle'} size={28} noShadow label="Walle" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
          assistant
            ? 'rounded-bl-md border border-border bg-muted/60 text-foreground'
            : 'rounded-br-md bg-pulse text-primary-foreground',
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function Typing({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 pl-9 text-[11px] font-medium text-muted-foreground">
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
  );
}

function Roadmap({
  copy,
  steps,
  locale,
  onNavigate,
}: {
  copy: Copy;
  steps: OnboardingRoadmapStep[];
  locale: Locale;
  onNavigate: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="pt-1"
    >
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-pulse" />
        {copy.roadmapTitle}
      </p>

      <ol className="space-y-2.5">
        {steps.map((step, index) => (
          <li key={step.courseId} className="relative flex gap-3">
            {/* Timeline rail */}
            <div className="flex shrink-0 flex-col items-center">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-pulse text-[11px] font-black text-primary-foreground shadow-[0_0_0_4px_var(--pulse-glow)]">
                {index + 1}
              </span>
              {index < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
            </div>

            <Link
              href={`/${locale}/courses/${step.courseId}`}
              onClick={onNavigate}
              className="group min-w-0 flex-1 rounded-2xl border border-border bg-background p-3 transition hover:border-pulse/60 hover:bg-pulse/5"
            >
              {step.when && (
                <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {step.when}
                </span>
              )}
              <p className="mt-1.5 text-sm font-bold leading-snug">{step.title}</p>
              {step.why && (
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{step.why}</p>
              )}
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-pulse">
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

function Composer({
  copy,
  question,
  selected,
  freeText,
  canSubmit,
  inputRef,
  onToggle,
  onFreeText,
  onSubmit,
}: {
  copy: Copy;
  question: OnboardingQuestion;
  selected: string[];
  freeText: string;
  canSubmit: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onToggle: (id: string) => void;
  onFreeText: (value: string) => void;
  onSubmit: () => void;
}) {
  const chips = question.kind !== 'text';
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="shrink-0 border-t border-border bg-card px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
    >
      {chips && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {question.kind === 'multi' ? copy.selectHint(question.maxSelections ?? 2) : copy.honest}
            </p>
            {selected.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pulse">
                {selected.length}
                <Check className="h-3 w-3" />
              </span>
            )}
          </div>

          <div className="max-h-[38vh] space-y-1.5 overflow-y-auto sm:max-h-56">
            {question.options.map((option) => {
              const active = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onToggle(option.id)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition',
                    active
                      ? 'border-pulse bg-pulse/10'
                      : 'border-border bg-background hover:border-pulse/45 hover:bg-pulse/5',
                  )}
                >
                  {option.emoji && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-muted text-sm">
                      {option.emoji}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold leading-snug">{option.label}</span>
                    {option.description && (
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition',
                      active ? 'border-pulse bg-pulse text-primary-foreground' : 'border-border',
                    )}
                  >
                    {active && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-2 flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={freeText}
          onChange={(event) => onFreeText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder={question.placeholder || copy.ownWords}
          className="max-h-24 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-3 text-[13px] leading-snug outline-none transition placeholder:text-muted-foreground focus:border-pulse"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label={copy.sendLabel}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pulse text-primary-foreground shadow-[0_6px_18px_var(--pulse-glow)] transition enabled:hover:-translate-y-0.5 disabled:opacity-35"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

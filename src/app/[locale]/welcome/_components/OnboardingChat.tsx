'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  LockKeyhole,
  MessageCircleHeart,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { Walli, type WalliState } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/v2/i18n';
import type {
  OnboardingAnswer,
  OnboardingProfileSignals,
  OnboardingQuestion,
  OnboardingTranscriptMessage,
} from '@/lib/onboarding';

type Phase = 'loading' | 'intro' | 'interview' | 'complete';

type Copy = {
  brandEyebrow: string;
  headline: (name: string) => string;
  intro: string;
  start: string;
  time: string;
  questions: string;
  honest: string;
  privacy: string;
  guideLabel: string;
  guideTitle: string;
  guideBody: string;
  stepLabel: (current: number) => string;
  saved: string;
  selectHint: (max: number) => string;
  ownWords: string;
  continue: string;
  send: string;
  retry: string;
  error: string;
  completeEyebrow: string;
  completeTitle: string;
  completeBody: string;
  pathReady: string;
  enter: string;
  preparing: string;
};

const COPY: Record<Locale, Copy> = {
  en: {
    brandEyebrow: 'A small conversation before we begin',
    headline: (name) => `${name}, let’s make this academy feel like yours.`,
    intro:
      'I’ll ask 4–7 short questions. There are no right answers — I simply want to understand what you hope to create, improve, or change with AI.',
    start: 'Personalize my path',
    time: 'About 2 minutes',
    questions: '4–7 thoughtful questions',
    honest: 'No wrong answers',
    privacy:
      'Your answers personalize learning and help us build a better academy. We only summarize what you choose to share.',
    guideLabel: 'Your learning companion',
    guideTitle: 'WALL‑E is listening',
    guideBody:
      'The same WALL‑E you’ll meet inside lessons is here to understand your starting point — then adapt the journey to you.',
    stepLabel: (current) => `Question ${current} · maximum 7`,
    saved: 'Answers saved',
    selectHint: (max) => `Choose up to ${max}`,
    ownWords: 'Or say it in your own words…',
    continue: 'Continue',
    send: 'Send answer',
    retry: 'Try again',
    error: 'I lost the signal for a moment. Your previous answers are safe — please try again.',
    completeEyebrow: 'Signal received',
    completeTitle: 'Your starting path is ready.',
    completeBody: 'WALL‑E will use this context to make explanations and recommendations more relevant.',
    pathReady: 'What I heard',
    enter: 'Enter my academy',
    preparing: 'WALL‑E is thinking about your answer…',
  },
  ka: {
    brandEyebrow: 'პატარა საუბარი დაწყებამდე',
    headline: (name) => `${name}, მოდი ეს აკადემია შენს სივრცედ ვაქციოთ.`,
    intro:
      'დაგისვამ 4–7 მოკლე კითხვას. სწორი ან არასწორი პასუხი არ არსებობს — უბრალოდ მინდა გავიგო, რისი შექმნა, გაუმჯობესება ან შეცვლა გინდა AI-ის დახმარებით.',
    start: 'ჩემი გზის მორგება',
    time: 'დაახლოებით 2 წუთი',
    questions: '4–7 გააზრებული კითხვა',
    honest: 'არასწორი პასუხი არ არსებობს',
    privacy:
      'შენი პასუხები სწავლას მოგარგებს და უკეთესი აკადემიის შექმნაში დაგვეხმარება. ვაჯამებთ მხოლოდ იმას, რასაც თავად გვიზიარებ.',
    guideLabel: 'შენი სასწავლო თანამგზავრი',
    guideTitle: 'WALL‑E გისმენს',
    guideBody:
      'იგივე WALL‑E, რომელსაც გაკვეთილებში შეხვდები, ახლა შენს საწყის წერტილს გაიგებს და შემდეგ გზას მოგარგებს.',
    stepLabel: (current) => `კითხვა ${current} · მაქსიმუმ 7`,
    saved: 'პასუხები შენახულია',
    selectHint: (max) => `აირჩიე მაქსიმუმ ${max}`,
    ownWords: 'ან შენი სიტყვებით მითხარი…',
    continue: 'გაგრძელება',
    send: 'პასუხის გაგზავნა',
    retry: 'ხელახლა ცდა',
    error: 'კავშირი წამით დავკარგე. წინა პასუხები შენახულია — გთხოვ, კიდევ სცადო.',
    completeEyebrow: 'სიგნალი მიღებულია',
    completeTitle: 'შენი საწყისი გზა მზადაა.',
    completeBody: 'WALL‑E ამ კონტექსტს ახსნებისა და რეკომენდაციების უკეთ მოსარგებად გამოიყენებს.',
    pathReady: 'რა გავიგე',
    enter: 'აკადემიაში შესვლა',
    preparing: 'WALL‑E შენს პასუხზე ფიქრობს…',
  },
};

function nowMessage(
  role: OnboardingTranscriptMessage['role'],
  content: string,
): OnboardingTranscriptMessage {
  return { role, content, at: new Date().toISOString() };
}

function isQuestion(value: unknown): value is OnboardingQuestion {
  if (!value || typeof value !== 'object') return false;
  const question = value as Partial<OnboardingQuestion>;
  return (
    typeof question.id === 'string' &&
    typeof question.text === 'string' &&
    (question.kind === 'single' || question.kind === 'multi' || question.kind === 'text') &&
    Array.isArray(question.options)
  );
}

function profileFromRow(row: Record<string, unknown>): OnboardingProfileSignals {
  const strings = (value: unknown) =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  const text = (key: string) => (typeof row[key] === 'string' ? String(row[key]) : '');
  return {
    interests: strings(row.interests),
    primaryGoal: text('primary_goal'),
    desiredOutcome: text('desired_outcome'),
    experienceLevel: text('experience_level'),
    learningPreferences: strings(row.learning_preferences),
    weeklyCommitment: text('weekly_commitment'),
    barriers: strings(row.barriers),
    motivation: text('motivation'),
    summary: text('ai_summary'),
    segmentLabel: text('segment_label'),
    opportunitySignals: strings(row.opportunity_signals),
    verbatimQuote: text('verbatim_quote'),
  };
}

export default function OnboardingChat({
  locale,
  displayName,
  redeemCode,
}: {
  locale: Locale;
  displayName: string;
  redeemCode?: string;
}) {
  const T = COPY[locale];
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const welcomeMessage = React.useMemo(
    () =>
      nowMessage(
        'assistant',
        locale === 'ka'
          ? `გამარჯობა, ${displayName} 👋 მე WALL‑E ვარ. სანამ შენთვის პირველ ნაბიჯს ავარჩევთ, მინდა ცოტა უკეთ გაგიცნო.`
          : `Hi, ${displayName} 👋 I’m WALL‑E. Before we choose your first step, I’d love to understand you a little better.`,
      ),
    [displayName, locale],
  );

  const [phase, setPhase] = React.useState<Phase>('loading');
  const [messages, setMessages] = React.useState<OnboardingTranscriptMessage[]>([welcomeMessage]);
  const [answers, setAnswers] = React.useState<OnboardingAnswer[]>([]);
  const [question, setQuestion] = React.useState<OnboardingQuestion | null>(null);
  const [profile, setProfile] = React.useState<OnboardingProfileSignals | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [freeText, setFreeText] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/onboarding', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('load_failed');
        return response.json();
      })
      .then(({ profile: saved }) => {
        if (cancelled || !saved) {
          if (!cancelled) setPhase('intro');
          return;
        }
        const savedRow = saved as Record<string, unknown>;
        const savedAnswers = Array.isArray(savedRow.answers)
          ? (savedRow.answers as OnboardingAnswer[])
          : [];
        const savedMessages = Array.isArray(savedRow.transcript)
          ? (savedRow.transcript as OnboardingTranscriptMessage[])
          : [];
        setAnswers(savedAnswers);
        if (savedMessages.length) setMessages(savedMessages);
        if (savedRow.status === 'completed') {
          setProfile(profileFromRow(savedRow));
          setPhase('complete');
          return;
        }
        if (isQuestion(savedRow.current_question)) {
          setQuestion(savedRow.current_question);
          setPhase('interview');
          return;
        }
        setPhase('intro');
      })
      .catch(() => {
        if (!cancelled) setPhase('intro');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollTo({
      top: element.scrollHeight,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }, [messages, pending, phase, reducedMotion]);

  React.useEffect(() => {
    if (question?.kind === 'text') {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 250);
      return () => window.clearTimeout(timer);
    }
  }, [question?.id, question?.kind]);

  const runTurn = React.useCallback(
    async (
      nextAnswers: OnboardingAnswer[],
      nextMessages: OnboardingTranscriptMessage[],
    ) => {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale, answers: nextAnswers, transcript: nextMessages }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'turn_failed');
      return data as {
        complete: boolean;
        question: OnboardingQuestion | null;
        profile: OnboardingProfileSignals | null;
        assistantMessage: OnboardingTranscriptMessage;
      };
    },
    [locale],
  );

  const startInterview = async () => {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const result = await runTurn([], messages);
      setMessages((current) => [...current, result.assistantMessage]);
      setQuestion(result.question);
      setPhase(result.complete ? 'complete' : 'interview');
      if (result.profile) setProfile(result.profile);
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

  const submitAnswer = async () => {
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
    const userMessage = nowMessage('user', displayText);
    const nextAnswers = [...answers, answer];
    const nextMessages = [...messages, userMessage];
    const previousMessages = messages;
    const previousQuestion = question;

    setMessages(nextMessages);
    setQuestion(null);
    setPending(true);
    setError('');
    try {
      const result = await runTurn(nextAnswers, nextMessages);
      setAnswers(nextAnswers);
      setMessages((current) => [...current, result.assistantMessage]);
      if (result.complete) {
        setProfile(result.profile);
        setPhase('complete');
      } else {
        setSelected([]);
        setFreeText('');
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
      setSelected([id]);
      return;
    }
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      const max = question.maxSelections ?? 2;
      if (current.length >= max) return [...current.slice(1), id];
      return [...current, id];
    });
  };

  const enterAcademy = () => {
    router.replace(
      redeemCode
        ? `/${locale}/redeem/${encodeURIComponent(redeemCode)}`
        : `/${locale}`,
    );
  };

  const walliState: WalliState = pending
    ? 'tilt'
    : phase === 'complete'
      ? 'dance'
      : phase === 'intro'
        ? 'wave'
        : 'idle';
  const currentStep = Math.min(answers.length + 1, 7);

  return (
    <main className="relative min-h-dvh overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-36 h-[32rem] w-[32rem] rounded-full bg-pulse/12 blur-3xl" />
        <div className="absolute -bottom-48 -right-36 h-[34rem] w-[34rem] rounded-full bg-heart/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_center,var(--grid-line)_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-0 sm:px-5 lg:px-7">
        <header className="onboarding-page-header hidden h-20 shrink-0 items-center justify-between sm:flex">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-pulse text-sm font-black text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)]">
              W
            </div>
            <div>
              <p className="text-sm font-black leading-none">walle.academy</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {T.brandEyebrow}
              </p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur">
            <LockKeyhole className="h-3 w-3 text-pulse" />
            {T.saved}
          </div>
        </header>

        <div className="onboarding-layout grid min-h-0 flex-1 lg:h-[calc(100dvh-5rem)] lg:flex-none lg:grid-cols-[330px_minmax(0,1fr)] lg:gap-5 lg:pb-7">
          <aside className="relative hidden min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#071321] p-7 text-white shadow-2xl shadow-pulse/10 lg:flex lg:flex-col [@media(max-height:760px)]:p-5">
            <div aria-hidden className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pulse/20 blur-3xl" />
            <div aria-hidden className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-heart/15 blur-3xl" />
            <div className="relative shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
                {T.guideLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold">{T.guideTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{T.guideBody}</p>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden py-2">
              <motion.div
                animate={reducedMotion ? undefined : { y: [0, -7, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="origin-center [@media(max-height:760px)]:scale-75"
              >
                <Walli state={walliState} size={230} label="WALL-E" />
              </motion.div>
            </div>

            <div className="relative shrink-0 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em]">
                <span className="text-white/45">
                  {phase === 'complete'
                    ? T.completeEyebrow
                    : phase === 'intro' || phase === 'loading'
                      ? T.questions
                      : T.stepLabel(currentStep)}
                </span>
                <span className="text-cyan-300">
                  {phase === 'complete' ? '100%' : `${Math.round((answers.length / 7) * 100)}%`}
                </span>
              </div>
              <div className="mt-3 flex gap-1.5">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span
                    key={index}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-all duration-500',
                      phase === 'complete' || index < answers.length
                        ? 'bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,.55)]'
                        : index === answers.length && phase === 'interview'
                          ? 'bg-white/50'
                          : 'bg-white/10',
                    )}
                  />
                ))}
              </div>
            </div>
          </aside>

          <section className="onboarding-chat-shell flex h-dvh min-h-0 min-w-0 flex-col overflow-hidden border-border bg-card/95 shadow-2xl shadow-slate-900/10 backdrop-blur sm:h-[calc(100dvh-7rem)] sm:max-h-[850px] sm:rounded-[2rem] sm:border lg:h-full lg:max-h-none">
            <div className="flex h-[72px] shrink-0 items-center gap-3 border-b border-border bg-card/75 px-4 backdrop-blur sm:px-5">
              <div className="relative shrink-0 lg:hidden">
                <Walli state={walliState} size={44} noShadow label="WALL-E" />
                {pending && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 animate-pulse rounded-full bg-pulse ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pulse">
                    WALL‑E
                  </p>
                  <span className="h-1 w-1 rounded-full bg-pulse" />
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {pending
                      ? locale === 'ka'
                        ? 'ფიქრობს'
                        : 'thinking'
                      : locale === 'ka'
                        ? 'შენთანაა'
                        : 'with you'}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm font-bold sm:text-base">
                  {phase === 'complete'
                    ? T.completeTitle
                    : phase === 'interview'
                      ? T.stepLabel(currentStep)
                      : T.brandEyebrow}
                </p>
              </div>
              {phase === 'interview' && (
                <div className="hidden items-center gap-1 sm:flex">
                  {Array.from({ length: 7 }).map((_, index) => (
                    <span
                      key={index}
                      className={cn(
                        'h-1.5 rounded-full transition-all',
                        index < answers.length
                          ? 'w-4 bg-pulse'
                          : index === answers.length
                            ? 'w-6 bg-pulse/45'
                            : 'w-2 bg-muted',
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7"
              role="log"
              aria-live="polite"
            >
              {phase === 'loading' ? (
                <div className="flex h-full min-h-64 flex-col items-center justify-center gap-4">
                  <Walli state="idle" size={86} />
                  <LoadingDots />
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => (
                    <MessageBubble
                      key={`${message.at}-${index}`}
                      message={message}
                      isLatest={index === messages.length - 1}
                      walliState={
                        message.role === 'assistant' && index === messages.length - 1
                          ? walliState
                          : 'idle'
                      }
                    />
                  ))}
                </AnimatePresence>
              )}

              {pending && phase !== 'loading' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 pl-1"
                >
                  <Walli state="tilt" size={38} noShadow />
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                    <LoadingDots />
                    <span className="sr-only">{T.preparing}</span>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="shrink-0 border-t border-border bg-card/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-7 sm:pb-6 sm:pt-5">
              {phase === 'intro' && (
                <IntroComposer copy={T} pending={pending} error={error} onStart={startInterview} />
              )}
              {phase === 'interview' && (
                <InterviewComposer
                  copy={T}
                  question={question}
                  selected={selected}
                  freeText={freeText}
                  pending={pending}
                  canSubmit={canSubmit}
                  error={error}
                  inputRef={inputRef}
                  onToggle={toggleOption}
                  onFreeText={setFreeText}
                  onSubmit={submitAnswer}
                />
              )}
              {phase === 'complete' && (
                <CompletionComposer copy={T} profile={profile} onEnter={enterAcademy} />
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-pulse"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: index * 0.14 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({
  message,
  isLatest,
  walliState,
}: {
  message: OnboardingTranscriptMessage;
  isLatest: boolean;
  walliState: WalliState;
}) {
  const assistant = message.role === 'assistant';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn('flex items-end gap-2.5', assistant ? 'justify-start' : 'justify-end')}
    >
      {assistant && (
        <div className="w-10 shrink-0">
          <Walli state={isLatest ? walliState : 'idle'} size={40} noShadow label="WALL-E" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[84%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-relaxed sm:max-w-[76%] sm:px-5 sm:py-3.5',
          assistant
            ? 'rounded-bl-md border border-border bg-muted/70 text-foreground'
            : 'rounded-br-md bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)]',
        )}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

function IntroComposer({
  copy,
  pending,
  error,
  onStart,
}: {
  copy: Copy;
  pending: boolean;
  error: string;
  onStart: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm leading-relaxed text-muted-foreground">{copy.intro}</p>
      <div className="mt-3 flex flex-wrap gap-2">
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
      </div>
      {error && <ErrorNote message={error} />}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onStart}
          disabled={pending}
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-pulse px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_28px_var(--pulse-glow)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_var(--pulse-glow)] disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {copy.start}
          {!pending && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        </button>
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground sm:max-w-xs">
          <LockKeyhole className="mt-0.5 h-3 w-3 shrink-0 text-pulse" />
          {copy.privacy}
        </p>
      </div>
    </div>
  );
}

function InterviewComposer({
  copy,
  question,
  selected,
  freeText,
  pending,
  canSubmit,
  error,
  inputRef,
  onToggle,
  onFreeText,
  onSubmit,
}: {
  copy: Copy;
  question: OnboardingQuestion | null;
  selected: string[];
  freeText: string;
  pending: boolean;
  canSubmit: boolean;
  error: string;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onToggle: (id: string) => void;
  onFreeText: (value: string) => void;
  onSubmit: () => void;
}) {
  if (!question) {
    return (
      <div className="flex min-h-20 items-center justify-center gap-2 text-xs font-semibold text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-pulse" />
        {copy.preparing}
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="mx-auto max-w-2xl"
    >
      {question.kind !== 'text' && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {question.kind === 'multi'
                ? copy.selectHint(question.maxSelections ?? 2)
                : copy.honest}
            </p>
            {selected.length > 0 && (
              <span className="text-[10px] font-bold text-pulse">
                {selected.length} <Check className="inline h-3 w-3" />
              </span>
            )}
          </div>
          <div className="onboarding-option-grid grid max-h-[32vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 sm:max-h-none">
            {question.options.map((option) => {
              const active = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={active}
                  disabled={pending}
                  onClick={() => onToggle(option.id)}
                  className={cn(
                    'group flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-all',
                    active
                      ? 'border-pulse bg-pulse/8 shadow-[0_0_0_2px_var(--pulse-glow)]'
                      : 'border-border bg-background hover:border-pulse/45 hover:bg-pulse/5',
                  )}
                >
                  {option.emoji && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted text-base">
                      {option.emoji}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-foreground sm:text-sm">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground sm:text-[11px]">
                        {option.description}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'grid h-5 w-5 shrink-0 place-items-center rounded-full border transition',
                      active
                        ? 'border-pulse bg-pulse text-primary-foreground'
                        : 'border-border group-hover:border-pulse/50',
                    )}
                  >
                    {active && <Check className="h-3 w-3" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className={cn('flex items-end gap-2', question.kind !== 'text' && 'mt-3')}>
        <textarea
          ref={inputRef}
          value={freeText}
          rows={question.kind === 'text' ? 3 : 1}
          maxLength={700}
          disabled={pending}
          placeholder={question.placeholder || copy.ownWords}
          onChange={(event) => onFreeText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && question.kind !== 'text') {
              event.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
          className="min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition placeholder:text-muted-foreground focus:border-pulse focus:ring-2 focus:ring-pulse/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          aria-label={question.kind === 'text' ? copy.send : copy.continue}
          className="group inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-pulse px-4 text-xs font-bold text-primary-foreground shadow-[0_6px_20px_var(--pulse-glow)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none sm:px-5"
        >
          <span className="hidden sm:inline">
            {question.kind === 'text' ? copy.send : copy.continue}
          </span>
          {question.kind === 'text' ? <Send className="h-3.5 w-3.5" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>
      {question.helper && (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{question.helper}</p>
      )}
      {error && <ErrorNote message={error} />}
    </form>
  );
}

function CompletionComposer({
  copy,
  profile,
  onEnter,
}: {
  copy: Copy;
  profile: OnboardingProfileSignals | null;
  onEnter: () => void;
}) {
  const chips = [
    ...(profile?.interests ?? []),
    ...(profile?.learningPreferences ?? []),
  ].slice(0, 4);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl"
    >
      <div className="rounded-3xl border border-pulse/25 bg-gradient-to-br from-pulse/10 via-card to-heart/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-pulse text-primary-foreground shadow-[0_6px_20px_var(--pulse-glow)]">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pulse">
              {copy.pathReady}
            </p>
            <p className="mt-1 text-sm font-bold leading-relaxed text-foreground">
              {profile?.summary || copy.completeBody}
            </p>
            {chips.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-pulse/20 bg-card/75 px-2.5 py-1 text-[10px] font-bold text-pulse"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-muted-foreground sm:max-w-sm">
          {copy.completeBody}
        </p>
        <button
          type="button"
          onClick={onEnter}
          className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-pulse px-6 text-sm font-bold text-primary-foreground shadow-[0_10px_28px_var(--pulse-glow)] transition hover:-translate-y-0.5"
        >
          {copy.enter}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl border border-heart/25 bg-heart/5 px-3 py-2 text-[11px] font-semibold leading-relaxed text-heart">
      <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" />
      {message}
    </p>
  );
}

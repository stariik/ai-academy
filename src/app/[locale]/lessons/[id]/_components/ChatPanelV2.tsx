'use client';

/**
 * walle.academy — v2 chat panel
 *
 * Reuses the streaming protocol from the legacy ChatPanel (POST /api/chat,
 * GET /api/chat-history, QUIZ_UNLOCK_MARKER) but rebuilds the UI on Eve
 * tokens. Walli sits inline as the assistant avatar and reacts to state:
 *   • wave on mount / page change
 *   • tilt during streaming (thinking pose)
 *   • spin once when the unlock marker fires
 *   • idle otherwise
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowUp, Sparkles, CheckCircle2, RotateCcw } from 'lucide-react';
import type { Lesson, ChatMessage } from '@/types';
import { Walli, type WalliState } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';

const QUIZ_UNLOCK_MARKER = '[READY_FOR_QUIZ]';

type TutorLocale = 'ka' | 'en';

/** All chrome strings the chat panel itself shows. Server-side strings (the
 *  tutor's actual replies, quiz feedback) are localized on the backend by
 *  passing `locale` through the API. */
const STRINGS: Record<TutorLocale, {
  teacher: string;
  ready: string;
  quickQuestions: string;
  again: string;
  explainAgain: string;
  placeholder: string;
  send: string;
  chatHistoryLabel: string;
  chatMessageLabel: string;
  typing: string;
  introUserMsg: (title: string) => string;
  fallbackIntro: string;
  errorPrefix: string;
  genericError: string;
  requestFailed: string;
  emptyTeacher: string;
  emptyTitle: string;
  emptyHint: string;
  suggestionsHeader: string;
  suggestExplainSimple: (t: string) => string;
  suggestWhatIs: (t: string) => string;
  suggestExample: string;
  suggestExampleShort: string;
  suggestExplainDetail: (t: string) => string;
  toggleLabel: string;
}> = {
  ka: {
    teacher: 'AI მასწავლებელი',
    ready: 'მზად',
    quickQuestions: 'სწრაფი კითხვები',
    again: 'ხელახლა',
    explainAgain: 'გასაგებად ხელახლა ამიხსენი — სხვა მაგალითით.',
    placeholder: 'დაუსვი კითხვა Walli-ს…',
    send: 'გაგზავნა',
    chatHistoryLabel: 'საუბრის ისტორია',
    chatMessageLabel: 'საუბრის შეტყობინება',
    typing: 'წერს...',
    introUserMsg: (title) => `მზად ვარ ვისწავლო "${title}". გთხოვ, ამიხსენი!`,
    fallbackIntro: 'მოგესალმები! მკითხე რამე ამ თემაზე.',
    errorPrefix: 'ბოდიში, შეცდომა მოხდა:',
    genericError: 'რაღაც არასწორად მოხდა',
    requestFailed: 'მოთხოვნა ვერ შესრულდა',
    emptyTeacher: 'შენი მასწავლებელი',
    emptyTitle: 'მე ვარ Walli — ერთად ვისწავლოთ!',
    emptyHint: 'დამისვი ნებისმიერი კითხვა — ან აარჩიე ერთ-ერთი წინადადება.',
    suggestionsHeader: 'შემოთავაზებები',
    suggestExplainSimple: (t) => `ამიხსენი "${t}" მარტივად`,
    suggestWhatIs: (t) => `რა არის ${t}?`,
    suggestExample: 'მომიყვანე ნამდვილი მაგალითი',
    suggestExampleShort: 'მომიყვანე მაგალითი',
    suggestExplainDetail: (t) => `ამიხსენი "${t}" დეტალურად`,
    toggleLabel: 'მასწავლებლის ენა',
  },
  en: {
    teacher: 'AI Teacher',
    ready: 'ready',
    quickQuestions: 'Quick questions',
    again: 'Again',
    explainAgain: 'Please explain again — with a different example.',
    placeholder: 'Ask Walli a question…',
    send: 'Send',
    chatHistoryLabel: 'Chat history',
    chatMessageLabel: 'Chat message',
    typing: 'typing...',
    introUserMsg: (title) => `I'm ready to learn "${title}". Please explain!`,
    fallbackIntro: "Hi! Ask me anything about this topic.",
    errorPrefix: 'Sorry, something went wrong:',
    genericError: 'Something went wrong',
    requestFailed: 'Request failed',
    emptyTeacher: 'Your teacher',
    emptyTitle: "I'm Walli — let's learn together!",
    emptyHint: 'Ask me anything — or pick one of the suggestions.',
    suggestionsHeader: 'Suggestions',
    suggestExplainSimple: (t) => `Explain "${t}" simply`,
    suggestWhatIs: (t) => `What is ${t}?`,
    suggestExample: 'Give me a real-world example',
    suggestExampleShort: 'Give me an example',
    suggestExplainDetail: (t) => `Explain "${t}" in detail`,
    toggleLabel: 'Teacher language',
  },
};

/**
 * Picks Walli's reaction state from the user's message content.
 *   • 'dance' — gratitude, comprehension, enthusiasm
 *   • 'wave'  — default acknowledgment for everything else
 *
 * Heuristic only — keep the patterns short so they don't false-fire on
 * lesson content. Covers Georgian + English shorthand kids might use.
 */
const POSITIVE_HINTS =
  /(მადლობა|გავიგე|გასაგებია|სუპერ|მაგარია|ვაო|ფანტასტიკაა|thanks?|thank ?you|got ?it|cool|nice|wow|amazing|awesome|great|❤️|🎉|😄|😀|🙌)/i;

function pickWalliReaction(text: string): WalliState {
  if (!text) return 'wave';
  if (POSITIVE_HINTS.test(text)) return 'dance';
  return 'wave';
}

export function ChatPanelV2({
  lessonId,
  lesson,
  pageNumber,
  siteLocale,
  onUnlockCheck,
  walliPulseKey,
  pendingPrompt,
}: {
  lessonId: string;
  lesson: Lesson;
  pageNumber: number;
  siteLocale: TutorLocale;
  onUnlockCheck?: () => void;
  walliPulseKey?: number;
  pendingPrompt?: { id: number; text: string } | null;
}) {
  // Teacher language — defaults to the site locale, can be overridden per-lesson
  // via the in-panel toggle. Persisted in localStorage keyed by lesson.
  const [teacherLocale, setTeacherLocale] = React.useState<TutorLocale>(siteLocale);
  // Ref mirrors the state so async closures (the auto-intro fetch chain) always
  // pick up the freshest value, even before the next render commits.
  const teacherLocaleRef = React.useRef<TutorLocale>(siteLocale);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(`walli_lang:${lessonId}`);
      const next: TutorLocale = stored === 'ka' || stored === 'en' ? stored : siteLocale;
      setTeacherLocale(next);
      teacherLocaleRef.current = next;
    } catch {
      teacherLocaleRef.current = siteLocale;
    }
  }, [lessonId, siteLocale]);

  const setAndPersistTeacherLocale = React.useCallback(
    (next: TutorLocale) => {
      setTeacherLocale(next);
      teacherLocaleRef.current = next;
      try {
        localStorage.setItem(`walli_lang:${lessonId}`, next);
      } catch { /* ignore */ }
    },
    [lessonId],
  );

  const T = STRINGS[teacherLocale];
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);

  // Walli state + key (key forces re-mount for one-shot animations)
  const [walliState, setWalliState] = React.useState<WalliState>('wave');
  const [walliKey, setWalliKey] = React.useState(0);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const unlockFiredRef = React.useRef(false);
  const reduced = useReducedMotion();

  const currentPageData = lesson.pages?.find((p) => p.pageNumber === pageNumber);

  /* ─── walli reactions ─── */
  React.useEffect(() => {
    // Wave on page change, settle to idle.
    setWalliState('wave');
    setWalliKey((k) => k + 1);
    const t = setTimeout(() => setWalliState('idle'), 3200);
    return () => clearTimeout(t);
  }, [pageNumber]);

  React.useEffect(() => {
    setWalliState((prev) => (isStreaming ? 'tilt' : prev === 'tilt' ? 'idle' : prev));
  }, [isStreaming]);

  // External unlock pulse — celebrate one time.
  React.useEffect(() => {
    if (walliPulseKey === undefined) return;
    if (walliPulseKey === 0) return;
    setWalliState('spin');
    setWalliKey((k) => k + 1);
    const t = setTimeout(() => setWalliState('idle'), 1400);
    return () => clearTimeout(t);
  }, [walliPulseKey]);

  /* ─── load history / auto-intro ─── */
  React.useEffect(() => {
    let cancelled = false;
    unlockFiredRef.current = false;

    async function run() {
      try {
        const url = `/api/chat-history?lessonId=${lessonId}&pageNumber=${pageNumber}`;
        const res = await fetch(url);
        const data = await res.json();
        if (cancelled) return;

        if (data.messages && data.messages.length > 0) {
          const loaded = data.messages.map(
            (m: { id: string; role: string; content: string; timestamp: string }) => ({
              id: m.id,
              role: m.role as ChatMessage['role'],
              content: m.content.replace(QUIZ_UNLOCK_MARKER, '').trim(),
              timestamp: m.timestamp,
            }),
          );
          setMessages(loaded);
          const hadUnlock = data.messages.some(
            (m: { role: string; content: string }) =>
              m.role === 'assistant' && m.content.includes(QUIZ_UNLOCK_MARKER),
          );
          if (hadUnlock && onUnlockCheck && !unlockFiredRef.current) {
            unlockFiredRef.current = true;
            onUnlockCheck();
          }
          setHistoryLoaded(true);
        } else {
          setHistoryLoaded(true);
          sendAutoIntro();
        }
      } catch {
        if (!cancelled) {
          setHistoryLoaded(true);
          sendAutoIntro();
        }
      }
    }

    function sendAutoIntro() {
      const activeLocale = teacherLocaleRef.current;
      const S = STRINGS[activeLocale];
      const pageTitle = currentPageData?.title ?? (activeLocale === 'en' ? 'this topic' : 'ეს თემა');
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: S.introUserMsg(pageTitle),
        timestamp: new Date().toISOString(),
      };
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      setMessages([userMsg, assistantMsg]);
      setIsStreaming(true);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMsg],
          lessonId,
          pageNumber,
          isFirstVisit: true,
          locale: activeLocale,
        }),
      })
        .then(async (res) => {
          if (cancelled || !res.ok) throw new Error('failed');
          const reader = res.body?.getReader();
          if (!reader) throw new Error('no body');
          const decoder = new TextDecoder();
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done || cancelled) break;
            fullText += decoder.decode(value, { stream: true });
            if (
              fullText.includes(QUIZ_UNLOCK_MARKER) &&
              onUnlockCheck &&
              !unlockFiredRef.current
            ) {
              unlockFiredRef.current = true;
              onUnlockCheck();
            }
            const display = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: display } : m)),
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: S.fallbackIntro }
                  : m,
              ),
            );
          }
        })
        .finally(() => {
          if (!cancelled) setIsStreaming(false);
        });
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, pageNumber]);

  /* ─── scroll handling ─── */
  React.useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 160;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth',
      });
    }
  }, [messages, reduced]);

  /* ─── send message ─── */
  const sendMessage = React.useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };
      const updated = [...messages, userMessage];
      setMessages(updated);
      setInput('');
      setIsStreaming(true);

      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', timestamp: new Date().toISOString() },
      ]);

      const activeLocale = teacherLocaleRef.current;
      const S = STRINGS[activeLocale];
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updated.filter((m) => m.role === 'user' || m.role === 'assistant'),
            lessonId,
            pageNumber,
            locale: activeLocale,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: S.requestFailed }));
          throw new Error(err.error ?? 'chat failed');
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error('no body');
        const decoder = new TextDecoder();
        let fullText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          if (
            fullText.includes(QUIZ_UNLOCK_MARKER) &&
            onUnlockCheck &&
            !unlockFiredRef.current
          ) {
            unlockFiredRef.current = true;
            onUnlockCheck();
          }
          const display = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: display } : m)),
          );
        }
      } catch (err) {
        const errorText = err instanceof Error ? err.message : S.genericError;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `${S.errorPrefix} ${errorText}` }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [messages, isStreaming, lessonId, pageNumber, onUnlockCheck],
  );

  /* ─── per-message Walli reaction ───
     Latest assistant bubble's Walli responds to the conversation in three
     beats so the user sees a clear cause→effect:
       1. You send         → Walli reacts to YOUR message
                              · 'dance' if it reads enthusiastic / grateful
                              · 'wave'  otherwise (acknowledgment)
                              Holds for ~1.1–1.8s, then …
       2. Walli is replying → 'tilt'  (thinking pose, while streaming)
       3. Reply just landed → 'spin'  (celebration, ~1.4s)
       4. Otherwise        → 'idle'
     Older messages stay 'idle' so attention follows the live reply. */
  const [userSendReaction, setUserSendReaction] = React.useState<WalliState | null>(null);
  const lastSeenUserMsgIdRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    let lastUser: ChatMessage | undefined;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUser = messages[i];
        break;
      }
    }
    if (!lastUser) return;
    if (lastUser.id === lastSeenUserMsgIdRef.current) return;
    lastSeenUserMsgIdRef.current = lastUser.id;
    const reaction = pickWalliReaction(lastUser.content);
    setUserSendReaction(reaction);
    const holdMs = reaction === 'dance' ? 1800 : 1100;
    const t = setTimeout(() => setUserSendReaction(null), holdMs);
    return () => clearTimeout(t);
  }, [messages]);

  const [bubbleJustFinished, setBubbleJustFinished] = React.useState(false);
  const wasStreamingRef = React.useRef(false);
  React.useEffect(() => {
    if (isStreaming) {
      wasStreamingRef.current = true;
      return;
    }
    if (wasStreamingRef.current) {
      wasStreamingRef.current = false;
      setBubbleJustFinished(true);
      const t = setTimeout(() => setBubbleJustFinished(false), 1400);
      return () => clearTimeout(t);
    }
  }, [isStreaming]);

  const latestBubbleWalli: WalliState = userSendReaction
    ? userSendReaction
    : isStreaming
      ? 'tilt'
      : bubbleJustFinished
        ? 'spin'
        : 'idle';

  const latestAssistantId = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') return messages[i].id;
    }
    return null;
  }, [messages]);

  /* ─── pending prompt from parent (e.g. wrong check-answers) ─── */
  const lastPromptIdRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!pendingPrompt) return;
    if (lastPromptIdRef.current === pendingPrompt.id) return;
    // Wait for any in-flight stream to finish — the effect re-runs when
    // isStreaming flips, so we'll dispatch then.
    if (isStreaming) return;
    if (!historyLoaded) return;
    lastPromptIdRef.current = pendingPrompt.id;
    sendMessage(pendingPrompt.text);
  }, [pendingPrompt, isStreaming, historyLoaded, sendMessage]);

  const suggested = React.useMemo(() => {
    if (!currentPageData) {
      return [
        T.suggestExplainSimple(lesson.title),
        ...lesson.keyConcepts.slice(0, 2).map((c) => T.suggestWhatIs(c.term)),
        T.suggestExample,
      ];
    }
    return [
      T.suggestExplainSimple(currentPageData.title),
      ...currentPageData.keyConcepts.slice(0, 2).map((c) => T.suggestWhatIs(c.term)),
      T.suggestExampleShort,
    ];
  }, [currentPageData, lesson, T]);

  const concepts = currentPageData?.keyConcepts ?? lesson.keyConcepts ?? [];

  /* ─── render ─── */
  if (!historyLoaded) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <Walli size={72} state="idle" />
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-pulse"
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ─── Header ─── */}
      <div className="shrink-0 px-3 sm:px-4 py-2.5 border-b border-border bg-card/60 backdrop-blur-sm flex items-center gap-3">
        <div className="relative shrink-0">
          <Walli key={`hdr-${walliKey}`} state={walliState} size={36} noShadow />
          {isStreaming && (
            <span
              aria-hidden
              className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-pulse ring-2 ring-card animate-ping"
              style={{ animationDuration: '1.4s' }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-pulse font-bold leading-none">
            {T.teacher}
          </p>
          <p className="text-sm font-bold mt-0.5 truncate" style={{ fontFamily: 'var(--font-display)' }}>
            {currentPageData ? currentPageData.title : 'Walli'}
          </p>
        </div>
        <TeacherLocaleToggle
          locale={teacherLocale}
          onChange={setAndPersistTeacherLocale}
          label={T.toggleLabel}
        />
        {unlockFiredRef.current && (
          <span className="inline-flex items-center gap-1 rounded-full bg-pulse/15 text-pulse border border-pulse/30 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap">
            <CheckCircle2 className="w-3 h-3" />
            {T.ready}
          </span>
        )}
      </div>

      {/* ─── Messages ─── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-4"
        role="log"
        aria-label={T.chatHistoryLabel}
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <EmptyChat suggested={suggested} onSelect={sendMessage} strings={T} />
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLast={idx === messages.length - 1}
                isStreaming={isStreaming}
                walliState={msg.id === latestAssistantId ? latestBubbleWalli : 'idle'}
              />
            ))}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Concept chips ─── */}
      {messages.length > 0 && concepts.length > 0 && (
        <div className="shrink-0 px-3 sm:px-4 pt-2 pb-1 border-t border-border bg-card/40 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold mb-1.5">
            {T.quickQuestions}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {concepts.slice(0, 4).map((c) => (
              <button
                key={c.term}
                type="button"
                disabled={isStreaming}
                onClick={() => sendMessage(T.suggestExplainDetail(c.term))}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-pulse/40 hover:text-pulse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-2.5 h-2.5" />
                {c.term}
              </button>
            ))}
            <button
              type="button"
              disabled={isStreaming}
              onClick={() => sendMessage(T.explainAgain)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:border-pulse/40 hover:text-pulse transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              {T.again}
            </button>
          </div>
        </div>
      )}

      {/* ─── Input ─── */}
      <div
        className="shrink-0 px-3 sm:px-4 pt-2 pb-3 border-t border-border bg-card"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0), 12px)' }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={T.placeholder}
            disabled={isStreaming}
            aria-label={T.chatMessageLabel}
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-pulse focus:outline-none focus:ring-2 focus:ring-pulse/30 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label={T.send}
            className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-full bg-pulse text-primary-foreground shadow-[0_4px_16px_var(--pulse-glow)] hover:shadow-[0_8px_24px_var(--pulse-glow)] disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none transition-all active:scale-[0.96]"
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────── */

function TeacherLocaleToggle({
  locale,
  onChange,
  label,
}: {
  locale: TutorLocale;
  onChange: (next: TutorLocale) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex shrink-0 items-center rounded-full border border-border bg-muted/40 p-0.5 text-[10px] font-bold uppercase tracking-wider"
    >
      <button
        type="button"
        onClick={() => onChange('ka')}
        aria-pressed={locale === 'ka'}
        className={cn(
          'px-2 py-0.5 rounded-full transition-colors',
          locale === 'ka'
            ? 'bg-pulse text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        KA
      </button>
      <button
        type="button"
        onClick={() => onChange('en')}
        aria-pressed={locale === 'en'}
        className={cn(
          'px-2 py-0.5 rounded-full transition-colors',
          locale === 'en'
            ? 'bg-pulse text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        EN
      </button>
    </div>
  );
}

function EmptyChat({
  suggested,
  onSelect,
  strings,
}: {
  suggested: string[];
  onSelect: (q: string) => void;
  strings: typeof STRINGS[TutorLocale];
}) {
  return (
    <div className="space-y-3 max-w-xl mx-auto">
      <div className="rounded-3xl border border-pulse/25 bg-gradient-to-br from-pulse/8 via-card to-card p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <Walli size={48} state="wave" noShadow />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-pulse font-bold">
              {strings.emptyTeacher}
            </p>
            <p
              className="text-sm sm:text-base font-bold mt-0.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {strings.emptyTitle}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {strings.emptyHint}
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold px-1">
          {strings.suggestionsHeader}
        </p>
        {suggested.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(q)}
            className="group block w-full rounded-2xl border border-border bg-card px-3.5 py-2.5 text-left text-sm text-foreground hover:border-pulse/40 hover:bg-pulse/5 transition-all"
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-pulse shrink-0" />
              <span className="leading-snug">{q}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  msg,
  isLast,
  isStreaming,
  walliState,
}: {
  msg: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  walliState: WalliState;
}) {
  const isAssistant = msg.role === 'assistant';
  const showTyping = isLast && isStreaming && !msg.content && isAssistant;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('flex gap-2', isAssistant ? 'justify-start' : 'justify-end')}
    >
      {isAssistant && (
        <div className="shrink-0 mt-0.5" aria-hidden>
          <Walli size={28} state={walliState} noShadow />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[78%] rounded-2xl text-sm leading-relaxed shadow-sm',
          isAssistant
            ? 'bg-card border border-border text-foreground px-3.5 py-2.5'
            : 'bg-pulse text-primary-foreground px-3.5 py-2.5 rounded-br-sm',
        )}
      >
        {isAssistant ? (
          <div className="chat-prose">
            {showTyping ? (
              <div className="flex gap-1 py-0.5" aria-label="...">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-pulse"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            ) : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content || '...'}
              </ReactMarkdown>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
        )}
      </div>
    </motion.div>
  );
}

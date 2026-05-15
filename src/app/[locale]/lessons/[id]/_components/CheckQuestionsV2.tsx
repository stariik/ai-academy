'use client';

/**
 * Per-page check questions. Reuses /api/quiz/check-page for grading.
 * Three visual states:
 *   • locked      → muted card, hint to chat with Walli first
 *   • unlocked    → answer form (mcq / true_false / fill_in_blank / short_answer)
 *   • passed      → success ribbon
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Lock, Check, X, RotateCcw, Sparkles, MessageCircle } from 'lucide-react';
import type { QuizQuestion } from '@/types';
import { Walli } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';

type Result = {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
};

export type WrongAnswer = { question: QuizQuestion; userAnswer: string };

export function CheckQuestionsV2({
  lessonId,
  pageNumber,
  questions,
  alreadyPassed,
  locked,
  onPass,
  onWrongAnswers,
}: {
  lessonId: string;
  pageNumber: number;
  questions: QuizQuestion[];
  alreadyPassed: boolean;
  locked: boolean;
  onPass: () => void;
  onWrongAnswers?: (wrongs: WrongAnswer[]) => void;
}) {
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [results, setResults] = React.useState<Result[] | null>(null);
  const [checking, setChecking] = React.useState(false);
  const reduced = useReducedMotion();

  if (questions.length === 0) return null;

  /* ─── PASSED ─── */
  if (alreadyPassed) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-pulse/30 bg-gradient-to-br from-pulse/10 via-card to-card p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-pulse/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <div className="shrink-0">
            <Walli size={48} state="dance" noShadow />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
              შესანიშნავია!
            </p>
            <p className="text-base font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
              გვერდი დასრულდა
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              მზად ხარ შემდეგი გვერდისთვის.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─── LOCKED ─── */
  if (locked) {
    return (
      <div className="relative rounded-3xl border border-border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-muted/30 backdrop-blur-[2px]" aria-hidden />
        <div className="relative p-5 sm:p-6 space-y-3 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-muted text-muted-foreground">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p
              className="text-base font-bold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              შემოწმების კითხვები ჩაკეტილია
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
              ისაუბრე Walli-სთან მასალაზე — ის გახსნის კითხვებს, როცა მზად იქნები.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-pulse">
            <MessageCircle className="w-3 h-3" />
            დაუბრუნდი ჩატს
          </div>
        </div>
      </div>
    );
  }

  /* ─── ACTIVE ─── */
  const allAnswered = questions.every((q) => answers[q.id]?.trim());
  const allCorrect = results?.every((r) => r.isCorrect);

  const handleSubmit = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/quiz/check-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          pageNumber,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      const data = await res.json();
      const newResults: Result[] = data.results ?? [];
      setResults(newResults);
      setSubmitted(true);

      if (data.passed) {
        onPass();
      } else if (onWrongAnswers) {
        // Hand off the wrong answers to the parent so the AI tutor can
        // explain — we deliberately don't show the correct answer here.
        const wrongs: WrongAnswer[] = newResults
          .filter((r) => !r.isCorrect)
          .map((r) => {
            const q = questions.find((x) => x.id === r.questionId);
            if (!q) return null;
            return { question: q, userAnswer: answers[r.questionId] ?? '' };
          })
          .filter((x): x is WrongAnswer => x !== null);
        if (wrongs.length > 0) onWrongAnswers(wrongs);
      }
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  };

  const handleRetry = () => {
    const cleared = { ...answers };
    results?.forEach((r) => {
      if (!r.isCorrect) delete cleared[r.questionId];
    });
    setAnswers(cleared);
    setSubmitted(false);
    setResults(null);
  };

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pulse/15 via-card to-card px-4 sm:px-5 py-3.5 border-b border-border">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-pulse/15 blur-3xl" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-pulse text-primary-foreground shadow-[0_4px_14px_var(--pulse-glow)]">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              შემოწმე გაგება
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              უპასუხე სწორად — შემდეგი გვერდი გაიხსნება.
            </p>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="p-4 sm:p-5 space-y-4">
        {questions.map((q, i) => {
          const r = results?.find((x) => x.questionId === q.id);
          return (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              answer={answers[q.id]}
              onAnswer={(v) =>
                !submitted && setAnswers((prev) => ({ ...prev, [q.id]: v }))
              }
              result={r}
              submitted={submitted}
            />
          );
        })}

        {/* Footer action */}
        <div className="pt-2 flex flex-col items-stretch sm:flex-row sm:items-center gap-2.5">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || checking}
              className={cn(
                'flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-bold transition-all active:scale-[0.98]',
                allAnswered && !checking
                  ? 'bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)] hover:shadow-[0_12px_30px_var(--pulse-glow)] hover:-translate-y-0.5'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {checking ? (
                <>
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    animate={reduced ? {} : { rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  />
                  მოწმდება…
                </>
              ) : !allAnswered ? (
                <>
                  უპასუხე ყველაფერს ({Object.keys(answers).length}/{questions.length})
                </>
              ) : (
                <>
                  შემოწმება
                  <Check className="w-4 h-4" strokeWidth={2.6} />
                </>
              )}
            </button>
          ) : !allCorrect ? (
            <button
              type="button"
              onClick={handleRetry}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-bold bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" />
              ვცადოთ ხელახლა
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.36, 0.64, 1] }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-bold bg-pulse/15 text-pulse border border-pulse/30"
            >
              <Check className="w-4 h-4" strokeWidth={2.8} />
              ყველაფერი სწორია!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Single question card
   ────────────────────────────────────────────────────────── */

function QuestionCard({
  question: q,
  index,
  answer,
  onAnswer,
  result,
  submitted,
}: {
  question: QuizQuestion;
  index: number;
  answer?: string;
  onAnswer: (v: string) => void;
  result?: Result;
  submitted: boolean;
}) {
  const status: 'idle' | 'correct' | 'wrong' = result
    ? result.isCorrect
      ? 'correct'
      : 'wrong'
    : 'idle';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={cn(
        'rounded-2xl border p-4 transition-colors',
        status === 'correct' && 'border-pulse/40 bg-pulse/5',
        status === 'wrong' && 'border-heart/40 bg-heart/5',
        status === 'idle' && 'border-border bg-background',
      )}
    >
      <div className="flex items-start gap-2.5 mb-3">
        <span className="shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-foreground text-xs font-bold tabular-nums">
          {index + 1}
        </span>
        <p className="text-sm sm:text-[15px] font-semibold leading-snug">{q.question}</p>
      </div>

      {/* MCQ — only the user's selection is annotated; the correct option is
           NOT revealed when wrong (Walli explains via chat instead). */}
      {q.type === 'mcq' && q.options && (
        <div className="space-y-2" role="radiogroup" aria-label={`კითხვა ${index + 1}`}>
          {q.options.map((opt, i) => {
            const selected = answer === opt;
            const isCorrect = result?.isCorrect && selected;
            const isWrong = submitted && !result?.isCorrect && selected;
            return (
              <label
                key={i}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 cursor-pointer transition-all',
                  submitted && 'cursor-default',
                  selected && !submitted && 'border-pulse bg-pulse/10',
                  isCorrect && 'border-pulse bg-pulse/15',
                  isWrong && 'border-heart bg-heart/10',
                  !selected && !submitted && 'border-border bg-card hover:border-pulse/40',
                  !selected && submitted && 'border-border bg-card opacity-60',
                )}
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt}
                  checked={selected}
                  onChange={() => onAnswer(opt)}
                  disabled={submitted}
                  className="sr-only"
                />
                <span
                  className={cn(
                    'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                    selected ? 'border-pulse bg-pulse' : 'border-border bg-background',
                    isWrong && 'border-heart bg-heart',
                  )}
                  aria-hidden
                >
                  {selected && (
                    <span className="block w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  )}
                </span>
                <span className="flex-1 text-sm leading-snug">{opt}</span>
                {isCorrect && <Check className="w-4 h-4 text-pulse shrink-0" strokeWidth={2.8} />}
                {isWrong && <X className="w-4 h-4 text-heart shrink-0" strokeWidth={2.8} />}
              </label>
            );
          })}
        </div>
      )}

      {/* True / False */}
      {q.type === 'true_false' && (
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`კითხვა ${index + 1}`}>
          {['True', 'False'].map((val) => {
            const labelKa = val === 'True' ? 'სწორი' : 'არასწორი';
            const selected = answer === val;
            const isCorrect = result?.isCorrect && selected;
            const isWrong = submitted && !result?.isCorrect && selected;
            return (
              <button
                key={val}
                type="button"
                disabled={submitted}
                aria-pressed={selected}
                onClick={() => onAnswer(val)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-sm font-bold transition-all',
                  selected && !submitted && 'border-pulse bg-pulse/10 text-pulse',
                  isCorrect && 'border-pulse bg-pulse/15 text-pulse',
                  isWrong && 'border-heart bg-heart/10 text-heart',
                  !selected && 'border-border bg-card text-foreground hover:border-pulse/40',
                )}
              >
                {labelKa}
              </button>
            );
          })}
        </div>
      )}

      {/* Fill in the blank */}
      {q.type === 'fill_in_blank' && (
        <input
          type="text"
          value={answer ?? ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={submitted}
          placeholder="ჩაწერე პასუხი…"
          aria-label={`კითხვა ${index + 1}`}
          className={cn(
            'w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors',
            status === 'correct' && 'border-pulse focus:ring-pulse/30',
            status === 'wrong' && 'border-heart focus:ring-heart/30',
            status === 'idle' && 'border-border focus:border-pulse focus:ring-pulse/30',
          )}
        />
      )}

      {/* Short answer */}
      {q.type === 'short_answer' && (
        <textarea
          value={answer ?? ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={submitted}
          placeholder="დაწერე შენი პასუხი…"
          aria-label={`კითხვა ${index + 1}`}
          rows={3}
          className={cn(
            'w-full rounded-xl border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors resize-y',
            status === 'correct' && 'border-pulse focus:ring-pulse/30',
            status === 'wrong' && 'border-heart focus:ring-heart/30',
            status === 'idle' && 'border-border focus:border-pulse focus:ring-pulse/30',
          )}
        />
      )}

      {/* Ordering & matching fallback — keep typed text */}
      {(q.type === 'ordering' || q.type === 'matching') && (
        <textarea
          value={answer ?? ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={submitted}
          placeholder={
            q.type === 'ordering'
              ? 'მძიმეებით გამოყავი — სწორი თანმიმდევრობით'
              : 'შესაბამისობა მიუთითე ტექსტით'
          }
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-pulse focus:outline-none focus:ring-2 focus:ring-pulse/30"
        />
      )}

      {/* Feedback — correct shows explanation; wrong hands off to chat. */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {result.isCorrect ? (
              <div className="mt-3 rounded-xl px-3 py-2 text-xs bg-pulse/10 text-pulse border border-pulse/30">
                <p className="font-bold mb-0.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
                  სწორია!
                </p>
                {result.explanation && (
                  <p className="mt-1 text-foreground/75">{result.explanation}</p>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-xl px-3 py-2.5 text-xs bg-heart/10 text-heart border border-heart/30">
                <p className="font-bold mb-1 flex items-center gap-1.5">
                  <X className="w-3.5 h-3.5" strokeWidth={2.8} />
                  არასწორი
                </p>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-90">
                  <MessageCircle className="w-3 h-3" />
                  <span>Walli ხსნის ჩატში — გადახედე და ხელახლა სცადე</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

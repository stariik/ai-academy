'use client';

/**
 * Final quiz — one question at a time, animated transitions.
 * Reuses /api/quiz/check for scoring (matches legacy QuizModal).
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, X, Trophy, Sparkles } from 'lucide-react';
import type { QuizQuestion, QuizResult, QuizAttempt } from '@/types';
import { Walli } from '@/components/walli/Walli';
import { cn } from '@/lib/utils';

export function FinalQuizV2({
  lessonId,
  lessonTitle,
  questions,
  onBack,
  onComplete,
}: {
  lessonId: string;
  lessonTitle: string;
  questions: QuizQuestion[];
  onBack: () => void;
  onComplete?: () => void;
}) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [submitted, setSubmitted] = React.useState(false);
  const [result, setResult] = React.useState<QuizResult | null>(null);
  const [grading, setGrading] = React.useState(false);
  const reduced = useReducedMotion();

  const total = questions.length;
  const current = questions[index];
  const allAnswered = questions.every((q) => answers[q.id]?.trim());
  const pct = Math.round(((index + 1) / total) * 100);

  const setAnswer = (id: string, v: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [id]: v }));
  };

  const submit = async () => {
    setGrading(true);
    try {
      const res = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        }),
      });
      if (!res.ok) throw new Error('grade failed');
      const data: QuizResult = await res.json();
      setResult(data);
      setSubmitted(true);
      onComplete?.();
    } catch {
      /* ignore */
    } finally {
      setGrading(false);
    }
  };

  const retake = () => {
    setSubmitted(false);
    setResult(null);
    setAnswers({});
    setIndex(0);
  };

  /* ─── Results view ─── */
  if (submitted && result) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.34, 1.36, 0.64, 1] }}
              className="flex justify-center"
            >
              <Walli size={120} state={result.passed ? 'dance' : 'tilt'} />
            </motion.div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-pulse font-bold">
                შედეგი
              </p>
              <h2
                className="text-3xl sm:text-4xl font-bold tracking-tight mt-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {result.passed ? 'შესანიშნავად ისწავლე!' : 'ცოტა მეტი ვარჯიში'}
              </h2>
              <ScoreRing pct={result.percentage} passed={result.passed} />
              <p className="text-sm text-muted-foreground mt-2">
                {result.score} / {result.totalPoints} ქულა{' '}
                {result.passed ? '· გავიდი!' : '· საჭიროა 70%'}
              </p>
            </div>
          </div>

          <div className="space-y-3" role="list" aria-label="კითხვების შედეგი">
            {questions.map((q, i) => {
              const a: QuizAttempt | undefined = result.answers.find(
                (x) => x.questionId === q.id,
              );
              return (
                <div
                  key={q.id}
                  role="listitem"
                  className={cn(
                    'rounded-2xl border p-4',
                    a?.isCorrect
                      ? 'border-pulse/30 bg-pulse/5'
                      : 'border-heart/30 bg-heart/5',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full',
                        a?.isCorrect ? 'bg-pulse text-primary-foreground' : 'bg-heart text-primary-foreground',
                      )}
                    >
                      {a?.isCorrect ? (
                        <Check className="w-3.5 h-3.5" strokeWidth={2.8} />
                      ) : (
                        <X className="w-3.5 h-3.5" strokeWidth={2.8} />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug">
                        <span className="text-muted-foreground">Q{i + 1}.</span> {q.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1.5">
                        შენი პასუხი: <span className="text-foreground">{a?.answer || '—'}</span>
                      </p>
                      {!a?.isCorrect && (
                        <p className="text-xs text-pulse mt-0.5">
                          სწორი: <span className="font-bold">{q.correctAnswer}</span>
                        </p>
                      )}
                      {a?.feedback && (
                        <p className="text-xs text-foreground/70 mt-1.5 italic">{a.feedback}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
            <button
              type="button"
              onClick={retake}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full h-11 px-5 text-sm font-bold border border-border bg-card hover:border-pulse/40 hover:text-pulse transition-all"
            >
              თავიდან ვცადო
            </button>
            <button
              type="button"
              onClick={onBack}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full h-11 px-5 text-sm font-bold bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              გაკვეთილში დაბრუნება
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Quiz taking view ─── */
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-5 sm:py-7 space-y-5">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pulse/10 border border-pulse/30 px-2.5 py-1 text-[10px] font-bold text-pulse uppercase tracking-widest">
            <Trophy className="w-3 h-3" />
            საბოლოო ქვიზი
          </span>
          <h2
            className="text-2xl sm:text-3xl font-bold tracking-tight mt-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            შეამოწმე ცოდნა
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
            {lessonTitle} · 70% საჭიროა გასავლელად
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground tabular-nums">
              {Object.keys(answers).length}/{total} შევსებული
            </span>
            <span className="font-bold tabular-nums">
              {index + 1} / {total}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pulse via-pulse-soft to-pulse"
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait" custom={index}>
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -14 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="rounded-3xl border border-border bg-card p-4 sm:p-5"
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border',
                  current.difficulty === 'easy' && 'bg-pulse/10 text-pulse border-pulse/30',
                  current.difficulty === 'medium' &&
                    'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
                  current.difficulty === 'hard' && 'bg-heart/10 text-heart border-heart/30',
                )}
              >
                {current.difficulty === 'easy' && 'მარტივი'}
                {current.difficulty === 'medium' && 'საშუალო'}
                {current.difficulty === 'hard' && 'რთული'}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {current.points} ქულა
              </span>
            </div>

            <p
              className="text-base sm:text-lg font-bold leading-snug mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {current.question}
            </p>

            {/* Answer input */}
            {current.type === 'mcq' && current.options && (
              <div className="space-y-2" role="radiogroup">
                {current.options.map((opt, i) => {
                  const selected = answers[current.id] === opt;
                  return (
                    <label
                      key={i}
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border px-3.5 py-3 cursor-pointer transition-all',
                        selected
                          ? 'border-pulse bg-pulse/10 shadow-[0_4px_16px_var(--pulse-glow)]'
                          : 'border-border bg-background hover:border-pulse/40',
                      )}
                    >
                      <input
                        type="radio"
                        name={current.id}
                        value={opt}
                        checked={selected}
                        onChange={() => setAnswer(current.id, opt)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          selected ? 'border-pulse bg-pulse' : 'border-border bg-background',
                        )}
                        aria-hidden
                      >
                        {selected && (
                          <span className="block w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                        )}
                      </span>
                      <span className="flex-1 text-sm leading-snug font-semibold">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {current.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-2.5">
                {['True', 'False'].map((val) => {
                  const labelKa = val === 'True' ? 'სწორი' : 'არასწორი';
                  const selected = answers[current.id] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAnswer(current.id, val)}
                      className={cn(
                        'rounded-2xl border p-4 text-sm font-bold transition-all',
                        selected
                          ? 'border-pulse bg-pulse/10 text-pulse shadow-[0_4px_16px_var(--pulse-glow)]'
                          : 'border-border bg-background text-foreground hover:border-pulse/40',
                      )}
                    >
                      {labelKa}
                    </button>
                  );
                })}
              </div>
            )}

            {current.type === 'short_answer' && (
              <textarea
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
                placeholder="დაწერე შენი პასუხი…"
                rows={3}
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-pulse focus:outline-none focus:ring-2 focus:ring-pulse/30 resize-y"
              />
            )}

            {current.type === 'fill_in_blank' && (
              <input
                type="text"
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
                placeholder="ჩაწერე პასუხი…"
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-pulse focus:outline-none focus:ring-2 focus:ring-pulse/30"
              />
            )}

            {(current.type === 'ordering' || current.type === 'matching') && (
              <textarea
                value={answers[current.id] ?? ''}
                onChange={(e) => setAnswer(current.id, e.target.value)}
                placeholder={
                  current.type === 'ordering'
                    ? 'მძიმეებით გამოყავი — სწორი თანმიმდევრობით'
                    : 'შესაბამისობა მიუთითე ტექსტით'
                }
                rows={3}
                className="w-full rounded-2xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-pulse focus:outline-none focus:ring-2 focus:ring-pulse/30 resize-y"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Question dots */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {questions.map((q, i) => {
            const isCurrent = i === index;
            const isAnswered = !!answers[q.id]?.trim();
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`კითხვა ${i + 1}${isAnswered ? ' (შევსებული)' : ''}`}
                aria-current={isCurrent ? 'true' : undefined}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-all',
                  isCurrent
                    ? 'w-6 bg-pulse'
                    : isAnswered
                      ? 'bg-pulse/40'
                      : 'bg-muted hover:bg-muted-foreground/40',
                )}
              />
            );
          })}
        </div>

        {/* Nav */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => (index === 0 ? onBack() : setIndex((i) => i - 1))}
            className="inline-flex items-center gap-1.5 rounded-full px-4 h-10 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {index === 0 ? 'უკან' : 'წინა'}
          </button>

          {index < total - 1 ? (
            <button
              type="button"
              onClick={() => setIndex((i) => i + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 h-10 text-sm font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
            >
              შემდეგი
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={!allAnswered || grading}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-5 h-10 text-sm font-bold transition-all active:scale-[0.98]',
                allAnswered
                  ? 'bg-pulse text-primary-foreground shadow-[0_8px_24px_var(--pulse-glow)] hover:-translate-y-0.5'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {grading ? (
                <>
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    animate={reduced ? {} : { rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                  />
                  იგზავნება…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  გადააგზავნე
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreRing({ pct, passed }: { pct: number; passed: boolean }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (c * pct) / 100;
  return (
    <div className="relative inline-flex items-center justify-center my-4">
      <svg width="144" height="144" viewBox="0 0 144 144" className="-rotate-90">
        <circle cx="72" cy="72" r={r} className="fill-none stroke-muted" strokeWidth="8" />
        <motion.circle
          cx="72"
          cy="72"
          r={r}
          className={cn('fill-none', passed ? 'stroke-pulse' : 'stroke-heart')}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'text-4xl font-bold tabular-nums',
            passed ? 'text-pulse' : 'text-heart',
          )}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

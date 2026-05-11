'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { ReviewQueueItem } from '@/types';

type CheckResult = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  reExplanation: string | null;
  gamification: {
    totalXp: number;
    currentStreak: number;
    xpGained: number;
    unlockedBadges: string[];
  };
};

export default function ReviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [items, setItems] = useState<ReviewQueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/review?limit=10');
        const data = await res.json();
        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (err) {
        console.error(err);
        setItems([]);
      }
    }
    load();
  }, []);

  if (authLoading || items === null) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-cyan-50 border-t-teal rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (items.length === 0) {
    return (
      <div className="bg-cream-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="text-6xl mb-4">✨</div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy mb-2">ყველა გამეორება დასრულებულია</h1>
          <p className="text-sm text-navy-100 mb-6">
            ახლა გამეორებადი კითხვები არ გაქვს. დაასრულე მეტი გაკვეთილი — შეცდომები აქ გამოჩნდება გამეორებისთვის.
          </p>
          <Link
            href="/courses"
            className="inline-block bg-gradient-to-r from-teal to-cyan text-white font-bold px-6 py-3 rounded-full no-underline hover:-translate-y-0.5 transition"
          >
            კურსების ნახვა
          </Link>
        </div>
      </div>
    );
  }

  if (index >= items.length) {
    return (
      <div className="bg-cream-50 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy mb-2">გამეორება დასრულდა!</h1>
          <p className="text-base text-navy mb-1">
            {stats.correct} / {stats.total} სწორი პასუხი
          </p>
          <p className="text-sm text-navy-100 mb-6">ყოველდღე დაბრუნდი, რომ ცოდნა გაიმყარო.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/profile"
              className="inline-block bg-gradient-to-r from-teal to-cyan text-white font-bold px-6 py-3 rounded-full no-underline hover:-translate-y-0.5 transition"
            >
              პროფილზე დაბრუნება
            </Link>
            <button
              onClick={() => {
                setIndex(0);
                setResult(null);
                setAnswer('');
                setStats({ correct: 0, total: 0 });
                fetch('/api/review?limit=10')
                  .then((r) => r.json())
                  .then((d) => setItems(Array.isArray(d.items) ? d.items : []));
              }}
              className="inline-block border-2 border-navy text-navy font-bold px-6 py-3 rounded-full hover:bg-navy hover:text-white transition"
            >
              ახალი რაუნდი
            </button>
          </div>
        </div>
      </div>
    );
  }

  const current = items[index];
  const question = current.question;
  const progress = Math.round((index / items.length) * 100);

  async function submit() {
    if (!answer.trim() || checking) return;
    setChecking(true);
    try {
      const res = await fetch('/api/review/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          lessonId: current.lessonId,
          answer,
        }),
      });
      if (!res.ok) throw new Error('check failed');
      const data: CheckResult = await res.json();
      setResult(data);
      setStats((s) => ({ correct: s.correct + (data.isCorrect ? 1 : 0), total: s.total + 1 }));
    } catch (err) {
      console.error(err);
    } finally {
      setChecking(false);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setAnswer('');
    setResult(null);
  }

  return (
    <div className="bg-cream-50 min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-navy-100 mb-2">
            <span>
              გამეორება {index + 1} / {items.length}
            </span>
            <span className="text-teal">
              ✓ {stats.correct} / {stats.total}
            </span>
          </div>
          <div className="h-2 bg-cyan-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal to-cyan transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Lesson context */}
        <p className="text-xs uppercase tracking-wider text-navy-100 font-bold mb-1">
          {current.lessonTitle || 'გაკვეთილი'}
        </p>

        {/* Question card */}
        <div className="bg-white rounded-2xl border border-cyan-50 p-6 sm:p-8">
          <h2 className="text-lg sm:text-xl font-black text-navy mb-5 leading-snug">
            {question.question}
          </h2>

          {/* MCQ or True/False options */}
          {question.options && question.options.length > 0 ? (
            <div className="space-y-2">
              {question.options.map((opt) => {
                const selected = answer === opt;
                const showResult = !!result;
                const isCorrectOption = showResult && opt === result.correctAnswer;
                const isWrongSelected = showResult && selected && !result.isCorrect;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={!!result}
                    onClick={() => setAnswer(opt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition font-medium text-sm ${
                      isCorrectOption
                        ? 'border-teal bg-teal/10 text-teal'
                        : isWrongSelected
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : selected
                        ? 'border-teal bg-cyan-50 text-navy'
                        : 'border-cyan-50 hover:border-cyan text-navy'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={!!result}
              placeholder="შენი პასუხი..."
              rows={4}
              className="w-full p-4 rounded-xl border-2 border-cyan-50 focus:border-teal outline-none text-sm resize-none"
            />
          )}

          {/* Result panel */}
          {result && (
            <div
              className={`mt-5 p-4 rounded-xl border-2 ${
                result.isCorrect ? 'border-teal bg-teal/5' : 'border-red-300 bg-red-50'
              }`}
            >
              <p className={`text-sm font-black mb-1 ${result.isCorrect ? 'text-teal' : 'text-red-700'}`}>
                {result.isCorrect ? '✓ სწორია!' : '✗ არასწორია'}
              </p>
              {!result.isCorrect && (
                <p className="text-xs text-navy-100 mb-2">
                  <strong>სწორი პასუხი:</strong> {result.correctAnswer}
                </p>
              )}
              <p className="text-sm text-navy leading-relaxed whitespace-pre-wrap">
                {result.reExplanation || result.explanation}
              </p>
              {result.gamification.xpGained > 0 && (
                <p className="text-xs font-bold text-teal mt-3">
                  +{result.gamification.xpGained} XP · სულ {result.gamification.totalXp} XP
                </p>
              )}
              {result.gamification.unlockedBadges.length > 0 && (
                <p className="text-xs font-bold text-navy mt-1">
                  🏅 ახალი ბეჯი: {result.gamification.unlockedBadges.join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex justify-end">
            {result ? (
              <button
                onClick={next}
                className="bg-gradient-to-r from-teal to-cyan text-white font-bold px-6 py-3 rounded-full hover:-translate-y-0.5 transition"
              >
                შემდეგი →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!answer.trim() || checking}
                className="bg-gradient-to-r from-teal to-cyan text-white font-bold px-6 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition"
              >
                {checking ? 'მოწმდება...' : 'შემოწმება'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

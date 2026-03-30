'use client';

import { useState, useEffect } from 'react';
import type { QuizQuestion, QuizResult, QuizAttempt } from '@/types';

export function QuizModal({
  lessonId,
  questions,
  onClose,
  onComplete,
}: {
  lessonId: string;
  questions: QuizQuestion[];
  onClose: () => void;
  onComplete?: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [grading, setGrading] = useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const allAnswered = questions.every((q) => answers[q.id]?.trim());

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  // Escape key to close + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async () => {
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

      if (!res.ok) throw new Error('Failed to grade quiz');
      const data: QuizResult = await res.json();
      setResult(data);
      setSubmitted(true);
      onComplete?.();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setGrading(false);
    }
  };

  // Results view
  if (submitted && result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center quiz-backdrop" role="dialog" aria-modal="true" aria-label="Quiz results">
        <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in">
          <div className="p-6">
            {/* Score header */}
            <div className="text-center mb-6 animate-scale-in">
              <div className="relative inline-flex items-center justify-center mb-4" role="img" aria-label={`Score: ${result.percentage}%`}>
                <svg className="w-32 h-32 transform -rotate-90" aria-hidden="true">
                  <circle cx="64" cy="64" r="56" fill="none" stroke={result.passed ? '#dcfce7' : '#fee2e2'} strokeWidth="8" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke={result.passed ? '#10b981' : '#ef4444'}
                    strokeWidth="8"
                    strokeDasharray="351.86"
                    strokeDashoffset={351.86 * (1 - result.percentage / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-3xl font-bold ${result.passed ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.percentage}%
                  </span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                {result.passed ? 'Great job!' : 'Keep learning!'}
              </h2>
              <p className="text-gray-500 mt-1">
                {result.score} / {result.totalPoints} points
                {result.passed
                  ? ' - You passed!'
                  : ' - 70% needed to pass'}
              </p>
            </div>

            {/* Per-question results */}
            <div className="space-y-4" role="list" aria-label="Question results">
              {questions.map((q, i) => {
                const attempt: QuizAttempt | undefined = result.answers.find(
                  (a) => a.questionId === q.id
                );
                return (
                  <div
                    key={q.id}
                    role="listitem"
                    className={`rounded-lg border p-4 ${
                      attempt?.isCorrect
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className={`mt-0.5 text-lg ${
                          attempt?.isCorrect
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                        aria-hidden="true"
                      >
                        {attempt?.isCorrect ? '\u2713' : '\u2717'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          Q{i + 1}: {q.question}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Your answer: {attempt?.answer || '(no answer)'}
                        </p>
                        {!attempt?.isCorrect && (
                          <p className="mt-1 text-xs text-green-700">
                            Correct answer: {q.correctAnswer}
                          </p>
                        )}
                        {attempt?.feedback && (
                          <div className="mt-2 rounded bg-white/60 p-2 text-xs text-gray-700">
                            {attempt.feedback}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setAnswers({});
                  setCurrentIndex(0);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Retake Quiz
              </button>
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Back to Lesson
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center quiz-backdrop" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl ring-1 ring-black/5 animate-scale-in">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="quiz-title" className="text-xl font-bold text-gray-900">Quiz</h2>
              <p className="text-sm text-gray-500">
                Question {currentIndex + 1} of {totalQuestions} &middot; 70% needed to pass
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close quiz"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              &#10005;
            </button>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>{Object.keys(answers).length}/{totalQuestions} answered</span>
              <span>Question {currentIndex + 1}/{totalQuestions}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={totalQuestions}>
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  currentQuestion.difficulty === 'easy'
                    ? 'bg-green-100 text-green-700'
                    : currentQuestion.difficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {currentQuestion.difficulty}
              </span>
              <span className="text-xs text-gray-400">
                {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-lg font-medium text-gray-900">
              {currentQuestion.question}
            </p>
          </div>

          {/* Answer input */}
          <fieldset className="mb-8">
            <legend className="sr-only">Select your answer</legend>

            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-2" role="radiogroup">
                {currentQuestion.options.map((option, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      answers[currentQuestion.id] === option
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${currentQuestion.id}`}
                      value={option}
                      checked={answers[currentQuestion.id] === option}
                      onChange={() => setAnswer(currentQuestion.id, option)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="flex gap-4">
                {['True', 'False'].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAnswer(currentQuestion.id, val)}
                    aria-pressed={answers[currentQuestion.id] === val}
                    className={`flex-1 rounded-lg border p-4 text-center text-sm font-medium transition ${
                      answers[currentQuestion.id] === val
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'short_answer' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswer(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                aria-label="Your answer"
                rows={3}
                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            )}
          </fieldset>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Question dots */}
            <div className="flex gap-1.5" role="tablist" aria-label="Question navigation">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Question ${i + 1}${answers[q.id] ? ' (answered)' : ''}`}
                  className={`h-3 w-3 rounded-full transition hover:scale-125 ${
                    i === currentIndex
                      ? 'bg-blue-600 ring-2 ring-blue-200'
                      : answers[q.id]
                      ? 'bg-blue-300'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || grading}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {grading ? 'Grading...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

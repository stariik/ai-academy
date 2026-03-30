'use client';

import { useState, useEffect, useMemo } from 'react';
import type { QuizQuestion } from '@/types';

// ============================================================
// CHECK QUESTIONS - Inline per-page questions with lock/unlock
// ============================================================

export function CheckQuestions({
  lessonId,
  pageNumber,
  questions,
  alreadyPassed,
  locked,
  onPass,
}: {
  lessonId: string;
  pageNumber: number;
  questions: QuizQuestion[];
  alreadyPassed: boolean;
  locked: boolean;
  onPass: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<
    { questionId: string; isCorrect: boolean; correctAnswer: string; explanation: string }[] | null
  >(null);
  const [checking, setChecking] = useState(false);

  if (alreadyPassed) {
    return (
      <div className="content-surface p-0 overflow-hidden">
        <div className="bg-linear-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" aria-hidden="true">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Check Questions Completed</h3>
              <p className="text-emerald-100 text-sm">You can proceed to the next page</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="content-surface p-0 overflow-hidden relative" aria-label="Check questions - locked">
        <div className="bg-linear-to-r from-gray-500 to-gray-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" aria-hidden="true">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Check Questions Locked</h3>
              <p className="text-gray-200 text-sm">Work through the material with your AI tutor to unlock</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="p-6 space-y-4 blur-[3px] select-none pointer-events-none opacity-50" aria-hidden="true">
            {questions.map((q, i) => (
              <div key={q.id} className="rounded-xl bg-white p-5 border border-gray-200 shadow-sm">
                <p className="font-medium text-gray-900 mb-3">{i + 1}. {q.question}</p>
                {q.type === 'mcq' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((option, j) => (
                      <div key={j} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                        <span className="text-sm text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'true_false' && (
                  <div className="flex gap-4">
                    {['True', 'False'].map((val) => (
                      <div key={val} className="flex-1 rounded-lg border border-gray-200 p-3 text-center text-sm text-gray-600">
                        {val}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/30">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-3" aria-hidden="true">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Complete the tutor session to unlock</p>
              <p className="text-xs text-gray-400 mt-1">Your AI tutor will unlock these when you&apos;re ready</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
      setResults(data.results);
      setSubmitted(true);
      if (data.passed) {
        onPass();
      }
    } catch {
      /* ignore */
    } finally {
      setChecking(false);
    }
  };

  const handleRetry = () => {
    const clearedAnswers = { ...answers };
    results?.forEach((r) => {
      if (!r.isCorrect) {
        delete clearedAnswers[r.questionId];
      }
    });
    setAnswers(clearedAnswers);
    setSubmitted(false);
    setResults(null);
  };

  return (
    <div className="content-surface p-0 overflow-hidden" role="region" aria-label="Check your understanding">
      <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center" aria-hidden="true">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <h3 className="text-white font-semibold">Check Your Understanding</h3>
            <p className="text-blue-100 text-sm">Answer correctly to unlock the next page</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {questions.map((q, i) => {
          const result = results?.find((r) => r.questionId === q.id);
          return (
            <div
              key={q.id}
              className={`rounded-xl bg-white p-5 border shadow-sm ${
                result
                  ? result.isCorrect
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : 'border-red-200 bg-red-50/30'
                  : 'border-gray-200'
              }`}
            >
              <p className="font-medium text-gray-900 mb-3">{i + 1}. {q.question}</p>

              {q.type === 'mcq' && q.options && (
                <div className="space-y-2" role="radiogroup" aria-label={`Question ${i + 1}`}>
                  {q.options.map((option, j) => (
                    <label
                      key={j}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        submitted ? 'cursor-default' : ''
                      } ${
                        answers[q.id] === option
                          ? submitted
                            ? result?.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                            : 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`check-${q.id}`}
                        value={option}
                        checked={answers[q.id] === option}
                        onChange={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                        disabled={submitted}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'true_false' && (
                <div className="flex gap-4" role="radiogroup" aria-label={`Question ${i + 1}`}>
                  {['True', 'False'].map((val) => (
                    <button
                      key={val}
                      onClick={() => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: val }))}
                      disabled={submitted}
                      aria-pressed={answers[q.id] === val}
                      className={`flex-1 rounded-lg border p-3 text-center text-sm font-medium transition ${
                        answers[q.id] === val
                          ? submitted
                            ? result?.isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-500 bg-red-50 text-red-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'ordering' && q.options && (
                <OrderingQuestion
                  questionId={q.id}
                  options={q.options}
                  submitted={submitted}
                  result={result}
                  currentAnswer={answers[q.id]}
                  onAnswer={(answer) => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: answer }))}
                />
              )}

              {q.type === 'fill_in_blank' && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {q.question.split('___').map((part, partIdx, arr) => (
                      <span key={partIdx}>
                        {part}
                        {partIdx < arr.length - 1 && (
                          <input
                            type="text"
                            value={answers[q.id] || ''}
                            onChange={(e) => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                            disabled={submitted}
                            aria-label={`Fill in the blank for question ${i + 1}`}
                            className={`inline-block w-32 border-b-2 mx-1 px-1 py-0.5 text-center ${
                              submitted
                                ? result?.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                                : 'border-blue-300 focus:border-blue-500'
                            } outline-none text-sm`}
                            placeholder="..."
                          />
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {q.type === 'matching' && q.options && q.metadata?.matches ? (
                <MatchingQuestion
                  questionId={q.id}
                  terms={q.options}
                  definitions={Object.values((q.metadata.matches) as Record<string, string>)}
                  submitted={submitted}
                  result={result}
                  onAnswer={(answer) => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: answer }))}
                />
              ) : q.type === 'matching' && (
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => !submitted && setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  disabled={submitted}
                  placeholder="Type your answer..."
                  aria-label={`Answer for question ${i + 1}`}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}

              {result && (
                <div
                  className={`mt-3 rounded p-2 text-sm ${
                    result.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}
                  role="status"
                >
                  {result.isCorrect
                    ? '\u2713 Correct!'
                    : `Incorrect. The answer is: ${result.correctAnswer}`}
                  {result.explanation && (
                    <p className="mt-1 text-xs opacity-80">{result.explanation}</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit / Retry */}
        <div className="mt-6 text-center pb-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || checking}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {checking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Checking...
                </>
              ) : !allAnswered ? (
                <>Answer all questions ({Object.keys(answers).length}/{questions.length})</>
              ) : (
                <>
                  Check Answers
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </>
              )}
            </button>
          ) : !allCorrect ? (
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-200 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-300 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Try Again
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 text-emerald-700 font-medium" role="status">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              All correct! Moving to next page...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ORDERING QUESTION
// ============================================================

function OrderingQuestion({
  questionId,
  options,
  submitted,
  result,
  currentAnswer,
  onAnswer,
}: {
  questionId: string;
  options: string[];
  submitted: boolean;
  result?: { isCorrect: boolean; correctAnswer: string; explanation: string } | null;
  currentAnswer?: string;
  onAnswer: (answer: string) => void;
}) {
  const [items, setItems] = useState<string[]>(options);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    onAnswer(items.join(', '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (submitted || toIndex < 0 || toIndex >= items.length) return;
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  };

  const handleDragStart = (index: number) => {
    if (submitted) return;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index || submitted) return;
    const newItems = [...items];
    const [dragged] = newItems.splice(dragIndex, 1);
    newItems.splice(index, 0, dragged);
    setItems(newItems);
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  return (
    <div className="space-y-2" role="listbox" aria-label="Reorder items">
      <p className="text-xs text-gray-500 mb-2">Drag items into the correct order:</p>
      {items.map((item, i) => (
        <div
          key={`${questionId}-item-${i}`}
          draggable={!submitted}
          onDragStart={() => handleDragStart(i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDragEnd={handleDragEnd}
          role="option"
          aria-selected={dragIndex === i}
          className={`flex items-center gap-3 rounded-lg border p-3 transition
            ${dragIndex === i ? 'border-blue-400 bg-blue-50 opacity-70' : 'border-gray-200'}
            ${submitted ? 'cursor-default' : 'cursor-grab hover:bg-gray-50'}`}
        >
          <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}.</span>
          <span className="text-sm text-gray-700 flex-1">{item}</span>
          {!submitted && (
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveItem(i, i - 1)}
                disabled={i === 0}
                aria-label={`Move ${item} up`}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => moveItem(i, i + 1)}
                disabled={i === items.length - 1}
                aria-label={`Move ${item} down`}
                className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MATCHING QUESTION
// ============================================================

function MatchingQuestion({
  questionId,
  terms,
  definitions,
  submitted,
  result,
  onAnswer,
}: {
  questionId: string;
  terms: string[];
  definitions: string[];
  submitted: boolean;
  result?: { isCorrect: boolean } | null;
  onAnswer: (answer: string) => void;
}) {
  const [matches, setMatches] = useState<Record<string, string>>({});
  const shuffledDefs = useMemo(
    () => [...definitions].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [definitions.join(',')]
  );

  const handleMatch = (term: string, definition: string) => {
    if (submitted) return;
    const newMatches = { ...matches, [term]: definition };
    setMatches(newMatches);
    onAnswer(JSON.stringify(newMatches));
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">Match each term with its definition:</p>
      {terms.map((term) => (
        <div key={`${questionId}-${term}`} className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-800 w-1/3 shrink-0">{term}</span>
          <select
            value={matches[term] || ''}
            onChange={(e) => handleMatch(term, e.target.value)}
            disabled={submitted}
            aria-label={`Match for ${term}`}
            className={`flex-1 border rounded-lg p-2 text-sm transition ${
              submitted
                ? result?.isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
            }`}
          >
            <option value="">Select...</option>
            {shuffledDefs.map((def) => (
              <option key={def} value={def}>{def}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

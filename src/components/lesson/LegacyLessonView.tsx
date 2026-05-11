'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import type { Lesson, ContentBlock } from '@/types';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { ChatPanel } from './ChatPanel';
import { QuizModal } from './QuizModal';

// ============================================================
// LEGACY LESSON VIEW - Single-page layout (backward compatible)
// ============================================================

export function LegacyLessonView({
  lesson,
  lessonId,
}: {
  lesson: Lesson;
  lessonId: string;
}) {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showChat, setShowChat] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [recommended, setRecommended] = useState<Lesson | null>(null);
  // Language toggle removed — tutor auto-detects student's language

  const fetchRecommendation = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setRecommended(data[0]);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm" aria-label="მთავარ გვერდზე დაბრუნება">
            &larr; Back
          </a>
          <h1 className="text-lg font-bold text-gray-900">{lesson.title}</h1>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            {lesson.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChat(!showChat)}
            aria-label={showChat ? 'Hide AI tutor chat' : 'Show AI tutor chat'}
            aria-pressed={showChat}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              showChat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showChat ? 'Hide' : 'Show'} AI Tutor
          </button>
          <button
            onClick={() => setShowQuiz(true)}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Take Quiz
          </button>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - navigation */}
        <aside className="w-64 shrink-0 overflow-y-auto border-r bg-white p-4">
          <LessonNav
            contentBlocks={lesson.contentBlocks}
            activeSection={activeSection}
            onSectionClick={setActiveSection}
          />
        </aside>

        {/* Center - lesson content */}
        <main className="flex-1 overflow-y-auto p-8">
          <LessonContent lesson={lesson} onSectionVisible={setActiveSection} />
          <div className="mt-12 border-t pt-8 text-center">
            <p className="text-gray-500 mb-4">
              Finished reading? Test your knowledge!
            </p>
            <button
              onClick={() => setShowQuiz(true)}
              className="rounded-lg bg-green-600 px-6 py-3 text-lg font-medium text-white hover:bg-green-700 transition"
            >
              Take the Quiz ({lesson.quizQuestions.length} questions)
            </button>
          </div>

          {recommended && recommended.id !== lessonId && (
            <div className="mt-6 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Next recommended lesson:</p>
              <Link href={`/student/lesson/${recommended.id}`} className="text-blue-600 font-semibold hover:underline">
                {recommended.title} &rarr;
              </Link>
            </div>
          )}
        </main>

        {/* Right panel - AI Chat */}
        {showChat && (
          <aside className="w-96 shrink-0 border-l bg-white flex flex-col" aria-label="AI Tutor chat">
            <ChatPanel lessonId={lessonId} lesson={lesson} />
          </aside>
        )}
      </div>

      {showQuiz && (
        <QuizModal
          lessonId={lessonId}
          questions={lesson.quizQuestions}
          onClose={() => setShowQuiz(false)}
          onComplete={fetchRecommendation}
        />
      )}
    </div>
  );
}

// ============================================================
// LEFT SIDEBAR NAVIGATION
// ============================================================

function LessonNav({
  contentBlocks,
  activeSection,
  onSectionClick,
}: {
  contentBlocks: ContentBlock[];
  activeSection: string;
  onSectionClick: (id: string) => void;
}) {
  const headings = contentBlocks
    .filter((b) => b.type === 'heading')
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Contents
      </h3>
      <nav className="space-y-1" aria-label="Lesson sections">
        {headings.map((heading) => (
          <button
            key={heading.id}
            onClick={() => {
              onSectionClick(heading.id);
              document
                .getElementById(`block-${heading.id}`)
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            aria-current={activeSection === heading.id ? 'true' : undefined}
            className={`block w-full rounded px-3 py-1.5 text-left text-sm transition ${
              activeSection === heading.id
                ? 'bg-blue-50 font-medium text-blue-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {heading.content}
          </button>
        ))}
      </nav>

      <div className="mt-6 pt-4 border-t">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Progress
        </h3>
        <div className="h-2 rounded-full bg-gray-200" role="progressbar" aria-valuenow={headings.findIndex((h) => h.id === activeSection) + 1} aria-valuemin={0} aria-valuemax={headings.length}>
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{
              width: `${
                headings.length > 0
                  ? Math.round(
                      ((headings.findIndex((h) => h.id === activeSection) + 1) /
                        headings.length) *
                        100
                    )
                  : 0
              }%`,
            }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-400">
          {headings.findIndex((h) => h.id === activeSection) + 1} / {headings.length} sections
        </p>
      </div>
    </div>
  );
}

// ============================================================
// MAIN LESSON CONTENT
// ============================================================

function LessonContent({
  lesson,
  onSectionVisible,
}: {
  lesson: Lesson;
  onSectionVisible: (id: string) => void;
}) {
  const sortedBlocks = [...lesson.contentBlocks].sort((a, b) => a.order - b.order);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{lesson.title}</h1>
        <p className="text-gray-600 mb-4">{lesson.description}</p>

        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4" role="region" aria-label="Learning objectives">
          <h3 className="font-semibold text-blue-800 mb-2">Learning Objectives</h3>
          <ul className="space-y-1">
            {lesson.learningObjectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                <span className="mt-0.5 text-blue-400" aria-hidden="true">&#10003;</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {sortedBlocks.map((block) => (
        <ContentBlockRenderer key={block.id} block={block} onVisible={onSectionVisible} />
      ))}

      {lesson.keyConcepts.length > 0 && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Concepts</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lesson.keyConcepts.map((concept, i) => (
              <div key={i} className="rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition">
                <h4 className="font-semibold text-gray-900 mb-1">{concept.term}</h4>
                <p className="text-sm text-gray-600">{concept.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lesson.summary && (
        <div className="mt-8 rounded-lg bg-gray-50 border p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
          <div className="lesson-prose text-sm text-gray-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{lesson.summary}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

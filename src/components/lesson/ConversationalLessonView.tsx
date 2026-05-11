'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lesson, ChatMessage, LessonPage } from '@/types';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import { CheckQuestions } from './CheckQuestions';
import { QuizModal } from './QuizModal';
import { LessonControls } from './LessonControls';

// ============================================================
// CONVERSATIONAL LESSON VIEW
// Merges content + chat into a single vertical stream.
// Content blocks appear as tutor "presentations", chat is inline.
// ============================================================

type StreamItem =
  | { type: 'content-block'; id: string; blockData: LessonPage['contentBlocks'][0]; translatedContent?: string }
  | { type: 'bridge'; id: string; text: string }
  | { type: 'page-header'; id: string; pageNumber: number; title: string; difficultyLevel?: string }
  | { type: 'misconceptions'; id: string; items: string[] }
  | { type: 'applications'; id: string; items: string[] }
  | { type: 'reflection'; id: string; text: string }
  | { type: 'key-concepts'; id: string; concepts: { term: string; definition: string }[] }
  | { type: 'check-questions'; id: string; pageNumber: number }
  | { type: 'chat-message'; id: string; message: ChatMessage }
  | { type: 'tutor-prompt'; id: string; text: string }
  | { type: 'page-complete'; id: string; pageNumber: number; isLast: boolean };

const QUIZ_UNLOCK_MARKER = '[READY_FOR_QUIZ]';

export function ConversationalLessonView({
  lesson,
  lessonId,
}: {
  lesson: Lesson;
  lessonId: string;
}) {
  const pages = lesson.pages!;
  const totalPages = lesson.totalPages ?? pages.length;

  const [currentPage, setCurrentPage] = useState(1);
  const [completedPages, setCompletedPages] = useState<number[]>([]);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [recommended, setRecommended] = useState<Lesson | null>(null);
  const [language, setLanguage] = useState<'en' | 'ka'>('en');
  const [showPageNav, setShowPageNav] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [unlockedPages, setUnlockedPages] = useState<Set<number>>(new Set());
  const unlockFiredRef = useRef(false);

  // Translation
  const [translatedPages, setTranslatedPages] = useState<Record<number, Record<string, string>>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [chatTranslations, setChatTranslations] = useState<Record<string, string>>({});

  const streamEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isCheckUnlocked = completedPages.includes(currentPage) || unlockedPages.has(currentPage);
  const currentPageData = pages.find((p) => p.pageNumber === currentPage);
  const allPagesCompleted = pages.every((p) => completedPages.includes(p.pageNumber));

  // ---- Load progress ----
  useEffect(() => {
    async function loadProgress() {
      try {
        const res = await fetch('/api/progress');
        const data = await res.json();
        if (Array.isArray(data)) {
          const lp = data.find((p: { lessonId: string }) => p.lessonId === lessonId);
          if (lp) {
            setCurrentPage(lp.currentPage || 1);
            setCompletedPages(lp.completedPages || []);
          }
        }
      } catch { /* ignore */ }
      setProgressLoaded(true);
    }
    loadProgress();
  }, [lessonId]);

  // ---- Load chat history + auto intro ----
  useEffect(() => {
    if (!progressLoaded) return;
    let cancelled = false;

    async function loadChat() {
      try {
        const res = await fetch(`/api/chat-history?lessonId=${lessonId}&pageNumber=${currentPage}`);
        const data = await res.json();

        if (cancelled) return;

        if (data.messages && data.messages.length > 0) {
          const loaded = data.messages.map((m: { id: string; role: string; content: string; timestamp: string }) => ({
            id: m.id,
            role: m.role as ChatMessage['role'],
            content: m.content.replace(QUIZ_UNLOCK_MARKER, '').trim(),
            timestamp: m.timestamp,
          }));
          setChatMessages(loaded);

          const hadUnlock = data.messages.some(
            (m: { role: string; content: string }) =>
              m.role === 'assistant' && m.content.includes(QUIZ_UNLOCK_MARKER)
          );
          if (hadUnlock && !unlockFiredRef.current) {
            unlockFiredRef.current = true;
            setUnlockedPages((prev) => new Set(prev).add(currentPage));
          }
        } else {
          setChatMessages([]);
          sendAutoIntro();
        }
      } catch {
        if (!cancelled) {
          setChatMessages([]);
          sendAutoIntro();
        }
      }
      if (!cancelled) setHistoryLoaded(true);
    }

    function sendAutoIntro() {
      const pageData = pages.find((p) => p.pageNumber === currentPage);
      if (!pageData) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `I'm ready to learn about "${pageData.title}". Please teach me!`,
        timestamp: new Date().toISOString(),
      };
      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setChatMessages([userMsg, assistantMsg]);
      setIsStreaming(true);

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMsg],
          lessonId,
          pageNumber: currentPage,
          isFirstVisit: true,
        }),
      })
        .then(async (res) => {
          if (cancelled || !res.ok) return;
          const reader = res.body?.getReader();
          if (!reader) return;
          const decoder = new TextDecoder();
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done || cancelled) break;
            fullText += decoder.decode(value, { stream: true });
            if (fullText.includes(QUIZ_UNLOCK_MARKER) && !unlockFiredRef.current) {
              unlockFiredRef.current = true;
              setUnlockedPages((prev) => new Set(prev).add(currentPage));
            }
            const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
            setChatMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: displayText } : m))
            );
          }
        })
        .catch(() => {
          if (!cancelled) {
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: 'Welcome! Ask me anything about this page.' }
                  : m
              )
            );
          }
        })
        .finally(() => {
          if (!cancelled) setIsStreaming(false);
        });
    }

    unlockFiredRef.current = false;
    setHistoryLoaded(false);
    setChatMessages([]);
    loadChat();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, currentPage, progressLoaded]);

  // ---- Translation ----
  useEffect(() => {
    if (language !== 'ka') return;
    if (translatedPages[currentPage]) return;
    if (!currentPageData) return;

    const textsToTranslate: string[] = [];
    const keys: string[] = [];

    textsToTranslate.push(currentPageData.title);
    keys.push('title');

    if (currentPageData.bridgeFromPrevious) {
      textsToTranslate.push(currentPageData.bridgeFromPrevious);
      keys.push('bridge');
    }

    [...currentPageData.contentBlocks]
      .sort((a, b) => a.order - b.order)
      .forEach((block) => {
        textsToTranslate.push(block.content);
        keys.push(`block-${block.id}`);
      });

    currentPageData.commonMisconceptions?.forEach((m, i) => {
      textsToTranslate.push(m);
      keys.push(`misconception-${i}`);
    });

    currentPageData.realWorldApplications?.forEach((a, i) => {
      textsToTranslate.push(a);
      keys.push(`application-${i}`);
    });

    if (currentPageData.teachingFlow?.reflectionPrompt) {
      textsToTranslate.push(currentPageData.teachingFlow.reflectionPrompt);
      keys.push('reflection');
    }

    currentPageData.keyConcepts.forEach((c, i) => {
      textsToTranslate.push(c.term);
      keys.push(`concept-term-${i}`);
      textsToTranslate.push(c.definition);
      keys.push(`concept-def-${i}`);
    });

    if (textsToTranslate.length === 0) return;

    setIsTranslating(true);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts: textsToTranslate, targetLang: 'ka', sourceLang: 'en' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.translations) {
          const map: Record<string, string> = {};
          keys.forEach((key, i) => {
            map[key] = data.translations[i];
          });
          setTranslatedPages((prev) => ({ ...prev, [currentPage]: map }));
        }
      })
      .catch((err) => console.error('Translation error:', err))
      .finally(() => setIsTranslating(false));
  }, [language, currentPage, translatedPages, currentPageData, pages]);

  const t = useCallback(
    (key: string, original: string): string => {
      if (language !== 'ka') return original;
      return translatedPages[currentPage]?.[key] ?? original;
    },
    [language, currentPage, translatedPages]
  );

  // ---- Chat translation for Georgian display ----
  const getDisplayContent = useCallback((msg: ChatMessage): string => {
    if (language === 'ka' && msg.role === 'assistant' && chatTranslations[msg.id]) {
      return chatTranslations[msg.id];
    }
    return msg.content;
  }, [language, chatTranslations]);

  // Translate assistant messages when language switches to Georgian
  useEffect(() => {
    if (language !== 'ka' || isStreaming) return;
    const untranslated = chatMessages.filter(
      (m) => m.role === 'assistant' && m.content.trim() && !chatTranslations[m.id]
    );
    if (untranslated.length === 0) return;

    const texts = untranslated.map((m) => m.content);
    fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang: 'ka', sourceLang: 'en' }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.translations) {
          const newT: Record<string, string> = {};
          untranslated.forEach((m, i) => { newT[m.id] = data.translations[i]; });
          setChatTranslations((prev) => ({ ...prev, ...newT }));
        }
      })
      .catch(() => {});
  }, [language, chatMessages, chatTranslations, isStreaming]);

  // ---- Send message ----
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      setInput('');
      setIsStreaming(true);

      // Translate user input if Georgian
      let englishUserText = text.trim();
      if (language === 'ka') {
        try {
          const res = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang: 'en', sourceLang: 'ka' }),
          });
          const data = await res.json();
          if (data.translation) englishUserText = data.translation;
        } catch { /* fallback to original */ }
      }

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);

      try {
        const claudeMessages = updatedMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => {
            if (m.role === 'user' && language === 'ka') {
              const english = m.id === userMessage.id ? englishUserText : (chatTranslations[m.id] || m.content);
              return { ...m, content: english };
            }
            return m;
          });

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: claudeMessages, lessonId, pageNumber: currentPage }),
        });

        if (!res.ok) throw new Error('Chat request failed');

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });

          if (fullText.includes(QUIZ_UNLOCK_MARKER) && !unlockFiredRef.current) {
            unlockFiredRef.current = true;
            setUnlockedPages((prev) => new Set(prev).add(currentPage));
          }

          const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
          setChatMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: displayText } : m))
          );
        }

        // Translate if Georgian
        if (language === 'ka') {
          const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
          try {
            const tRes = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: displayText, targetLang: 'ka', sourceLang: 'en' }),
            });
            const tData = await tRes.json();
            if (tData.translation) {
              setChatTranslations((prev) => ({ ...prev, [assistantId]: tData.translation }));
            }
          } catch { /* ignore */ }
        }
      } catch (err) {
        const errorText = err instanceof Error ? err.message : 'Something went wrong';
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Sorry, I encountered an error: ${errorText}. Please try again.` }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        inputRef.current?.focus();
      }
    },
    [chatMessages, isStreaming, lessonId, currentPage, language, chatTranslations]
  );

  // ---- Navigation ----
  const canAccessPage = (pageNum: number) => {
    if (pageNum === 1) return true;
    if (completedPages.includes(pageNum)) return true;
    return completedPages.includes(pageNum - 1);
  };

  const navigateToPage = (pageNum: number) => {
    if (canAccessPage(pageNum)) {
      setCurrentPage(pageNum);
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, currentPage: pageNum }),
      }).catch(() => {});
    }
  };

  const handleCheckPassed = (pageNum: number) => {
    const updated = [...completedPages];
    if (!updated.includes(pageNum)) updated.push(pageNum);
    setCompletedPages(updated);

    if (pageNum < totalPages) {
      setTimeout(() => navigateToPage(pageNum + 1), 1500);
    }
  };

  const handleCheckUnlocked = useCallback((pageNum: number) => {
    setUnlockedPages((prev) => new Set(prev).add(pageNum));
  }, []);

  const fetchRecommendation = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) setRecommended(data[0]);
    } catch { /* ignore */ }
  }, []);

  // ---- Auto-scroll to bottom ----
  useEffect(() => {
    const el = streamEndRef.current;
    if (!el) return;
    const container = el.parentElement;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
    if (isNearBottom) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Scroll to top on page change
  useEffect(() => {
    streamEndRef.current?.parentElement?.scrollTo(0, 0);
  }, [currentPage]);

  // ---- Suggested questions ----
  const suggestedQuestions = currentPageData
    ? [
        `Explain "${currentPageData.title}" in simpler terms`,
        ...currentPageData.keyConcepts.slice(0, 2).map((c) => `What is ${c.term}?`),
        'Give me an example',
      ]
    : [];

  // ---- Loading states ----
  if (!progressLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50" role="status">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-linear-to-br from-blue-500 to-purple-600 mb-4 shadow-lg shadow-blue-200">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // ---- Build the stream ----
  const streamItems: StreamItem[] = [];

  if (currentPageData) {
    // Page header
    streamItems.push({
      type: 'page-header',
      id: `header-${currentPage}`,
      pageNumber: currentPage,
      title: t('title', currentPageData.title),
      difficultyLevel: currentPageData.difficultyLevel,
    });

    // Bridge from previous
    if (currentPageData.bridgeFromPrevious && currentPage > 1) {
      streamItems.push({
        type: 'bridge',
        id: `bridge-${currentPage}`,
        text: t('bridge', currentPageData.bridgeFromPrevious),
      });
    }

    // Content blocks
    [...currentPageData.contentBlocks]
      .sort((a, b) => a.order - b.order)
      .forEach((block) => {
        streamItems.push({
          type: 'content-block',
          id: `block-${block.id}`,
          blockData: block,
          translatedContent: language === 'ka' ? translatedPages[currentPage]?.[`block-${block.id}`] : undefined,
        });
      });

    // Misconceptions
    if (currentPageData.commonMisconceptions && currentPageData.commonMisconceptions.length > 0) {
      streamItems.push({
        type: 'misconceptions',
        id: `misconceptions-${currentPage}`,
        items: currentPageData.commonMisconceptions.map((m, i) => t(`misconception-${i}`, m)),
      });
    }

    // Applications
    if (currentPageData.realWorldApplications && currentPageData.realWorldApplications.length > 0) {
      streamItems.push({
        type: 'applications',
        id: `applications-${currentPage}`,
        items: currentPageData.realWorldApplications.map((a, i) => t(`application-${i}`, a)),
      });
    }

    // Reflection
    if (currentPageData.teachingFlow?.reflectionPrompt) {
      streamItems.push({
        type: 'reflection',
        id: `reflection-${currentPage}`,
        text: t('reflection', currentPageData.teachingFlow.reflectionPrompt),
      });
    }

    // Key concepts
    if (currentPageData.keyConcepts.length > 0) {
      streamItems.push({
        type: 'key-concepts',
        id: `concepts-${currentPage}`,
        concepts: currentPageData.keyConcepts.map((c, i) => ({
          term: t(`concept-term-${i}`, c.term),
          definition: t(`concept-def-${i}`, c.definition),
        })),
      });
    }
  }

  // Tutor divider before chat
  if (chatMessages.length > 0 || !historyLoaded) {
    streamItems.push({
      type: 'tutor-prompt',
      id: `tutor-divider-${currentPage}`,
      text: language === 'ka' ? 'AI ტუტორი' : 'AI Tutor',
    });
  }

  // Chat messages
  chatMessages.forEach((msg) => {
    streamItems.push({
      type: 'chat-message',
      id: msg.id,
      message: msg,
    });
  });

  // Check questions after chat
  if (currentPageData && currentPageData.checkQuestions.length > 0) {
    streamItems.push({
      type: 'check-questions',
      id: `check-${currentPage}`,
      pageNumber: currentPage,
    });
  }

  // Continue button for pages without check questions
  if (currentPageData && currentPageData.checkQuestions.length === 0 && !completedPages.includes(currentPage)) {
    streamItems.push({
      type: 'page-complete',
      id: `complete-${currentPage}`,
      pageNumber: currentPage,
      isLast: currentPage >= totalPages,
    });
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ---- HEADER ---- */}
      <header className="glass-panel border-b sticky top-0 z-20">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/" className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition shrink-0" aria-label="უკან">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </a>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-gray-900 truncate">{lesson.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">
                  {completedPages.length}/{totalPages}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Page nav toggle */}
            <button
              onClick={() => setShowPageNav(!showPageNav)}
              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              aria-label="Page navigation"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              <span className="hidden sm:inline">{currentPage}/{totalPages}</span>
            </button>

            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'ka' : 'en')}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                language === 'ka'
                  ? 'bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-300'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {language === 'ka' ? '\u{1F1EC}\u{1F1EA}' : '\u{1F1EC}\u{1F1E7}'}
            </button>

            {/* Quiz button */}
            {allPagesCompleted && (
              <button
                onClick={() => setShowQuiz(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="hidden sm:inline">Final Quiz</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-linear-to-r from-blue-500 to-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${(completedPages.length / totalPages) * 100}%` }}
          />
        </div>
      </header>

      {/* ---- PAGE NAV DROPDOWN ---- */}
      {showPageNav && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowPageNav(false)} />
          <div className="absolute top-[60px] left-0 right-0 z-15 mx-4 sm:mx-auto sm:max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-3 animate-scale-in" style={{ zIndex: 15 }}>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {pages
                .sort((a, b) => a.pageNumber - b.pageNumber)
                .map((page) => {
                  const isCompleted = completedPages.includes(page.pageNumber);
                  const isCurrent = page.pageNumber === currentPage;
                  const isLocked = !isCompleted && !isCurrent && page.pageNumber > 1 && !completedPages.includes(page.pageNumber - 1);

                  return (
                    <button
                      key={page.id}
                      onClick={() => {
                        if (!isLocked) {
                          navigateToPage(page.pageNumber);
                          setShowPageNav(false);
                        }
                      }}
                      disabled={isLocked}
                      className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        isCurrent ? 'bg-blue-50 text-blue-700 font-medium'
                        : isCompleted ? 'text-green-700 hover:bg-green-50'
                        : isLocked ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        isCompleted ? 'bg-emerald-100 text-emerald-600'
                        : isCurrent ? 'bg-blue-600 text-white'
                        : isLocked ? 'bg-gray-100 text-gray-400'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        ) : isLocked ? (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        ) : (
                          page.pageNumber
                        )}
                      </span>
                      <span className="truncate">{page.title}</span>
                    </button>
                  );
                })}
            </div>

            {/* Quiz entry */}
            <div className="mt-2 pt-2 border-t">
              <button
                onClick={() => { if (allPagesCompleted) { setShowQuiz(true); setShowPageNav(false); } }}
                disabled={!allPagesCompleted}
                className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  allPagesCompleted ? 'text-emerald-700 hover:bg-emerald-50 font-medium' : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  allPagesCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                <span>Final Quiz</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ---- MAIN STREAM ---- */}
      <main className="flex-1 overflow-y-auto lesson-scroll" role="main">
        <div className="mx-auto max-w-2xl px-4 py-6 pb-4">
          {isTranslating && language === 'ka' && (
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-2 mb-4 flex items-center gap-2 text-sm text-purple-700" role="status">
              <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
              {'\u10D8\u10D7\u10D0\u10E0\u10D2\u10DB\u10DC\u10D4\u10D1\u10D0...'}
            </div>
          )}

          {streamItems.map((item) => {
            switch (item.type) {
              case 'page-header':
                return (
                  <div key={item.id} className="mb-6 animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        {language === 'ka' ? `\u10D2\u10D5\u10D4\u10E0\u10D3\u10D8 ${item.pageNumber}/${totalPages}` : `Page ${item.pageNumber} of ${totalPages}`}
                      </span>
                      {item.difficultyLevel && (
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                          item.difficultyLevel === 'foundational' ? 'bg-green-100 text-green-700'
                          : item.difficultyLevel === 'intermediate' ? 'bg-amber-100 text-amber-700'
                          : item.difficultyLevel === 'advanced' ? 'bg-red-100 text-red-700'
                          : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.difficultyLevel}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{item.title}</h2>
                  </div>
                );

              case 'bridge':
                return (
                  <div key={item.id} className="rounded-lg bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 p-3 mb-4 text-sm text-teal-800 italic animate-fade-in-up">
                    {item.text}
                  </div>
                );

              case 'content-block':
                return (
                  <div key={item.id} className="animate-fade-in-up">
                    <ContentBlockRenderer
                      block={item.blockData}
                      translatedContent={item.translatedContent}
                    />
                  </div>
                );

              case 'misconceptions':
                return (
                  <div key={item.id} className="rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4 mb-6 animate-fade-in-up" role="note">
                    <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 mb-2">
                      {language === 'ka' ? '\u10D2\u10D0\u10D5\u10E0\u10EA\u10D4\u10DA\u10D4\u10D1\u10E3\u10DA\u10D8 \u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D4\u10D1\u10D8' : 'Common Misconceptions'}
                    </p>
                    <ul className="list-disc list-inside text-sm text-orange-900 space-y-1">
                      {item.items.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                );

              case 'applications':
                return (
                  <div key={item.id} className="rounded-lg bg-green-50 border border-green-200 p-4 mb-6 animate-fade-in-up">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-2">
                      {language === 'ka' ? '\u10E0\u10D4\u10D0\u10DA\u10E3\u10E0\u10D8 \u10D2\u10D0\u10DB\u10DD\u10E7\u10D4\u10DC\u10D4\u10D1\u10D0' : 'Real-World Applications'}
                    </p>
                    <ul className="list-disc list-inside text-sm text-green-900 space-y-1">
                      {item.items.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </div>
                );

              case 'reflection':
                return (
                  <div key={item.id} className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 mb-6 animate-fade-in-up">
                    <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700 mb-1">
                      {language === 'ka' ? '\u10D3\u10D0\u10E4\u10D8\u10E5\u10E0\u10D3\u10D8' : 'Reflect'}
                    </p>
                    <p className="text-sm text-yellow-900 italic">{item.text}</p>
                  </div>
                );

              case 'key-concepts':
                return (
                  <div key={item.id} className="mb-6 animate-fade-in-up">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">
                      {language === 'ka' ? '\u10EB\u10D8\u10E0\u10D8\u10D7\u10D0\u10D3\u10D8 \u10EA\u10DC\u10D4\u10D1\u10D4\u10D1\u10D8' : 'Key Concepts'}
                    </h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {item.concepts.map((concept, i) => (
                        <div key={i} className="rounded-xl border border-purple-100 bg-linear-to-br from-purple-50 to-white p-3 transition hover:shadow-md hover:border-purple-200">
                          <h4 className="font-semibold text-purple-900 text-sm mb-0.5">{concept.term}</h4>
                          <p className="text-xs text-purple-700 leading-snug">{concept.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );

              case 'tutor-prompt':
                return (
                  <div key={item.id} className="flex items-center gap-3 my-6">
                    <div className="h-px flex-1 bg-gray-200" />
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
                      <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span className="text-xs font-medium text-blue-700">{item.text}</span>
                      {!unlockFiredRef.current && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                          Teaching...
                        </span>
                      )}
                      {unlockFiredRef.current && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          Ready
                        </span>
                      )}
                    </div>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                );

              case 'chat-message': {
                const msg = item.message;
                if (msg.role === 'user') {
                  return (
                    <div key={item.id} className="flex justify-end mb-3 animate-fade-in-up">
                      <div className="max-w-[85%] rounded-2xl bg-blue-600 text-white px-4 py-2.5 text-sm msg-tail-right">
                        <p className="leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={item.id} className="flex gap-2 mb-3 animate-fade-in-up">
                    <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <div className="max-w-[85%] rounded-2xl bg-gray-100 text-gray-800 px-4 py-3 text-sm msg-tail-left">
                      <div className="chat-prose max-w-none text-[0.8125rem]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {getDisplayContent(msg) || '...'}
                        </ReactMarkdown>
                        {isStreaming &&
                          msg.id === chatMessages[chatMessages.length - 1]?.id &&
                          !msg.content && (
                            <div className="flex gap-1 py-1" aria-label="Typing">
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                              <span className="typing-dot" />
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              }

              case 'check-questions':
                return (
                  <div key={item.id} className="my-6 animate-fade-in-up">
                    <CheckQuestions
                      lessonId={lessonId}
                      pageNumber={item.pageNumber}
                      questions={currentPageData!.checkQuestions}
                      alreadyPassed={completedPages.includes(item.pageNumber)}
                      locked={!isCheckUnlocked}
                      onPass={() => handleCheckPassed(item.pageNumber)}
                    />
                  </div>
                );

              case 'page-complete':
                return (
                  <div key={item.id} className="my-6 text-center animate-fade-in-up">
                    {isCheckUnlocked ? (
                      <button
                        onClick={() => handleCheckPassed(item.pageNumber)}
                        className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition shadow-sm"
                      >
                        {language === 'ka' ? '\u10D2\u10D0\u10D2\u10E0\u10EB\u10D4\u10DA\u10D4\u10D1\u10D0' : 'I understand - Continue'}
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm text-gray-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        {language === 'ka' ? '\u10D8\u10DB\u10E3\u10E8\u10D0\u10D5\u10D4\u10D7 AI \u10E2\u10E3\u10E2\u10DD\u10E0\u10D7\u10D0\u10DC' : 'Work through the material with your AI tutor'}
                      </div>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })}

          {/* Suggested questions when chat is empty (only auto-intro) */}
          {historyLoaded && chatMessages.length <= 2 && !isStreaming && suggestedQuestions.length > 0 && (
            <div className="mb-4 animate-fade-in">
              <p className="text-xs font-medium text-gray-400 mb-2">
                {language === 'ka' ? '\u10E8\u10D4\u10D9\u10D8\u10D7\u10EE\u10D5\u10D4\u10D1\u10D8' : 'Suggested questions'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All pages completed banner */}
          {allPagesCompleted && (
            <div className="mt-4 bg-linear-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 text-center animate-fade-in-up">
              <p className="font-semibold text-green-800 mb-1">
                {language === 'ka' ? '\u10E7\u10D5\u10D4\u10DA\u10D0 \u10D2\u10D5\u10D4\u10E0\u10D3\u10D8 \u10D3\u10D0\u10E1\u10E0\u10E3\u10DA\u10D4\u10D1\u10E3\u10DA\u10D8\u10D0!' : 'All pages completed!'}
              </p>
              <p className="text-sm text-green-700 mb-3">
                {language === 'ka' ? '\u10DB\u10D6\u10D0\u10D3 \u10EE\u10D0\u10E0\u10D7 \u10E4\u10D8\u10DC\u10D0\u10DA\u10E3\u10E0\u10D8 \u10E5\u10D5\u10D8\u10D6\u10D8\u10E1\u10D7\u10D5\u10D8\u10E1?' : 'Ready for the final quiz?'}
              </p>
              <button
                onClick={() => setShowQuiz(true)}
                className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
              >
                {language === 'ka' ? '\u10E4\u10D8\u10DC\u10D0\u10DA\u10E3\u10E0\u10D8 \u10E5\u10D5\u10D8\u10D6\u10D8' : `Final Quiz (${lesson.quizQuestions.filter(q => q.scope !== 'check').length} questions)`}
              </button>
            </div>
          )}

          {/* Next recommendation */}
          {recommended && recommended.id !== lessonId && (
            <div className="mt-4 bg-linear-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Next recommended lesson:</p>
              <Link href={`/student/lesson/${recommended.id}`} className="text-blue-600 font-semibold hover:underline">
                {recommended.title} &rarr;
              </Link>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 mb-2 flex items-center justify-between">
            <button
              onClick={() => navigateToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              {language === 'ka' ? '\u10EC\u10D8\u10DC\u10D0' : 'Previous'}
            </button>

            {currentPage < totalPages ? (
              <button
                onClick={() => navigateToPage(currentPage + 1)}
                disabled={!canAccessPage(currentPage + 1)}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed transition-all"
              >
                {language === 'ka' ? '\u10E8\u10D4\u10DB\u10D3\u10D4\u10D2\u10D8' : 'Next'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            ) : allPagesCompleted ? (
              <button
                onClick={() => setShowQuiz(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-linear-to-r from-emerald-600 to-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all"
              >
                {language === 'ka' ? '\u10E5\u10D5\u10D8\u10D6\u10D8' : 'Take Quiz'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>
            ) : (
              <button disabled className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-5 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
                {language === 'ka' ? '\u10D3\u10D0\u10D0\u10E1\u10E0\u10E3\u10DA\u10D4\u10D7' : 'Complete to continue'}
              </button>
            )}
          </div>

          <div ref={streamEndRef} />
        </div>
      </main>

      {/* ---- PINNED CHAT INPUT ---- */}
      <div className="border-t bg-white px-4 py-3 sticky bottom-0 z-10 safe-area-bottom">
        {/* Lesson controls (simpler/deeper/example + style selector) */}
        {chatMessages.length > 0 && (
          <div className="mb-2">
            <LessonControls onPrompt={(p) => sendMessage(p)} disabled={isStreaming} compact />
          </div>
        )}

        {/* Concept chips */}
        {currentPageData && currentPageData.keyConcepts.length > 0 && chatMessages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {currentPageData.keyConcepts.slice(0, 4).map((c, i) => (
              <button
                key={i}
                onClick={() => sendMessage(`Can you explain "${c.term}" in more detail?`)}
                disabled={isStreaming}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition disabled:opacity-50"
              >
                {c.term}
              </button>
            ))}
          </div>
        )}

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
            placeholder={language === 'ka' ? '\u10D3\u10D0\u10E1\u10D5\u10D8\u10D7 \u10E8\u10D4\u10D9\u10D8\u10D7\u10EE\u10D5\u10D0...' : 'Ask a question...'}
            disabled={isStreaming}
            className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 placeholder:text-gray-400 transition"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition shadow-sm"
          >
            {isStreaming ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" /></svg>
            )}
          </button>
        </form>
      </div>

      {/* ---- QUIZ MODAL ---- */}
      {showQuiz && (
        <QuizModal
          lessonId={lessonId}
          questions={lesson.quizQuestions.filter((q) => q.scope !== 'check')}
          onClose={() => setShowQuiz(false)}
          onComplete={fetchRecommendation}
        />
      )}
    </div>
  );
}

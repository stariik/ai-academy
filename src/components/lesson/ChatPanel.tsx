'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Lesson, ChatMessage } from '@/types';

const QUIZ_UNLOCK_MARKER = '[READY_FOR_QUIZ]';

export function ChatPanel({
  lessonId,
  lesson,
  pageNumber,
  onUnlockCheck,
  language = 'en',
}: {
  lessonId: string;
  lesson: Lesson;
  pageNumber?: number;
  onUnlockCheck?: () => void;
  language?: 'en' | 'ka';
}) {
  // Messages always store the ORIGINAL language: user msgs in their typed language, assistant msgs in English
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Translation cache: msgId -> translated text
  // For assistant msgs: English -> Georgian translation
  // For user msgs typed in Georgian: Georgian -> English translation (used when sending to Claude)
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslatingChat, setIsTranslatingChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unlockFiredRef = useRef(false);

  // Current page data for page-scoped mode
  const currentPageData =
    pageNumber !== undefined
      ? lesson.pages?.find((p) => p.pageNumber === pageNumber)
      : null;

  // Translate a completed assistant message (English -> Georgian)
  const translateAssistantMessage = useCallback(async (messageId: string, englishText: string) => {
    if (!englishText.trim()) return;
    setIsTranslatingChat(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: englishText, targetLang: 'ka', sourceLang: 'en' }),
      });
      const data = await res.json();
      if (data.translation) {
        setTranslations((prev) => ({ ...prev, [messageId]: data.translation }));
      }
    } catch (err) {
      console.error('Chat translation error:', err);
    } finally {
      setIsTranslatingChat(false);
    }
  }, []);

  // Translate user input (Georgian -> English) before sending to Claude
  const translateUserInput = useCallback(async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: 'en', sourceLang: 'ka' }),
      });
      const data = await res.json();
      return data.translation || text;
    } catch {
      return text; // Fallback: send original text
    }
  }, []);

  // Get display content for a message based on current language
  const getDisplayContent = useCallback((msg: ChatMessage): string => {
    if (language === 'ka' && msg.role === 'assistant' && translations[msg.id]) {
      return translations[msg.id];
    }
    return msg.content;
  }, [language, translations]);

  // Load chat history + auto-intro for new pages
  useEffect(() => {
    let cancelled = false;

    async function loadHistoryAndMaybeIntro() {
      try {
        let url = `/api/chat-history?lessonId=${lessonId}`;
        if (pageNumber !== undefined) {
          url += `&pageNumber=${pageNumber}`;
        }
        const res = await fetch(url);
        const data = await res.json();

        if (cancelled) return;

        if (data.messages && data.messages.length > 0) {
          const loadedMessages = data.messages.map(
            (m: { id: string; role: string; content: string; timestamp: string }) => ({
              id: m.id,
              role: m.role as ChatMessage['role'],
              content: m.content.replace(QUIZ_UNLOCK_MARKER, '').trim(),
              timestamp: m.timestamp,
            })
          );
          setMessages(loadedMessages);

          // Check if any assistant message in history contained the unlock marker
          const hadUnlock = data.messages.some(
            (m: { role: string; content: string }) =>
              m.role === 'assistant' && m.content.includes(QUIZ_UNLOCK_MARKER)
          );
          if (hadUnlock && onUnlockCheck && !unlockFiredRef.current) {
            unlockFiredRef.current = true;
            onUnlockCheck();
          }

          // If Georgian mode, translate all assistant messages from history
          if (language === 'ka') {
            const assistantMsgs = loadedMessages.filter(
              (m: ChatMessage) => m.role === 'assistant' && m.content.trim()
            );
            if (assistantMsgs.length > 0) {
              const textsToTranslate = assistantMsgs.map((m: ChatMessage) => m.content);
              try {
                const translateRes = await fetch('/api/translate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ texts: textsToTranslate, targetLang: 'ka', sourceLang: 'en' }),
                });
                const translateData = await translateRes.json();
                if (translateData.translations) {
                  const newTranslations: Record<string, string> = {};
                  assistantMsgs.forEach((m: ChatMessage, i: number) => {
                    newTranslations[m.id] = translateData.translations[i];
                  });
                  if (!cancelled) setTranslations((prev) => ({ ...prev, ...newTranslations }));
                }
              } catch {
                // Translations will stay in English
              }
            }
          }

          setHistoryLoaded(true);
        } else {
          setHistoryLoaded(true);

          // Auto-intro for paged mode on first visit
          if (pageNumber !== undefined && currentPageData) {
            sendAutoIntro();
          }
        }
      } catch {
        if (!cancelled) {
          setHistoryLoaded(true);
          if (pageNumber !== undefined && currentPageData) {
            sendAutoIntro();
          }
        }
      }
    }

    function sendAutoIntro() {
      const pageTitle = currentPageData?.title ?? 'this topic';
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: `I'm ready to learn about "${pageTitle}". Please teach me!`,
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
        }),
      })
        .then(async (res) => {
          if (cancelled) return;
          if (!res.ok) throw new Error('Failed');
          const reader = res.body?.getReader();
          if (!reader) throw new Error('No body');
          const decoder = new TextDecoder();
          let fullText = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (cancelled) break;
            fullText += decoder.decode(value, { stream: true });
            if (fullText.includes(QUIZ_UNLOCK_MARKER) && onUnlockCheck && !unlockFiredRef.current) {
              unlockFiredRef.current = true;
              onUnlockCheck();
            }
            const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: displayText } : m))
            );
          }
          // Translate the completed response if Georgian mode
          if (!cancelled && language === 'ka') {
            const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
            translateAssistantMessage(assistantId, displayText);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMessages((prev) =>
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

    loadHistoryAndMaybeIntro();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, pageNumber]);

  // When language changes to Georgian, translate any untranslated assistant messages
  useEffect(() => {
    if (language !== 'ka' || isStreaming) return;

    const untranslated = messages.filter(
      (m) => m.role === 'assistant' && m.content.trim() && !translations[m.id]
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
          const newTranslations: Record<string, string> = {};
          untranslated.forEach((m, i) => {
            newTranslations[m.id] = data.translations[i];
          });
          setTranslations((prev) => ({ ...prev, ...newTranslations }));
        }
      })
      .catch(() => {});
  }, [language, messages, translations, isStreaming]);

  // Suggested questions
  const suggestedQuestions =
    currentPageData
      ? [
          `Can you explain "${currentPageData.title}" in simpler terms?`,
          ...currentPageData.keyConcepts
            .slice(0, 3)
            .map((c) => `What is ${c.term} and why does it matter?`),
          'Can you give me an example of this?',
        ]
      : [
          `Can you explain the main ideas of "${lesson.title}" in simple terms?`,
          ...lesson.keyConcepts
            .slice(0, 3)
            .map((c) => `What is ${c.term} and why does it matter?`),
          'Can you give me a real-world example of this?',
          'What are the most important things I should remember?',
        ];

  const scrollToBottom = useCallback(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, translations, scrollToBottom]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      setIsStreaming(true);

      // If typing in Georgian, translate to English for Claude
      let englishUserText = text.trim();
      if (language === 'ka') {
        englishUserText = await translateUserInput(text.trim());
        // Store the English translation so we can send it to Claude
        setTranslations((prev) => ({ ...prev, [userMessage.id]: englishUserText }));
      }

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Build messages for Claude - all content in English
        const claudeMessages = updatedMessages
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .map((m) => {
            if (m.role === 'user' && language === 'ka') {
              // Use English translation for user messages sent in Georgian
              const englishVersion = m.id === userMessage.id ? englishUserText : (translations[m.id] || m.content);
              return { ...m, content: englishVersion };
            }
            return m;
          });

        const body: Record<string, unknown> = {
          messages: claudeMessages,
          lessonId,
        };
        if (pageNumber !== undefined) {
          body.pageNumber = pageNumber;
        }

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Request failed' }));
          throw new Error(err.error || 'Chat request failed');
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          if (fullText.includes(QUIZ_UNLOCK_MARKER) && onUnlockCheck && !unlockFiredRef.current) {
            unlockFiredRef.current = true;
            onUnlockCheck();
          }

          const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: displayText } : m))
          );
        }

        // Translate assistant response if Georgian mode
        if (language === 'ka') {
          const displayText = fullText.replace(QUIZ_UNLOCK_MARKER, '').trim();
          translateAssistantMessage(assistantId, displayText);
        }
      } catch (err) {
        const errorText = err instanceof Error ? err.message : 'Something went wrong';
        setMessages((prev) =>
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
    [messages, isStreaming, lessonId, pageNumber, onUnlockCheck, language, translateAssistantMessage, translateUserInput, translations]
  );

  if (!historyLoaded) {
    return (
      <div className="flex items-center justify-center flex-1" role="status" aria-label="Loading chat">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-linear-to-br from-blue-500 to-purple-600 shadow-sm">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const conceptButtons = currentPageData
    ? currentPageData.keyConcepts.slice(0, 4)
    : lesson.keyConcepts.slice(0, 4);

  return (
    <>
      {/* Chat header */}
      <div className="border-b px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0" aria-hidden="true">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.187 3.187 0 01-.758.515m0 0a3.188 3.188 0 01-2.544 0m3.302-.515a3.187 3.187 0 00.758-.515" /></svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">AI Tutor</h3>
          <p className="text-xs text-gray-400 truncate">
            {currentPageData ? `Page ${pageNumber}: ${currentPageData.title}` : 'Ask me anything about this lesson'}
          </p>
        </div>
        {language === 'ka' && (
          <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-[11px] font-medium text-purple-700 ring-1 ring-inset ring-purple-300">
            &#x10E5;&#x10D0;&#x10E0;
          </span>
        )}
        {currentPageData && onUnlockCheck && (
          <div className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
            unlockFiredRef.current
              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-200'
              : 'bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200'
          }`}>
            {unlockFiredRef.current ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                Quiz Ready
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Teaching...
              </>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" role="log" aria-label="Chat messages" aria-live="polite">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">
                Welcome! I&apos;m your AI tutor.
              </p>
              <p className="text-xs text-blue-600">
                I&apos;m here to help you understand{' '}
                {currentPageData ? `"${currentPageData.title}"` : `"${lesson.title}"`}
                . Ask me anything, or try one of the suggestions below!
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-400 uppercase">
                Suggested questions
              </p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="block w-full rounded-lg border border-gray-200 p-2 text-left text-xs text-gray-600 hover:bg-gray-50 hover:border-blue-300 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white px-4 py-2.5 msg-tail-right'
                  : 'bg-gray-100 text-gray-800 px-4 py-3 msg-tail-left'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="chat-prose max-w-none text-[0.8125rem]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {getDisplayContent(msg) || '...'}
                  </ReactMarkdown>
                  {isStreaming &&
                    msg.id === messages[messages.length - 1]?.id &&
                    !msg.content && (
                      <div className="flex gap-1 py-1" aria-label="Typing">
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                        <span className="typing-dot" />
                      </div>
                    )}
                </div>
              ) : (
                <p className="leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isTranslatingChat && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-purple-600" role="status">
            <div className="w-3 h-3 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" aria-hidden="true" />
            &#x10D8;&#x10D7;&#x10D0;&#x10E0;&#x10D2;&#x10DB;&#x10DC;&#x10D4;&#x10D1;&#x10D0;...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick concept buttons */}
      {messages.length > 0 && conceptButtons.length > 0 && (
        <div className="border-t px-3 py-2">
          <p className="text-xs text-gray-400 mb-1">Ask about a concept:</p>
          <div className="flex flex-wrap gap-1">
            {conceptButtons.map((c, i) => (
              <button
                key={i}
                onClick={() => sendMessage(`Can you explain "${c.term}" in more detail?`)}
                disabled={isStreaming}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-blue-100 hover:text-blue-700 transition disabled:opacity-50"
              >
                {c.term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3 bg-gray-50/50">
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
            placeholder={language === 'ka' ? 'დასვით შეკითხვა...' : 'Ask a question...'}
            disabled={isStreaming}
            aria-label={language === 'ka' ? 'შეკითხვის ველი' : 'Chat message input'}
            className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 placeholder:text-gray-400 transition"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            className="shrink-0 w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9-7-9-7-9 7 9 7z" transform="rotate(-45 12 12)" /></svg>
          </button>
        </form>
      </div>
    </>
  );
}

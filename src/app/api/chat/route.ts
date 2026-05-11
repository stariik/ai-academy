// ============================================================
// Streaming Chat API Route - Student AI Tutor
// POST /api/chat
// Supports both full-lesson and page-scoped chat
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getLesson,
  getChatHistory,
  upsertChatHistory,
  getPageChatHistory,
  upsertPageChatHistory,
  getOrCreateProfile,
} from '@/lib/supabase/db';
import {
  buildTutorSystemPrompt,
  buildEnhancedTutorPrompt,
  buildPageTutorPrompt,
  buildEnhancedPageTutorPrompt,
  streamChat,
  ThinkingConfig,
} from '@/lib/ai/claude';
import { getSessionId } from '@/lib/session';
import { ChatMessage } from '@/types';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, lessonId, pageNumber, isFirstVisit } = body as {
      messages: ChatMessage[];
      lessonId: string;
      pageNumber?: number;
      isFirstVisit?: boolean;
    };

    if (!messages || !lessonId) {
      return NextResponse.json(
        { error: 'Missing required fields: messages, lessonId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const lesson = await getLesson(supabase, lessonId);
    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    let systemPrompt: string;
    const sessionId = await getSessionId();

    // ---- Page-scoped chat mode ----
    if (pageNumber !== undefined && lesson.pages && lesson.pages.length > 0) {
      const page = lesson.pages.find((p) => p.pageNumber === pageNumber);
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }

      // Build page content string
      const pageContent = page.contentBlocks
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          if (block.type === 'heading') return `## ${block.content}`;
          if (block.type === 'code') return `\`\`\`\n${block.content}\n\`\`\``;
          if (block.type === 'callout') return `> ${block.content}`;
          return block.content;
        })
        .join('\n\n');

      const previousPageTitles = lesson.pages
        .filter((p) => p.pageNumber < pageNumber)
        .sort((a, b) => a.pageNumber - b.pageNumber)
        .map((p) => p.title);

      // Pedagogical enrichment — now threaded into the tutor so it
      // actively uses misconceptions, real-world examples, bridges, and
      // reflection prompts instead of leaving them as UI-only decoration.
      const pageExtras = {
        commonMisconceptions: page.commonMisconceptions,
        realWorldApplications: page.realWorldApplications,
        bridgeFromPrevious: page.bridgeFromPrevious,
        reflectionPrompt: page.teachingFlow?.reflectionPrompt,
      };

      if (sessionId) {
        try {
          const [profile, chatHistory] = await Promise.all([
            getOrCreateProfile(supabase, sessionId),
            getPageChatHistory(supabase, sessionId, lessonId, pageNumber),
          ]);

          systemPrompt = buildEnhancedPageTutorPrompt({
            lessonTitle: lesson.title,
            pageTitle: page.title,
            pageNumber,
            totalPages: lesson.totalPages ?? lesson.pages.length,
            pageContent,
            pageKeyConcepts: page.keyConcepts,
            previousPageTitles,
            learningObjectives: lesson.learningObjectives,
            isFirstVisit: isFirstVisit ?? false,
            profile,
            previousMessageCount: chatHistory?.messages?.length ?? 0,
            ...pageExtras,
          });
        } catch {
          systemPrompt = buildPageTutorPrompt({
            lessonTitle: lesson.title,
            pageTitle: page.title,
            pageNumber,
            totalPages: lesson.totalPages ?? lesson.pages.length,
            pageContent,
            pageKeyConcepts: page.keyConcepts,
            previousPageTitles,
            learningObjectives: lesson.learningObjectives,
            isFirstVisit: isFirstVisit ?? false,
            ...pageExtras,
          });
        }
      } else {
        systemPrompt = buildPageTutorPrompt({
          lessonTitle: lesson.title,
          pageTitle: page.title,
          pageNumber,
          totalPages: lesson.totalPages ?? lesson.pages.length,
          pageContent,
          pageKeyConcepts: page.keyConcepts,
          previousPageTitles,
          learningObjectives: lesson.learningObjectives,
          isFirstVisit: isFirstVisit ?? false,
          ...pageExtras,
        });
      }
    } else {
      // ---- Legacy full-lesson chat mode ----
      const lessonContent = lesson.contentBlocks
        .sort((a, b) => a.order - b.order)
        .map((block) => {
          if (block.type === 'heading') return `## ${block.content}`;
          if (block.type === 'code') return `\`\`\`\n${block.content}\n\`\`\``;
          if (block.type === 'callout') return `> ${block.content}`;
          return block.content;
        })
        .join('\n\n');

      if (sessionId) {
        try {
          const [profile, chatHistory] = await Promise.all([
            getOrCreateProfile(supabase, sessionId),
            getChatHistory(supabase, sessionId, lessonId),
          ]);

          systemPrompt = buildEnhancedTutorPrompt({
            lessonTitle: lesson.title,
            lessonContent,
            learningObjectives: lesson.learningObjectives,
            keyConcepts: lesson.keyConcepts,
            profile,
            previousMessageCount: chatHistory?.messages?.length ?? 0,
          });
        } catch {
          systemPrompt = buildTutorSystemPrompt({
            lessonTitle: lesson.title,
            lessonContent,
            learningObjectives: lesson.learningObjectives,
            keyConcepts: lesson.keyConcepts,
          });
        }
      } else {
        systemPrompt = buildTutorSystemPrompt({
          lessonTitle: lesson.title,
          lessonContent,
          learningObjectives: lesson.learningObjectives,
          keyConcepts: lesson.keyConcepts,
        });
      }
    }

    // Convert ChatMessage[] to Claude format
    const claudeMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    if (claudeMessages.length === 0) {
      return NextResponse.json(
        { error: 'No user or assistant messages provided' },
        { status: 400 }
      );
    }

    // Build thinking config from environment variable
    const thinkingConfig: ThinkingConfig = {
      enabled: process.env.ENABLE_EXTENDED_THINKING === 'true',
      budgetTokens: 4096,
    };

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChat(claudeMessages, systemPrompt, thinkingConfig)) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();

          // Save chat history after stream completes
          if (sessionId) {
            try {
              const allMessages = [
                ...messages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  timestamp: m.timestamp,
                })),
                {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: fullResponse,
                  timestamp: new Date().toISOString(),
                },
              ];

              if (pageNumber !== undefined) {
                await upsertPageChatHistory(supabase, sessionId, lessonId, pageNumber, allMessages);
              } else {
                await upsertChatHistory(supabase, sessionId, lessonId, allMessages);
              }
            } catch (err) {
              console.error('Failed to save chat history:', err);
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          const errorMsg = err instanceof Error ? err.message : 'Unknown streaming error';
          controller.enqueue(encoder.encode(`\n\n[Error: ${errorMsg}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat API error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

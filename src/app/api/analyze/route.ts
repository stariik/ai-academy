// ============================================================
// API Route: POST /api/analyze
// Accepts file upload, extracts text, analyzes with Gemini,
// saves lesson to Supabase, and returns the generated lesson.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/document-parser';
import { analyzeDocument } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { saveLesson, getLesson } from '@/lib/supabase/db';
import type { Lesson, ContentBlock, QuizQuestion, LessonPage, AnalysisResult } from '@/types';

export const maxDuration = 60; // Allow up to 60s for AI processing

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ---- 1. Parse the FormData ----
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetLevel = (formData.get('targetLevel') as string) || 'intermediate';
    const courseId = formData.get('courseId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload a PDF or DOCX file.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Please upload a PDF or DOCX file.`,
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File is too large. Maximum file size is 10MB.' },
        { status: 400 }
      );
    }

    console.log(`[Analyze] Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);

    // ---- 2. Extract text from the document ----
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText: string;
    let wordCount: number;

    try {
      const extraction = await extractText(buffer, file.type);
      extractedText = extraction.text;
      wordCount = extraction.wordCount;
      console.log(
        `[Analyze] Extracted ${wordCount} words from document (${extraction.pageCount ?? 'N/A'} pages)`
      );
    } catch (extractionError) {
      console.error('[Analyze] Text extraction failed:', extractionError);
      return NextResponse.json(
        {
          error: 'Failed to extract text from the document. The file may be corrupted or password-protected.',
        },
        { status: 422 }
      );
    }

    if (wordCount < 20) {
      return NextResponse.json(
        {
          error: 'The document contains too little text to generate a meaningful lesson. Please upload a document with more content.',
        },
        { status: 422 }
      );
    }

    // ---- 3. Analyze with Gemini AI ----
    console.log(`[Analyze] Sending to Gemini AI for analysis (target level: ${targetLevel})...`);

    let geminiResponse;
    try {
      geminiResponse = await analyzeDocument(extractedText, { targetLevel });
    } catch (aiError) {
      console.error('[Analyze] Gemini analysis failed:', aiError);
      const errorMessage =
        aiError instanceof Error ? aiError.message : 'AI analysis failed';

      if (errorMessage.includes('GEMINI_API_KEY')) {
        return NextResponse.json({ error: errorMessage }, { status: 500 });
      }

      return NextResponse.json(
        {
          error: `AI analysis failed: ${errorMessage}. Please try again.`,
        },
        { status: 502 }
      );
    }

    // ---- 4. Transform paged Gemini response into a Lesson object ----
    const lessonId = generateId();

    // Build pages with their content blocks and check questions
    const pages: LessonPage[] = geminiResponse.pages.map((page) => {
      const pageId = `${lessonId}-page-${page.page_number}`;

      const pageBlocks: ContentBlock[] = page.content_blocks.map((block, idx) => ({
        id: `${pageId}-cb-${idx}`,
        type: normalizeBlockType(block.type),
        content: block.content,
        metadata: block.metadata,
        order: idx,
        pageId,
      }));

      const checkQuestions: QuizQuestion[] = page.check_questions.map((q, idx) => ({
        id: `${pageId}-cq-${idx}`,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        points: q.points || 5,
        pageId,
        scope: 'check' as const,
      }));

      return {
        id: pageId,
        lessonId,
        pageNumber: page.page_number,
        title: page.title,
        keyConcepts: page.key_concepts,
        contentBlocks: pageBlocks,
        checkQuestions,
      };
    });

    // Build final quiz questions
    const quizQuestions: QuizQuestion[] = geminiResponse.final_quiz_questions.map(
      (q, index) => ({
        id: `${lessonId}-fq-${index}`,
        type: q.type,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct_answer,
        explanation: q.explanation,
        difficulty: q.difficulty,
        points: q.points || 10,
        scope: 'final' as const,
      })
    );

    // Aggregate all key concepts from pages for the lesson level
    const allKeyConcepts = pages.flatMap((p) => p.keyConcepts);

    const lesson: Lesson = {
      id: lessonId,
      title: geminiResponse.title,
      description: geminiResponse.description,
      learningObjectives: geminiResponse.learning_objectives,
      contentBlocks: [],
      keyConcepts: allKeyConcepts,
      summary: geminiResponse.summary,
      quizQuestions,
      sourceDocument: file.name,
      difficulty: geminiResponse.difficulty,
      estimatedDurationMinutes: geminiResponse.estimated_duration_minutes,
      createdAt: new Date().toISOString(),
      status: 'draft',
      tags: [],
      courseId: courseId ?? undefined,
      pages,
      totalPages: pages.length,
    };

    // ---- 5. Save lesson to Supabase ----
    const supabase = await createClient();
    await saveLesson(supabase, lesson);

    // Verify it was saved
    const savedLesson = await getLesson(supabase, lessonId);
    if (!savedLesson) {
      console.error('[Analyze] Failed to save lesson to Supabase');
      return NextResponse.json(
        { error: 'Failed to save the generated lesson. Please try again.' },
        { status: 500 }
      );
    }

    // ---- 6. Return the result ----
    const processingTimeMs = Date.now() - startTime;
    console.log(`[Analyze] Lesson generated successfully in ${processingTimeMs}ms`);

    const result: AnalysisResult = {
      lesson,
      processingTimeMs,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const processingTimeMs = Date.now() - startTime;
    console.error(`[Analyze] Unexpected error after ${processingTimeMs}ms:`, error);

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while processing your document. Please try again.',
      },
      { status: 500 }
    );
  }
}

// ---- Helper Functions ----

function generateId(): string {
  return `lesson_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeBlockType(
  type: string
): 'heading' | 'text' | 'key_concepts' | 'code' | 'callout' | 'summary' {
  const typeMap: Record<string, ContentBlock['type']> = {
    heading: 'heading',
    text: 'text',
    key_concepts: 'key_concepts',
    code: 'code',
    callout: 'callout',
    summary: 'summary',
    paragraph: 'text',
    note: 'callout',
    tip: 'callout',
    warning: 'callout',
    important: 'callout',
    definition: 'key_concepts',
    concepts: 'key_concepts',
    overview: 'summary',
  };

  return typeMap[type.toLowerCase()] || 'text';
}

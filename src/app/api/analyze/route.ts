// ============================================================
// API Route: POST /api/analyze
// Accepts file upload, extracts text, analyzes with Gemini,
// saves lesson to Supabase, and returns the generated lesson.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/document-parser';
import { analyzeDocument } from '@/lib/ai/gemini';
import { createClient } from '@/lib/supabase/server';
import { saveLesson, getLesson, createCourse } from '@/lib/supabase/db';
import { buildLessonFromGeminiResponse } from '@/lib/lesson-builder';
import type { AnalysisResult } from '@/types';

export const maxDuration = 300; // Allow up to 5 min for large document chunked generation

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // ---- 1. Parse the FormData ----
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const targetLevel = (formData.get('targetLevel') as string) || 'intermediate';
    let courseId = formData.get('courseId') as string | null;
    const newCourseName = formData.get('newCourseName') as string | null;

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

    // ---- 4. Transform Gemini response into Lesson + save ----
    const lesson = buildLessonFromGeminiResponse(
      geminiResponse,
      file.name,
      courseId ?? undefined,
    );

    // ---- 5. Save lesson to Supabase ----
    const supabase = await createClient();

    // Auto-create course if a new course name was provided
    if (!courseId && newCourseName?.trim()) {
      const newCourse = await createCourse(supabase, {
        title: newCourseName.trim(),
        description: '',
        tags: [],
      });
      courseId = newCourse.id;
      lesson.courseId = newCourse.id;
    }

    await saveLesson(supabase, lesson);

    // Verify it was saved
    const savedLesson = await getLesson(supabase, lesson.id);
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


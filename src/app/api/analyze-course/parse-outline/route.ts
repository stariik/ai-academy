// ============================================================
// API Route: POST /api/analyze-course/parse-outline
// Parses a PDF outline to extract lesson titles + key points.
// Expected format:
//   Lesson 1: Title
//   - Key point 1
//   - Key point 2
//   ...
//   Lesson 2: Title
//   ...
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/document-parser';

export const maxDuration = 60;

export interface ParsedLesson {
  id: string;
  title: string;
  keyPoints: string[];
}

/**
 * Parse extracted text into lessons with key points.
 * Supports multiple formats:
 *   - "Lesson N: Title" or "Lesson N. Title" or "Lesson N - Title"
 *   - Numbered: "1. Title" or "1) Title"
 *   - Markdown headings: "# Title" or "## Title"
 * Key points are lines starting with -, *, or indented bullets.
 */
function parseOutlineText(text: string): ParsedLesson[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const lessons: ParsedLesson[] = [];

  // Patterns that indicate a new lesson title
  const lessonTitlePatterns = [
    /^lesson\s+\d+\s*[:.\-–—]\s*(.+)/i,
    /^module\s+\d+\s*[:.\-–—]\s*(.+)/i,
    /^chapter\s+\d+\s*[:.\-–—]\s*(.+)/i,
    /^#{1,3}\s+(.+)/,
    /^\d+\s*[.)]\s+([A-Z].{3,})/,
    /^\d+\s*[:.\-–—]\s+([A-Z].{3,})/,
  ];

  // Patterns that indicate a key point
  const keyPointPattern = /^[-*•]\s+(.+)/;
  const numberedKeyPointPattern = /^\d+\.\d+[.)]\s+(.+)/; // e.g. "1.1) Key point"

  let currentLesson: ParsedLesson | null = null;

  for (const line of lines) {
    // Check if this line is a lesson title
    let isTitle = false;
    for (const pattern of lessonTitlePatterns) {
      const match = line.match(pattern);
      if (match) {
        // Save previous lesson
        if (currentLesson && currentLesson.keyPoints.length > 0) {
          lessons.push(currentLesson);
        }
        currentLesson = {
          id: `outline-${lessons.length + 1}`,
          title: match[1].trim().replace(/[*_#]/g, ''),
          keyPoints: [],
        };
        isTitle = true;
        break;
      }
    }

    if (isTitle) continue;

    // Check if this line is a key point
    if (currentLesson) {
      const kpMatch = line.match(keyPointPattern) || line.match(numberedKeyPointPattern);
      if (kpMatch) {
        currentLesson.keyPoints.push(kpMatch[1].trim());
      } else if (line.length > 10 && !line.match(/^\d+\s*[.)]/)) {
        // Non-bullet line under a lesson — treat as a key point if it's descriptive
        currentLesson.keyPoints.push(line);
      }
    }
  }

  // Push the last lesson
  if (currentLesson && currentLesson.keyPoints.length > 0) {
    lessons.push(currentLesson);
  }

  return lessons;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extraction = await extractText(buffer, file.type);

    if (!extraction.text || extraction.text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Could not extract enough text from the file. Make sure it contains lesson outlines.' },
        { status: 400 }
      );
    }

    const lessons = parseOutlineText(extraction.text);

    if (lessons.length === 0) {
      return NextResponse.json(
        {
          error: 'Could not detect any lessons in the file. Expected format:\n\nLesson 1: Title\n- Key point 1\n- Key point 2\n\nLesson 2: Title\n- Key point 1\n...',
          rawText: extraction.text.substring(0, 2000),
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      lessons,
      totalLessons: lessons.length,
      rawText: extraction.text,
    });
  } catch (err) {
    console.error('[ParseOutline] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to parse outline';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ============================================================
// API Route: POST /api/analyze-outline
// Extracts text from a PDF and detects sections/chapters.
// Returns the outline for admin preview before course generation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/document-parser';
import { extractDocumentOutline } from '@/lib/ai/gemini';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 25MB.' }, { status: 400 });
    }

    // Extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extraction = await extractText(buffer, file.type);

    if (extraction.wordCount < 50) {
      return NextResponse.json({ error: 'Document has too little text.' }, { status: 422 });
    }

    // Detect sections
    const outline = await extractDocumentOutline(extraction.text);

    // Build section previews
    const sections = outline.sections.map((section, i) => {
      const text = extraction.text.substring(section.startIndex, section.endIndex);
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      // First 200 non-empty chars as preview
      const preview = text.trim().substring(0, 200).replace(/\n+/g, ' ').trim();

      return {
        id: `section-${i}`,
        title: section.title || `Section ${i + 1}`,
        startIndex: section.startIndex,
        endIndex: section.endIndex,
        wordCount,
        preview: preview + (text.length > 200 ? '...' : ''),
      };
    });

    return NextResponse.json({
      fileName: file.name,
      totalWords: extraction.wordCount,
      pageCount: extraction.pageCount,
      sections,
      extractedText: extraction.text,
    });
  } catch (err) {
    console.error('[AnalyzeOutline] Error:', err);
    const message = err instanceof Error ? err.message : 'Failed to analyze document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

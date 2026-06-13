// ============================================================
// API Route: POST /api/analyze-outline
// Extracts text from a PDF and detects sections/chapters.
// Returns the outline for admin preview before course generation.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractText } from '@/lib/document-parser';
import { extractDocumentOutline, type LLMProvider } from '@/lib/ai/gemini';
import { isAdmin } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const providerRaw = (formData.get('provider') as string | null) ?? 'gemini';
    const provider: LLMProvider = providerRaw === 'claude' ? 'claude' : 'gemini';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Browsers report .md files inconsistently — common values include
    // '', 'text/plain', 'text/markdown', and 'application/octet-stream'.
    // Normalize by extension so valid Markdown uploads aren't rejected.
    const lowerName = file.name.toLowerCase();
    const isMarkdownExt = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');
    const markdownLikeMime =
      file.type === '' ||
      file.type === 'text/plain' ||
      file.type === 'text/markdown' ||
      file.type === 'text/x-markdown' ||
      file.type === 'application/octet-stream';
    const effectiveType = isMarkdownExt && markdownLikeMime ? 'text/markdown' : file.type;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/markdown',
    ];
    if (!allowedTypes.includes(effectiveType)) {
      return NextResponse.json({ error: `Unsupported file type: ${file.type || 'unknown'}` }, { status: 400 });
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 25MB.' }, { status: 400 });
    }

    // Extract text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extraction = await extractText(buffer, effectiveType);

    if (extraction.wordCount < 50) {
      return NextResponse.json({ error: 'Document has too little text.' }, { status: 422 });
    }

    // Detect sections
    const outline = await extractDocumentOutline(extraction.text, provider);

    // Filter out course metadata sections so they don't get turned into
    // bogus "lessons". The creator's course template emits fixed section
    // headings for the course-level metadata — those aren't teachable
    // content, they're frontmatter/backmatter. Keep only headings that
    // look like real lessons (numbered "გაკვეთილი NN", "Lesson NN",
    // "Chapter NN", or similar).
    const METADATA_TITLES = [
      'კურსის შესახებ',
      'ვისთვისაა კურსი',
      'ვისთვისაა',
      'კურსში გამოყენებული',
      'გამოყენებული ai ინსტრუმენტები',
      'რას ისწავლი კურსის ბოლოს',
      'რას ისწავლი',
      'about',
      'about this course',
      'who is this for',
      'who it\'s for',
      'who this course is for',
      'tools used',
      'ai tools used',
      'what you\'ll learn',
      'what you will learn',
      'learning outcomes',
    ];
    const LESSON_HEADING_RE = /\b(გაკვეთილი|lesson|chapter|module|unit)\s*\d+/i;

    function isLessonHeading(title: string): boolean {
      const normalized = title.trim().toLowerCase();
      if (METADATA_TITLES.some((md) => normalized.includes(md))) return false;
      // If any heading in the doc looks like "Lesson 01" / "გაკვეთილი 01",
      // assume the creator is using that convention and be strict. This
      // drops decorative intros and wrap-ups.
      return LESSON_HEADING_RE.test(title);
    }

    const anyLessonHeading = outline.sections.some((s) => LESSON_HEADING_RE.test(s.title));
    const filteredOutline = anyLessonHeading
      ? outline.sections.filter((s) => isLessonHeading(s.title))
      // Fallback: if no section looks like a "Lesson NN" heading, keep
      // everything — the document isn't using the AI Academy template
      // and we shouldn't drop content that might be teachable.
      : outline.sections.filter((s) => {
          const normalized = s.title.trim().toLowerCase();
          return !METADATA_TITLES.some((md) => normalized.includes(md));
        });

    if (filteredOutline.length !== outline.sections.length) {
      console.log(
        `[AnalyzeOutline] Filtered ${outline.sections.length - filteredOutline.length} metadata section(s); ` +
          `kept ${filteredOutline.length}`
      );
    }

    // Build section previews
    const sections = filteredOutline.map((section, i) => {
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

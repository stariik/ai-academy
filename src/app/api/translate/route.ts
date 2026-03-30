// ============================================================
// Translation API Route
// POST /api/translate
// Translates text or batch of texts using Google Translate
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch } from '@/lib/google-translate';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLang, sourceLang } = body as {
      text?: string;
      texts?: string[];
      targetLang: string;
      sourceLang?: string;
    };

    if (!targetLang) {
      return NextResponse.json(
        { error: 'Missing required field: targetLang' },
        { status: 400 }
      );
    }

    // Batch mode
    if (texts && Array.isArray(texts)) {
      const translated = await translateBatch(texts, targetLang, sourceLang);
      return NextResponse.json({ translations: translated });
    }

    // Single text mode
    if (text) {
      const translated = await translateText(text, targetLang, sourceLang);
      return NextResponse.json({ translation: translated });
    }

    return NextResponse.json(
      { error: 'Missing required field: text or texts' },
      { status: 400 }
    );
  } catch (err) {
    console.error('Translation API error:', err);
    const message = err instanceof Error ? err.message : 'Translation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

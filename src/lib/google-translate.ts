// ============================================================
// Google Translate API Client
// Translates text between languages using Google Cloud Translation API v2
// ============================================================

import { logAiUsage, translateCharsCostUsd } from '@/lib/ai/usage';

const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2';
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

/** Record translated character volume ($20/M chars) in the AI usage log. */
function logTranslateUsage(chars: number, targetLang: string): void {
  void logAiUsage({
    feature: 'ui_translation',
    provider: 'google-translate',
    model: 'translate-v2',
    costUsd: translateCharsCostUsd(chars),
    metadata: { chars, targetLang },
  });
}

export type TranslateResult = {
  translatedText: string;
  detectedSourceLanguage?: string;
};

/**
 * Translate a single string.
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  if (!API_KEY) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');
  if (!text.trim()) return text;

  const body: Record<string, string | string[]> = {
    q: text,
    target: targetLang,
    format: 'text',
  };
  if (sourceLang) body.source = sourceLang;

  const res = await fetch(`${GOOGLE_TRANSLATE_API}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Translate API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  logTranslateUsage(text.length, targetLang);
  return data.data.translations[0].translatedText;
}

/**
 * Translate multiple strings in a single API call (batch).
 * Google Translate v2 accepts an array of `q` values.
 */
export async function translateBatch(
  texts: string[],
  targetLang: string,
  sourceLang?: string
): Promise<string[]> {
  if (!API_KEY) throw new Error('GOOGLE_TRANSLATE_API_KEY is not set');

  // Filter out empty strings but track their positions
  const nonEmpty: { index: number; text: string }[] = [];
  texts.forEach((t, i) => {
    if (t.trim()) nonEmpty.push({ index: i, text: t });
  });

  if (nonEmpty.length === 0) return texts;

  const body: Record<string, string | string[]> = {
    q: nonEmpty.map((n) => n.text),
    target: targetLang,
    format: 'text',
  };
  if (sourceLang) body.source = sourceLang;

  const res = await fetch(`${GOOGLE_TRANSLATE_API}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Translate API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  logTranslateUsage(nonEmpty.reduce((sum, n) => sum + n.text.length, 0), targetLang);
  const translations: { translatedText: string }[] = data.data.translations;

  // Reconstruct full array with translated texts in correct positions
  const result = [...texts];
  nonEmpty.forEach((n, i) => {
    result[n.index] = translations[i].translatedText;
  });

  return result;
}

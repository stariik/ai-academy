// ============================================================
// Google Translate API Client
// Translates text between languages using Google Cloud Translation API v2
// ============================================================

const GOOGLE_TRANSLATE_API = 'https://translation.googleapis.com/language/translate/v2';
const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

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
  const translations: { translatedText: string }[] = data.data.translations;

  // Reconstruct full array with translated texts in correct positions
  const result = [...texts];
  nonEmpty.forEach((n, i) => {
    result[n.index] = translations[i].translatedText;
  });

  return result;
}

// ============================================================
// Gemini AI Client - Document Analysis for Lesson Generation
// Uses gemini-2.0-flash for fast structured output
// ============================================================

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiPagedLessonResponse } from '@/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Determine target page range and output token budget based on document word count.
 */
function getPageRange(wordCount: number): { min: number; max: number; outputTokens: number } {
  if (wordCount < 2_000) {
    return { min: 3, max: 5, outputTokens: 16_384 };
  } else if (wordCount < 10_000) {
    return { min: 5, max: 10, outputTokens: 16_384 };
  } else if (wordCount < 50_000) {
    return { min: 8, max: 15, outputTokens: 32_768 };
  } else {
    return { min: 12, max: 25, outputTokens: 65_536 };
  }
}

const ANALYSIS_PROMPT = `You are an expert educational content creator and instructional designer. Your task is to analyze the following document and transform it into a structured, multi-page lesson that a student will learn page by page with an AI tutor.

IMPORTANT: Split the document into logical PAGES. Each page covers ONE coherent topic or subtopic that can be taught and assessed independently. A student will read one page at a time, discuss it with an AI tutor, answer check questions, then move to the next page.

TARGET LEVEL: {targetLevel}

This document contains approximately {wordCount} words.

INSTRUCTIONS:
- Split the content into {minPages}-{maxPages} pages. Each page should take approximately 3-8 minutes to read.
- Cover ALL major topics and sections from the document. Do not skip or summarize away important content.
- Each page should contain substantial teaching material, not just surface-level summaries.
- The first page should introduce the topic and set context.
- Each page covers one coherent subtopic - do NOT mix unrelated ideas on a single page.
- Each page gets its own content_blocks, key_concepts, and 1-2 check_questions.
- Check questions MUST be mcq or true_false only (quick verification, not deep assessment).
- Check questions test understanding of THAT page's content only.
- The final_quiz_questions are a comprehensive assessment of the ENTIRE lesson (5-8 questions, all types allowed).
- All content must be accurate to the source document - do NOT invent facts.
- Use markdown formatting within content block text where helpful.

You MUST respond with a valid JSON object matching this exact structure:
{
  "title": "A clear, engaging title for the lesson",
  "description": "A 2-3 sentence description of what the lesson covers",
  "learning_objectives": [
    "Students will be able to [verb] [specific skill/knowledge]",
    "Students will understand [concept]"
  ],
  "pages": [
    {
      "page_number": 1,
      "title": "Clear topic name for this page",
      "content_blocks": [
        {"type": "heading", "content": "Section Title"},
        {"type": "text", "content": "Detailed explanation paragraph..."},
        {"type": "key_concepts", "content": "Important concept explanation..."},
        {"type": "code", "content": "code example if relevant"},
        {"type": "callout", "content": "Important note or tip..."},
        {"type": "summary", "content": "Brief page summary..."}
      ],
      "key_concepts": [
        {"term": "Technical Term", "definition": "Clear definition"}
      ],
      "check_questions": [
        {
          "question": "Quick comprehension question about this page?",
          "type": "mcq",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A",
          "explanation": "Why this answer is correct",
          "difficulty": "easy",
          "points": 5
        }
      ]
    }
  ],
  "summary": "A comprehensive 3-5 sentence summary of the entire lesson",
  "final_quiz_questions": [
    {
      "question": "Comprehensive question covering the full lesson?",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Detailed explanation",
      "difficulty": "medium",
      "points": 10
    },
    {
      "question": "True or false: Statement?",
      "type": "true_false",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Explanation",
      "difficulty": "easy",
      "points": 5
    },
    {
      "question": "Open-ended question?",
      "type": "short_answer",
      "correct_answer": "Expected key points",
      "explanation": "Full explanation",
      "difficulty": "hard",
      "points": 15
    }
  ],
  "difficulty": "beginner | intermediate | advanced",
  "estimated_duration_minutes": 30
}

RULES:
- Generate {minPages}-{maxPages} pages with logical progression from basic to advanced concepts
- Each page MUST have 1-2 check questions (mcq or true_false only, with 4 options for mcq)
- Each page MUST have at least 2 content_blocks
- Each page MUST have at least 1 key_concept
- Generate 5-8 final_quiz_questions with a mix of mcq, true_false, and short_answer types
- For mcq: provide exactly 4 options with one correct answer
- For true_false: provide ["True", "False"] as options
- For short_answer: do NOT include an options array
- The difficulty field must be exactly one of: "beginner", "intermediate", or "advanced"
- estimated_duration_minutes should be realistic (typically 15-60)

DOCUMENT TO ANALYZE:
---
{documentText}
---

Respond ONLY with the JSON object. No additional text before or after.`;

/**
 * Analyze a document and generate a multi-page lesson using Gemini AI.
 */
export async function analyzeDocument(
  text: string,
  options: { targetLevel: string }
): Promise<GeminiPagedLessonResponse> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Please add it to .env.local'
    );
  }

  if (!text || text.trim().length < 50) {
    throw new Error(
      'Document text is too short to analyze. Please provide a document with more content.'
    );
  }

  // Truncate very long documents to stay within Gemini's context window
  const maxChars = 500_000;
  const truncatedText =
    text.length > maxChars
      ? text.substring(0, maxChars) + '\n\n[Document truncated for processing]'
      : text;

  // Scale pages and output tokens based on document size
  const wordCount = truncatedText.split(/\s+/).length;
  const { min: minPages, max: maxPages, outputTokens } = getPageRange(wordCount);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: outputTokens,
      responseMimeType: 'application/json',
    },
  });

  const prompt = ANALYSIS_PROMPT
    .replace('{targetLevel}', options.targetLevel)
    .replace('{documentText}', truncatedText)
    .replace(/\{wordCount\}/g, String(wordCount))
    .replace(/\{minPages\}/g, String(minPages))
    .replace(/\{maxPages\}/g, String(maxPages));

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Gemini] Attempt ${attempt}/${maxRetries} - Analyzing document (${truncatedText.length} chars)...`
      );

      const result = await model.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Gemini returned an empty response');
      }

      console.log(`[Gemini] Received response (${responseText.length} chars)`);

      // Parse the JSON response
      const parsed = parseGeminiResponse(responseText);

      // Validate the parsed response has required fields
      validateResponse(parsed);

      return parsed;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Gemini] Attempt ${attempt} failed:`, lastError.message);

      if (
        lastError.message.includes('429') ||
        lastError.message.includes('RATE_LIMIT') ||
        lastError.message.includes('Resource has been exhausted')
      ) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`[Gemini] Rate limited. Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
        continue;
      }

      if (attempt < maxRetries) {
        const waitTime = 1000 * attempt;
        console.log(`[Gemini] Retrying in ${waitTime}ms...`);
        await sleep(waitTime);
        continue;
      }
    }
  }

  throw new Error(
    `Failed to analyze document after ${maxRetries} attempts. Last error: ${lastError?.message}`
  );
}

function parseGeminiResponse(responseText: string): GeminiPagedLessonResponse {
  let cleanText = responseText.trim();

  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }

  cleanText = cleanText.trim();

  try {
    return JSON.parse(cleanText) as GeminiPagedLessonResponse;
  } catch (parseError) {
    console.error('[Gemini] JSON parse error. Raw response:', cleanText.substring(0, 500));
    throw new Error(
      `Failed to parse Gemini response as JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
    );
  }
}

function validateResponse(response: GeminiPagedLessonResponse): void {
  if (!response.title) throw new Error('Missing required field: title');
  if (!response.description) throw new Error('Missing required field: description');
  if (!Array.isArray(response.learning_objectives) || response.learning_objectives.length === 0) {
    throw new Error('Must include at least one learning objective');
  }
  if (!Array.isArray(response.pages) || response.pages.length < 2) {
    throw new Error('Must include at least 2 pages');
  }
  for (const page of response.pages) {
    if (!page.title) throw new Error(`Page ${page.page_number} missing title`);
    if (!Array.isArray(page.content_blocks) || page.content_blocks.length < 1) {
      throw new Error(`Page ${page.page_number} must have at least 1 content block`);
    }
    if (!Array.isArray(page.check_questions) || page.check_questions.length < 1) {
      throw new Error(`Page ${page.page_number} must have at least 1 check question`);
    }
  }
  if (!response.summary) throw new Error('Missing required field: summary');
  if (!Array.isArray(response.final_quiz_questions) || response.final_quiz_questions.length < 3) {
    throw new Error('Must include at least 3 final quiz questions');
  }
  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!validDifficulties.includes(response.difficulty)) {
    throw new Error(`Invalid difficulty: ${response.difficulty}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

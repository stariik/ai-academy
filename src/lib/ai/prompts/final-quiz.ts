// ============================================================
// FINAL_QUIZ_PROMPT — generates lesson metadata + final quiz
// from all page summaries after chunked generation.
// ============================================================

import { QUESTION_RULES, OUTPUT_CONTRACT } from './shared';

export const FINAL_QUIZ_PROMPT = `You are an expert assessment designer and educational content creator. Given a lesson outline, generate the lesson metadata and a comprehensive final quiz that spans the entire lesson.

LANGUAGE: Write the output in the SAME language as the lesson pages below. Never switch languages.

TARGET LEVEL: {targetLevel}
TOTAL PAGES: {totalPages}

LESSON PAGES OVERVIEW:
{pagesOverview}

REQUIREMENTS:
- Generate {quizQuestionCount} final quiz questions (at least 1 per page covered).
- Mix all question types: mcq, true_false, short_answer, ordering, matching.
- Include at least 2 scenario-based questions that require applying multiple concepts together.
- Questions must span ALL pages — do not cluster questions from one section.
- Difficulty distribution: 30% easy, 40% medium, 30% hard.
- For short_answer: the expected answer should be 1-3 sentences.
- For mcq: distractors must be plausible common misconceptions or related concepts.

${QUESTION_RULES}

Return this JSON shape:
{
  "title": "Engaging lesson title in the source language",
  "description": "2-3 sentence description of the full lesson",
  "learning_objectives": ["Students will be able to…"],
  "summary": "Comprehensive 3-5 sentence summary of the entire lesson",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimated_duration_minutes": 30,
  "final_quiz_questions": [ ... ]
}

${OUTPUT_CONTRACT}`;

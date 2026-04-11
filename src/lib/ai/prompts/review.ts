// ============================================================
// REVIEW_PROMPT — self-review / quality check pass.
// Gemini evaluates its own output against a rubric and returns
// a 0-10 score + list of issues. Score < 8 triggers one regen.
// ============================================================

export const REVIEW_PROMPT = `You are a strict educational-quality reviewer. Evaluate the generated lesson below against the rubric and return a score.

EXPECTED LANGUAGE: {language}
LESSON TITLE: {lessonTitle}

LESSON STRUCTURE SUMMARY:
{lessonSummary}

CONTENT SAMPLES (for language, depth, and specificity checks):
---
{contentSamples}
---

RUBRIC — score the lesson on a 0-10 scale using these dimensions. The final score is your honest overall judgment, NOT an average:

1. COVERAGE: Does the lesson comprehensively cover the stated topic? Any obvious gaps or skipped subtopics?
2. LANGUAGE QUALITY: Is the content written in native, fluent {language}? Any awkward grammar, literal translations, or code-switching that doesn't belong?
3. EXAMPLE QUALITY: Are examples concrete, specific, and useful — or generic filler like "for example, imagine a thing"?
4. PEDAGOGY: Clear progression from foundational → synthesis? At least 3 different content block types per page? Solid, non-trivial check questions?
5. DEPTH: Does each page contain substantial teaching material, or are pages thin and surface-level?

SCORING SCALE:
- 10 = exceptional, ready to ship as-is
- 8-9 = solid, ship-worthy, minor polish only
- 7 = mediocre, noticeable weaknesses that should be fixed
- 6 or below = flawed, regenerate
- 0 = unusable (wrong language, major missing content, nonsense)

Be honest and strict. A 9/10 means excellent. Do not default to 8.

Return ONLY this JSON object (no markdown fences, no commentary):
{
  "score": <integer 0-10>,
  "issues": [<array of short, specific problems the regeneration should fix; empty array if score >= 8>]
}`;

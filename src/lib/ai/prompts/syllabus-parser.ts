// ============================================================
// SYLLABUS_PARSER_PROMPT — Stage 0 of the syllabus pipeline.
// Extracts the course structure from a syllabus PDF's raw text.
// Works on Georgian, English, and other languages.
//
// The parser is Gemini-based (not regex) so it handles layout
// variations across different courses without brittleness.
// ============================================================

export const SYLLABUS_PARSER_PROMPT = `You are a syllabus structure extractor. The document below is a course syllabus — a table of contents with module and lesson titles, but NO teaching material. Your job is to extract the full course structure as JSON.

RECOGNIZE THESE COMMON MARKERS (may appear in any language — Georgian examples in parentheses):
- Course title — usually the largest / most prominent text
- Course subtitle — secondary line under the title
- Course description — short paragraph about what the course teaches (e.g. labeled "About", "კურსის შესახებ")
- Target audience — list of who the course is for (e.g. "Who it's for", "ვისთვისაა კურსი")
- Duration + lesson count — metadata (e.g. "6 weeks / 20 lessons", "6 კვირა / 20 გაკვეთილი")
- Modules — top-level groupings, often numbered (01, 02, ...) and often paired with a week label ("Week 1", "კვირა 1")
- Lessons — entries within modules, numbered (e.g. "Lesson 1", "გაკვეთილი 1")
- Module outcomes — the skill/result a student gains after finishing the module (labels: "Result", "Outcome", "შედეგი", "By the end of this module")
- Final outcomes — skills listed at the very end of the syllabus (labels: "What you'll learn", "რას ისწავლი")
- Tools used — software/framework list (labels: "Tools", "AI ინსტრუმენტები")

EXTRACTION RULES:
- PRESERVE THE ORIGINAL LANGUAGE. Do not translate titles, descriptions, or outcomes. If the syllabus is in Georgian, everything you extract must remain in Georgian.
- Number modules and lessons sequentially starting at 1, following the order they appear in the syllabus.
- If a lesson title contains a dash, en-dash, or em-dash ("—", "–", "-") splitting it into two halves, the first half is the main title and the second half is the subtitle hint. Example: "ChatGPT vs Claude vs Gemini — რომელი გამოვიყენო?" → title: "ChatGPT vs Claude vs Gemini", subtitle: "რომელი გამოვიყენო?".
- Module outcomes are the SINGLE MOST IMPORTANT field for downstream generation. Capture them verbatim. If a module has no explicit outcome, infer a one-sentence outcome from the lesson titles in that module.
- "language" field: detect from the dominant script/language of the content. Use "Georgian", "English", "Russian", etc.
- If any field is completely absent from the syllabus, return an empty string or empty array — never invent content.

DOCUMENT TO PARSE:
---
{documentText}
---

Return ONLY this JSON shape. No markdown fences, no commentary:

{
  "courseTitle": "Main course title in source language",
  "courseSubtitle": "Subtitle if present, else empty string",
  "courseDescription": "Short paragraph describing the course",
  "language": "Georgian | English | ...",
  "audience": ["Audience segment 1", "Audience segment 2"],
  "durationLabel": "e.g. '6 weeks' or '6 კვირა' (empty string if absent)",
  "totalLessonsLabel": "e.g. '20 lessons' or '20 გაკვეთილი' (empty string if absent)",
  "modules": [
    {
      "number": 1,
      "title": "Module title in source language",
      "weekNumber": 1,
      "outcome": "What the student can do after this module — verbatim from source, or inferred if absent",
      "lessons": [
        { "number": 1, "title": "Lesson title", "subtitle": "Subtitle hint if present, else empty string" }
      ]
    }
  ],
  "finalOutcomes": ["Skill 1 from 'What you'll learn' section", "Skill 2", "..."],
  "toolsUsed": [
    { "category": "content | visual | analysis | video | automation | ...", "tools": ["ChatGPT", "Claude"] }
  ]
}`;

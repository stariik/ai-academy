// ============================================================
// Shared rules used by all Gemini generation prompts.
// Keep in sync with src/lib/ai/gemini-schema.ts
// ============================================================

export const CONTENT_BLOCK_TYPES = `CONTENT BLOCK TYPES — Use a VARIETY (at least 3 different types per page):
- "heading": Page or section titles
- "text": Explanatory paragraphs (markdown supported)
- "definition": Formal term definitions. Set metadata.term
- "example": Worked examples. Set metadata.title
- "analogy": Relatable comparisons for abstract concepts
- "code": Code snippets or commands
- "table": Structured data. Set metadata.headers (string[]) and metadata.rows (string[][])
- "list": Ordered or unordered lists. Set metadata.ordered (boolean). Put items in metadata.items (string[]) AND include them in content as a markdown list.
- "step_by_step": Procedures. Put steps in metadata.steps (string[]) AND a short intro sentence in content.
- "tip": Best practices
- "warning": Common mistakes or pitfalls
- "diagram_description": Visual or flowchart descriptions
- "quote": Notable quotes. Set metadata.attribution if known
- "callout": Important notes
- "key_concepts": Inline concept explanations
- "summary": Page summaries

⚠️ ABSOLUTE FORMAT RULE — READ CAREFULLY ⚠️
The "content" field of EVERY content block MUST be a STRING. Never use an array. Never use an object. Never omit it.
- WRONG: { "type": "list", "content": ["item 1", "item 2"] }
- RIGHT: { "type": "list", "content": "- item 1\\n- item 2", "metadata": { "ordered": false, "items": ["item 1", "item 2"] } }

- WRONG: { "type": "step_by_step", "content": ["Step 1", "Step 2"] }
- RIGHT: { "type": "step_by_step", "content": "Follow these steps to set up your first campaign:", "metadata": { "steps": ["Step 1", "Step 2"] } }

- WRONG: { "type": "table", "content": { "headers": [...], "rows": [...] } }
- RIGHT: { "type": "table", "content": "Comparison of the three AI tools:", "metadata": { "headers": [...], "rows": [...] } }

If you put anything other than a plain string in "content", the lesson will be REJECTED and regenerated — costing time. Always use a string.

VARIETY RULES:
- Each page MUST use at least 3 DIFFERENT block types (not just heading + text + summary)
- Prefer "example", "analogy", "definition" blocks over plain "text" when content fits
- Use "warning" blocks for common misconceptions
- Use "table" blocks when comparing multiple items
- Use "step_by_step" for procedural content`;

export const QUESTION_RULES = `QUESTION TYPES:
- "mcq": exactly 4 plausible options. Distractors must be common misconceptions — never obviously wrong. Never use "all of the above" or "none of the above".
- "true_false": options must be ["True", "False"]. The statement must be unambiguous.
- "ordering": provide 3-6 items as options. correct_answer = comma-separated correct order (a STRING, not an array).
- "fill_in_blank": use ___ for the blank. correct_answer = the expected word(s) as a STRING. The blank must test a KEY term, not a trivial word.
- "matching": options = terms (string[]). metadata.matches = {"term": "definition"} for all pairs. correct_answer = a JSON-formatted STRING, NOT a raw object.
  - WRONG: "correct_answer": { "Term A": "Def A" }
  - RIGHT: "correct_answer": "{\\"Term A\\": \\"Def A\\", \\"Term B\\": \\"Def B\\"}"
- "short_answer" (final quiz only): no options array. Expected answer = 1-3 sentences as a STRING.

⚠️ ABSOLUTE RULES FOR EVERY QUESTION ⚠️
- EVERY question MUST have: "question" (string), "type" (string), "correct_answer" (string), "explanation" (string), "difficulty" (one of "easy"|"medium"|"hard"), "points" (number).
- "correct_answer" and "explanation" are REQUIRED — never omit them. If you can't write a clear answer, DON'T include the question.
- "correct_answer" is ALWAYS a string, never an object, never an array, never missing.
- If you put an object or array in "correct_answer", or omit any required field, the question will be DROPPED.

CHECK QUESTIONS: 2-4 per page, testing ONLY that page's content. Use at least 2 different question types per page. Difficulty progresses: earlier pages easier, later pages harder.`;

export const PEDAGOGICAL_FIELDS = `PEDAGOGICAL FIELDS — Each page MUST include:
- "difficulty_level": one of "foundational" | "intermediate" | "advanced" | "synthesis"
- "bridge_from_previous": 1-2 sentence transition from the previous page (null for page 1)
- "common_misconceptions": array of strings — typical misunderstandings about this topic
- "real_world_applications": array of strings — practical uses
- "teaching_flow": { "reflection_prompt": "a metacognitive question for the end of the page" }

PAGE ORDERING:
- Page 1: "foundational" — introduce the topic, set context, define basic terms
- Middle pages: "intermediate" progressing to "advanced"
- Final page(s): "synthesis" — tie concepts together, show the big picture`;

export const LESSON_TOP_LEVEL = `Each lesson MUST include at the top level:
- "title": engaging lesson title
- "description": 2-3 sentence overview
- "learning_objectives": array of "Students will be able to…" statements
- "summary": comprehensive 3-5 sentence recap
- "difficulty": "beginner" | "intermediate" | "advanced"
- "estimated_duration_minutes": realistic number (typically 15-60)
- "pages": array of page objects
- "final_quiz_questions": 5-8 questions spanning ALL pages, mix of types`;

export const OUTPUT_CONTRACT = `Respond ONLY with a valid JSON object. No markdown fences, no commentary before or after. Start your response with { and end with }.`;

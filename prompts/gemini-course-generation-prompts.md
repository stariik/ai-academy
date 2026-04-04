# Gemini Course & Lesson Generation Prompts

All prompts that control how Gemini AI analyses documents and creates courses, lessons, pages, and assessments.  
**Source:** `src/lib/ai/gemini.ts`

---

## 1. Document Outline Extraction (Lightweight)

**Location:** `src/lib/ai/gemini.ts:270-279`  
**Used for:** Detecting document structure when no clear headings are found. Fallback for unstructured documents.

```
Analyze this document's structure and return a JSON array of sections.
Each section should have: "title" (string), "start_marker" (first ~20 chars of the section).
Only identify MAJOR sections (chapters, main headings), not every paragraph.

Document sample:
---
{sampleText}
---

Respond ONLY with JSON: {"sections": [{"title": "...", "start_marker": "..."}]}
```

---

## 2. Main Document Analysis Prompt (ANALYSIS_PROMPT)

**Location:** `src/lib/ai/gemini.ts:439-679`  
**Used for:** Single-pass conversion of a document into a structured multi-page lesson. This is the primary prompt for document-to-lesson transformation.

```
You are an expert educational content creator and instructional designer. Your task is to analyze the following document and transform it into a structured, multi-page lesson that a student will learn page by page with an AI tutor.

IMPORTANT: Split the document into logical PAGES. Each page covers ONE coherent topic or subtopic that can be taught and assessed independently. A student will read one page at a time, discuss it with an AI tutor, answer check questions, then move to the next page.

TARGET LEVEL: {targetLevel}

This document contains approximately {wordCount} words.

INSTRUCTIONS:
- Split the content into approximately {targetPages} pages (minimum {minPages}, maximum {maxPages}).
  Each page should cover ONE coherent topic or subtopic. If the document has more topics,
  create more pages. If fewer, create fewer. The target is driven by the document's own structure,
  not an arbitrary limit.
- Do NOT compress multiple unrelated topics onto a single page just to stay within a page count.
  It is better to have more pages with focused content than fewer pages with mixed content.
- Cover ALL major topics and sections from the document. Do not skip or summarize away important content.
- Each page should contain substantial teaching material, not just surface-level summaries.
- Each page covers one coherent subtopic - do NOT mix unrelated ideas on a single page.
- Each page gets its own content_blocks, key_concepts, and 2-4 check_questions.
- All content must be accurate to the source document - do NOT invent facts.
- Use markdown formatting within content block text where helpful.

CONTENT BLOCK TYPES - Use a VARIETY of these types to create engaging lessons:
- "heading": Section titles and subtitles
- "text": Standard explanatory paragraphs (use markdown formatting)
- "definition": Formal definitions. Set metadata.term to the term being defined
- "example": Worked examples demonstrating concepts. Set metadata.title to a descriptive title
- "analogy": Relatable comparisons that make abstract concepts concrete
- "code": Code snippets, commands, or technical syntax
- "table": Structured comparisons or data. Set metadata.headers (string[]) and metadata.rows (string[][])
- "list": Ordered or unordered lists. Set metadata.ordered to true/false
- "step_by_step": Procedural instructions. Set metadata.steps as an array of step strings
- "tip": Helpful tips and best practices
- "warning": Common mistakes, pitfalls, or important cautions
- "diagram_description": Text description of a visual/diagram/flowchart
- "quote": Notable quotes from the source document. Set metadata.attribution if known
- "callout": General important notes
- "key_concepts": Inline concept explanations
- "summary": Page or section summaries

VARIETY RULES:
- Each page MUST use at least 3 DIFFERENT block types (not just heading + text + summary)
- Use "example" blocks frequently -- worked examples are the most effective teaching tool
- Use "analogy" blocks to explain abstract concepts
- Use "warning" blocks for common misconceptions
- Use "table" blocks when comparing multiple items
- Use "step_by_step" for any procedural or sequential content
- Use "definition" blocks for important terms instead of embedding definitions in text blocks

RECOMMENDED CONTENT BLOCK ORDER PER PAGE:
1. "heading" -- Page title
2. "text" / "definition" / "analogy" -- Introduction and context
3. "text" / "example" / "code" / "table" -- Core explanation with examples
4. "step_by_step" / "diagram_description" -- Procedural or visual content
5. "tip" / "warning" -- Practical guidance
6. "summary" -- Page summary

PEDAGOGICAL STRUCTURE REQUIREMENTS:

1. PAGE ORDERING - Structure pages with deliberate difficulty progression:
   - Page 1: Always "foundational" -- introduce the topic, set context, define basic terms
   - Middle pages: Progress from "intermediate" to "advanced" concepts
   - Final page(s): "synthesis" -- connect concepts together, show big picture

2. TEACHING FLOW - Each page MUST include a "teaching_flow" object:
   - "introduction": 1-2 sentences that hook the student and connect to what they learned on the previous page. For page 1, introduce the overall topic.
   - "core_explanation": A label for the main concept taught on this page (e.g., "Understanding Variables")
   - "practice_hint": A suggestion for what the student should try or think about (e.g., "Try to identify three variables in the code example above")
   - "reflection_prompt": A metacognitive question at the end (e.g., "How would you explain this concept to a friend?")

3. PREREQUISITES - Each page should declare "prerequisites": an array of concept_ids from previous pages that a student needs to understand before this page makes sense. Page 1 has no prerequisites (empty array).

4. CONCEPTS INTRODUCED - Each page should declare "concepts_introduced": an array of concept_ids that are first taught on this page. These should be short lowercase identifiers (e.g., "variables", "for_loops", "recursion").

5. BRIDGE FROM PREVIOUS - Each page (except page 1) MUST include "bridge_from_previous": a 1-2 sentence transition that references what was just learned and previews what comes next.

6. COMMON MISCONCEPTIONS - Include "common_misconceptions" (array of strings) where relevant. These are typical misunderstandings students have about this page's topic.

7. REAL-WORLD APPLICATIONS - Include "real_world_applications" (array of strings) connecting the theory to practical use.

8. DIFFICULTY LEVEL - Each page MUST include "difficulty_level": one of "foundational", "intermediate", "advanced", "synthesis"

CHECK QUESTIONS (per page):
- Each page gets 2-4 check questions testing THAT page's content only.
- Question types allowed: mcq, true_false, ordering, fill_in_blank, matching.
- Each question MUST include "bloom_level": one of "remember", "understand", "apply", "analyze".
- Use at least 2 different question types per page.
- For mcq: provide exactly 4 plausible options (distractors should be common misconceptions, not obviously wrong).
- For true_false: provide ["True", "False"] as options. Statement must be unambiguous.
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order.
- For fill_in_blank: use ___ in the question for the blank; correct_answer is the expected word(s).
- For matching: provide terms as options; include metadata.matches with {"term": "definition"} pairs; correct_answer is JSON of the correct mapping.
- Difficulty progression: early pages get "easy" questions, later pages get "medium" or "hard".

CONCEPT MAP AND LEARNING PATH (lesson level):
- "concept_map": an array of concept nodes showing how concepts relate across the lesson.
- "learning_path": an ordered array of concept_ids in the order they should be learned.

RULES:
- Generate approximately {targetPages} pages (between {minPages} and {maxPages}) with logical progression from foundational to synthesis
- Each page MUST have 2-4 check questions with a mix of types (mcq, true_false, ordering, fill_in_blank, matching) and bloom_level on each
- Each page MUST have at least 3 content_blocks using at least 3 different block types
- Each page MUST have at least 1 key_concept
- Each page MUST have a teaching_flow, difficulty_level, prerequisites, and concepts_introduced
- Each page after page 1 MUST have bridge_from_previous
- Generate 5-8 final_quiz_questions with a mix of mcq, true_false, short_answer, ordering, and matching types
- Each final quiz question MUST include bloom_level
- For mcq: provide exactly 4 options with one correct answer
- For true_false: provide ["True", "False"] as options
- For short_answer: do NOT include an options array
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order
- For matching: options = terms, include metadata.matches, correct_answer = JSON mapping
- The difficulty field must be exactly one of: "beginner", "intermediate", or "advanced"
- estimated_duration_minutes should be realistic (typically 15-60)
- Include concept_map and learning_path at the lesson level

DOCUMENT TO ANALYZE:
---
{documentText}
---

Respond ONLY with the JSON object. No additional text before or after.
```

---

## 3. Chunk Pages Prompt (CHUNK_PAGES_PROMPT)

**Location:** `src/lib/ai/gemini.ts:683-791`  
**Used for:** Generating pages from a single chunk of a large document (when document exceeds 60,000 chars). Called multiple times, once per chunk.

```
You are an expert educational content creator. Generate lesson pages from the following text section.

TARGET LEVEL: {targetLevel}
This is section {chunkIndex} of {totalChunks} of a larger document.
Section topics: {sectionTitles}

Generate approximately {targetPages} pages from this section (you may generate {targetPages} +/- 1 pages depending on natural topic breaks), starting at page number {startPage}.

{previousContext}

INSTRUCTIONS:
- Each page covers ONE coherent topic or subtopic.
- Each page should contain substantial teaching material from the source text.
- Each page gets content_blocks, key_concepts, and 2-4 check_questions.
- All content must be accurate to the source text.
- Use markdown formatting within content block text where helpful.

CONTENT BLOCK TYPES AVAILABLE:
heading, text, definition, example, analogy, code, table, list, step_by_step,
tip, warning, diagram_description, quote, callout, key_concepts, summary

Use at least 3 different block types per page. Prefer "example", "analogy", and
"definition" blocks over plain "text" blocks when the content naturally fits those types.
Set metadata for: definition (term), example (title), table (headers, rows),
list (ordered), step_by_step (steps), quote (attribution).

PEDAGOGICAL FIELDS - Each page MUST include:
- "teaching_flow": {"introduction": "...", "core_explanation": "...", "practice_hint": "...", "reflection_prompt": "..."}
- "difficulty_level": one of "foundational", "intermediate", "advanced", "synthesis"
- "bridge_from_previous": 1-2 sentence transition from the previous page (null for first page of section if startPage is 1)
- "concepts_introduced": array of short lowercase concept_ids first taught on this page
- "prerequisites": array of concept_ids from previous pages needed for this page
- "common_misconceptions": array of strings (common misunderstandings about this topic)
- "real_world_applications": array of strings (practical applications)

CHECK QUESTIONS:
- 2-4 questions per page testing THAT page's content only
- Types: mcq, true_false, ordering, fill_in_blank, matching
- Each question MUST include "bloom_level": remember, understand, apply, or analyze
- Use at least 2 different question types per page
- For mcq: exactly 4 plausible options. For ordering: 3-6 items. For matching: include metadata.matches

RULES:
- Each page MUST have at least 3 content_blocks using at least 3 different block types, 1 key_concept, and 2 check_questions
- Each page MUST have teaching_flow, difficulty_level, concepts_introduced, and prerequisites
- For mcq: exactly 4 options. For true_false: ["True", "False"]. For ordering: 3-6 items. For matching: include metadata.matches
- Each check question MUST have bloom_level
- Be thorough -- include details from the source text, not just summaries

TEXT SECTION:
---
{chunkText}
---

Respond ONLY with the JSON object.
```

---

## 4. Final Quiz & Metadata Prompt (FINAL_QUIZ_PROMPT)

**Location:** `src/lib/ai/gemini.ts:795-908`  
**Used for:** Generating the final comprehensive quiz, concept map, and lesson metadata after all pages have been created (used in chunked mode).

```
You are an expert assessment designer and educational content creator. Based on the following lesson outline, generate the lesson metadata, a comprehensive final quiz, and a concept map.

TARGET LEVEL: {targetLevel}
TOTAL PAGES: {totalPages}

LESSON PAGES OVERVIEW:
{pagesOverview}

BLOOM'S TAXONOMY DISTRIBUTION for the final quiz:
- 15% REMEMBER: Recall key terms and facts
- 25% UNDERSTAND: Explain concepts and relationships
- 25% APPLY: Use knowledge in new contexts or scenarios
- 20% ANALYZE: Compare, contrast, or break down complex topics
- 10% EVALUATE: Judge the merits of different approaches
- 5% CREATE: Synthesize multiple concepts into a new idea

REQUIREMENTS:
- Generate {quizQuestionCount} final quiz questions (at least 1 per page covered)
- Mix of question types: mcq, true_false, short_answer, ordering, matching
- Include at least 2 scenario-based questions that require applying multiple concepts
- Questions must span ALL pages -- do not cluster questions from one section
- Difficulty distribution: 30% easy, 40% medium, 30% hard
- Each question MUST specify "bloom_level"
- Each question SHOULD include "page_reference" (the page number most relevant to the question)
- For short_answer: the expected answer should be 1-3 sentences, not a single word
- For mcq: distractors must be plausible (common misconceptions or related concepts)

RULES:
- Generate exactly {quizQuestionCount} final_quiz_questions covering material from across ALL pages
- Mix all question types: mcq, true_false, short_answer, ordering, matching
- Each question MUST have bloom_level: remember, understand, apply, analyze, evaluate, or create
- For mcq: exactly 4 plausible options. For true_false: ["True", "False"]. For short_answer: no options array
- For ordering: provide 3-6 items as options; correct_answer is comma-separated correct order
- For matching: options = terms, include metadata.matches, correct_answer = JSON mapping
- difficulty must be "beginner", "intermediate", or "advanced" (for the lesson-level field)
- Question difficulty must be "easy", "medium", or "hard"
- The quiz should test comprehensive understanding, not just recall from a single page
- concept_map should show how the key concepts from ALL pages relate to each other
- learning_path should list concept_ids in recommended learning order

Respond ONLY with the JSON object.
```

---

## 5. Check Questions Prompt (CHECK_QUESTIONS_PROMPT)

**Location:** `src/lib/ai/gemini.ts:912-967`  
**Used for:** Generating per-page check questions as a separate pass (used when pages were generated without questions, or for regeneration).

```
You are an expert assessment designer. Generate check questions for the following lesson pages.

TARGET LEVEL: {targetLevel}

BLOOM'S TAXONOMY - Use a MIX of cognitive levels:
- REMEMBER: Recall facts, terms, definitions ("What is...?", "Which of the following is...?")
- UNDERSTAND: Explain concepts ("Why does...?", "What is the purpose of...?")
- APPLY: Use in a new context ("How would you use...?", "What would happen if...?")
- ANALYZE: Compare, contrast, break down ("How does X differ from Y?", "What is the relationship between...?")

QUESTION TYPES AVAILABLE:
- "mcq": Multiple choice with 4 options. One correct, three plausible distractors.
  CRITICAL: Distractors must be PLAUSIBLE (common misconceptions or related concepts), not obviously wrong.
- "true_false": True or false statement. The statement must be specific enough to be unambiguous.
- "ordering": Put items in the correct sequence. options = items in random order, correct_answer = items in correct order as comma-separated string.
- "fill_in_blank": Sentence with ___ blank(s). correct_answer = the expected word(s).
- "matching": Match terms to definitions. options = terms, metadata.matches = {"term": "definition"} for all pairs, correct_answer = JSON of {"term": "definition"} mapping.

For each page, generate {questionsPerPage} questions.

RULES:
- Questions MUST be answerable from the page content alone
- Each question must specify "bloom_level" (remember, understand, apply, or analyze)
- Use at least 2 different question types per page
- Use at least 2 different Bloom's levels per page
- Difficulty should match page position: earlier pages = easier, later pages = harder
- For mcq: all 4 options must be plausible. Never use "all of the above" or "none of the above"
- For ordering: provide 3-6 items
- For matching: provide 3-5 pairs
- For fill_in_blank: the blank should test a KEY term or concept, not a trivial word

PAGES:
{pagesContent}

Respond ONLY with the JSON object.
```

---

## 6. Generative Lesson Prompt (GENERATIVE_LESSON_PROMPT)

**Location:** `src/lib/ai/gemini.ts:1688-1796`  
**Used for:** Creating a complete lesson from scratch based on a topic and key points (no source document). Used in the outline-based course creation flow where admins define course structure and Gemini generates each lesson.

```
You are an expert educational content creator and instructional designer. Your task is to CREATE a complete, detailed lesson from scratch based on a topic and detailed key points provided below.

IMPORTANT: You are NOT analyzing an existing document. You are GENERATING original educational content. The lesson should be comprehensive, accurate, well-structured, and engaging for adult learners.

LESSON TOPIC: {lessonTitle}

DETAILED KEY POINTS TO COVER:
{keyPoints}

IMPORTANT — KEY POINTS CONTAIN CONTEXT: Each key point may include specific details, frameworks, tool names, examples, or angles that MUST be reflected in your lesson content. Do NOT ignore the details after the colon — they tell you exactly what to teach and how to frame it. For example:
- "Common mistakes: being vague, no context, asking multiple things" means you MUST cover these specific mistakes, not generic ones.
- "Key tools: ChatGPT, Claude" means you MUST mention and explain these specific tools.
- If a key point says "RCTF framework" you MUST teach that specific framework.
Use the details as your content blueprint — expand on them with explanations, examples, and practice exercises.

LANGUAGE: Write the ENTIRE lesson in {language}. All content, questions, explanations, titles — everything must be in {language}.

TARGET DURATION: exactly 15 minutes of learning time.

CRITICAL PAGE LIMIT: Generate EXACTLY 5 pages. Not more, not less. Do NOT exceed 5 pages under any circumstances.
Each page takes ~3 minutes (reading + understanding + answering check questions). 5 pages × 3 min = 15 min.

{previousContext}

INSTRUCTIONS:
- Create EXACTLY 5 pages. This is a hard limit — never generate more than 5 pages.
- Each page covers ONE coherent subtopic derived from the key points.
- Distribute ALL the key points across exactly 5 pages — combine related points on the same page if needed.
- Each page should have 200-300 words of teaching material (not more).
- HONOR THE SPECIFICS in key points — if they mention specific tools, frameworks, numbers, or examples, USE them. Do not substitute with generic alternatives.
- Use real-world examples, practical scenarios, and concrete explanations.
- Build knowledge progressively — start with foundations, end with synthesis.
- Make the content engaging and practical, not dry textbook material.
- Keep content concise and focused — quality over quantity.

CONTENT BLOCK TYPES — Use a VARIETY (at least 3 different types per page):
- "heading": Page/section title
- "text": Explanatory paragraphs (use markdown formatting)
- "definition": Key terms. Set metadata.term
- "example": Worked examples. Set metadata.title
- "analogy": Relatable comparisons for abstract concepts
- "code": Code/commands if relevant
- "table": Comparisons. Set metadata.headers (string[]) and metadata.rows (string[][])
- "list": Lists. Set metadata.ordered (boolean)
- "step_by_step": Procedures. Set metadata.steps (string[])
- "tip": Best practices
- "warning": Common mistakes/pitfalls
- "diagram_description": Visual descriptions
- "callout": Important notes
- "summary": Page summaries

PEDAGOGICAL REQUIREMENTS per page:
- "teaching_flow": {"introduction": "hook + connection to previous", "core_explanation": "main concept label", "practice_hint": "what to try", "reflection_prompt": "metacognitive question"}
- "difficulty_level": "foundational" | "intermediate" | "advanced" | "synthesis"
- "prerequisites": concept_ids from previous pages (empty for page 1)
- "concepts_introduced": new concept_ids taught on this page
- "bridge_from_previous": transition from prior page (null for page 1)
- "common_misconceptions": typical misunderstandings
- "real_world_applications": practical uses

CHECK QUESTIONS (per page):
- 2 questions per page testing THAT page's content.
- Types: mcq, true_false, ordering, fill_in_blank, matching
- Each MUST include "bloom_level": remember | understand | apply | analyze
- For mcq: exactly 4 plausible options. For true_false: ["True", "False"]. For ordering: 3-6 items, correct_answer comma-separated.
- For matching: options = terms, metadata.matches = {"term": "definition"}, correct_answer = JSON mapping.

FINAL QUIZ: 5-8 questions covering the whole lesson.
- Mix of types. Each with bloom_level. Points: 10.
- Bloom distribution: 15% remember, 25% understand, 25% apply, 20% analyze, 15% evaluate/create.

Respond ONLY with the JSON object. No additional text.
```

---

## How These Prompts Work Together

### Flow 1: PDF Upload (Document → Lesson)
1. Document uploaded → structure analyzed with regex patterns
2. If unstructured → **Outline Extraction** (#1) detects sections via Gemini
3. If small document → **Analysis Prompt** (#2) generates entire lesson in one pass
4. If large document (>60K chars):
   - Split into smart chunks based on section boundaries
   - **Chunk Pages Prompt** (#3) generates pages per chunk
   - **Final Quiz Prompt** (#4) generates quiz + metadata from all pages
   - **Check Questions Prompt** (#5) fills in missing questions if needed

### Flow 2: Outline-Based Course Creation (No Document)
1. Admin defines course outline with lesson titles + key points
2. **Generative Lesson Prompt** (#6) creates each lesson from scratch
3. Each lesson gets context about previous lessons to avoid repetition

### Gemini Model Configuration
- Model: `gemini-2.0-flash` for all tasks
- Temperature: 0.2-0.4 depending on task (lower for outlines, higher for content)
- Output tokens: dynamically calculated based on page count and content density
- Response format: always `application/json`
- Retry: up to 3 attempts with exponential backoff

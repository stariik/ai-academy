# AI Academy — AI Essentials

## Full Course Content Prompts — Courses 01 through 05

Each prompt below generates a **complete** course document in Georgian Markdown — full lesson bodies (550–700 words each) with the **seven labeled subsections** the pipeline needs to populate the AI tutor's misconceptions / real-world-applications / bridge fields.

---

## 📌 How to use this document

1. Find the course you need (01 through 05 below).
2. Copy the **entire** prompt block — from the line starting `You are writing a COMPLETE COURSE DOCUMENT…` down to the line ending `…Nothing else.`
3. Paste into ChatGPT — GPT-4o or later works best. Claude Opus 4 also works.
4. ChatGPT outputs a Georgian Markdown document (10,000–20,000+ words).
5. If ChatGPT stops mid-way, reply `გააგრძელე იქიდან, სადაც შეჩერდი`.
6. Paste the output into Google Docs → export as PDF or DOCX.
7. Upload via `/admin` — single file for review mode, multiple files for queue mode.

## ⚠️ What changed from the old prompt

Two rules now matter more than anything else:

- **R2** — word floor is **550** (was 500). Target **600**. Anything below 550 gets flagged.
- **R3** — every lesson must contain **seven bold-label subsections**:
  `**კონცეფცია:** **მაგალითი:** **ვარჯიში:** **მცდარი წარმოდგენები:** **რეალური გამოყენება:** **ხიდი წინა გაკვეთილიდან:** **გასაღები:**`
  These bold labels are not decorative — the downstream creator AI uses them to extract the tutor-facing fields. Flowing prose without the labels = tutor loses half its behavior.

Why this matters: the AI tutor reads `commonMisconceptions`, `realWorldApplications`, and `bridgeFromPrevious` from the lesson record and uses them to (a) intercept wrong student thinking, (b) anchor abstract concepts in concrete work scenarios, (c) bridge pages on first visit. No bold labels = empty fields = flat tutor.

---

## COURSE 01 — Beginner — `What is AI? Understanding the Basics`

კატეგორია: AI Essentials · დონე: Beginner · წინაპირობა: არ არის საჭირო — ეს კატეგორიის პირველი კურსია

📋 **PROMPT — copy everything below this line into ChatGPT**

```
შენ წერ a COMPLETE COURSE DOCUMENT-ს AI Academy-ისთვის (ai-academy.ge),
ქართული ონლაინ სწავლების პლატფორმა for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         What is AI? Understanding the Basics
Category:             AI Essentials
Level:                Beginner
Prerequisite course:  არ არის საჭირო — ეს კატეგორიის პირველი კურსია
Target audience:      მომუშავე პროფესიონალები, რომლებიც AI-ს პირველად ეცნობიან და სურთ გაიგონ, რა შეუძლია AI-ს მათთვის გააკეთოს
Constraints / focus:  ნულოვანი ტექნიკური ცოდნა — ყველა კონცეფცია ყოველდღიური ანალოგიებით. ფოკუსი: AI-ის პრაქტიკული გამოყენება სამუშაო ადგილზე, არა თეორია ან ისტორია. ChatGPT და Claude უნდა იყოს ძირითადი ხელსაწყოები.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 …
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT.
- Never skip a number. Never reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS
Every lesson body must contain between 550 and 700 Georgian words
(including the labeled subsections below). Under 550 → pipeline
underfills pages. Over 700 → generator truncates and loses focus.
Target 600 — do not cut close to 550. Count words; do not guess.
If a lesson comes in at 540, expand it. Do not submit anything below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each of the seven subsections below MUST start with its bold
label on its own line, followed by the content. This is NOT optional,
NOT decorative, and NOT a stylistic suggestion. The downstream parser
searches for these exact markdown strings (`**კონცეფცია:**`, etc.) to
populate the tutor's misconceptions/real-world-applications/bridge
fields. Flowing prose without the bold markers = those fields stay
empty = tutor loses half its behavior.

If you find yourself writing a smooth narrative essay, STOP. The
labels must be visible, bold, and sit at the start of their section.

Use these EXACT Georgian labels as bold markdown (`**label:**`).

   **კონცეფცია:** ~100 words. Explain the idea in plain Georgian with
   a concrete anchor (a product, workflow, or analogy).

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific tool. Show the exact Prompt the student types (fenced code
   block if it helps). Show what the AI returns. Show what the student
   does with it.

   **ვარჯიში:** ~80 words. One specific 5–10 minute exercise. Write
   it as imperative instruction.

   **მცდარი წარმოდგენები:** 2–4 short bullets (`- ...` on separate
   lines). Typical wrong thinking students bring to this topic. Each
   bullet: one misconception, under 20 words. The tutor uses these to
   intercept wrong pattern-matching in real time.

   **რეალური გამოყენება:** 2–4 short bullets. Concrete situations
   where this skill applies at work. The tutor uses them to make
   abstract concepts concrete.

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only; omit on Lesson 01.)
   1–2 sentences connecting this lesson to the previous one.

   **გასაღები:** ONE sentence. The single thing to remember. Lesson's
   final line. Starts with the word "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
The seven bold-label subsections above are the ONLY structure inside
a lesson. Do not use `### Something` inside a lesson body.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, mentally re-read lessons 1..N-1. Lesson N
must teach something none of them taught.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A previous run produced flowing prose like this:

   ## გაკვეთილი 02 — Claude PDF-ის კითხვა — ...
   ბევრი პროფესიონალი AI-ს პირველად ტექსტის დასაწერად იყენებს... [450
   words of narrative paragraphs with no bold labels] ...
   გასაღები: ...

That is a FAILED lesson. It contained the right ideas but omitted
every bold label and the misconceptions / real-world / bridge sections
entirely. The pipeline could not extract those fields, so the tutor
was flat. Do not write lessons in that shape.

Correct shape:

   ## გაკვეთილი 02 — ...
   **კონცეფცია:** ... [100 words] ...
   **მაგალითი:** ... [150 words] ...
   **ვარჯიში:** ... [80 words] ...
   **მცდარი წარმოდგენები:**
   - ...
   - ...
   **რეალური გამოყენება:**
   - ...
   - ...
   **ხიდი წინა გაკვეთილიდან:** ...
   **გასაღები:** ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE (exactly this order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# {{TITLE}}

*One-line italic subtitle — the course's specific angle.*

დონე: {{LEVEL}} · კატეგორია: {{CATEGORY}}
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences. Start with WHY this skill matters NOW. Reference
{{PREREQUISITES}} once if provided. End with a concrete NUMERIC claim.

## ვისთვისაა კურსი?
4–6 bullets, each: **Persona role** — specific PAIN + why THIS course
is the fix.

## გაკვეთილი 01 — [specific title]
[550–700 words, seven bold-label subsections. Lesson 01 omits
"ხიდი წინა გაკვეთილიდან".]

## გაკვეთილი 02 — [specific title]
[550–700 words, all seven subsections including bridge.]

...continue for the full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories, each with 2–4 named tools:
- **Category:** Tool, Tool, Tool
Every tool named in any lesson body MUST appear here. No one-tool
categories.

## რას ისწავლი კურსის ბოლოს?
6–10 bullets, each starting with `✓` (U+2713; not ✔):
- ✓ [concrete, demonstrable outcome]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW MANY LESSONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Beginner, narrow topic        10–12 lessons
   Beginner, broad topic         14–16 lessons
   Intermediate                  16–20 lessons
   Advanced                      18–24 lessons
   Hero (capstone)               20–28 lessons
Never pad. Lesson count is set by content, not by target.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] NN runs 01, 02, 03 without gaps or duplicates
[ ] Every lesson body is 550–700 words (count; aim for 600)
[ ] Every lesson has ALL seven `**bold labels:**` visible in the source
[ ] Labels appear as literal markdown `**კონცეფცია:**` — not as implicit paragraph topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] Every tool named in any lesson body appears in the tools section
[ ] Final-outcome bullets start with ✓ (U+2713), not ✔
[ ] Stats line is a single `·`-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques; Georgian reads natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with the "# What is AI? Understanding the Basics"
line and end with the footer line. Nothing else.
```

---

## COURSE 02 — Beginner — `How AI Tools Work — ChatGPT, Claude, Gemini`

კატეგორია: AI Essentials · დონე: Beginner · წინაპირობა: What is AI? Understanding the Basics

📋 **PROMPT — copy everything below this line into ChatGPT**

```
შენ წერ a COMPLETE COURSE DOCUMENT-ს AI Academy-ისთვის (ai-academy.ge),
ქართული ონლაინ სწავლების პლატფორმა for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         How AI Tools Work — ChatGPT, Claude, Gemini
Category:             AI Essentials
Level:                Beginner
Prerequisite course:  What is AI? Understanding the Basics
Target audience:      პროფესიონალები, რომლებმაც გაიარეს პირველი კურსი და მზად არიან ChatGPT, Claude და Gemini-ს პრაქტიკული გამოყენებისთვის კონკრეტულ სამუშაო სიტუაციებში
Constraints / focus:  სამივე ხელსაწყო (ChatGPT, Claude, Gemini) შედარებულია გვერდიგვერდ კონკრეტული სამუშაო სცენარებით — Email, შეჯამება, კვლევა, კოდი. კურსის ბოლოს სტუდენტი ხვდება, რომელი ხელსაწყო რომელი ტიპის ამოცანისთვის არჩიოს.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 …
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT.
- Never skip a number. Never reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS
Every lesson body must contain between 550 and 700 Georgian words.
Target 600. Under 550 → pipeline underfills pages. Over 700 →
generator truncates. Count words; do not guess. Do not submit
anything below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each of the seven subsections MUST start with its bold
label on its own line. This is NOT optional. The downstream parser
searches for these exact markdown strings (`**კონცეფცია:**`, etc.)
to populate the tutor's misconceptions/real-world-applications/bridge
fields. Flowing prose without the bold markers = tutor fields stay
empty = tutor loses half its behavior.

Use these EXACT Georgian labels as bold markdown (`**label:**`):

   **კონცეფცია:** ~100 words. Explain the idea with a concrete anchor.

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific tool. Show the exact Prompt, what the AI returns, and
   what the student does with it.

   **ვარჯიში:** ~80 words. One 5–10 minute exercise as imperative
   instruction.

   **მცდარი წარმოდგენები:** 2–4 short bullets. Typical wrong thinking
   students bring to this topic.

   **რეალური გამოყენება:** 2–4 short bullets. Concrete work situations
   where this skill applies.

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only.) 1–2 sentences
   connecting this lesson to the previous one.

   **გასაღები:** ONE sentence. Lesson's final line. Starts with
   "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
Seven bold-label subsections are the ONLY structure inside a lesson.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, re-read lessons 1..N-1. Lesson N must teach
something none of them taught.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
A previous run produced flowing prose without the bold labels — all
seven subsections merged into narrative paragraphs. That is a FAILED
lesson. The pipeline could not extract misconceptions/real-world/bridge
fields, so the tutor went flat. Bold labels are mandatory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE (exactly this order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# How AI Tools Work — ChatGPT, Claude, Gemini

*One-line italic subtitle — the course's specific angle.*

დონე: Beginner · კატეგორია: AI Essentials
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences. Start with WHY. Reference prerequisite once. End with
a concrete NUMERIC claim.

## ვისთვისაა კურსი?
4–6 bullets, each: **Persona role** — specific PAIN + why THIS course.

## გაკვეთილი 01 — [specific title]
[550–700 words, seven bold-label subsections. Lesson 01 omits bridge.]

## გაკვეთილი 02 — [specific title]
[550–700 words, all seven subsections including bridge.]

...continue...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Every tool named in a lesson must appear.
No one-tool categories.

## რას ისწავლი კურსის ბოლოს?
6–10 bullets starting with `✓`.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] Every lesson body is 550–700 words (count; aim for 600)
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Labels appear as literal `**კონცეფცია:**` — not implicit topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every tool named in any lesson appears in tools section
[ ] Checkmark bullets use ✓ (U+2713), not ✔
[ ] Stats line is single `·`-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques

Scope: Beginner broad topic — aim for 14–16 lessons covering ChatGPT,
Claude, and Gemini across Email/summarization/research/code scenarios.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# How AI Tools Work — ChatGPT, Claude, Gemini" and end with the
footer. Nothing else.
```

---

## COURSE 03 — Beginner — `AI in Everyday Life & Work`

კატეგორია: AI Essentials · დონე: Beginner · წინაპირობა: How AI Tools Work — ChatGPT, Claude, Gemini

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI in Everyday Life & Work
Category:             AI Essentials
Level:                Beginner
Prerequisite course:  How AI Tools Work — ChatGPT, Claude, Gemini
Target audience:      მენეჯერები, ადმინისტრატორები და სპეციალისტები HR, მარკეტინგი, ფინანსები, გაყიდვები და იურიდიული სფეროებიდან, რომლებიც ცდილობენ AI-ს ინტეგრირებას კონკრეტულ სამუშაო პროცესებში
Constraints / focus:  მინიმუმ 5 პროფესიული სფერო — თითოეულისთვის კონკრეტული AI გამოყენების მაგალითი რეალური Prompt-ებით. ფოკუსი: დროის დაზოგვა და გამეორებადი ამოცანების ავტომატიზაცია.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded (01, 02, …). Em-dash (—). Title names a tool, action,
or concrete artifact. Never skip or reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600.
Do not submit anything below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate the tutor's misconceptions/
real-world/bridge fields. Flowing prose = tutor goes flat.

   **კონცეფცია:** ~100 words. Idea with concrete anchor.
   **მაგალითი:** ~150 words. One real end-to-end example with a
   specific tool, the exact Prompt, AI return, and student action.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise.
   **მცდარი წარმოდგენები:** 2–4 short bullets. Typical wrong thinking.
   **რეალური გამოყენება:** 2–4 short bullets. Concrete work situations.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only.) 1–2 sentences.
   **გასაღები:** ONE sentence. Final line. Starts with "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS.

ANTI-EXAMPLE: A previous run produced 450-word flowing prose without
bold labels — that is a FAILED lesson. Bold labels are mandatory.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI in Everyday Life & Work

*Italic subtitle.*

დონე: Beginner · კატეგორია: AI Essentials
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim.

## ვისთვისაა კურსი?
4–6 persona bullets with pain + why-this-course.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue to full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. No one-tool categories.

## რას ისწავლი კურსის ბოლოს?
6–10 bullets starting with ✓.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading "## გაკვეთილი NN — ..." exact
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] Every tool in any lesson appears in tools section
[ ] ✓ used, not ✔ ; Georgian დ, not Latin d
[ ] Minimum 5 distinct professional domains covered across lessons
  (HR, marketing, finance, sales, legal — or similar)

Scope: Beginner broad topic — 14–16 lessons spanning 5+ domains.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI in Everyday Life & Work" and end with the footer. Nothing else.
```

---

## COURSE 04 — Intermediate — `Understanding Machine Learning Fundamentals`

კატეგორია: AI Essentials · დონე: Intermediate · წინაპირობა: AI in Everyday Life & Work

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Understanding Machine Learning Fundamentals
Category:             AI Essentials
Level:                Intermediate
Prerequisite course:  AI in Everyday Life & Work
Target audience:      პროფესიონალები, რომლებიც უკვე იყენებენ AI ხელსაწყოებს ყოველდღიურად და სურთ გაიგონ მათ უკან მდგომი მექანიზმები — რათა Prompt-ები დაწერონ უფრო ჭკვიანურად
Constraints / focus:  კოდი სრულად გამოირიცხება. Machine Learning-ის კონცეფციები — ანალოგიებით (Netflix-ის რეკომენდაცია, Gmail სპამ-ფილტრი, Google Maps-ის მარშრუტი). ყოველი გაკვეთილი უნდა მიაბას კონცეფცია ChatGPT-ის ან Claude-ის კონკრეტულ ქცევას.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a product, concept, or
concrete artifact. Never skip or reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate tutor fields. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. Idea with concrete anchor (Netflix /
   Gmail / Maps-style analogy).
   **მაგალითი:** ~150 words. One real end-to-end example — name the
   product, show the ML behavior, explain what the student can
   observe. Connect to ChatGPT/Claude behavior when relevant.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise —
   observing an ML behavior in a real product.
   **მცდარი წარმოდგენები:** 2–4 bullets. Typical wrong mental models
   non-engineers bring to ML.
   **რეალური გამოყენება:** 2–4 bullets. Where this ML idea shows up
   in work products today.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

NO CODE — not a single line. All concepts explained by analogy to
products the student already uses.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Understanding Machine Learning Fundamentals

*Italic subtitle — the product-analogies angle.*

დონე: Intermediate · კატეგორია: AI Essentials
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim.

## ვისთვისაა კურსი?
4–6 persona bullets.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge. No code.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge. No code.]

...continue to full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Mix AI chat tools with reference products
(Netflix, Gmail, Google Maps, Spotify, YouTube) under a clearly named
category like "რეალური პროდუქტების მაგალითები".

## რას ისწავლი კურსის ბოლოს?
6–10 bullets starting with ✓.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Zero code anywhere
[ ] Each lesson anchored in a concrete product the student knows
[ ] Lesson 01 omits bridge; 02+ include it
[ ] ✓ used; Georgian დ; no English calques

Scope: Intermediate — 16–20 lessons covering rec systems, classification,
regression, error/bias, evaluation, and connecting ML concepts to
ChatGPT/Claude behavior.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# Understanding Machine Learning Fundamentals" and end with the
footer. Nothing else.
```

---

## COURSE 05 — Intermediate — `Deep Learning & Neural Networks Explained`

კატეგორია: AI Essentials · დონე: Intermediate · წინაპირობა: Understanding Machine Learning Fundamentals

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Deep Learning & Neural Networks Explained
Category:             AI Essentials
Level:                Intermediate
Prerequisite course:  Understanding Machine Learning Fundamentals
Target audience:      ბიზნეს-პროფესიონალები და გადაწყვეტილების მიმღებები, რომლებსაც სურთ გაიგონ, რატომ იქცევა ChatGPT, Midjourney და Siri ისე, როგორც იქცევა — კოდის გარეშე
Constraints / focus:  კოდი — ნული. ყოველი ნეირონული ქსელის კონცეფცია (ფენები, წონები, ტრენინგი) მიბმულია კონკრეტულ პროდუქტთან. კურსი ასახავს, სად ჯობს Deep Learning-ი კლასიკურ ML-ს და სად — არა.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a product, network type,
or concrete artifact. Never skip or reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate tutor fields. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. Idea with a product anchor (ChatGPT,
   Midjourney, Siri, YouTube recommendations).
   **მაგალითი:** ~150 words. One real end-to-end example — name the
   product, show the neural-network behavior, explain what the user
   observes and why.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise —
   observing the DL behavior in a consumer product.
   **მცდარი წარმოდგენები:** 2–4 bullets. Typical wrong mental models
   non-engineers bring about "AI thinks" / "brains".
   **რეალური გამოყენება:** 2–4 bullets. Where this DL concept powers
   products the student uses every week.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

NO CODE — not a single line. All concepts explained by product
analogies and visual intuition.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Deep Learning & Neural Networks Explained

*Italic subtitle — the no-code-product-anchored angle.*

დონე: Intermediate · კატეგორია: AI Essentials
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim.

## ვისთვისაა კურსი?
4–6 persona bullets.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge. No code.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge. No code.]

...continue to full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Must include a "რეალური პროდუქტების
მაგალითები" category naming at least ChatGPT, Midjourney, Siri,
YouTube recommendations (or similar DL-powered consumer products).

## რას ისწავლი კურსის ბოლოს?
6–10 bullets starting with ✓.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Zero code anywhere
[ ] Each lesson explicitly tied to a consumer product the student uses
[ ] Lesson 01 omits bridge; 02+ include it
[ ] ✓ used; Georgian დ; no English calques
[ ] At least one lesson explicitly compares Deep Learning vs classical
    ML — when DL wins, when it doesn't

Scope: Intermediate — 16–20 lessons covering layers/weights/training
intuitively, then CNNs (Midjourney), RNNs/Transformers (ChatGPT),
speech (Siri), recommendations (YouTube), and the when-to-use-DL
trade-off.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# Deep Learning & Neural Networks Explained" and end with the
footer. Nothing else.
```

---

AI Academy © 2025–2026 · ai-academy.ge · info@ai-academy.ge

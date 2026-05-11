# AI Academy — Vibe Coding

## Full Course Content Prompts — Courses 01 · 02 · 03 · 04

Each prompt generates a **COMPLETE** course in Georgian Markdown.
550–700 words per lesson · 7 tutor-facing subsections · pipeline-ready.
Latest prompt format — includes ANTI-EXAMPLE section.

---

## 🗺️ Course Map — Vibe Coding

Courses 01–02 are **Beginner**. Courses 03–04 are **Intermediate**.
Each course teaches **specific AI tools** applied to a **specific category** of software work — not general theory.

```
01  🟢  Vibe Coding 101 — Code with AI from Day One
02  🟢  Vibe Frontend — AI-Powered UI Development
03  🟡  Vibe Backend — AI-Assisted APIs & Servers
04  🟡  Vibe Database — AI-Powered Data Architecture
```

---

## 📌 How to Use

1. Find the course you need (01 through 04 below).
2. Copy the **entire** prompt block — from the line starting `You are writing a COMPLETE COURSE DOCUMENT…` down to the line ending `…Nothing else.`
3. Paste into ChatGPT (GPT-4o or later) or Claude (Opus 4 / Sonnet 4.6).
4. The AI outputs a complete Georgian Markdown course document (10,000–20,000+ words).
5. If the model stops mid-way, reply: `გააგრძელე იქიდან, სადაც შეჩერდი`.
6. Paste the output into Google Docs → export as DOCX or PDF.
7. Upload via `/admin` — single file for review mode, multiple files for queue mode.

## ⚠️ Key rules in this prompt version

- ✦ **550–700 words per lesson** (target 600 — never below 550)
- ✦ **7 bold-labeled subsections** per lesson — parser depends on them
- ✦ **ANTI-EXAMPLE** section — prevents flowing-prose failures
- ✦ Lesson 01 omits bridge; Lessons 02+ include `ხიდი წინა გაკვეთილიდან`
- ✦ No `###` subheadings inside lessons — breaks section detection
- ✦ Every lesson must teach a **specific AI tool** in a **concrete coding scenario**

---

## COURSE 01 — Beginner — `Vibe Coding 101 — Code with AI from Day One`

კატეგორია: Vibe Coding · დონე: Beginner · წინაპირობა: არ არის საჭირო — ეს კატეგორიის პირველი კურსია

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Vibe Coding 101 — Code with AI from Day One
Category:             Vibe Coding
Level:                Beginner
Prerequisite course:  არ არის საჭირო — ეს კატეგორიის პირველი კურსია
Target audience:      მომუშავე პროფესიონალები, რომელთაც სურთ AI-ს დახმარებით კოდის წერა და მცირე პროექტების აშენება — Junior დეველოპერები, პროდუქტ-მენეჯერები, დიზაინერები და მეწარმეები, რომლებიც პირველად ცდიან Cursor-ს, Claude Code-ს და GitHub Copilot-ს
Constraints / focus:  ნულოვანი AI-coding ფონი — "Vibe Coding"-ის ფილოსოფია (ბუნებრივი ენით კოდის წერა). ფოკუსი კონკრეტულ ხელსაწყოებზე: Cursor, Claude Code, GitHub Copilot, ChatGPT. ყოველი გაკვეთილი — ერთი ხელსაწყო ერთი კონკრეტული workflow-ით (Prompt → Code → Review → Run). ენა და სტეკი: JavaScript/TypeScript, HTML/CSS — მცირე CLI და Web სკრიპტები. არანაირი დიდი arch-დებატი

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 ...
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT.
- Never skip a number. Never reuse a number.

  CORRECT   ## გაკვეთილი 01 — Cursor-ის Tab-Tab workflow
  CORRECT   ## გაკვეთილი 07 — Claude Code-ით CLI სკრიპტის შექმნა
  WRONG     ## Lesson 1 — Intro              (English, wrong prefix)
  WRONG     ## გაკვეთილი 01 — შესავალი        (vague, abstract noun)
  WRONG     ## გაკვეთილი 1 — Cursor          (single digit, not "01")

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
searches for these exact markdown strings to populate the tutor fields.
Flowing prose without the bold markers = tutor loses half its behavior.

If you find yourself writing a smooth narrative essay, STOP. The
labels must be visible, bold, and sit at the start of their section.

Use these EXACT Georgian labels as bold markdown (**label:**):

   **კონცეფცია:** ~100 words. Explain the idea in plain Georgian with
   a concrete anchor (a tool, workflow, or analogy from coding).

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific AI tool (Cursor / Claude Code / Copilot / ChatGPT). Show
   the exact Prompt the student types (fenced code block). Show what
   the AI returns (code or response). Show what the student does with
   it (run, test, ship).

   **ვარჯიში:** ~80 words. One specific 5-10 minute hands-on coding
   exercise. Write it as imperative instruction.

   **მცდარი წარმოდგენები:** 2-4 short bullets (- ... on separate
   lines). Typical wrong thinking students bring to AI-assisted coding.
   Each bullet: one misconception, under 20 words.

   **რეალური გამოყენება:** 2-4 short bullets. Concrete situations
   where this skill applies in real software work.

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only; OMIT on Lesson 01.)
   1-2 sentences connecting this lesson to the previous one.

   **გასაღები:** ONE sentence. The single thing to remember. Lesson's
   final line. Starts with the word "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
The seven bold-label subsections above are the ONLY structure inside
a lesson. Do not use ### Something inside a lesson body.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, mentally re-read lessons 1..N-1. Lesson N
must teach something none of them taught. Each lesson = one tool +
one new workflow + one new artifact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A previous run produced flowing prose like this:

   ## გაკვეთილი 02 — ...
   ბევრი დეველოპერი AI-ს პირველად კოდის დასაწერად იყენებს...
   [450 words of narrative paragraphs with no bold labels]
   გასაღები: ...

That is a FAILED lesson. Correct shape:

   ## გაკვეთილი 02 — ...
   **კონცეფცია:** ... [100 words] ...
   **მაგალითი:** ... [150 words with fenced Prompt block] ...
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

# Vibe Coding 101 — Code with AI from Day One

*One-line italic subtitle — the course's specific angle.*

დონე: Beginner · კატეგორია: Vibe Coding
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3-5 sentences. Start with WHY this skill matters NOW. Reference
prerequisites once if provided. End with a concrete NUMERIC claim
(e.g. "10x სწრაფად", "50+ Prompt-ი", "2 საათი 2 დღის ნაცვლად").

## ვისთვისაა კურსი?
4-6 bullets, each: **Persona role** — specific PAIN + why THIS course
is the fix (not just "AI learning").

## გაკვეთილი 01 — [specific title]
[550-700 words, seven bold-label subsections. Lesson 01 OMITS
the "ხიდი წინა გაკვეთილიდან" subsection.]

## გაკვეთილი 02 — [specific title]
[550-700 words, all seven subsections including bridge.]

...continue for the full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5-7 categories, each with 2-4 named tools:
- **Category:** Tool, Tool, Tool
Every tool named in any lesson body MUST appear here.
No one-tool categories. Expected categories for this course:
AI Code Editors (Cursor, ...), AI Pair Programmers (GitHub Copilot,
Claude Code, ...), General AI Assistants (ChatGPT, Claude, ...),
Run/Test Environments, Documentation Helpers.

## რას ისწავლი კურსის ბოლოს?
6-10 bullets, each starting with checkmark U+2713 (not other variants):
- ✓ [concrete, demonstrable outcome]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW MANY LESSONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Beginner, narrow topic        10-12 lessons
   Beginner, broad topic         14-16 lessons
   Intermediate                  16-20 lessons
   Advanced                      18-24 lessons
   Hero (capstone)               20-28 lessons
Never pad. Lesson count is set by content, not by target.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL CALIBRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Beginner:      no AI background assumed. Define every Latin-script
               term on first use. Single-tool workflows only.
Intermediate:  assume daily AI use. Multi-tool workflows, longer
               Prompts, structured Outputs.
Advanced:      Prompt Engineering fluency assumed. System Prompts,
               Custom GPTs / Claude Projects, optimization.
Hero:          capstone-grade end-to-end projects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] NN runs 01, 02, 03 without gaps or duplicates
[ ] Every lesson body is 550-700 words (count; aim for 600)
[ ] Every lesson has ALL seven **bold labels:** visible in the source
[ ] Labels appear as literal markdown **კონცეფცია:** — not implicit topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] Every tool named in any lesson body appears in the tools section
[ ] Every lesson names at least one specific AI tool (not just "AI")
[ ] Final-outcome bullets start with checkmark U+2713, not other variants
[ ] Stats line is a single dot-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques; Georgian reads natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with the # Vibe Coding 101 — Code with AI from Day One line and end with
the footer line. Nothing else.
```

---

## COURSE 02 — Beginner — `Vibe Frontend — AI-Powered UI Development`

კატეგორია: Vibe Coding · დონე: Beginner · წინაპირობა: Vibe Coding 101 — Code with AI from Day One

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Vibe Frontend — AI-Powered UI Development
Category:             Vibe Coding
Level:                Beginner
Prerequisite course:  Vibe Coding 101 — Code with AI from Day One
Target audience:      ბაზისური HTML/CSS/JS-ის მცოდნე პროდუქტ-დიზაინერები, Junior Frontend დეველოპერები და არა-დეველოპერები, რომლებსაც სურთ AI-ს დახმარებით ლანდინგების, კომპონენტების და მცირე React/Next.js აპების სწრაფი აშენება
Constraints / focus:  ფოკუსი კონკრეტულ ხელსაწყოებზე: v0.dev (Vercel), bolt.new, Lovable, Cursor + shadcn/ui, Claude UI-ისთვის. სტეკი: HTML, Tailwind CSS, React, Next.js. ყოველი გაკვეთილი = ერთი ხელსაწყო ერთი UI-არტეფაქტისთვის (button, form, hero, dashboard, landing page). screenshot-დან კოდამდე workflow, design-token-ები, responsive layout-ი AI-ს დახმარებით

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 ...
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT.
- Never skip a number. Never reuse a number.

  CORRECT   ## გაკვეთილი 01 — v0.dev-ით პირველი Hero-სექცია
  CORRECT   ## გაკვეთილი 07 — Cursor + shadcn/ui — Form კომპონენტი 5 წუთში
  WRONG     ## Lesson 1 — Intro              (English, wrong prefix)
  WRONG     ## გაკვეთილი 01 — შესავალი        (vague, abstract noun)
  WRONG     ## გაკვეთილი 1 — v0              (single digit, not "01")

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
searches for these exact markdown strings to populate the tutor fields.
Flowing prose without the bold markers = tutor loses half its behavior.

If you find yourself writing a smooth narrative essay, STOP. The
labels must be visible, bold, and sit at the start of their section.

Use these EXACT Georgian labels as bold markdown (**label:**):

   **კონცეფცია:** ~100 words. Explain the idea in plain Georgian with
   a concrete anchor (a UI tool, layout pattern, or design analogy).

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific AI tool (v0 / bolt.new / Lovable / Cursor / Claude). Show
   the exact Prompt the student types (fenced code block). Show what
   the AI generates (component code or screenshot). Show what the
   student does with it (paste, refine, deploy).

   **ვარჯიში:** ~80 words. One specific 5-10 minute UI-build exercise.
   Write it as imperative instruction.

   **მცდარი წარმოდგენები:** 2-4 short bullets (- ... on separate
   lines). Typical wrong thinking about AI-generated UI. Each bullet:
   one misconception, under 20 words.

   **რეალური გამოყენება:** 2-4 short bullets. Concrete situations
   where this skill applies (landing pages, internal tools, MVPs).

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only; OMIT on Lesson 01.)
   1-2 sentences connecting this lesson to the previous one.

   **გასაღები:** ONE sentence. The single thing to remember. Lesson's
   final line. Starts with the word "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
The seven bold-label subsections above are the ONLY structure inside
a lesson. Do not use ### Something inside a lesson body.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, mentally re-read lessons 1..N-1. Lesson N
must teach something none of them taught. Each lesson = one tool +
one new UI artifact.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A previous run produced flowing prose like this:

   ## გაკვეთილი 02 — ...
   ბევრი დიზაინერი AI-ს პირველად UI-ს შესაქმნელად იყენებს...
   [450 words of narrative paragraphs with no bold labels]
   გასაღები: ...

That is a FAILED lesson. Correct shape:

   ## გაკვეთილი 02 — ...
   **კონცეფცია:** ... [100 words] ...
   **მაგალითი:** ... [150 words with fenced Prompt block] ...
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

# Vibe Frontend — AI-Powered UI Development

*One-line italic subtitle — the course's specific angle.*

დონე: Beginner · კატეგორია: Vibe Coding
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3-5 sentences. Start with WHY this skill matters NOW. Reference
prerequisites once if provided. End with a concrete NUMERIC claim
(e.g. "10x სწრაფად", "Landing-ი 30 წუთში", "5 კომპონენტი 1 საათში").

## ვისთვისაა კურსი?
4-6 bullets, each: **Persona role** — specific PAIN + why THIS course
is the fix.

## გაკვეთილი 01 — [specific title]
[550-700 words, seven bold-label subsections. Lesson 01 OMITS
the "ხიდი წინა გაკვეთილიდან" subsection.]

## გაკვეთილი 02 — [specific title]
[550-700 words, all seven subsections including bridge.]

...continue for the full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5-7 categories, each with 2-4 named tools:
- **Category:** Tool, Tool, Tool
Every tool named in any lesson body MUST appear here.
No one-tool categories. Expected categories for this course:
AI UI Generators (v0.dev, bolt.new, Lovable, ...), AI Code Editors
(Cursor, ...), Component Libraries (shadcn/ui, ...), General AI
Assistants (Claude, ChatGPT, ...), Design-to-Code Tools.

## რას ისწავლი კურსის ბოლოს?
6-10 bullets, each starting with checkmark U+2713 (not other variants):
- ✓ [concrete, demonstrable outcome]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW MANY LESSONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Beginner, narrow topic        10-12 lessons
   Beginner, broad topic         14-16 lessons
   Intermediate                  16-20 lessons
   Advanced                      18-24 lessons
   Hero (capstone)               20-28 lessons
Never pad. Lesson count is set by content, not by target.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL CALIBRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Beginner:      no AI background assumed. Define every Latin-script
               term on first use. Single-tool workflows only.
Intermediate:  assume daily AI use. Multi-tool workflows, longer
               Prompts, structured Outputs.
Advanced:      Prompt Engineering fluency assumed. System Prompts,
               Custom GPTs / Claude Projects, optimization.
Hero:          capstone-grade end-to-end projects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] NN runs 01, 02, 03 without gaps or duplicates
[ ] Every lesson body is 550-700 words (count; aim for 600)
[ ] Every lesson has ALL seven **bold labels:** visible in the source
[ ] Labels appear as literal markdown **კონცეფცია:** — not implicit topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] Every tool named in any lesson body appears in the tools section
[ ] Every lesson names at least one specific AI tool (not just "AI")
[ ] Final-outcome bullets start with checkmark U+2713, not other variants
[ ] Stats line is a single dot-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques; Georgian reads natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with the # Vibe Frontend — AI-Powered UI Development line and end with
the footer line. Nothing else.
```

---

## COURSE 03 — Intermediate — `Vibe Backend — AI-Assisted APIs & Servers`

კატეგორია: Vibe Coding · დონე: Intermediate · წინაპირობა: Vibe Frontend — AI-Powered UI Development

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Vibe Backend — AI-Assisted APIs & Servers
Category:             Vibe Coding
Level:                Intermediate
Prerequisite course:  Vibe Frontend — AI-Powered UI Development
Target audience:      Frontend დეველოპერები და Full-Stack-მსურველები, რომლებსაც სურთ AI-ს დახმარებით REST/JSON API-ების, server-actions-ების და მცირე backend-ების აშენება Node.js / Next.js / Supabase-ით — ყოველდღიური AI გამოყენება უკვე ნაცნობი
Constraints / focus:  ფოკუსი კონკრეტულ ხელსაწყოებზე: Cursor, Claude Code, GitHub Copilot Chat, Replit Agent, Supabase AI. სტეკი: Node.js, Next.js Route Handlers, Hono, Express, Supabase Edge Functions. ყოველი გაკვეთილი = ერთი backend-არტეფაქტი (REST endpoint, auth flow, webhook, queue job, rate-limiter) AI-ს დახმარებით აშენებული. Multi-file editing, terminal automation, error-debugging-loop AI-სთან, ტესტის წერა AI-ით

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 ...
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT.
- Never skip a number. Never reuse a number.

  CORRECT   ## გაკვეთილი 01 — Cursor Composer-ით REST endpoint-ის შექმნა
  CORRECT   ## გაკვეთილი 07 — Claude Code-ით Stripe webhook-ი 20 წუთში
  WRONG     ## Lesson 1 — Intro              (English, wrong prefix)
  WRONG     ## გაკვეთილი 01 — შესავალი        (vague, abstract noun)
  WRONG     ## გაკვეთილი 1 — Backend         (single digit, not "01")

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
searches for these exact markdown strings to populate the tutor fields.
Flowing prose without the bold markers = tutor loses half its behavior.

If you find yourself writing a smooth narrative essay, STOP. The
labels must be visible, bold, and sit at the start of their section.

Use these EXACT Georgian labels as bold markdown (**label:**):

   **კონცეფცია:** ~100 words. Explain the idea in plain Georgian with
   a concrete anchor (a backend pattern, server flow, or API analogy).

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific AI tool (Cursor / Claude Code / Copilot / Replit Agent /
   Supabase AI). Show the exact Prompt the student types (fenced code
   block). Show what the AI returns (code, file diff, terminal output).
   Show what the student does with it (run, test, deploy).

   **ვარჯიში:** ~80 words. One specific 5-10 minute backend exercise
   with a concrete deliverable. Write it as imperative instruction.

   **მცდარი წარმოდგენები:** 2-4 short bullets (- ... on separate
   lines). Typical wrong thinking about AI-assisted backend work.
   Each bullet: one misconception, under 20 words.

   **რეალური გამოყენება:** 2-4 short bullets. Concrete situations
   where this skill applies in real backend / API work.

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only; OMIT on Lesson 01.)
   1-2 sentences connecting this lesson to the previous one.

   **გასაღები:** ONE sentence. The single thing to remember. Lesson's
   final line. Starts with the word "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
The seven bold-label subsections above are the ONLY structure inside
a lesson. Do not use ### Something inside a lesson body.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, mentally re-read lessons 1..N-1. Lesson N
must teach something none of them taught. Each lesson = one tool +
one new backend artifact or workflow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A previous run produced flowing prose like this:

   ## გაკვეთილი 02 — ...
   ბევრი დეველოპერი AI-ს პირველად API-ს დასაწერად იყენებს...
   [450 words of narrative paragraphs with no bold labels]
   გასაღები: ...

That is a FAILED lesson. Correct shape:

   ## გაკვეთილი 02 — ...
   **კონცეფცია:** ... [100 words] ...
   **მაგალითი:** ... [150 words with fenced Prompt block] ...
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

# Vibe Backend — AI-Assisted APIs & Servers

*One-line italic subtitle — the course's specific angle.*

დონე: Intermediate · კატეგორია: Vibe Coding
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3-5 sentences. Start with WHY this skill matters NOW. Reference
prerequisites once if provided. End with a concrete NUMERIC claim
(e.g. "API 1 საათში დეპლოი", "5 endpoint 1 დღეში", "10x სწრაფი debug").

## ვისთვისაა კურსი?
4-6 bullets, each: **Persona role** — specific PAIN + why THIS course
is the fix.

## გაკვეთილი 01 — [specific title]
[550-700 words, seven bold-label subsections. Lesson 01 OMITS
the "ხიდი წინა გაკვეთილიდან" subsection.]

## გაკვეთილი 02 — [specific title]
[550-700 words, all seven subsections including bridge.]

...continue for the full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5-7 categories, each with 2-4 named tools:
- **Category:** Tool, Tool, Tool
Every tool named in any lesson body MUST appear here.
No one-tool categories. Expected categories for this course:
AI Code Editors (Cursor, ...), AI Pair Programmers (Claude Code,
GitHub Copilot Chat, ...), AI Cloud Builders (Replit Agent,
Supabase AI, ...), Backend Frameworks (Next.js, Hono, Express, ...),
General AI Assistants (Claude, ChatGPT, ...).

## რას ისწავლი კურსის ბოლოს?
6-10 bullets, each starting with checkmark U+2713 (not other variants):
- ✓ [concrete, demonstrable outcome]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW MANY LESSONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Beginner, narrow topic        10-12 lessons
   Beginner, broad topic         14-16 lessons
   Intermediate                  16-20 lessons
   Advanced                      18-24 lessons
   Hero (capstone)               20-28 lessons
Never pad. Lesson count is set by content, not by target.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL CALIBRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Beginner:      no AI background assumed. Define every Latin-script
               term on first use. Single-tool workflows only.
Intermediate:  assume daily AI use. Multi-tool workflows, longer
               Prompts, structured Outputs.
Advanced:      Prompt Engineering fluency assumed. System Prompts,
               Custom GPTs / Claude Projects, optimization.
Hero:          capstone-grade end-to-end projects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] NN runs 01, 02, 03 without gaps or duplicates
[ ] Every lesson body is 550-700 words (count; aim for 600)
[ ] Every lesson has ALL seven **bold labels:** visible in the source
[ ] Labels appear as literal markdown **კონცეფცია:** — not implicit topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] Every tool named in any lesson body appears in the tools section
[ ] Every lesson names at least one specific AI tool (not just "AI")
[ ] Final-outcome bullets start with checkmark U+2713, not other variants
[ ] Stats line is a single dot-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques; Georgian reads natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with the # Vibe Backend — AI-Assisted APIs & Servers line and end with
the footer line. Nothing else.
```

---

## COURSE 04 — Intermediate — `Vibe Database — AI-Powered Data Architecture`

კატეგორია: Vibe Coding · დონე: Intermediate · წინაპირობა: Vibe Backend — AI-Assisted APIs & Servers

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Vibe Database — AI-Powered Data Architecture
Category:             Vibe Coding
Level:                Intermediate
Prerequisite course:  Vibe Backend — AI-Assisted APIs & Servers
Target audience:      Full-Stack დეველოპერები და Backend-ის მცოდნე პროფესიონალები, რომლებსაც სურთ AI-ს დახმარებით მონაცემთა ბაზის სქემის დაპროექტება, მიგრაციების მართვა, რთული SQL-ის წერა და მონაცემთა მოდელირება — ყოველდღიური AI გამოყენება უკვე ნაცნობი
Constraints / focus:  ფოკუსი კონკრეტულ ხელსაწყოებზე: Supabase AI, Claude / ChatGPT სქემის დიზაინისთვის, Cursor მიგრაციებისთვის, Drizzle/Prisma AI-ით. ბაზები: PostgreSQL (Supabase), SQLite. ყოველი გაკვეთილი = ერთი data-არტეფაქტი (ER-დიაგრამა, table-სქემა, migration-ი, რთული SQL query, RLS policy, seed-data, index-strategy) AI-ს დახმარებით შექმნილი. ფოკუსი production-უსაფრთხო პრაქტიკაზე — მონაცემთა მთლიანობა, წინასწარ-bench-ი, AI-სქემების გადამოწმება

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 ...
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT.
- Never skip a number. Never reuse a number.

  CORRECT   ## გაკვეთილი 01 — Claude-ით ER-დიაგრამის გენერაცია
  CORRECT   ## გაკვეთილი 07 — Supabase AI-ით RLS Policy-ის წერა
  WRONG     ## Lesson 1 — Intro              (English, wrong prefix)
  WRONG     ## გაკვეთილი 01 — შესავალი        (vague, abstract noun)
  WRONG     ## გაკვეთილი 1 — SQL             (single digit, not "01")

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
searches for these exact markdown strings to populate the tutor fields.
Flowing prose without the bold markers = tutor loses half its behavior.

If you find yourself writing a smooth narrative essay, STOP. The
labels must be visible, bold, and sit at the start of their section.

Use these EXACT Georgian labels as bold markdown (**label:**):

   **კონცეფცია:** ~100 words. Explain the idea in plain Georgian with
   a concrete anchor (a schema pattern, query type, or data analogy).

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific AI tool (Supabase AI / Claude / ChatGPT / Cursor). Show
   the exact Prompt the student types (fenced code block). Show what
   the AI returns (SQL, schema, migration, ER-diagram). Show what the
   student does with it (run migration, test query, verify integrity).

   **ვარჯიში:** ~80 words. One specific 5-10 minute database exercise
   with a concrete deliverable. Write it as imperative instruction.

   **მცდარი წარმოდგენები:** 2-4 short bullets (- ... on separate
   lines). Typical wrong thinking about AI-generated SQL / schemas.
   Each bullet: one misconception, under 20 words.

   **რეალური გამოყენება:** 2-4 short bullets. Concrete situations
   where this skill applies in real data work.

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only; OMIT on Lesson 01.)
   1-2 sentences connecting this lesson to the previous one.

   **გასაღები:** ONE sentence. The single thing to remember. Lesson's
   final line. Starts with the word "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
The seven bold-label subsections above are the ONLY structure inside
a lesson. Do not use ### Something inside a lesson body.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, mentally re-read lessons 1..N-1. Lesson N
must teach something none of them taught. Each lesson = one tool +
one new data artifact or workflow.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A previous run produced flowing prose like this:

   ## გაკვეთილი 02 — ...
   ბევრი დეველოპერი AI-ს პირველად SQL-ის დასაწერად იყენებს...
   [450 words of narrative paragraphs with no bold labels]
   გასაღები: ...

That is a FAILED lesson. Correct shape:

   ## გაკვეთილი 02 — ...
   **კონცეფცია:** ... [100 words] ...
   **მაგალითი:** ... [150 words with fenced Prompt block] ...
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

# Vibe Database — AI-Powered Data Architecture

*One-line italic subtitle — the course's specific angle.*

დონე: Intermediate · კატეგორია: Vibe Coding
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3-5 sentences. Start with WHY this skill matters NOW. Reference
prerequisites once if provided. End with a concrete NUMERIC claim
(e.g. "სქემა 30 წუთში", "10x სწრაფი მიგრაცია", "0 dataloss").

## ვისთვისაა კურსი?
4-6 bullets, each: **Persona role** — specific PAIN + why THIS course
is the fix.

## გაკვეთილი 01 — [specific title]
[550-700 words, seven bold-label subsections. Lesson 01 OMITS
the "ხიდი წინა გაკვეთილიდან" subsection.]

## გაკვეთილი 02 — [specific title]
[550-700 words, all seven subsections including bridge.]

...continue for the full scope...

## კურსში გამოყენებული AI ინსტრუმენტები
5-7 categories, each with 2-4 named tools:
- **Category:** Tool, Tool, Tool
Every tool named in any lesson body MUST appear here.
No one-tool categories. Expected categories for this course:
AI DB Assistants (Supabase AI, ...), AI Code Editors (Cursor, ...),
ORMs with AI (Drizzle, Prisma, ...), Database Engines (PostgreSQL,
SQLite, ...), General AI Assistants (Claude, ChatGPT, ...).

## რას ისწავლი კურსის ბოლოს?
6-10 bullets, each starting with checkmark U+2713 (not other variants):
- ✓ [concrete, demonstrable outcome]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW MANY LESSONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Beginner, narrow topic        10-12 lessons
   Beginner, broad topic         14-16 lessons
   Intermediate                  16-20 lessons
   Advanced                      18-24 lessons
   Hero (capstone)               20-28 lessons
Never pad. Lesson count is set by content, not by target.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL CALIBRATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Beginner:      no AI background assumed. Define every Latin-script
               term on first use. Single-tool workflows only.
Intermediate:  assume daily AI use. Multi-tool workflows, longer
               Prompts, structured Outputs.
Advanced:      Prompt Engineering fluency assumed. System Prompts,
               Custom GPTs / Claude Projects, optimization.
Hero:          capstone-grade end-to-end projects.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] NN runs 01, 02, 03 without gaps or duplicates
[ ] Every lesson body is 550-700 words (count; aim for 600)
[ ] Every lesson has ALL seven **bold labels:** visible in the source
[ ] Labels appear as literal markdown **კონცეფცია:** — not implicit topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] Every tool named in any lesson body appears in the tools section
[ ] Every lesson names at least one specific AI tool (not just "AI")
[ ] Final-outcome bullets start with checkmark U+2713, not other variants
[ ] Stats line is a single dot-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques; Georgian reads natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with the # Vibe Database — AI-Powered Data Architecture line and end with
the footer line. Nothing else.
```

---

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

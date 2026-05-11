# AI Academy — AI for Business

## Full Course Content Prompts — Courses 01 through 08

Each prompt below generates a **complete** course document in Georgian Markdown — full lesson bodies (550–700 words each) with the **seven labeled subsections** the pipeline needs to populate the AI tutor's misconceptions / real-world-applications / bridge fields.

This category does **not** teach "how to build a business from zero." It teaches **how to use AI inside an existing business — from beginner to AI-first company.** The student may already be a founder, manager, employee, freelancer, team lead, HR, sales, finance, or operations person. Every prompt below assumes the student already works in a business; the courses progress from zero AI knowledge (Course 01) through governance of an AI-first company (Course 08).

---

## 📌 How to use this document

1. Find the course you need (01 through 08 below).
2. Copy the **entire** prompt block — from the line starting `შენ წერ a COMPLETE COURSE DOCUMENT…` down to the line ending `…Nothing else.`
3. Paste into ChatGPT — GPT-4o or later works best. Claude Opus 4 also works.
4. ChatGPT outputs a Georgian Markdown document (10,000–20,000+ words).
5. If ChatGPT stops mid-way, reply `გააგრძელე იქიდან, სადაც შეჩერდი`.
6. Paste the output into Google Docs → export as PDF or DOCX.
7. Upload via `/admin` — single file for review mode, multiple files for queue mode.

## ⚠️ What matters most

Two rules drive everything:

- **R2** — word floor is **550**. Target **600**. Anything below 550 gets flagged.
- **R3** — every lesson must contain **seven bold-label subsections**:
  `**კონცეფცია:** **მაგალითი:** **ვარჯიში:** **მცდარი წარმოდგენები:** **რეალური გამოყენება:** **ხიდი წინა გაკვეთილიდან:** **გასაღები:**`
  These bold labels are not decorative — the downstream creator AI uses them to extract the tutor-facing fields. Flowing prose without the labels = tutor loses half its behavior.

---

## COURSE 01 — Beginner — `AI for Business — Where to Start`

კატეგორია: AI for Business · დონე: Beginner · წინაპირობა: არ არის საჭირო — ეს კატეგორიის პირველი კურსია

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
Course title:         AI for Business — Where to Start
Category:             AI for Business
Level:                Beginner
Prerequisite course:  არ არის საჭირო — ეს კატეგორიის პირველი კურსია
Target audience:      მომუშავე პროფესიონალები ნებისმიერ ბიზნეს როლში — დამფუძნებლები, მენეჯერები, თანამშრომლები, ფრილანსერები, გუნდის ლიდერები, HR, გაყიდვები, ფინანსები, ოპერაციები — რომლებსაც უკვე აქვთ სამსახური ან ბიზნესი და სურთ AI-ის ჩართვა მათ უკვე არსებულ სამუშაო პროცესებში
Constraints / focus:  ეს არ არის კურსი ბიზნესის ნულიდან აშენების შესახებ — ეს არის როგორ ჩაერთო AI თქვენს უკვე არსებულ ბიზნეს კონტექსტში. ნულოვანი AI ცოდნა. ფოკუსი: AI-ის მაღალი გავლენის გამოყენების შემთხვევების ამოცნობა ნებისმიერ ბიზნეს როლში — სად დაზოგავს AI ყველაზე მეტ დროსა და ფულს. ChatGPT და Claude უნდა იყოს ძირითადი ხელსაწყოები. არანაირი ტექნიკური წინაპირობა — ყველა კონცეფცია ყოველდღიური ბიზნეს ანალოგიებით.

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
meta-commentary. Start with the "# AI for Business — Where to Start"
line and end with the footer line. Nothing else.
```

---

## COURSE 02 — Beginner — `AI Tools for Productivity & Daily Work`

კატეგორია: AI for Business · დონე: Beginner · წინაპირობა: AI for Business — Where to Start

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
Course title:         AI Tools for Productivity & Daily Work
Category:             AI for Business
Level:                Beginner
Prerequisite course:  AI for Business — Where to Start
Target audience:      მომუშავე პროფესიონალები ნებისმიერ როლში — დამფუძნებლები, მენეჯერები, თანამშრომლები, ფრილანსერები — რომლებსაც უკვე ესმით რა არის AI და მზად არიან ყოველდღიური სამუშაო ამოცანების ავტომატიზაციისთვის: ელფოსტა, დოკუმენტები, შეხვედრები, კვლევა, შაჯამებები, ჩანაწერები
Constraints / focus:  ფოკუსი ყოველდღიურ "small wins"-ებზე — დროის დაზოგვა საათებში კვირაში, არა თვეებში. ეს არ არის კურსი ბიზნესის აშენების შესახებ — ეს არის როგორ გახადო შენი არსებული სამუშაო დღე უფრო პროდუქტიული AI-ის ხელით გამოყენებით. ხელსაწყოები: ChatGPT, Claude, NotebookLM, Notion AI, Otter.ai, Grammarly, Perplexity. არანაირი ავტომატიზაცია/Zapier ჯერ — მხოლოდ ხელით AI-სთან მუშაობის ცაცხალი ჩვევები, რომლებიც მაშინვე იწყებენ მუშაობას.

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
meta-commentary. Start with the "# AI Tools for Productivity & Daily Work"
line and end with the footer line. Nothing else.
```

---

## COURSE 03 — Intermediate — `Automating Business Workflows with AI`

კატეგორია: AI for Business · დონე: Intermediate · წინაპირობა: AI Tools for Productivity & Daily Work

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
Course title:         Automating Business Workflows with AI
Category:             AI for Business
Level:                Intermediate
Prerequisite course:  AI Tools for Productivity & Daily Work
Target audience:      მომუშავე პროფესიონალები — ოპერაციების მენეჯერები, მცირე ბიზნესის მფლობელები, ფრილანსერები, ოფისის მენეჯერები, marketing/sales ops, customer success — რომლებიც უკვე ხელით იყენებენ ChatGPT-სა და Claude-ს და მზად არიან, რომ AI-მ ავტომატურად აკეთოს მათი მრავალნაბიჯიანი პროცესები ადამიანის ჩარევის გარეშე
Constraints / focus:  ფოკუსი მრავალნაბიჯიან no-code/low-code ავტომატიზაციაზე — როდის და როგორ გადავიყვანოთ ხელით AI მუშაობა ავტომატურ workflow-ად. ხელსაწყოები: Zapier, Make.com, n8n, ChatGPT Custom GPTs, Claude Projects, Google Apps Script + Gemini, Airtable AI. რეალური workflow მაგალითები: ლიდის კვალიფიკაცია, ინვოისის დამუშავება, კონტენტის გენერაცია, კლიენტის onboarding, mail-merge შაბლონები. არ არის კოდირების კურსი — ყველა მაგალითი no-code ან 1-2 ხაზიანი formula. სტუდენტი ბოლოს ფლობს მინიმუმ 5 მუშა workflow-ს.

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
meta-commentary. Start with the "# Automating Business Workflows with AI"
line and end with the footer line. Nothing else.
```

---

## COURSE 04 — Intermediate — `AI for Project Management & Teams`

კატეგორია: AI for Business · დონე: Intermediate · წინაპირობა: Automating Business Workflows with AI

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
Course title:         AI for Project Management & Teams
Category:             AI for Business
Level:                Intermediate
Prerequisite course:  Automating Business Workflows with AI
Target audience:      პროექტ მენეჯერები, გუნდის ლიდერები, scrum masters, product managers, ოპერაციების მენეჯერები, engineering managers — ვინც გუნდის კოორდინაციაზე, სტატუს რეპორტებზე, შეხვედრებზე და ვადებზე პასუხისმგებელია
Constraints / focus:  ფოკუსი გუნდურ მუშაობაზე, არა ინდივიდუალურ პროდუქტიულობაზე — როგორ გამოვიყენოთ AI გუნდის კოორდინაციისთვის. რეალური სცენარები: სტატუს ანგარიშების გენერაცია, stand-up შაჯამებები, შეხვედრის action item-ების ამოღება, sprint retrospective-ის ანალიზი, ამოცანების ავტომატური მინიჭება, რისკების ადრეული გამოვლენა. ხელსაწყოები: Notion AI, ClickUp AI Brain, Linear, Asana Intelligence, Atlassian Intelligence (Jira/Confluence), Fellow.app, Otter.ai, ChatGPT, Claude. სტუდენტი არ წერს კოდს — მხოლოდ აყენებს და იყენებს ხელსაწყოებს.

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
meta-commentary. Start with the "# AI for Project Management & Teams"
line and end with the footer line. Nothing else.
```

---

## COURSE 05 — Intermediate — `AI Finance — Forecasting & Reporting`

კატეგორია: AI for Business · დონე: Intermediate · წინაპირობა: AI for Project Management & Teams

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
Course title:         AI Finance — Forecasting & Reporting
Category:             AI for Business
Level:                Intermediate
Prerequisite course:  AI for Project Management & Teams
Target audience:      ფინანსისტები, ბუღალტრები, CFO-ები, FP&A ანალიტიკოსები, ბიზნეს ანალიტიკოსები, კონტროლერები, მცირე ბიზნესის მფლობელები, ფრილანსერები რომლებიც თავად მართავენ ფინანსებს — ყველა, ვინც კვირაში მინიმუმ ერთხელ ხსნის Excel-ს ან Google Sheets-ს ფინანსური ანალიზისთვის
Constraints / focus:  ფოკუსი ფინანსურ მოდელირებაზე, პროგნოზირებაზე, ანგარიშგების გენერაციაზე და მონაცემთა ანალიზზე — არა ზოგად AI გამოყენებაზე. რეალური სცენარები: revenue forecast, cash flow projection, expense categorization, P&L variance analysis, board reports, KPI dashboards. ხელსაწყოები: ChatGPT Advanced Data Analysis, Claude (Projects + Artifacts), Microsoft Excel Copilot, Google Sheets Gemini, Power BI Copilot, Tableau Pulse. ყველა მაგალითი რეალური ცხრილებით — სტუდენტი თავის ფინანსურ მონაცემებს იყენებს ვარჯიშებზე. სიფრთხილის ხაზი: AI შეიძლება შეცდეს რიცხვებში — ყოველთვის გადაამოწმე.

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
meta-commentary. Start with the "# AI Finance — Forecasting & Reporting"
line and end with the footer line. Nothing else.
```

---

## COURSE 06 — Intermediate — `AI for HR & Talent Management`

კატეგორია: AI for Business · დონე: Intermediate · წინაპირობა: AI Finance — Forecasting & Reporting

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
Course title:         AI for HR & Talent Management
Category:             AI for Business
Level:                Intermediate
Prerequisite course:  AI Finance — Forecasting & Reporting
Target audience:      HR სპეციალისტები, რეკრუტერები, talent partners, people operations მენეჯერები, გუნდის ხელმძღვანელები რომლებიც დაქირავებენ ან მართავენ ხალხს, founders პატარა გუნდებში რომლებიც თავად აქირავებენ — ყველა, ვინც პასუხისმგებელია დაქირავებაზე, onboarding-ზე, performance-ზე ან employee experience-ზე
Constraints / focus:  ფოკუსი HR life cycle-ის ყველა ეტაპზე AI-ის გამოყენებაზე: job description-ის წერა, screening, interview prep, onboarding, performance review, 1:1 prep, employee engagement survey ანალიზი, exit interview ინსაიტები. ხელსაწყოები: ChatGPT, Claude, Gemini, LinkedIn Recruiter AI, HireVue, Lattice AI, BambooHR AI, 15Five, Otter.ai. ეთიკის სცენარი ყველა გაკვეთილში: bias risk, GDPR/personal data, ადამიანი საბოლოო გადაწყვეტილებაზე — AI არ ანაცვლებს HR-ის გადაწყვეტილებას. რეალური მაგალითები კონკრეტული JD-ებით, ინტერვიუ კითხვებით, review შაბლონებით.

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
meta-commentary. Start with the "# AI for HR & Talent Management"
line and end with the footer line. Nothing else.
```

---

## COURSE 07 — Intermediate — `AI Sales & CRM Optimization`

კატეგორია: AI for Business · დონე: Intermediate · წინაპირობა: AI for HR & Talent Management

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
Course title:         AI Sales & CRM Optimization
Category:             AI for Business
Level:                Intermediate
Prerequisite course:  AI for HR & Talent Management
Target audience:      გაყიდვების სპეციალისტები, account executives, BDR/SDR, sales managers, marketing managers, customer success managers, founders რომლებიც თავად გაყიდიან — ყველა, ვინც ლიდებზე, outreach-ზე, deal pipeline-ზე ან CRM-ის მონაცემებზე მუშაობს კვირაში
Constraints / focus:  ფოკუსი ბოლოდან ბოლომდე გაყიდვების ციკლზე AI-ით: lead generation, ICP-ის ფორმულირება, account research, personalized outreach, follow-up sequences, meeting prep, call analysis, deal scoring, CRM data enrichment, churn prediction. ხელსაწყოები: HubSpot AI (Breeze), Salesforce Einstein, Apollo.io, Clay, ChatGPT, Claude, Lavender, Gong, Chorus.ai, LinkedIn Sales Navigator AI. რეალური cold email-ის შაბლონები, რეალური Apollo/Clay ცხრილები, რეალური HubSpot/Salesforce workflow-ები. სიფრთხილე spam-ის და GDPR-ის წინააღმდეგ — personalization, არა automation-ის ბოროტად გამოყენება.

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
meta-commentary. Start with the "# AI Sales & CRM Optimization"
line and end with the footer line. Nothing else.
```

---

## COURSE 08 — Advanced — `AI Governance, Risk & Compliance for Business`

კატეგორია: AI for Business · დონე: Advanced · წინაპირობა: AI Sales & CRM Optimization

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
Course title:         AI Governance, Risk & Compliance for Business
Category:             AI for Business
Level:                Advanced
Prerequisite course:  AI Sales & CRM Optimization
Target audience:      ხელმძღვანელები, COO/CTO/CISO, compliance officers, DPO/data protection officers, IT directors, legal counsel, founders და heads of operations — ყველა, ვინც კომპანიის AI-ის გამოყენების პოლიტიკაზე, მონაცემთა დაცვაზე ან რისკის მართვაზეა პასუხისმგებელი. ეს კურსი არის capstone — სტუდენტი უკვე გავიდა Beginner და Intermediate ეტაპებზე და ახლა ქმნის AI-first კომპანიის ინფრასტრუქტურას.
Constraints / focus:  ფოკუსი მოწინავე თემებზე: AI Acceptable Use Policy, vendor/model risk assessment, EU AI Act compliance, GDPR + AI ერთად, data residency, prompt injection და shadow AI რისკები, AI risk register, DPIA AI სისტემებისთვის, audit trails, human-in-the-loop გადაწყვეტილებები, AI ethics committee. ხელსაწყოები: ChatGPT Enterprise, Claude for Work, Microsoft Purview, Microsoft Copilot Studio governance, IBM watsonx.governance, OneTrust AI Governance, Credo AI. რეალური დოკუმენტები: AUP შაბლონი, risk register შაბლონი, DPIA შაბლონი, vendor questionnaire. ეს არ არის სამართლის კურსი — ეს არის ოპერაციული framework-ი, რომელსაც business leader ახორციელებს.

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
meta-commentary. Start with the "# AI Governance, Risk & Compliance for Business"
line and end with the footer line. Nothing else.
```

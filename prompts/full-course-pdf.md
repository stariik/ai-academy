# Full-Course PDF Generation Prompt — AI Academy

Paste into ChatGPT Pro (or Claude). Fill the {placeholders} at the top. Output = a Markdown course document that maps cleanly to the AI Academy lesson schema (including the new tutor-facing fields: misconceptions, real-world applications, bridges).

## How to use
1. Fill in TITLE / CATEGORY / LEVEL / PREREQUISITES / AUDIENCE / CONSTRAINTS below.
2. Paste the whole prompt into ChatGPT Pro.
3. Copy the Markdown output → Google Docs → export as PDF (or DOCX).
4. Upload via `/admin` (single file for review mode, multiple files for queue mode).

---

## The prompt

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
INPUT (fill these in)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         {TITLE}
Category:             {CATEGORY}          (e.g. AI Essentials)
Level:                {LEVEL}             (Beginner | Intermediate | Advanced | Hero)
Prerequisite course:  {PREREQUISITES}     (optional)
Target audience:      {AUDIENCE}          (one sentence)
Constraints / focus:  {CONSTRAINTS}       (optional)

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

  CORRECT   ## გაკვეთილი 01 — ChatGPT Prompt-ის ანატომია
  CORRECT   ## გაკვეთილი 07 — Claude ანალიზი 10-გვერდიან PDF-ზე
  WRONG     ## Lesson 1 — Intro              (English, wrong prefix)
  WRONG     ## გაკვეთილი 01 — შესავალი        (vague, abstract noun)
  WRONG     ## გაკვეთილი 1 — ChatGPT         (single digit, not "01")

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
   1–2 sentences connecting this lesson to the previous one. The
   tutor uses this on first visit to remind the student of continuity.

   **გასაღები:** ONE sentence. The single thing to remember. The
   lesson's final line. Starts with the word "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES
The seven bold-label subsections above are the ONLY structure inside
a lesson. Do not use `### Something` inside a lesson body — it
confuses section detection. Use bold labels (`**label:**`) only.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ANTI-EXAMPLE — DO NOT DO THIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Below is what a previous run produced. It looks fine to a human
reader but is BROKEN for the pipeline because it merges all seven
subsections into flowing prose. This failed the parse. Do not
write lessons in this shape.

   WRONG (flowing prose, no bold labels):

   ## გაკვეთილი 02 — Claude PDF-ის კითხვა — 5 გვერდიდან 5 აზრის ამოღება

   ბევრი პროფესიონალი AI-ს პირველად ტექსტის დასაწერად იყენებს,
   მაგრამ რეალური დროის ეკონომია კითხვიდან იწყება... [continues as
   narrative paragraphs for 450 words] ...

   გასაღები: Claude-ს PDF-ზე მაშინ იყენებ სწორად, როცა სთხოვ
   მიზანზე მორგებულ ამოღებულ აზრებს.

The above contains all the RIGHT ideas (concept, example, practice,
takeaway) but omits every bold label and the misconceptions /
real-world / bridge sections entirely. That is a failed lesson.

   CORRECT shape (see worked example below):

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

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS
Before writing lesson N, mentally re-read lessons 1..N-1. Lesson N
must teach something none of them taught. If a technique was already
shown in an earlier Example, pick a different angle.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE (exactly this order)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# {TITLE}

*One-line italic subtitle — the course's specific angle.*

დონე: {LEVEL} · კატეგორია: {CATEGORY}
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ

3–5 sentences. Start with WHY this skill matters NOW. Reference
{PREREQUISITES} once if provided. End with a concrete NUMERIC claim
(e.g. "10x სწრაფად", "50+ Prompt-ი", "2 საათი 2 დღის ნაცვლად").

## ვისთვისაა კურსი?

4–6 bullets, each: **Persona role** — specific PAIN + why THIS course
is the fix (not just "AI learning").

## გაკვეთილი 01 — [specific title]

[500–700 words, organized as the seven bold-label subsections from R3,
in order. Lesson 01 omits the "ხიდი წინა გაკვეთილიდან" subsection.]

## გაკვეთილი 02 — [specific title]

[500–700 words, seven subsections including "ხიდი წინა გაკვეთილიდან".]

...continue for the full scope...

## კურსში გამოყენებული AI ინსტრუმენტები

5–7 categories, each with 2–4 named tools:
- **Category:** Tool, Tool, Tool

Every tool named in any lesson body MUST appear here. No one-tool
categories; if a category has only one tool, merge it with another.

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
WORKED EXAMPLE — ONE COMPLETE LESSON (match this style exactly)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## გაკვეთილი 03 — ChatGPT რედაქტირება — ტონის შეცვლა 30 წამში

**კონცეფცია:** ყოველი ტექსტს აქვს ტონი — ოფიციალური, მეგობრული,
სარკასტული, ნეიტრალური. როცა თავად წერ, ტონი გესმის, მაგრამ როცა AI
წერს შენთვის, ხშირად ღებულობ „ზოგად-LinkedIn" ტონს, რომელიც არც შენია,
არც კომპანიის. ეს გაკვეთილი გაჩვენებს, როგორ აიძულო ChatGPT შეცვალოს
ტონი ერთი Prompt-ით, ისე რომ მთავარი შინაარსი იგივე დარჩეს. ტექნიკას
ჰქვია „Tone Swap" და ეფუძნება იმ ფაქტს, რომ ChatGPT-ს ახსოვს წინა
პასუხი.

**მაგალითი:** წარმოიდგინე, რომ ChatGPT-მ დაგიწერა LinkedIn-ის პოსტი
ახალი პროდუქტის გაშვებაზე და პასუხი გამოვიდა ძალიან ოფიციალური. შენ
წერ: „იგივე პოსტი, მაგრამ ტონი გახდეს მეგობრული — თითქოს კოლეგას
სადილზე ვუყვები. შეინარჩუნე ფაქტები, შეცვალე მხოლოდ ხმა". ChatGPT
დააბრუნებს იმავე შინაარსს, მაგრამ პირველი პირით, მოკლე წინადადებებით,
და emoji-ით სადაც ტონი ამას ითხოვს. თუ მაინც ზედმეტად ოფიციალურია,
დაამატე: „უფრო თავისუფლად, მოკლე სიტყვები, საუბრის რიტმი". ChatGPT
ყოველი იტერაციისთვის უკეთ უახლოვდება შენს გემოვნებას, რადგან ხედავს
კონკრეტულ მიმართულებას და არა აბსტრაქტულ „გააკეთე უკეთესად".

**ვარჯიში:** აიღე ბოლო Email, რომელიც დაგიწერია. ჩასვი ChatGPT-ში და
სთხოვე: „დაწერე იგივე შინაარსი 3 ვერსიაში — ოფიციალური, მეგობრული,
პირდაპირი. შინაარსი შეინარჩუნე ზუსტად, ტონი შეცვალე ხმოვანი
ინსტრუქციის მიხედვით". შეადარე სამი ვერსია გვერდიგვერდ.

**მცდარი წარმოდგენები:**
- „უკეთესად დაწერე" იგივეა, რაც „ტონი შეცვალე" — არა, პირველი
  ბუნდოვანია.
- ChatGPT თავად ხვდება, რა ტონი მინდა — არა, ხმოვანი ანალოგია უნდა
  მივცე.
- ერთი მცდელობა საკმარისია — ჩვეულებრივ 2-3 იტერაცია სჭირდება.

**რეალური გამოყენება:**
- LinkedIn პოსტის გადაქცევა ოფიციალურიდან მეგობრულ ვერსიად.
- Email-ის შერბილება, როცა წერილი „ცივად" ჟღერს.
- გაყიდვის სკრიპტის ადაპტაცია სხვადასხვა სეგმენტისთვის.

**ხიდი წინა გაკვეთილიდან:** წინა გაკვეთილზე ვისწავლეთ, როგორ
ავიძულოთ ChatGPT შექმნას კონტენტი ნულიდან. ახლა ვასწავლით, როგორ
დავხვეწოთ უკვე შექმნილი ტექსტი.

**გასაღები:** ტონი ChatGPT-ში არ იცვლება ზედსართავით („უკეთესი"),
არამედ კონკრეტული ხმოვანი ანალოგიით („თითქოს კოლეგას სადილზე
ვუყვები").

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT (run every item)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading matches "## გაკვეთილი NN — ..." exactly
[ ] NN runs 01, 02, 03 without gaps or duplicates
[ ] Every lesson title names a tool/action/artifact after the em-dash
[ ] Every lesson body is 550–700 words (count; don't guess; aim for 600)
[ ] Every lesson has ALL seven `**bold labels:**` visible in the source
[ ] Labels appear as literal markdown `**კონცეფცია:**` — not as implicit paragraph topics
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] No ### subheadings inside lesson bodies
[ ] Every tool named in any lesson body appears in the tools section
[ ] No category in tools section has only one tool
[ ] Final-outcome bullets start with ✓ (U+2713), not ✔
[ ] Stats line is a single `·`-separated line, not bullets
[ ] "დონე:" uses Georgian დ, not Latin d
[ ] No English calques; Georgian reads natively

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with the "# {TITLE}" line and end with the
footer line. Nothing else.
```

---

## Why these subsections map to your tutor

Your tutor's system prompt now reads these Page fields directly:

| Lesson subsection | Creator AI extracts → Page field | Tutor does what with it? |
|---|---|---|
| `**კონცეფცია:**` + `**მაგალითი:**` | `contentBlocks` | Teaches the material page by page |
| `**ვარჯიში:**` | `checkQuestions` (synthesized) | Mid-page comprehension checks |
| `**მცდარი წარმოდგენები:**` | `commonMisconceptions` | Intercepts wrong student thinking in real time |
| `**რეალური გამოყენება:**` | `realWorldApplications` | Makes abstract concepts concrete when student is stuck |
| `**ხიდი წინა გაკვეთილიდან:**` | `bridgeFromPrevious` | Opens the page for returning students |
| `**გასაღები:**` | Closing reflection + `summary` | Seeds the lesson summary used for course coherence |

Drop the bold labels and the tutor loses those abilities. Keep them and the tutor actively uses every field.

---

## Prior prompts removed

`ai-prompting-syllabus.md` and `syllabus-generator.md` are gone — those produced syllabus-only documents for the old syllabus pipeline (also deleted). Only `full-course-pdf.md` remains.

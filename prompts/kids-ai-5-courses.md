# AI Academy — AI for Kids

## Full Course Content Prompts — Courses 01 through 05

Each prompt below generates a **complete** course document in Georgian Markdown — full lesson bodies (550–700 words each) with the **seven labeled subsections** the pipeline needs to populate the AI tutor's misconceptions / real-world-applications / bridge fields.

These five courses form a kids-focused track. Lessons are written to be read aloud by a parent or teacher for the youngest age groups, and read directly by the student for older ones. Tone is playful but precise; AI tools are always introduced with a name and a short safety note.

---

## 📌 How to use this document

1. Find the course you need (01 through 05 below).
2. Copy the **entire** prompt block — from the line starting `You are writing a COMPLETE COURSE DOCUMENT…` down to the line ending `…Nothing else.`
3. Paste into ChatGPT — GPT-4o or later works best. Claude Opus 4 also works.
4. ChatGPT outputs a Georgian Markdown document (10,000–20,000+ words).
5. If ChatGPT stops mid-way, reply `გააგრძელე იქიდან, სადაც შეჩერდი`.
6. Paste the output into Google Docs → export as PDF or DOCX.
7. Upload via `/admin` — single file for review mode, multiple files for queue mode.

## ⚠️ Special notes for the kids track

- **Tone:** simple sentences, short paragraphs, frequent concrete imagery. Even the bold-label subsections must read like they are addressed to a curious child, not to a working professional.
- **Safety:** every lesson body that introduces a new tool must contain at least one bullet inside `**მცდარი წარმოდგენები:**` or `**რეალური გამოყენება:**` reminding the student that an adult is involved (account, supervision, or review of output).
- **Account-bound tools:** ChatGPT, Claude, Gemini, Midjourney, etc. are used through a parent/teacher account. The lesson never instructs a child under 13 to create their own account.
- **Word counts and labels do NOT change.** R1–R5 still apply exactly as in the adult tracks. The kids angle is delivered through tone and content choices, not by relaxing the structure.

---

## COURSE 01 — Beginner — `What is AI? (Ages 6–9)`

კატეგორია: AI for Kids · დონე: Beginner · წინაპირობა: არ არის საჭირო — ეს კატეგორიის პირველი კურსია

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform. This course is part of the AI for Kids track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         What is AI? (Ages 6–9)
Category:             AI for Kids
Level:                Beginner
Prerequisite course:  არ არის საჭირო — ეს კატეგორიის პირველი კურსია
Target audience:      6–9 წლის ბავშვები, რომლებიც კურსს გადიან მშობლის ან მასწავლებლის თანხლებით. გაკვეთილები იწერება ისე, რომ უფროსმა შეძლოს მათი ხმამაღლა წაკითხვა და ახსნა.
Constraints / focus:  ენა — მარტივი, მოკლე წინადადებები, ბავშვისთვის გასაგები. ყოველი კონცეფცია — ხელშესახები მაგალითით (სათამაშო, ცხოველი, კერძი, თამაში). ხელსაწყოები ხსნება მხოლოდ მშობლის/მასწავლებლის ანგარიშის ფარგლებში — ChatGPT (Voice Mode), Google Search-ის "AI Overview", Siri / Google Assistant. ყოველი გაკვეთილი მოიცავს უსაფრთხოების უმოკლეს შეხსენებას. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 …
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, ACTION, or CONCRETE ARTIFACT
  appropriate for a 6–9-year-old (e.g., "ChatGPT-ს ხმით ვეკითხებით", "AI ნახატის
  გამოცნობა", not "AI-ის ისტორია").
- Never skip a number. Never reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS
Every lesson body must contain between 550 and 700 Georgian words.
Target 600. Do not submit anything below 550. Even at 6–9 the body
stays at full length — depth comes from concrete examples, not from
short text.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line, followed by the content. NOT optional, NOT decorative. The
downstream parser searches for these literal markdown strings
(`**კონცეფცია:**`, etc.) to populate the tutor's misconceptions /
real-world-applications / bridge fields. Flowing prose without the
bold markers = those fields stay empty = tutor loses half its
behavior.

Use these EXACT Georgian labels as bold markdown (`**label:**`).

   **კონცეფცია:** ~100 words. Explain the idea in plain Georgian
   for a 6–9-year-old, with one concrete anchor (a toy, animal,
   game, or food).

   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific tool. Show the exact short Prompt the child says or types
   (with adult help) — fenced code block is fine. Show what the AI
   returns. Show what the child notices or does next.

   **ვარჯიში:** ~80 words. One specific 5–10 minute hands-on activity
   the child does WITH a parent or teacher. Imperative instruction.

   **მცდარი წარმოდგენები:** 2–4 short bullets. Typical wrong ideas a
   child this age might bring (e.g., "AI knows me", "AI is alive",
   "AI is always right"). Each bullet under 20 words.

   **რეალური გამოყენება:** 2–4 short bullets. Where the child sees
   AI in everyday life — at home, at school, in toys, in shows.

   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only; omit on Lesson 01.)
   1–2 sentences connecting this lesson to the previous one.

   **გასაღები:** ONE sentence — short and child-memorable. Lesson's
   final line. Starts with "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.

R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS.

KIDS-TRACK SAFETY RULE
Every lesson must, in either **მცდარი წარმოდგენები** or **რეალური
გამოყენება**, contain ONE bullet that names the adult role
(მშობელი / მასწავლებელი) — supervising, opening the account, or
checking the AI's answer.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# What is AI? (Ages 6–9)

*One-line italic subtitle — playful, tells the child what they will discover.*

დონე: Beginner · კატეგორია: AI for Kids
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences. Speak to the parent/teacher reader: why a 6–9-year-old
benefits from understanding AI now. End with a concrete numeric claim
(e.g., "კურსის ბოლოს ბავშვი 5 AI-ხელსაწყოს ცნობს და 3-ს იყენებს").

## ვისთვისაა კურსი?
4–6 bullets — personas in this track:
- **მშობელი** — pain + why this course
- **მასწავლებელი** — pain + why this course
- **ცნობისმოყვარე ბავშვი** — pain + why this course
- ... etc.

## გაკვეთილი 01 — [specific title]
[550–700 words, seven bold-label subsections. Lesson 01 omits bridge.
Include kids-track safety bullet.]

## გაკვეთილი 02 — [specific title]
[550–700 words, all seven subsections including bridge.]

...continue to full scope (Beginner narrow topic: 10–12 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Example categories: "ხმოვანი ასისტენტები"
(Siri, Google Assistant, Alexa), "ჩატბოტები" (ChatGPT, Claude, Gemini),
"AI ძიებაში" (Google AI Overview, Bing Copilot), "AI ბავშვების
პროდუქტებში" (YouTube Kids რეკომენდაცია, Duolingo, Khan Academy Kids).
Every tool named in any lesson body MUST appear here. No one-tool
categories.

## რას ისწავლი კურსის ბოლოს?
6–10 bullets starting with ✓ (U+2713; not ✔):
- ✓ [concrete, demonstrable outcome a 6–9-year-old can show a parent]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading "## გაკვეთილი NN — ..." exact (em-dash, padded NN)
[ ] NN runs 01..NN without gaps or duplicates
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] Every lesson contains at least one adult-supervision bullet
[ ] Every tool named in a lesson appears in the tools section
[ ] Final-outcome bullets start with ✓ (U+2713)
[ ] Stats line is single `·`-separated line
[ ] "დონე:" uses Georgian დ
[ ] Language is age-appropriate for 6–9 (short sentences, concrete words)
[ ] Zero code

Scope: Beginner narrow topic — aim for 10–12 lessons covering: what AI
is, what it isn't, where children meet AI daily, how to ask a question,
how to listen to AI's answer, how to check if it's right, when to ask
an adult.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble, no
meta-commentary. Start with "# What is AI? (Ages 6–9)" and end with
the footer line. Nothing else.
```

---

## COURSE 02 — Beginner — `Talking to AI — Fun with Chatbots (Ages 6–9)`

კატეგორია: AI for Kids · დონე: Beginner · წინაპირობა: What is AI? (Ages 6–9)

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform. This course is part of the AI for Kids track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Talking to AI — Fun with Chatbots (Ages 6–9)
Category:             AI for Kids
Level:                Beginner
Prerequisite course:  What is AI? (Ages 6–9)
Target audience:      6–9 წლის ბავშვები, რომლებმაც გაიარეს პირველი კურსი და მზად არიან რეალურად ისაუბრონ ჩატბოტებთან მშობლის/მასწავლებლის თანხლებით.
Constraints / focus:  ფოკუსი — საუბრის უნარი, არა თეორია. ხელსაწყოები: ChatGPT (Voice Mode + Text), Claude, Gemini, Microsoft Copilot. ყოველი გაკვეთილი ასწავლის ერთ კონკრეტულ "კითხვის ფორმას" (ამიხსენი როგორც 6 წლის..., მომიყევი ისტორია... შესახებ, თუ რას იცი... შესახებ). უსაფრთხოება — ყოველ გაკვეთილში: "თუ AI უცნაურს ან საშიშს გეუბნება, აჩვენე უფროსს". კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a chatbot tool, a concrete
question pattern, or a kid-friendly artifact (e.g., "ChatGPT-ს
ვეუბნებით 'ამიხსენი როგორც 7 წლის'"). Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate tutor fields. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The idea in child-friendly Georgian.
   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific chatbot. Show the exact child-friendly Prompt (fenced code
   block). Show the AI's answer. Show what the child does next.
   **ვარჯიში:** ~80 words. One 5–10 min activity with a parent/teacher.
   **მცდარი წარმოდგენები:** 2–4 short bullets. Wrong ideas this age
   commonly has about chatbots ("ჩატბოტი ჩემი მეგობარია", "ჩატბოტი
   ყოველთვის სიმართლეს ამბობს", etc.).
   **რეალური გამოყენება:** 2–4 short bullets. Where this question
   pattern helps in school, at home, with hobbies.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE child-memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

KIDS-TRACK SAFETY RULE
Every lesson must include — in **მცდარი წარმოდგენები** or **რეალური
გამოყენება** — at least one bullet that explicitly names the
adult-supervision aspect (მშობელი/მასწავლებელი ხსნის ანგარიშს /
ამოწმებს პასუხს / ბავშვი უცნაურ პასუხს უფროსს აჩვენებს).

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Talking to AI — Fun with Chatbots (Ages 6–9)

*One-line italic subtitle.*

დონე: Beginner · კატეგორია: AI for Kids
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 10 question patterns
mastered, 4 chatbots tried).

## ვისთვისაა კურსი?
4–6 bullets — parent, teacher, curious child, shy child, child who
asks too many questions, etc.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge. Adult-supervision bullet.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Beginner narrow topic: 10–12 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories like "ჩატბოტები" (ChatGPT,
Claude, Gemini, Microsoft Copilot), "ხმოვანი რეჟიმები" (ChatGPT Voice,
Gemini Live), "კითხვის ფორმები" (ELI5 / "ამიხსენი როგორც...", "მომიყევი
ისტორია", "შემიდარე..."), "უსაფრთხოების ფუნქციები" (Parental controls,
Safe Search). No one-tool categories. Every tool named in lessons
appears here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — what the 6–9-year-old can DO at the end.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] Every lesson contains adult-supervision bullet
[ ] Every lesson teaches ONE distinct question pattern or chatbot
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no English calques in body text
[ ] Zero code

Scope: Beginner narrow topic — 10–12 lessons covering: how to start a
chat, "ELI5"-style asking, asking for a story, asking to compare,
asking step-by-step, voice vs. text, what to do when AI is wrong,
when to stop and ask an adult.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# Talking to AI — Fun with Chatbots (Ages 6–9)" and end with the
footer. Nothing else.
```

---

## COURSE 03 — Beginner — `AI Art & Drawing with Kids (Ages 8–12)`

კატეგორია: AI for Kids · დონე: Beginner · წინაპირობა: Talking to AI — Fun with Chatbots (Ages 6–9)

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform. This course is part of the AI for Kids track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below exists
because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI Art & Drawing with Kids (Ages 8–12)
Category:             AI for Kids
Level:                Beginner
Prerequisite course:  Talking to AI — Fun with Chatbots (Ages 6–9)
Target audience:      8–12 წლის ბავშვები, რომლებიც უყვართ ხატვა და ვიზუალური თამაშები. გაკვეთილებს ისინი თვითონ კითხულობენ, მაგრამ ანგარიში და გადახდები — მშობლის ხელშია.
Constraints / focus:  ფოკუსი — AI გამოსახულების შექმნა და ნახატის გაუმჯობესება. ხელსაწყოები: ChatGPT (Image generation), Microsoft Copilot Designer, Google Gemini Image, Canva Magic Studio (Kids/Edu), Adobe Firefly. ყოველი გაკვეთილი ასწავლის ერთ ვიზუალურ ტექნიკას ან Prompt-ის ნაწილს (სტილი, ფერი, ემოცია, კომპოზიცია, პერსონაჟი). საავტორო უფლებები და "AI-ნახატი არ არის ჩვენი მთლიანი ნახატი" — გასაკეთებელი ცნება. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool, technique, or
concrete artifact (e.g., "Copilot Designer-ით სათამაშოს დიზაინი").
Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate tutor fields. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The visual idea explained simply, with
   a non-AI anchor a child knows (e.g., comparing AI image to a
   crayon drawing or a photo).
   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific image tool. Show the exact Georgian Prompt the child types
   (fenced code block). Describe in words what the AI generates. Show
   how the child improves it (next Prompt iteration).
   **ვარჯიში:** ~80 words. One 5–10 min imperative activity — make
   one image, then improve it once.
   **მცდარი წარმოდგენები:** 2–4 bullets. Wrong ideas: "AI ნახავს
   ჩემს ფიქრს", "AI-ით შექმნილი ნახატი ჩემია 100%-ით", "ნებისმიერი
   სიტყვა იმუშავებს Prompt-ად", etc.
   **რეალური გამოყენება:** 2–4 bullets. Where the child uses AI art:
   სკოლის პროექტი, დაბადების დღის ბარათი, კომიქსი, თამაშის პერსონაჟი.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

KIDS-TRACK SAFETY RULE
Every lesson must include at least one bullet (in misconceptions or
real-world) that names adult involvement: account / payment / image
review (especially for sharing online).

COPYRIGHT RULE
At least 2 lessons in the course must explicitly address: AI image
ownership, copying real artists' styles, and what is OK vs. not OK to
share. These can be standalone lessons or strong subsections inside
existing ones — but the tools section must include a category that
covers it.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI Art & Drawing with Kids (Ages 8–12)

*One-line italic subtitle.*

დონე: Beginner · კატეგორია: AI for Kids
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 8 visual techniques, 4
tools tried, 1 mini-portfolio of 5 images).

## ვისთვისაა კურსი?
4–6 bullets — child-artist, kid-comic-creator, school-project-maker,
parent supporting creativity, art teacher, etc.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Beginner broad topic: 14–16 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories like "AI image generators"
(ChatGPT Image, Copilot Designer, Gemini Image, Adobe Firefly),
"Kid-friendly creative tools" (Canva Magic Studio, Tinkercad,
Scratch + AI extensions), "Prompt-ის ელემენტები" (სტილი, ფერი,
განწყობა, კომპოზიცია), "უსაფრთხოება და უფლებები" (parental
controls, content filters, ownership rules). Every tool named in
any lesson MUST appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — concrete things the child can produce and explain.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] Every lesson contains adult-supervision bullet
[ ] At least 2 lessons explicitly address ownership / artist-style /
    sharing rules
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no code

Scope: Beginner broad topic — 14–16 lessons covering: making first
image, describing style, describing color, describing emotion,
describing composition, character design, scene design, improving an
image, comparing two tools, ownership and copying, sharing an image,
making a small portfolio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI Art & Drawing with Kids (Ages 8–12)" and end with the footer.
Nothing else.
```

---

## COURSE 04 — Beginner — `Storytelling with AI (Ages 8–12)`

კატეგორია: AI for Kids · დონე: Beginner · წინაპირობა: AI Art & Drawing with Kids (Ages 8–12)

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform. This course is part of the AI for Kids track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Storytelling with AI (Ages 8–12)
Category:             AI for Kids
Level:                Beginner
Prerequisite course:  AI Art & Drawing with Kids (Ages 8–12)
Target audience:      8–12 წლის ბავშვები, რომლებსაც უყვართ ისტორიების მოგონება — წერა, კითხვა, მოყოლა. გაკვეთილებს ისინი თვითონ კითხულობენ; მშობელი/მასწავლებელი თანხლებს ანგარიშზე და მზა ნამუშევრის გადახედვაზე.
Constraints / focus:  ფოკუსი — AI როგორც თანა-ავტორი, არა შემცვლელი. ხელსაწყოები: ChatGPT, Claude, Gemini, NotebookLM, ElevenLabs (ხმის გახმოვანება — მშობლის თანხმობით), Suno (სიმღერად ისტორიის გარდაქმნა), Canva Magic Write. ყოველი გაკვეთილი ასწავლის ერთ ისტორიის ელემენტს (გმირი, კონფლიქტი, ლანდშაფტი, დიალოგი, შემობრუნება, ფინალი) ან ერთ რეჟიმს (კოლაბორაცია, რედაქტირება, გახმოვანება). ბიჭის/გოგოს როლების სტერეოტიპებზე ფრთხილი ენა. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool, story-element, or
concrete artifact (e.g., "Claude-თან ერთად მთავარი გმირის შექმნა").
Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
to populate tutor fields. Flowing prose = tutor goes flat.

   **კონცეფცია:** ~100 words. The story idea explained with a known
   anchor (a fairy tale, a cartoon, a book the child likely knows).
   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific tool. Show the exact Prompt (fenced code block) — long
   enough to teach the technique. Show what the AI returns (a short
   snippet, summarized). Show how the child edits or extends it.
   **ვარჯიში:** ~80 words. One 5–10 min imperative activity —
   produce a tiny piece of a story.
   **მცდარი წარმოდგენები:** 2–4 bullets. "AI შემიქმნის მთელ
   ისტორიას ჩემ მაგივრად", "AI-ის ვერსია ერთადერთი სწორია",
   "გრძელი ისტორია = კარგი ისტორია", etc.
   **რეალური გამოყენება:** 2–4 bullets. Where this technique helps:
   სკოლის თხზულება, კომიქსის სცენარი, ოჯახის თამაში, ბლოგი,
   სასაუბრო ვიდეო.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

KIDS-TRACK SAFETY RULE
Every lesson must include at least one bullet on adult involvement —
especially for voice/audio tools (ElevenLabs, Suno) where parental
review of the final output is required before sharing.

CO-AUTHORSHIP RULE
At least 2 lessons must explicitly teach: how to keep the child's
voice/idea central while AI assists — not the other way around.
Misconceptions like "AI შემიქმნის მთელ ისტორიას ჩემ მაგივრად" must
appear at least once.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Storytelling with AI (Ages 8–12)

*One-line italic subtitle.*

დონე: Beginner · კატეგორია: AI for Kids
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 finished short story
of 800–1200 words by course end, 5 story-elements practiced, 3 tools
tried).

## ვისთვისაა კურსი?
4–6 bullets — kid-writer, kid-storyteller, shy-writer who needs
ideas, school-essay-helper, parent, literature teacher.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Beginner broad topic: 14–16 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories like "ისტორიის თანა-ავტორები"
(ChatGPT, Claude, Gemini), "კვლევითი მხარდაჭერა" (NotebookLM, Perplexity),
"ხმოვანი/მუსიკალური" (ElevenLabs, Suno), "ვიზუალური თანხლება" (DALL·E,
Copilot Designer — for cover/scene), "სარედაქციო ხელსაწყოები"
(Grammarly, Canva Magic Write). Every tool named in a lesson MUST
appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — what the child can show: a finished short story,
a character bio, an audio-narrated scene, etc.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] Every lesson contains adult-supervision bullet
[ ] At least 2 lessons teach co-authorship / "AI as helper, not author"
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no code
[ ] No gender stereotypes in example characters

Scope: Beginner broad topic — 14–16 lessons covering: idea spark,
character, setting, conflict, dialogue, scene, twist, ending,
revision, voice narration, illustration pairing, sharing safely,
finishing one short story.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# Storytelling with AI (Ages 8–12)" and end with the footer.
Nothing else.
```

---

## COURSE 05 — Intermediate — `Coding Basics with AI Help (Ages 10–14)`

კატეგორია: AI for Kids · დონე: Intermediate · წინაპირობა: Storytelling with AI (Ages 8–12)

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform. This course is part of the AI for Kids track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         Coding Basics with AI Help (Ages 10–14)
Category:             AI for Kids
Level:                Intermediate
Prerequisite course:  Storytelling with AI (Ages 8–12)
Target audience:      10–14 წლის ბავშვები და ახალგაზრდა მოზარდები, რომლებიც პირველად ხვდებიან კოდს. იციან, რომ AI არსებობს, იყენებენ ჩატბოტებს — ახლა სურთ ერთი მცირე პროგრამის ავტ. გაკვეთება. მშობელი/მასწავლებელი თანხლებს ანგარიშზე, მაგრამ კოდს ბავშვი დაწერს თვითონ AI-ის დახმარებით.
Constraints / focus:  ერთი ენა მთელი კურსის განმავლობაში — Python (Scratch-ის ბლოკებიდან გამოსული). გარემო: replit.com (web-based, account-friendly), Google Colab (parental account), Trinket. AI ხელსაწყოები: ChatGPT (Code), Claude, GitHub Copilot (parental account), Cursor (parental account). ყოველი გაკვეთილი ასწავლის ერთ პატარა პროგრამულ ცნებას (input, print, if, loop, list, function) და ერთ AI-collaboration habit-ს (Prompt-ის წერა შეცდომისთვის, კოდის ახსნის თხოვნა, შედარება ვერსიებს შორის). უსაფრთხოება — ყოველ გაკვეთილში: მშობლის ანგარიში, არ ეთანხმება უცნობ ბმულებს, ჩაიწერე საკუთარი მონაცემები. კოდი — დიახ, მცირე ნიმუშებად, fenced code blocks-ში.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a Python concept, an AI
collaboration habit, or a concrete tiny project (e.g.,
"Replit-ში პირველი print() და როგორ ვთხოვოთ ChatGPT-ს ახსნა").
Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550. (At Intermediate level the body still stays in this range
even with code blocks.)

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate tutor fields. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The Python idea explained with a
   non-code anchor (recipe, checklist, board game rule).
   **მაგალითი:** ~150 words. ONE end-to-end mini-example. Show: the
   exact Prompt the student types into ChatGPT/Claude (fenced code
   block), the Python code the AI returns (separate fenced code
   block), and what the student does after running it in Replit.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise — a
   tiny modification to the example, with one specific Prompt to
   ask the AI for help.
   **მცდარი წარმოდგენები:** 2–4 bullets. Common wrong thinking new
   coders bring ("AI კოდი ყოველთვის სწორია", "კოპირება საკმარისია,
   გაგება საჭირო არ არის", "შეცდომა — წარუმატებლობაა"), or wrong
   AI-collaboration thinking ("AI-ს ვუთხრა 'გააკეთე' და გაკეთდება").
   **რეალური გამოყენება:** 2–4 bullets. Where this Python concept
   shows up in real apps the student uses (login forms, game scores,
   YouTube playlists, school grading sheets).
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

KIDS-TRACK SAFETY RULE
Every lesson must include at least one bullet on adult involvement
(account, payment, what to do if AI suggests installing something),
or a no-personal-data bullet (do not paste your real address, phone,
school, etc., into a Prompt).

AI-AS-PAIR-PROGRAMMER RULE
Every lesson must teach BOTH: a Python concept AND an AI-collaboration
habit (how to ask for help, how to read AI's code, how to debug with
AI, how to refuse copy-paste, etc.). A lesson that teaches only Python
or only AI usage is incomplete.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson. Also
forbidden: a lesson where the AI writes the whole program and the
student only runs it — the student must always modify or extend.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Coding Basics with AI Help (Ages 10–14)

*One-line italic subtitle — the AI-pair-programming angle.*

დონე: Intermediate · კატეგორია: AI for Kids
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 finished mini-project
the student can run and show; 8 Python concepts mastered; 5 AI
collaboration habits learned).

## ვისთვისაა კურსი?
4–6 bullets — kid coder starting out, kid coming from Scratch, parent
helping, computer-club teacher, kid who's tired of "copy answer from
AI", etc.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge. Both Python concept AND
AI-collab habit. At least one fenced code block.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge. Both Python AND
AI-collab habit. Code blocks as needed.]

...continue (Intermediate: 16–20 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories like "AI კოდის ასისტენტები"
(ChatGPT, Claude, Gemini, Microsoft Copilot Chat), "IDE-ში
ჩაშენებული AI" (GitHub Copilot, Cursor, Replit AI), "კოდის გარემო"
(Replit, Google Colab, Trinket), "Python სასწავლო პლატფორმები"
(Khan Academy, Codecademy Junior). Every tool named in a lesson
MUST appear here. No one-tool categories.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — what the child can build, run, and explain.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] Every lesson contains adult-supervision OR no-personal-data bullet
[ ] Every lesson teaches BOTH a Python concept AND an AI-collab habit
[ ] No lesson lets AI write the whole program — student always modifies
[ ] All code blocks are fenced and Python only
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no Latin d in stat lines

Scope: Intermediate — 16–20 lessons covering: Replit setup, print,
input, variables, if/else, loops, lists, dictionaries, functions,
debugging with AI, reading AI's code critically, refusing bad
suggestions, mini-project planning, building one end-to-end small
program (e.g., quiz game, score tracker, joke generator).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# Coding Basics with AI Help (Ages 10–14)" and end with the footer.
Nothing else.
```

---

AI Academy © 2025–2026 · ai-academy.ge · info@ai-academy.ge

# AI Academy — AI Creative Tools

## Full Course Content Prompts — Courses 01 through 06

Each prompt below generates a **complete** course document in Georgian Markdown — full lesson bodies (550–700 words each) with the **seven labeled subsections** the pipeline needs to populate the AI tutor's misconceptions / real-world-applications / bridge fields.

These six courses form a track for working creatives — designers, marketers, content creators, video producers, musicians, and product designers — who want to integrate AI into their daily creative workflow. The track moves from a generalist toolkit overview (01) through specialized tools by medium (image, design, video, audio, UI/UX).

---

## 📌 How to use this document

1. Find the course you need (01 through 06 below).
2. Copy the **entire** prompt block — from the line starting `You are writing a COMPLETE COURSE DOCUMENT…` down to the line ending `…Nothing else.`
3. Paste into ChatGPT — GPT-4o or later works best. Claude Opus 4 also works.
4. ChatGPT outputs a Georgian Markdown document (10,000–20,000+ words).
5. If ChatGPT stops mid-way, reply `გააგრძელე იქიდან, სადაც შეჩერდი`.
6. Paste the output into Google Docs → export as PDF or DOCX.
7. Upload via `/admin` — single file for review mode, multiple files for queue mode.

## ⚠️ Special notes for the creative-tools track

- **Tone:** professional creative voice — speaks to working designers/creators, not hobbyists. Assumes the student has a creative project on their desk right now and wants AI to make a concrete part of it faster.
- **Hands-on bias:** every lesson must produce a real artifact (image, layout, clip, audio sample, screen). Pure-theory lessons are forbidden.
- **Tool-naming discipline:** when a lesson teaches a technique, it must name the SPECIFIC tool and surface where that technique lives (panel, button, prompt field). Vague references ("an AI tool can help...") do not pass.
- **Copyright & licensing:** every course must address commercial-use rights at least once — what's safe to ship to a paying client, what's not.
- **Word counts and labels do NOT change.** R1–R5 still apply exactly as in the other tracks.

---

## COURSE 01 — Beginner — `AI Creative Tools 101 — The Creator's Toolkit`

კატეგორია: AI Creative Tools · დონე: Beginner · წინაპირობა: არ არის საჭირო — ეს კატეგორიის პირველი კურსია

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals. This course is
part of the AI Creative Tools track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor that actively teaches it
to the student. Every rule below exists because it changes what the tutor
can do with your content. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI Creative Tools 101 — The Creator's Toolkit
Category:             AI Creative Tools
Level:                Beginner
Prerequisite course:  არ არის საჭირო — ეს კატეგორიის პირველი კურსია
Target audience:      მომუშავე კრეატივები — დიზაინერები, მარკეტოლოგები, კონტენტ-შემქმნელები, ვიდეო-პროდიუსერები, SMM-სპეციალისტები — რომლებიც AI-ს ეცნობიან როგორც პროფესიულ ხელსაწყოს და სურთ ერთიანი სურათი მიიღონ — რომელი AI ხელსაწყო რომელი ამოცანისთვის უკეთესია.
Constraints / focus:  ფოკუსი — landscape-overview: სტუდენტი ბოლოს ცნობს მინიმუმ 15 ხელსაწყოს და ხვდება, რომელი როდის გამოიყენოს. ხელსაწყოები: ChatGPT, Claude, Gemini (ტექსტი); Midjourney, DALL·E, Adobe Firefly, Stable Diffusion (გამოსახულება); Canva Magic Studio, Figma AI (დიზაინი); Runway, Sora, Pika (ვიდეო); ElevenLabs, Suno, Udio (აუდიო); Notion AI, Otter.ai (პროდუქტიულობა). თითოეულ გაკვეთილში — შედარების კრიტერიუმი (ფასი, ხარისხი, სიჩქარე, ლიცენზია). ნაკლები სიღრმე, მეტი მიმოხილვა — სიღრმე მოდის შემდგომ კურსებში.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
Every lesson starts with exactly this line, on its own:

   ## გაკვეთილი NN — [specific title]

- NN is zero-padded two digits: 01, 02, 03 …
- The dash is an em-dash (—). Not a hyphen (-). Not an en-dash (–).
- The title (after the em-dash) must name a TOOL, MEDIUM, or CONCRETE
  COMPARISON (e.g., "Midjourney vs. DALL·E — როდის რომელი", not
  "AI ხელსაწყოების ისტორია").
- Never skip a number. Never reuse a number.

R2 — LESSON BODY LENGTH: 550–700 WORDS
Every lesson body must contain between 550 and 700 Georgian words.
Target 600. Do not submit anything below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line, followed by the content. NOT optional, NOT decorative. The
downstream parser searches for these literal markdown strings
(`**კონცეფცია:**`, etc.) to populate the tutor's misconceptions /
real-world-applications / bridge fields. Flowing prose without the
bold markers = those fields stay empty = tutor loses half its
behavior.

Use these EXACT Georgian labels as bold markdown (`**label:**`).

   **კონცეფცია:** ~100 words. The idea — what category of tool this
   is, what creative problem it solves.
   **მაგალითი:** ~150 words. ONE real end-to-end example. Name the
   specific tool. Show the exact Prompt or input the creator types
   (fenced code block where relevant). Show what the tool returns.
   Show how the creator uses it in a real deliverable.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise — try
   the tool with a specific creative input.
   **მცდარი წარმოდგენები:** 2–4 short bullets. Wrong ideas working
   creatives bring ("ერთი ხელსაწყო ყველაფერს აკეთებს", "უფასო ვერსია
   ყოველთვის საკმარისია", "AI-ით შექმნილი = კომერციულად უსაფრთხო").
   **რეალური გამოყენება:** 2–4 short bullets. Concrete creative
   deliverables where this tool wins (Instagram post, client mockup,
   thumbnail, etc.).
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+ only.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line. Starts with
   "გასაღები: ".

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — CONTENT DOES NOT REPEAT ACROSS LESSONS.

LICENSING RULE
At least 2 lessons must explicitly address commercial-use rights —
what each tool's license permits, what it forbids, what changes
between free and paid tiers. Misconceptions like "AI-ით შექმნილი =
კომერციულად უსაფრთხო" must appear at least once.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI Creative Tools 101 — The Creator's Toolkit

*One-line italic subtitle — the landscape-overview angle.*

დონე: Beginner · კატეგორია: AI Creative Tools
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences. Why a working creative needs a map of AI tools NOW.
End with concrete numeric claim (e.g., 15+ tools recognized, 5
categories navigated confidently).

## ვისთვისაა კურსი?
4–6 bullets — graphic designer, marketer/SMM, content creator, video
editor, freelance creative, in-house brand designer.

## გაკვეთილი 01 — [specific title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [specific title]
[550–700 words, seven subsections with bridge.]

...continue (Beginner broad topic: 14–16 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories: "ტექსტი/იდეა" (ChatGPT,
Claude, Gemini), "გამოსახულება" (Midjourney, DALL·E, Firefly, Stable
Diffusion), "დიზაინი" (Canva Magic Studio, Figma AI), "ვიდეო"
(Runway, Sora, Pika), "აუდიო" (ElevenLabs, Suno, Udio),
"პროდუქტიულობა" (Notion AI, Otter.ai). Every tool named in any
lesson MUST appear here. No one-tool categories.

## რას ისწავლი კურსის ბოლოს?
6–10 bullets starting with ✓ (U+2713; not ✔):
- ✓ [concrete, demonstrable outcome]

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK BEFORE YOU OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every heading "## გაკვეთილი NN — ..." exact (em-dash, padded NN)
[ ] NN runs without gaps or duplicates
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits "ხიდი წინა გაკვეთილიდან"; lessons 02+ include it
[ ] Every lesson ends with "გასაღები: ..." as the final line
[ ] At least 2 lessons explicitly address commercial-use licensing
[ ] Every tool named in a lesson appears in tools section
[ ] Final-outcome bullets start with ✓
[ ] Stats line is single `·`-separated line
[ ] "დონე:" uses Georgian დ
[ ] At least 5 tool categories represented across lessons

Scope: Beginner broad topic — aim for 14–16 lessons covering: tool
landscape, when to use text-AI vs. image-AI, image tool comparison,
design tool comparison, video tool overview, audio tool overview,
productivity overlay, pricing/licensing basics, building a personal
toolkit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble,
no meta-commentary. Start with "# AI Creative Tools 101 — The
Creator's Toolkit" and end with the footer line. Nothing else.
```

---

## COURSE 02 — Beginner — `AI Image Generation — Midjourney & DALL·E`

კატეგორია: AI Creative Tools · დონე: Beginner · წინაპირობა: AI Creative Tools 101 — The Creator's Toolkit

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals. This course is
part of the AI Creative Tools track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI Image Generation — Midjourney & DALL·E
Category:             AI Creative Tools
Level:                Beginner
Prerequisite course:  AI Creative Tools 101 — The Creator's Toolkit
Target audience:      დიზაინერები, ილუსტრატორები, არტ-დირექტორები, SMM-სპეციალისტები და მარკეტოლოგები, რომლებსაც სურთ კომერციულად გამოსაყენებელი ხარისხის AI გამოსახულებების შექმნა.
Constraints / focus:  ფოკუსი — Midjourney (v6/v7) და DALL·E 3 (ChatGPT-ში). მე-2 დონის ხელსაწყოები: Adobe Firefly (კომერციული უსაფრთხოება), Stable Diffusion (Local + ComfyUI — მოკლე ცნობა). სტუდენტი ისწავლის: Prompt-ის სტრუქტურა (subject + style + lighting + composition + camera + parameters), Midjourney-ის პარამეტრები (--ar, --s, --v, --niji, --sref, --cref), DALL·E-ში inline editing, image-to-image, character consistency, batch workflow. ბოლო ვერსიების მაგალითები სასურველია. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool, technique, or
concrete artifact (e.g., "Midjourney --sref-ით სტილის ფიქსაცია").
Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. The parser searches for literal markdown strings
(`**კონცეფცია:**`, etc.) to populate tutor fields. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The image-generation idea explained
   with a concrete creative anchor (a deliverable type the student
   recognizes — Instagram post, book cover, product render).
   **მაგალითი:** ~150 words. ONE end-to-end example. Name the
   specific tool. Show the exact Prompt the designer types (fenced
   code block — including parameters like --ar 3:2 --s 250 --v 6).
   Describe what the tool returns. Show how the designer iterates
   (next Prompt with one parameter changed).
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise — make
   one image, refine it once with a parameter change.
   **მცდარი წარმოდგენები:** 2–4 bullets. ("გრძელი Prompt = კარგი
   შედეგი", "Midjourney უკეთესია ყველაფერში", "ერთი try საკმარისია",
   "AI-ით შექმნილი ყოველთვის კომერციულად უსაფრთხოა").
   **რეალური გამოყენება:** 2–4 bullets. Where this technique wins:
   product hero, blog thumbnail, brand mood board, character sheet.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

LICENSING RULE
At least 2 lessons must compare commercial-use rights across
Midjourney, DALL·E, and Firefly. The Firefly "commercially safe"
distinction must appear at least once.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI Image Generation — Midjourney & DALL·E

*Italic subtitle — the working-designer angle.*

დონე: Beginner · კატეგორია: AI Creative Tools
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 finished mini-portfolio
of 10 commercially-safe images by course end).

## ვისთვისაა კურსი?
4–6 bullets — designer, illustrator, art director, SMM, marketer,
freelance brand creator.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Beginner broad topic: 14–16 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories: "ძირითადი გენერატორები"
(Midjourney, DALL·E 3, Adobe Firefly, Stable Diffusion), "Prompt-ის
ელემენტები" (subject, style, lighting, composition, camera),
"Midjourney პარამეტრები" (--ar, --s, --v, --niji, --sref, --cref),
"რედაქტირება" (DALL·E inline edit, Firefly Generative Fill,
Photoshop Generative Expand), "ლიცენზია & უფლებები" (Midjourney
Pro/Standard, Firefly commercial-safe, DALL·E in ChatGPT terms).
Every tool named in a lesson MUST appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — concrete, deliverable-grade outputs.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] At least 2 lessons compare licensing across MJ, DALL·E, Firefly
[ ] Every Prompt example uses real, current parameter syntax
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no English calques

Scope: Beginner broad topic — 14–16 lessons covering: first prompt,
prompt anatomy, subject vs. style, lighting, composition, camera,
Midjourney parameters, --sref / --cref consistency, DALL·E inline
editing, image-to-image, batch workflow, Firefly for commercial work,
licensing basics, building a portfolio.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI Image Generation — Midjourney & DALL·E" and end with the
footer. Nothing else.
```

---

## COURSE 03 — Beginner — `AI Graphic Design with Canva & Adobe Firefly`

კატეგორია: AI Creative Tools · დონე: Beginner · წინაპირობა: AI Image Generation — Midjourney & DALL·E

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals. This course is
part of the AI Creative Tools track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI Graphic Design with Canva & Adobe Firefly
Category:             AI Creative Tools
Level:                Beginner
Prerequisite course:  AI Image Generation — Midjourney & DALL·E
Target audience:      გრაფიკული დიზაინერები, SMM-მენეჯერები, მარკეტოლოგები, ბრენდის ადმინისტრატორები და პრინტ-დიზაინერები, რომლებსაც სურთ AI ფუნქციების ინტეგრირება ყოველდღიურ დიზაინერულ workflow-ში — სწრაფი მოწოდებები, ერთგვაროვანი ბრენდი, კომერციული უსაფრთხოება.
Constraints / focus:  ფოკუსი — Canva Magic Studio (Magic Design, Magic Write, Magic Edit, Magic Eraser, Magic Switch, Brand Kit) და Adobe Firefly + Photoshop (Generative Fill, Generative Expand, Generative Remove, Text Effects, Vector recolor). მე-2 დონის ხელსაწყოები: Recraft, Microsoft Designer, Looka. სტუდენტი ისწავლის: სოც-ქსელის posts, presentation deck, business card, banner, brand-consistent template-ები. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool feature, design
artifact, or workflow (e.g., "Photoshop Generative Fill-ით ფონის
გაფართოება"). Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. NOT optional. Parser searches for literal markdown strings.
Flowing prose = tutor goes flat.

   **კონცეფცია:** ~100 words. The design idea with a concrete
   deliverable anchor (Instagram carousel, deck, business card).
   **მაგალითი:** ~150 words. ONE end-to-end example. Name the tool
   AND the specific feature/panel/button. Show the exact Prompt or
   input the designer enters (fenced code block where text-based).
   Show what the tool returns. Show how the designer integrates it
   into a real layout.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise — make
   one design artifact end-to-end.
   **მცდარი წარმოდგენები:** 2–4 bullets. ("Canva = Magic Design-ის
   ერთი ღილაკი", "Firefly Generative Fill-ი ერთი try-ით სრულდება",
   "ბრენდი წესი არ ჭირდება AI-ით", "AI = ცვლის დიზაინერს").
   **რეალური გამოყენება:** 2–4 bullets. Where this feature wins:
   ბრიფიდან მოწოდებამდე 30 წუთი, კლიენტის 5 ვერსია 1 საათში, ბანერების
   ბაჩი 10-დან 50-მდე.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

BRAND-CONSISTENCY RULE
At least 3 lessons must teach how to maintain brand consistency
(Canva Brand Kit, Firefly Custom Models / Style references, locked
templates). A course that produces beautiful one-off images but no
brand-consistent system is incomplete.

LICENSING RULE
At least 1 lesson must address: client deliverables — what's safe to
hand off (Firefly is commercially safe; mixing in Midjourney requires
that tier; Canva Pro vs. Free changes asset rights).

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI Graphic Design with Canva & Adobe Firefly

*Italic subtitle.*

დონე: Beginner · კატეგორია: AI Creative Tools
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 brand kit, 1
multi-channel campaign of 10 assets by course end).

## ვისთვისაა კურსი?
4–6 bullets — graphic designer, SMM, marketer, brand admin, print
designer, freelance designer.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Beginner broad topic: 14–16 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories: "Canva Magic Studio" (Magic
Design, Magic Write, Magic Edit, Magic Eraser, Magic Switch),
"Adobe AI" (Firefly, Photoshop Generative Fill / Expand / Remove,
Illustrator Vector recolor, Express), "ალტერნატივები" (Recraft,
Microsoft Designer, Looka, Krea), "ბრენდის ერთგვაროვნება" (Canva
Brand Kit, Firefly Custom Models, Figma Variables), "ლიცენზია"
(Canva Pro, Firefly Generative credits, asset rights). Every tool
named in a lesson MUST appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — branded artifacts, ready-to-ship.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] At least 3 lessons cover brand consistency
[ ] At least 1 lesson covers commercial licensing for client work
[ ] Each lesson names a specific tool feature, not generic
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no English calques

Scope: Beginner broad topic — 14–16 lessons covering: Magic Design
basics, Brand Kit setup, Magic Write for copy, Magic Edit & Eraser,
Generative Fill for layouts, Generative Expand for resizing,
Generative Remove for cleanup, Vector recolor for branding,
template systems, multi-channel campaigns, client handoff & licensing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI Graphic Design with Canva & Adobe Firefly" and end with the
footer. Nothing else.
```

---

## COURSE 04 — Intermediate — `AI Video Creation & Editing (Runway, Sora)`

კატეგორია: AI Creative Tools · დონე: Intermediate · წინაპირობა: AI Graphic Design with Canva & Adobe Firefly

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals. This course is
part of the AI Creative Tools track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI Video Creation & Editing (Runway, Sora)
Category:             AI Creative Tools
Level:                Intermediate
Prerequisite course:  AI Graphic Design with Canva & Adobe Firefly
Target audience:      ვიდეო-პროდიუსერები, მონტაჟისტები, კონტენტ-შემქმნელები, რეკლამის შემქმნელები, motion designers და SMM-სპეციალისტები, რომლებიც უკვე იცნობენ AI გამოსახულებას და მზად არიან ვიდეო workflow-ში გადასვლისთვის.
Constraints / focus:  ფოკუსი — Runway (Gen-3 Alpha, Gen-4), Sora (OpenAI), Pika 2.0, Luma Dream Machine, Kling, Hailuo. Companion ხელსაწყოები: Adobe Premiere AI (Generative Extend, Enhance Speech), CapCut AI, ElevenLabs (voiceover), Suno (background music), Descript (text-based editing). სტუდენტი ისწავლის: text-to-video, image-to-video, video-to-video, camera control, character consistency, multi-shot scene assembly, color/audio polish, ლიცენზიური ლიმიტები (face/celebrity, ბრენდი). assumes დღიური AI გამოყენება. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool, technique, or
shot type (e.g., "Runway Gen-3-ით character-consistent dialogue
shot"). Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. Parser searches for literal markdown strings. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The video idea with a concrete shot
   anchor (intro stinger, B-roll, product reveal, dialogue scene).
   **მაგალითი:** ~150 words. ONE end-to-end example. Name the
   specific tool. Show the exact Prompt with all relevant parameters
   (camera move, duration, motion strength) — fenced code block.
   Describe the resulting clip in words (motion, mood, camera).
   Show how the editor integrates it into a timeline.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise —
   produce one shot, refine it once.
   **მცდარი წარმოდგენები:** 2–4 bullets. ("ერთი Prompt-ი იძლევა
   filmable shot-ს", "AI ვიდეო ცვლის გადაღებას ნებისმიერ შემთხვევაში",
   "ცნობილი სახე უსაფრთხოდ შეიძლება Prompt-ში", "გრძელი ხანგრძლივობა
   = კარგი ხარისხი").
   **რეალური გამოყენება:** 2–4 bullets. Where this technique wins:
   reklama spot, product demo B-roll, tutorial intro, social ad,
   mood film for pitch deck.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

WORKFLOW RULE
At least 4 lessons must teach the assembly workflow — not just
generation, but cutting/grading/sound layering across multiple
clips into one finished piece. A course that only generates clips
without ever finishing a piece is incomplete.

LICENSING RULE
At least 1 lesson must address: face/celebrity restrictions,
trademark/brand restrictions, music licensing, and what each tool's
commercial-use license permits.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI Video Creation & Editing (Runway, Sora)

*Italic subtitle — the production-pipeline angle.*

დონე: Intermediate · კატეგორია: AI Creative Tools
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 finished 60-second
multi-shot piece by course end).

## ვისთვისაა კურსი?
4–6 bullets — video producer, editor, content creator, ad creator,
motion designer, SMM.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Intermediate: 16–20 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories: "ვიდეო გენერატორები"
(Runway Gen-3/Gen-4, Sora, Pika, Luma Dream Machine, Kling, Hailuo),
"მონტაჟის AI" (Premiere Generative Extend, Premiere Enhance Speech,
CapCut AI, Descript), "ხმოვანი ხელსაწყოები" (ElevenLabs, Suno,
Eleven Music, Adobe Podcast Enhance), "Image-companion"
(Midjourney, Firefly — for keyframes), "ლიცენზია & ეთიკა"
(face/celebrity, brand, music licensing). Every tool named in a
lesson MUST appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — finished, ship-ready clips and pieces.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] At least 4 lessons cover end-to-end assembly, not just generation
[ ] At least 1 lesson covers face/brand/music licensing
[ ] Each lesson names a specific tool & parameter, not generic
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no English calques

Scope: Intermediate — 16–20 lessons covering: text-to-video basics,
camera moves, image-to-video, video-to-video, character consistency,
multi-shot scene planning, dialogue & lipsync, audio layering
(voiceover + music), color & grading, Premiere/CapCut integration,
restoration with AI, licensing & ethics, finished piece assembly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI Video Creation & Editing (Runway, Sora)" and end with the
footer. Nothing else.
```

---

## COURSE 05 — Intermediate — `AI Music & Audio Production`

კატეგორია: AI Creative Tools · დონე: Intermediate · წინაპირობა: AI Video Creation & Editing (Runway, Sora)

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals. This course is
part of the AI Creative Tools track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI Music & Audio Production
Category:             AI Creative Tools
Level:                Intermediate
Prerequisite course:  AI Video Creation & Editing (Runway, Sora)
Target audience:      მუსიკოსები, ხმის დიზაინერები, podcast-ერები, SMM-კონტენტის შემქმნელები, ვიდეო-პროდიუსერები და კომერციული მუსიკის შემქმნელები, რომლებსაც სურთ AI ხელსაწყოების ინტეგრირება მუსიკისა და აუდიოს ყოველდღიურ პროდუქტიკაში.
Constraints / focus:  ფოკუსი — Suno (v3.5/v4), Udio, Eleven Music (ElevenLabs music), Stable Audio (full-track music); ElevenLabs Voice (TTS, Voice Design, Voice Cloning), Descript Overdub; Adobe Podcast Enhance, Auphonic, Krisp (cleanup); Splice AI, Riffusion (sample/loop). სტუდენტი ისწავლის: სიმღერის Prompt-ი (style + mood + instruments + tempo + structure), lyrics + vocals, instrumental beds for video, podcast voiceover, voice cloning ეთიკურად, audio cleanup workflow. ლიცენზია — სიმღერის კომერციული გამოყენება (Suno Pro/Premier, Udio Pro), voice cloning consent. კოდი — ნული.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool, audio artifact, or
technique (e.g., "Suno-ს Custom Mode-ში სრული სიმღერის შექმნა").
Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. Parser searches for literal markdown strings. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The audio idea with a concrete
   deliverable anchor (TikTok track, podcast intro, ad jingle,
   game loop, voiceover line).
   **მაგალითი:** ~150 words. ONE end-to-end example. Name the
   specific tool. Show the exact Prompt — for Suno Custom Mode
   include style tags, lyrics structure, [Verse]/[Chorus] markers
   (fenced code block). Describe the result in audio terms (BPM,
   instrument layers, mood). Show how the producer uses it in a
   real piece (export, trim, layer with VO).
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise —
   produce one finished snippet (15–30s).
   **მცდარი წარმოდგენები:** 2–4 bullets. ("Suno = ერთი ღილაკი ჰიტს
   ქმნის", "AI ხმის კლონირება ეთიკურია ყოველთვის", "უფასო ვერსიის
   სიმღერა კომერციულად შეიძლება").
   **რეალური გამოყენება:** 2–4 bullets. Where this technique wins:
   reklama jingle 2 საათში, podcast intro/outro, video background,
   game prototype audio, brand sonic identity.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

CONSENT & LICENSING RULE
At least 2 lessons must address: voice cloning consent (you may not
clone someone's voice without explicit permission), and music
commercial licensing (Suno/Udio Free vs Pro, what tier owns the
output, what's safe for client work). The "Free Suno track is NOT
yours commercially" misconception must appear at least once.

WORKFLOW RULE
At least 3 lessons must teach end-to-end pieces (intro stinger
finished, podcast episode mastered, ad bed layered with VO),
not isolated sample generation.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI Music & Audio Production

*Italic subtitle.*

დონე: Intermediate · კატეგორია: AI Creative Tools
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 finished 90-second
track + 1 podcast intro + 1 voiceover by course end).

## ვისთვისაა კურსი?
4–6 bullets — musician, sound designer, podcaster, SMM, video
producer, brand-audio creator.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Intermediate: 16–20 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories: "მუსიკის გენერატორები"
(Suno, Udio, Eleven Music, Stable Audio), "ხმოვანი TTS & cloning"
(ElevenLabs Voice, Descript Overdub, Resemble), "Cleanup & mastering"
(Adobe Podcast Enhance, Auphonic, Krisp, iZotope RX with AI),
"სემპლი/ლუპი" (Splice AI, Riffusion), "ლიცენზია & ეთიკა" (Suno
Pro tier, voice cloning consent, royalty-free vs commercial). Every
tool named in a lesson MUST appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — finished audio artifacts.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] At least 2 lessons address voice consent + music licensing
[ ] At least 3 lessons produce a finished end-to-end piece
[ ] Each lesson names specific tool + feature/parameter
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no English calques

Scope: Intermediate — 16–20 lessons covering: Suno basics,
Custom Mode with style tags + lyrics, song structure, instrumental
beds for video, mastering & polish, ElevenLabs TTS, Voice Design,
Voice Cloning ethically, Descript Overdub, podcast intro/outro,
podcast cleanup, ad jingle, sample/loop workflow, licensing &
consent, finished pieces.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI Music & Audio Production" and end with the footer. Nothing else.
```

---

## COURSE 06 — Intermediate — `AI UI/UX Design — Figma + AI Tools`

კატეგორია: AI Creative Tools · დონე: Intermediate · წინაპირობა: AI Music & Audio Production

📋 **PROMPT — copy everything below this line into ChatGPT**

```
You are writing a COMPLETE COURSE DOCUMENT for AI Academy (ai-academy.ge),
a Georgian e-learning platform for working professionals. This course is
part of the AI Creative Tools track.

Output language: Georgian.
Output format: Markdown.

A downstream pipeline splits your output into lessons using the section
headings, then passes each lesson to an AI tutor. Every rule below
exists because it changes what the tutor can do. Follow them exactly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Course title:         AI UI/UX Design — Figma + AI Tools
Category:             AI Creative Tools
Level:                Intermediate
Prerequisite course:  AI Music & Audio Production
Target audience:      პროდუქტ-დიზაინერები, UI/UX დიზაინერები, frontend-developer-ები, product manager-ები და founder-ები, რომლებსაც სურთ AI-ით სწრაფი prototyping, design system, code-handoff და user research workflow.
Constraints / focus:  ფოკუსი — Figma (Make, AI features, FigJam AI, Figma Sites), Figma plugins: Magician, Diagram, Genius. Companion: v0 (Vercel) — UI from prompt, Lovable, Bolt, Cursor (frontend handoff), Galileo AI/Uizard, Stitch (Google), Relume (sitemap), UXPin Merge, Anthropic Claude / ChatGPT for UX writing. სტუდენტი ისწავლის: AI-ით wireframe → high-fidelity, design system tokens with AI, accessibility/ contrast checks, UX writing, user-research synthesis, code handoff (Figma Make + v0/Lovable). assumes Figma daily use. კოდი — დიახ, მცირე JSX/HTML snippet-ებად fenced blocks-ში.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE FIVE RULES THAT MUST NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

R1 — LESSON HEADING FORMAT
   ## გაკვეთილი NN — [specific title]
NN zero-padded. Em-dash (—). Title names a tool, plugin, screen
artifact, or workflow (e.g., "Figma Make-ით landing page wireframe").
Never skip or reuse.

R2 — LESSON BODY LENGTH: 550–700 WORDS. Target 600. Do not submit
below 550.

R3 — LESSON BODY STRUCTURE — SEVEN LABELED SUBSECTIONS, IN ORDER

CRITICAL: Each subsection MUST start with its bold label on its own
line. Parser searches for literal markdown strings. Flowing prose =
tutor goes flat.

   **კონცეფცია:** ~100 words. The product-design idea with a
   concrete screen anchor (signup, pricing, dashboard, onboarding).
   **მაგალითი:** ~150 words. ONE end-to-end example. Name the
   specific tool/plugin. Show the exact Prompt the designer enters
   (fenced code block). Show what the tool generates (frame names,
   layers, components). Show how the designer cleans/integrates it
   into a real Figma file with design system.
   **ვარჯიში:** ~80 words. One 5–10 min imperative exercise — make
   one screen end-to-end with AI assist + manual cleanup.
   **მცდარი წარმოდგენები:** 2–4 bullets. ("AI Figma frame = ship
   ready", "v0/Lovable ცვლის დიზაინერს", "design system არ ჭირდება
   AI-ით", "accessibility ავტომატურია AI-ში").
   **რეალური გამოყენება:** 2–4 bullets. Where this technique wins:
   sprint-ში 1 დღეში 5 prototype, founder-PM კომუნიკაცია, frontend
   handoff, A/B variants 10-დან 50-მდე.
   **ხიდი წინა გაკვეთილიდან:** (Lessons 02+.) 1–2 sentences.
   **გასაღები:** ONE memorable sentence. Final line.

R4 — NO ### SUBHEADINGS INSIDE LESSON BODIES.
R5 — NO REPEATED CONTENT ACROSS LESSONS.

DESIGN-SYSTEM RULE
At least 3 lessons must teach how AI integrates with design system
hygiene — tokens, components, variants, auto-layout, naming. A
course that produces beautiful one-off screens but no system-aware
output is incomplete.

ACCESSIBILITY RULE
At least 1 lesson must address: AI-suggested designs often fail
contrast, focus order, and screen-reader semantics. The student must
learn to AUDIT AI output, not trust it blindly.

HANDOFF RULE
At least 2 lessons must cover code handoff (Figma Make → React, v0
→ codebase, Cursor for frontend integration). A course that stops
at the design file is incomplete.

ANTI-EXAMPLE: flowing prose without bold labels = FAILED lesson.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENT SHAPE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# AI UI/UX Design — Figma + AI Tools

*Italic subtitle — the design-to-code pipeline angle.*

დონე: Intermediate · კატეგორია: AI Creative Tools
ხანგრძლივობა: X კვირა · X გაკვეთილი · სრული კურსი · სერტიფიკატი

## კურსის შესახებ
3–5 sentences ending in numeric claim (e.g., 1 finished 8-screen
prototype + working frontend handoff by course end).

## ვისთვისაა კურსი?
4–6 bullets — product designer, UI/UX designer, frontend dev, PM,
founder, design lead.

## გაკვეთილი 01 — [title]
[550–700 words, seven subsections, no bridge.]

## გაკვეთილი 02 — [title]
[550–700 words, seven subsections with bridge.]

...continue (Intermediate: 16–20 lessons)...

## კურსში გამოყენებული AI ინსტრუმენტები
5–7 categories × 2–4 tools. Categories: "Figma AI" (Figma Make,
Figma AI features, FigJam AI, Figma Sites), "Figma Plugins" (Magician,
Diagram, Genius, Relume), "Prompt-to-UI" (v0, Lovable, Bolt, Galileo
AI, Uizard, Stitch), "Frontend Handoff" (Cursor, Anima, Locofy,
UXPin Merge), "UX Writing & Research" (ChatGPT, Claude, Notion AI,
Maze AI), "Design System & Accessibility" (Figma Variables, Stark,
A11y plugins). Every tool named in a lesson MUST appear here.

## რას ისწავლი კურსის ბოლოს?
6–10 ✓ bullets — production-grade screens, system, handoff.

AI Academy © 2025-2026 · ai-academy.ge · info@ai-academy.ge

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SELF-CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] Every lesson body 550–700 words
[ ] Every lesson has ALL seven `**bold labels:**` visible
[ ] Lesson 01 omits bridge; 02+ include it
[ ] At least 3 lessons cover design-system integration
[ ] At least 1 lesson covers accessibility auditing of AI output
[ ] At least 2 lessons cover code handoff (Figma → code)
[ ] Each lesson names specific tool + feature/plugin
[ ] Every tool named in a lesson appears in tools section
[ ] ✓ used; Georgian დ; no English calques in body text

Scope: Intermediate — 16–20 lessons covering: prompt-to-wireframe
(v0/Lovable/Galileo), Figma Make basics, AI plugins (Magician,
Genius), design tokens with AI, component generation, variants &
auto-layout cleanup, UX writing with Claude/ChatGPT, user-research
synthesis with Maze AI, accessibility audit, contrast/focus, code
handoff with Cursor/Anima, founder→ship sprint, full prototype
assembly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOW GENERATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Output only the course document in Markdown. No preamble. Start with
"# AI UI/UX Design — Figma + AI Tools" and end with the footer.
Nothing else.
```

---

AI Academy © 2025–2026 · ai-academy.ge · info@ai-academy.ge

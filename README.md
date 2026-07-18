<div align="center">

# 🎓 AI Academy

### _Georgian-native, AI-powered learning platform_

**Turn any syllabus PDF into a full interactive course — taught by an AI tutor that only knows what it should.**

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Anthropic](https://img.shields.io/badge/Claude-Sonnet_4.5-D97757?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## 🌟 What is this?

**AI Academy** is an end-to-end e-learning platform built for the Georgian market. A teacher uploads a syllabus (PDF / DOCX / Markdown), and the system automatically:

1. **Parses** the outline into structured modules and lessons
2. **Expands** each lesson into focused 10–15 minute sub-lessons with detailed key points
3. **Generates** full lesson content, key concepts, inline check questions, and a graded quiz — all in native Georgian
4. **Teaches** the student through a Socratic AI tutor that is strictly grounded in the lesson material (no hallucinating "extra" facts)
5. **Remembers** what each student got wrong and re-surfaces it on an **SM-2 spaced repetition schedule**
6. **Motivates** learners with XP, daily streaks, badges, and a per-course leaderboard
7. **Reports** progress to parents / teachers via a revocable share-token dashboard
8. **Sells** courses and category bundles through Bank of Georgia hosted checkout, with promo codes and one-click admin refunds

The goal: give Georgian students a personalized, patient, always-available teacher — not another video library.

---

## ✨ Key Features

| Area | What it does |
|---|---|
| 📄 **Syllabus → Course Pipeline** | 3-stage LLM pipeline: _parse → expand → generate_. Carries context between lessons so the course stays coherent. Fully abortable to cap cost. |
| 🤖 **Grounded AI Tutor** | Claude Sonnet 4.5, streaming. Only teaches from the lesson's own material. Refuses off-topic questions rather than hallucinate. |
| 🧠 **Spaced Repetition** | SM-2 scheduler re-queues wrong answers at expanding intervals. A daily 5-minute `/review` session closes the retention loop. |
| 🎮 **Gamification** | XP per lesson + quiz score, daily streak tracking, milestone badges, per-course leaderboard. |
| 👨‍👩‍👧 **Parent / Teacher View** | Read-only share-token dashboards (`/share/[token]`) with weekly digest. Revocable, no auth required for guardians. |
| 🎛️ **Adaptive Lesson Controls** | "Explain simpler" / "Go deeper" mid-lesson. Per-lesson `preferred_style` — direct, Socratic, or exploratory. |
| 💳 **Payments** | Bank of Georgia hosted checkout for single courses and whole-category bundles. Prices always read from the DB, never from the client. Promo codes, payment reconciliation, one-click admin refund (revokes access too). |
| 🔐 **Auth & Enrollments** | Supabase Auth accounts with an `enrollments` table as the source of truth. Anti-sharing guard: warn at 5 distinct IPs / 30 days, block past 7. |
| 🛠️ **Admin Panel** | Server-gated `/admin`: students, courses + DB-backed pricing, category bundles, AI usage & cost tracking (per-call token log), leads, promo codes, refunds, analytics. Includes a one-click storefront-wide sale mode with exact price restore. |
| 📊 **Admin Analytics** | Which lessons have the lowest pass rate? Where do students drop off? Average time-to-complete per course. |
| 🇬🇪 **Georgian-First, Bilingual** | All content is natively Georgian — not machine-translated. A full English mode ships alongside: locale-routed pages (`/[locale]/…`) with cached on-the-fly AI translation and a hard English-only guard on the EN tutor. |

---

## 🛠️ Tech Stack

**Frontend**
- [Next.js 16](https://nextjs.org/) App Router + React 19 (with the React Compiler)
- Tailwind CSS 4 for styling
- `react-markdown` + `remark-gfm` for rich lesson rendering
- `react-dropzone` for syllabus uploads

**Backend**
- Next.js Route Handlers as the API layer (30+ endpoints)
- [Supabase](https://supabase.com/) — Postgres + SSR auth + row-level security
- [Bank of Georgia](https://api.bog.ge/) payments API — hosted checkout + server callback
- [Zod](https://zod.dev/) for runtime validation at every LLM boundary
- `pdf-parse` + `mammoth` for document ingestion
- [Replicate](https://replicate.com/) for AI category cover images, [Resend](https://resend.com/) for transactional email

**AI Providers**
- **[Anthropic Claude Sonnet 4.5](https://www.anthropic.com/)** — streaming tutor chat, quiz grading
- **[Google Gemini 2.5](https://ai.google.dev/)** — syllabus parsing, lesson expansion, bulk generation
- Provider abstraction (`LLMProvider`) makes swapping models trivial

**Tooling**
- TypeScript 5, ESLint 9, PostCSS
- Ships on [Vercel](https://vercel.com/) (Hobby-tier-aware: `maxDuration` tuned to 300s)

---

## 🧬 Techniques Worth Noting

These are the non-obvious engineering choices behind the product:

### 🔗 Multi-stage LLM pipeline with contextual carry-over
Stage 1 (_lesson expansion_) runs **upfront for all lessons** before Stage 2 (_content generation_) begins — this is what makes the progress bar accurate and lets us pre-budget tokens. Each Stage 2 call receives a distilled summary of previously generated lessons, so the course avoids repeating itself and builds on earlier material.

### 📐 Structured outputs everywhere
Every LLM call returns JSON that is validated against a Zod schema before it touches Postgres. Truncation and malformed responses are retried with tighter prompts rather than silently saved.

### 🪝 Grounded tutoring (anti-hallucination by design)
The tutor's system prompt is rebuilt per-lesson from that lesson's own content + key concepts + objectives. It is explicitly instructed to _refuse_ questions outside this scope and cite back to the lesson material — so the student always sees where an answer came from.

### 📆 SM-2 spaced repetition
Classic SuperMemo-2 algorithm implemented from scratch (`src/lib/spaced-repetition/sm2.ts`). Quality below 3 resets the repetition count; ease clamps at 1.3. Due items are surfaced as a 5-minute daily review session, with the tutor re-explaining failures using the original lesson context.

### 🛑 Abortable, cost-aware generation
The syllabus pipeline wraps every stage in `checkAbort()`. If the client disconnects or hits "Stop", the route handler throws `PipelineAbortError` and **deletes the partial course** — no orphaned token spend, no zombie rows.

### 🔒 Defense-in-depth prompt hygiene
Central `security-patterns.ts` defines prompt-injection filters and rate limits applied at the API boundary, before any user input reaches an LLM. See `SECURITY_REVIEW.md` for the full threat model.

### 🎯 Draft → review quality gate
Generated lessons are passed through a second LLM review pass before being persisted, catching truncated Georgian, off-topic drift, and missing key concepts.

---

## 🚀 Getting Started

```bash
# 1. Install
npm install

# 2. Configure environment — create .env.local with:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# ANTHROPIC_API_KEY, GEMINI_API_KEY
# ADMIN_EMAILS            (comma-separated allowlist for /admin)
# BOG_CLIENT_ID, BOG_CLIENT_SECRET, PUBLIC_SITE_URL   (payments; BOG needs an https callback)
# Optional: REPLICATE_API_KEY, RESEND_API_KEY, GOOGLE_TRANSLATE_API_KEY

# 3. Apply the database schema
# Run supabase-schema.sql, then every migrations/*.sql in date order

# 4. Develop
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're in.

### Handy scripts

```bash
npm run build          # Production build
npm run lint           # ESLint
npm run upload-syllabi # Bulk-upload PDFs from course-pdfs/ into the generator
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── [locale]/          # KA/EN storefront + app — catalog, courses, lessons, profile, about
│   ├── admin/             # Server-gated admin panel — students, courses, pricing, AI usage, leads
│   ├── api/               # 30+ route handlers — chat, quiz, checkout, bog, enrollments, admin…
│   └── ip-limit/          # Anti-sharing block page
├── components/
│   ├── lesson/            # Paged + Conversational lesson views, ChatPanel, LessonControls
│   └── profile/           # XP / streak / badge UI
├── lib/
│   ├── ai/                # Claude + Gemini clients, syllabus pipeline, prompts, usage tracking
│   ├── admin/             # Admin data layer (service-role queries)
│   ├── spaced-repetition/ # SM-2 scheduler
│   ├── gamification/      # XP and badge rules
│   ├── bog.ts             # Bank of Georgia payments client
│   └── supabase/          # Typed DB client + schema types
├── types/                 # Shared TS types
└── ...
migrations/                # Dated SQL migrations — run in order after supabase-schema.sql
```

---

## 🗺️ Roadmap

Active roadmap lives in [`ROADMAP.md`](./ROADMAP.md). Recently shipped: BOG payments with category bundles and refunds, rebuilt admin panel with DB pricing and AI cost tracking, full English mode, account-backed enrollments, IP-sharing limits. Next up: role-based auth (replacing the env allowlist), rate-limit enforcement on AI endpoints, and voice tutor mode (TTS → STT → realtime).

---

## 📜 License

Private project. All rights reserved.

<div align="center">

---

_Built with Claude, Gemini, and a lot of Georgian grammar._

</div>

# AI Academy — Roadmap

Tasks queued up for future work. Grouped by priority. Pick one when ready and we'll scope it properly before building.

---

## P0 — Critical (platform is unsafe/broken without these)

### 1. Wire real authentication
- Replace localStorage stubs in `/login` and `/register` with Supabase Auth
- Migrate anonymous `student_sessions` to auth-backed users (or link them)
- Add Next.js `middleware.ts` for route protection + role checks (student/admin)
- Files touched: `src/hooks/useAuth.ts`, `src/app/(main)/login/page.tsx`, `src/app/(main)/register/page.tsx`, new `src/middleware.ts`

### 2. Enforce rate limiting on AI endpoints
- `src/lib/security-patterns.ts` already defines limiters — none are called
- Apply to: `/api/chat`, `/api/analyze-course/*`, `/api/translate`, `/api/quiz/check`
- Without this, a single abuser can burn the Claude/Gemini budget overnight

### 3. Structured error logging
- Replace `console.error` with a real logger (Sentry / Axiom / Logflare)
- Critical spots: syllabus pipeline (truncations, retries), chat stream, quiz grading
- We need visibility into which prompts fail and which lessons truncate in Georgian

### 4. Delete dead code
- `src/lib/ai/backup/claude.ts.backup`

---

## P1 — High leverage (big product wins)

### 5. Spaced repetition / Daily Review    ✅ DONE
- New table `review_items (user_id, question_id, next_due_at, interval_days, ease)`
- SM-2 scheduler on wrong answers
- New route `/review` — 5-minute daily session pulling due questions
- AI teacher re-explains failures using original lesson context + `preferred_style`
- Feed weak topics back into tutor system prompt for new lessons
- Expected impact: 2–3× retention, daily habit loop

### 6. Gamification loop   ✅ DONE
- XP per lesson completed + quiz score
- Daily streak counter
- Per-course leaderboard
- Badges for milestones (first lesson, 7-day streak, course complete)
- Schema already has `points` on quiz questions — extend, don't replace

### 7. Student progress dashboard  ✅ DONE
- Flesh out `/profile` — currently minimal
- Show: XP, streak, courses in progress, weak topics, recent quiz scores
- Closes the gamification loop visually

### 8. Voice tutor mode
- Phase 1: TTS on tutor messages in Georgian (ElevenLabs or OpenAI TTS)
- Phase 2: STT so students can ask questions by voice
- Phase 3: realtime voice (Claude + streaming audio) — full conversational teacher
- Biggest differentiator vs Udemy/Coursera clones

---

## P2 — Medium leverage (worth doing, not urgent)

### 9. "Explain simpler / deeper" mid-lesson control  ✅ DONE
- Expose `preferred_style` (direct/socratic/exploratory) as a per-lesson UI control
- Button: "Explain this simpler" → tutor re-explains last section
- Button: "Go deeper" → tutor expands with more detail

### 10. Parent/teacher dashboard  ✅ DONE (email delivery deferred)
- Read-only progress view via revocable share token (`/share/[token]`)
- Weekly digest surface rendered on the share page
- Email delivery (Resend/SendGrid) still needs wiring — surface is ready
- Drives word-of-mouth in Georgian market

### 11. Lesson generation cost controls
- Track cost per generated course (Gemini + Claude tokens)
- Cache common syllabi — same PDF should not re-generate from scratch
- Draft→review pattern already partially exists in quality gate; push further

### 12. Public course preview (SEO)
- First page of lesson 1 in each course = public, indexed
- Free acquisition channel
- Requires auth gating logic to know what's public vs gated

### 13. Testing foundation
- Set up Vitest
- First targets: syllabus pipeline, `gradeQuizWithAI`, SM-2 scheduler (once built)
- Component tests for lesson views (paged + conversational)

---

## In progress

### Promo codes (started 2026-05-19)
Unlock codes only. Discount-code schema stored but inert until a real checkout exists (no payment system in repo today).

**Schema** — `migrations/2026-05-19-promo-codes.sql`:
- `promo_codes` — code, type ('unlock'|'percent_off'|'amount_off'), course_id?, max_redemptions?, redemption_count, per_user_limit, expires_at, is_active, notes, created_by
- `promo_redemptions` — promo_code_id, user_id, course_id, unique(promo_code_id, user_id)
- `enrollments` — user_id, course_id, source ('promo'|'purchase'|'free'), promo_code_id?, unique(user_id, course_id). Fills the missing backing for `isEnrolled` in UI.

**Code format:** `WALLI-XXXX-XXXX` Crockford base32 (no 0/O/1/I/L). Admin can override with custom slug (e.g. `SUMMER2026`).

**Admin** — `/admin/promo-codes` (English-only, consistent with rest of admin):
- List + filters (active / expired / used-up)
- Single-code generator
- Bulk single-use generator with CSV export
- Per-code detail with redemption log + deactivate

**User redemption** — all three surfaces hit `POST /api/promo/redeem`:
1. Profile page card
2. Course detail page expandable
3. `/[locale]/redeem/[code]` (auto-applies; logged-out users land on `/login?redeem=CODE`)

**Build order:**
1. ☑ Migration + RLS policies — `migrations/2026-05-19-promo-codes.sql`
2. ☑ `enrollments` write path — `src/lib/enrollments.ts`, `/api/enrollments`, server-fed `enrolledCourseIds`
3. ☑ Admin pages + API — `/admin/promo-codes` list + create + bulk CSV + detail
4. ☑ `/api/promo/redeem` + three surfaces — profile card, course detail expandable, `/[locale]/redeem/[code]`
5. ☑ Polish — rate limit, ka+en i18n strings, login `?redeem=` handoff

**To deploy (manual steps you need to do):**
- Run `migrations/2026-05-19-promo-codes.sql` in the Supabase SQL Editor
- Set `ADMIN_EMAILS=you@example.com` (comma-separated) in `.env.local` and prod env
- Confirm `SUPABASE_SERVICE_ROLE_KEY` is set in prod env (the admin lib needs it)

---

## P3 — Nice to have

### 14. Admin analytics  ✅ DONE
- Which lessons have the lowest quiz pass rate? (they need rewriting)
- Which pages have highest drop-off? (they're too hard/boring)
- Average time-to-complete per course
- Lives at `/admin/analytics`

### 15. API documentation
- OpenAPI spec or at minimum a README per route group
- 24 endpoints currently undocumented

### 16. Error boundaries
- React error boundaries around lesson views so one bad block doesn't blank the page

### 17. Mobile polish pass
- ConversationalLessonView is responsive; PagedLessonView's 3-column layout needs a mobile audit

---

## Notes

- When starting a task, open a plan, confirm the approach, then implement
- P0 items should be done before any paid user onboarding
- P1 #5 (spaced repetition) is the single highest-ROI pedagogical feature — prioritize when P0 is clear

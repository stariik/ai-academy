-- ============================================================
-- Personalized learning roadmap produced by the WALL-E interview.
--
-- Ordered steps referencing real courses, so the interview ends with a plan
-- the learner can act on instead of a summary.
-- ============================================================

alter table public.onboarding_profiles
  add column if not exists roadmap jsonb not null default '[]'::jsonb;

comment on column public.onboarding_profiles.roadmap is
  'Ordered [{courseId,title,when,why}] steps; course ids are validated against public.courses before saving.';

-- Adds the teaching-notes columns the lesson generator has always written.
-- They were in supabase-schema.sql but never applied to production, and
-- saveLessonPages silently retried without them, so every page lost its
-- misconceptions / bridges / real-world examples / reflection prompt, and
-- matching questions lost their answer pairs (metadata).
-- The save code no longer falls back: run this before generating lessons.

alter table lesson_pages add column if not exists teaching_flow jsonb default null;
alter table lesson_pages add column if not exists difficulty_level text default null;
alter table lesson_pages add column if not exists bridge_from_previous text default null;
alter table lesson_pages add column if not exists common_misconceptions text[] default null;
alter table lesson_pages add column if not exists real_world_applications text[] default null;

alter table quiz_questions add column if not exists bloom_level text default null;
alter table quiz_questions add column if not exists metadata jsonb default null;

-- Make PostgREST see the new columns immediately.
notify pgrst, 'reload schema';

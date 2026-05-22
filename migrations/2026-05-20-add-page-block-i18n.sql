-- ============================================================
-- Bilingual content-edit columns
--
-- The lesson-edit admin page (added 2026-05-20) lets editors fill in
-- English variants for the actual page content the student reads.
-- The columns already exist for the lesson row (lessons.title_en,
-- description_en, learning_objectives_en) and the course row
-- (courses.title_en, description_en). Page titles and content blocks
-- did not yet have an EN side — that's what this migration adds.
-- ============================================================

alter table lesson_pages
  add column if not exists title_en text;

comment on column lesson_pages.title_en is 'English translation of page title; null falls back to Georgian title';

alter table content_blocks
  add column if not exists content_en text;

comment on column content_blocks.content_en is 'English translation of block content; null falls back to Georgian content';

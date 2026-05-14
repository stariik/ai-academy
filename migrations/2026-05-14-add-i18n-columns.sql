-- ============================================================
-- Add EN translation columns to courses and lessons
-- Run this in the Supabase SQL Editor
-- ============================================================

alter table courses
  add column if not exists title_en text,
  add column if not exists description_en text;

alter table lessons
  add column if not exists title_en text,
  add column if not exists description_en text,
  add column if not exists learning_objectives_en text[];

comment on column courses.title_en is 'English translation of title; null falls back to Georgian title';
comment on column courses.description_en is 'English translation of description; null falls back to Georgian description';
comment on column lessons.title_en is 'English translation of title; null falls back to Georgian title';
comment on column lessons.description_en is 'English translation of description; null falls back to Georgian description';
comment on column lessons.learning_objectives_en is 'English translation of learning_objectives; null falls back to Georgian array';

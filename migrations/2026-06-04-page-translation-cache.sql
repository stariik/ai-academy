-- ============================================================
-- On-the-fly translation cache for lesson-page material
--
-- When a student switches the tutor/material to English, the page's
-- Georgian material is translated by Claude and the result is cached here
-- so subsequent views (for any student) are instant. `source_hash` is a
-- hash of the Georgian source — if the lesson content is edited, the hash
-- changes and the stale cache row is replaced on the next request.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

create table if not exists lesson_page_translations (
  id uuid primary key default uuid_generate_v4(),
  lesson_id text not null references lessons(id) on delete cascade,
  page_number int not null,
  locale text not null,
  source_hash text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, page_number, locale)
);

comment on table lesson_page_translations is 'Cached AI translations of lesson-page material, keyed by lesson + page + locale; invalidated via source_hash when the source changes.';

-- ============================================================
-- Tool radar + tool tagging — run in the Supabase SQL Editor
--
-- 1. courses.tools / sources / researched_at — which AI tools a course
--    teaches, the web pages its content was researched from, and when.
--    Field = the existing category (courses.tags).
-- 2. tool_radar — new AI tools found by the daily cron
--    (/api/cron/tool-radar), triaged at /admin/radar.
--
-- tool_radar is written/read only with the service-role key; RLS denies
-- everyone else.
-- ============================================================

alter table courses
  add column if not exists tools text[] not null default '{}',
  add column if not exists sources jsonb not null default '[]',
  add column if not exists researched_at timestamptz null;

comment on column courses.tools is 'AI tools this course teaches, e.g. {Sora 2,Runway}.';
comment on column courses.sources is 'Web sources used by /api/analyze-course/research: [{title,url}].';
comment on column courses.researched_at is 'When the course content was web-researched. NULL for PDF-made courses.';

create index if not exists courses_tools_idx on courses using gin (tools);

create table if not exists tool_radar (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  field text not null default '',   -- category name (CATEGORIES), '' if unsure
  summary text not null default '',
  url text not null default '',
  why text not null default '',
  status text not null default 'new'
    check (status in ('new', 'dismissed', 'course_created')),
  found_at timestamptz not null default now()
);

create index if not exists tool_radar_status_idx on tool_radar (status, found_at desc);

alter table tool_radar enable row level security;

drop policy if exists "tool_radar deny all" on tool_radar;
create policy "tool_radar deny all" on tool_radar for all using (false) with check (false);

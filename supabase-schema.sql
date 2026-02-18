-- ============================================================
-- AI Academy - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- Courses
-- ============================================================
create table courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null default '',
  tags text[] not null default '{}',
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Lessons
-- ============================================================
create table lessons (
  id text primary key,
  title text not null,
  description text not null default '',
  learning_objectives text[] not null default '{}',
  key_concepts jsonb not null default '[]',
  summary text not null default '',
  source_document text not null default '',
  difficulty text not null default 'intermediate',
  estimated_duration_minutes int not null default 15,
  status text not null default 'draft',
  tags text[] not null default '{}',
  course_id uuid null references courses(id) on delete set null,
  position_in_course int null,
  user_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Content Blocks (CASCADE delete with lesson)
-- ============================================================
create table content_blocks (
  id text primary key,
  lesson_id text not null references lessons(id) on delete cascade,
  type text not null,
  content text not null default '',
  metadata jsonb null,
  "order" int not null default 0
);

-- ============================================================
-- Quiz Questions (CASCADE delete with lesson)
-- ============================================================
create table quiz_questions (
  id text primary key,
  lesson_id text not null references lessons(id) on delete cascade,
  type text not null,
  question text not null,
  options text[] null,
  correct_answer text not null,
  explanation text not null default '',
  difficulty text not null default 'medium',
  points int not null default 10
);

-- ============================================================
-- Student Sessions (anonymous)
-- ============================================================
create table student_sessions (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null default 'Anonymous Student',
  preferences jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Lesson Progress
-- ============================================================
create table lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references student_sessions(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  status text not null default 'not_started',
  scroll_percentage real not null default 0,
  time_spent_seconds int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, lesson_id)
);

-- ============================================================
-- Quiz Attempts
-- ============================================================
create table quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references student_sessions(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  score int not null default 0,
  total_points int not null default 0,
  percentage int not null default 0,
  passed boolean not null default false,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Chat History
-- ============================================================
create table chat_history (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references student_sessions(id) on delete cascade,
  lesson_id text not null references lessons(id) on delete cascade,
  messages jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, lesson_id)
);

-- ============================================================
-- Student Profiles
-- ============================================================
create table student_profiles (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null unique references student_sessions(id) on delete cascade,
  weak_topics jsonb not null default '[]',
  strong_topics jsonb not null default '[]',
  preferred_style text not null default 'socratic',
  total_quizzes int not null default 0,
  average_score real not null default 0,
  total_time_spent int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_lessons_tags on lessons using gin(tags);
create index idx_courses_tags on courses using gin(tags);
create index idx_lessons_course_id on lessons(course_id);
create index idx_lesson_progress_session on lesson_progress(session_id);
create index idx_quiz_attempts_session on quiz_attempts(session_id);
create index idx_chat_history_session_lesson on chat_history(session_id, lesson_id);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger courses_updated_at before update on courses
  for each row execute function update_updated_at();

create trigger lessons_updated_at before update on lessons
  for each row execute function update_updated_at();

create trigger student_sessions_updated_at before update on student_sessions
  for each row execute function update_updated_at();

create trigger lesson_progress_updated_at before update on lesson_progress
  for each row execute function update_updated_at();

create trigger chat_history_updated_at before update on chat_history
  for each row execute function update_updated_at();

create trigger student_profiles_updated_at before update on student_profiles
  for each row execute function update_updated_at();

-- ============================================================
-- Lesson Pages (multi-page learning)
-- ============================================================
create table lesson_pages (
  id text primary key,
  lesson_id text not null references lessons(id) on delete cascade,
  page_number int not null,
  title text not null,
  key_concepts jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique(lesson_id, page_number)
);

create index idx_lesson_pages_lesson on lesson_pages(lesson_id);

-- Link content_blocks to pages
alter table content_blocks add column page_id text references lesson_pages(id) on delete cascade;
create index idx_content_blocks_page on content_blocks(page_id);

-- Link quiz_questions to pages + distinguish check vs final
alter table quiz_questions add column page_id text references lesson_pages(id) on delete cascade;
alter table quiz_questions add column scope text not null default 'final';
create index idx_quiz_questions_page on quiz_questions(page_id);

-- Track page-level progress
alter table lesson_progress add column current_page int not null default 1;
alter table lesson_progress add column completed_pages int[] not null default '{}';

-- Per-page chat history
alter table chat_history drop constraint if exists chat_history_session_id_lesson_id_key;
alter table chat_history add column page_number int;
alter table chat_history add constraint chat_history_session_lesson_page_key unique(session_id, lesson_id, page_number);

-- ============================================================
-- RLS Policies (commented out for demo - enable with auth)
-- ============================================================
-- alter table lessons enable row level security;
-- create policy "Public read for published lessons"
--   on lessons for select using (status = 'published');
-- create policy "Authenticated users can manage lessons"
--   on lessons for all using (auth.uid() = user_id);

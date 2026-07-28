-- ============================================================
-- Adaptive post-registration WALL-E interview.
--
-- Stores both structured, explicitly stated preferences and the original
-- conversation. This intentionally avoids inferred sensitive traits.
-- ============================================================

create table if not exists public.onboarding_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  session_id uuid null references public.student_sessions(id) on delete set null,
  locale text not null default 'ka' check (locale in ('ka', 'en')),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  question_count int not null default 0 check (question_count between 0 and 7),
  answers jsonb not null default '[]'::jsonb,
  transcript jsonb not null default '[]'::jsonb,
  current_question jsonb null,
  interests jsonb not null default '[]'::jsonb,
  primary_goal text null,
  desired_outcome text null,
  experience_level text null,
  learning_preferences jsonb not null default '[]'::jsonb,
  weekly_commitment text null,
  barriers jsonb not null default '[]'::jsonb,
  motivation text null,
  ai_summary text null,
  segment_label text null,
  opportunity_signals jsonb not null default '[]'::jsonb,
  verbatim_quote text null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists onboarding_profiles_status_idx
  on public.onboarding_profiles (status, created_at desc);

create index if not exists onboarding_profiles_session_id_idx
  on public.onboarding_profiles (session_id)
  where session_id is not null;

alter table public.onboarding_profiles enable row level security;

drop policy if exists "Users can read their onboarding profile" on public.onboarding_profiles;
create policy "Users can read their onboarding profile"
  on public.onboarding_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their onboarding profile" on public.onboarding_profiles;
create policy "Users can create their onboarding profile"
  on public.onboarding_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their onboarding profile" on public.onboarding_profiles;
create policy "Users can update their onboarding profile"
  on public.onboarding_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists onboarding_profiles_updated_at on public.onboarding_profiles;
create trigger onboarding_profiles_updated_at
  before update on public.onboarding_profiles
  for each row execute function public.update_updated_at();

comment on table public.onboarding_profiles is
  'Post-registration WALL-E discovery interviews: stated goals/preferences plus transcript for product research.';
comment on column public.onboarding_profiles.segment_label is
  'Plain-language segment based only on goals stated by the user; never a sensitive or psychological diagnosis.';

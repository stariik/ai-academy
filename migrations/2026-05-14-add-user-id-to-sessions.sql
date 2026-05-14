-- ============================================================
-- Link anonymous student_sessions to Supabase auth.users so that
-- progress, XP, badges, streaks survive sign-up. Nullable: existing
-- anonymous sessions stay anonymous until their first sign-in.
-- ============================================================

alter table student_sessions
  add column if not exists user_id uuid null references auth.users(id) on delete set null;

create index if not exists student_sessions_user_id_idx
  on student_sessions (user_id)
  where user_id is not null;

comment on column student_sessions.user_id is 'Linked Supabase auth user id; null for anonymous sessions';

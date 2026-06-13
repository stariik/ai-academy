-- ============================================================
-- Admin panel rebuild — run in the Supabase SQL Editor
--
-- 1. ai_usage          — one row per AI provider call (Claude, Gemini,
--                        Google Translate, Replicate). Powers the
--                        /admin/ai-usage cost dashboard. Written only
--                        with the service-role key; RLS denies clients.
-- 2. courses           — price_cents / retail_price_cents so the admin
--                        panel can set per-course prices shown on the
--                        storefront (₾, stored in tetri).
-- 3. category_images   — bundle_price_cents / bundle_retail_cents to
--                        override the derived category bundle price.
--                        (Table doubles as per-category admin metadata.)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. ai_usage
-- ============================================================
create table if not exists ai_usage (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  provider text not null,           -- 'anthropic' | 'gemini' | 'google-translate' | 'replicate'
  model text not null,
  feature text not null,            -- 'tutor_chat' | 'quiz_grading' | 'english_guard' | ...
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  duration_ms int null,
  success boolean not null default true,
  -- Loose references on purpose: usage history must survive deletion of
  -- sessions/lessons/courses, and inserts must never fail on a missing row.
  session_id uuid null,
  user_id uuid null,
  lesson_id text null,
  course_id uuid null,
  locale text null,
  metadata jsonb null
);

create index if not exists idx_ai_usage_created_at on ai_usage (created_at desc);
create index if not exists idx_ai_usage_feature on ai_usage (feature, created_at desc);
create index if not exists idx_ai_usage_session on ai_usage (session_id) where session_id is not null;

alter table ai_usage enable row level security;

drop policy if exists "ai_usage deny all" on ai_usage;
create policy "ai_usage deny all" on ai_usage
  for all using (false) with check (false);

comment on table ai_usage is
  'One row per external AI call. cost_usd is an estimate from published per-token prices. Service-role writes only.';

-- ============================================================
-- 2. Course prices
-- ============================================================
alter table courses
  add column if not exists price_cents int null check (price_cents is null or price_cents >= 0),
  add column if not exists retail_price_cents int null check (retail_price_cents is null or retail_price_cents >= 0);

comment on column courses.price_cents is
  'Selling price in tetri (₾ * 100). NULL = course is shown as free.';
comment on column courses.retail_price_cents is
  'Optional struck-through "retail" price in tetri for discount display.';

-- ============================================================
-- 3. Category bundle prices (category_images doubles as category metadata)
-- ============================================================
alter table category_images
  add column if not exists bundle_price_cents int null check (bundle_price_cents is null or bundle_price_cents >= 0),
  add column if not exists bundle_retail_cents int null check (bundle_retail_cents is null or bundle_retail_cents >= 0);

comment on table category_images is
  'Per-category admin metadata keyed by category slug: AI cover image (3:2, Replicate) and optional bundle price override (tetri). NULL prices fall back to the derived storefront bundle price.';

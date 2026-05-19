-- ============================================================
-- Promo codes + enrollments
--
-- Three tables:
--   promo_codes        — issued codes (admin-created)
--   promo_redemptions  — one row per (code, user) pair
--   enrollments        — account-level course access; backs the
--                        existing UI `isEnrolled` flag (today a
--                        localStorage hack in CourseDetailClient.tsx)
--
-- Redemption is atomic via the SECURITY DEFINER RPC `redeem_promo_code`
-- defined at the bottom. RLS keeps clients from touching promo_codes
-- directly — they can only read their own redemptions and enrollments.
--
-- Discount-code columns (percent_off, amount_off_cents) are stored but
-- inert until a real checkout flow lands. The RPC refuses to redeem
-- those types and tells the caller so.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- promo_codes
-- ============================================================
create table if not exists promo_codes (
  id uuid primary key default uuid_generate_v4(),
  code text not null,
  type text not null check (type in ('unlock', 'percent_off', 'amount_off')),
  course_id uuid null references courses(id) on delete cascade,
  percent_off int null check (percent_off is null or (percent_off > 0 and percent_off <= 100)),
  amount_off_cents int null check (amount_off_cents is null or amount_off_cents > 0),
  max_redemptions int null check (max_redemptions is null or max_redemptions > 0),
  redemption_count int not null default 0 check (redemption_count >= 0),
  per_user_limit int not null default 1 check (per_user_limit >= 1),
  expires_at timestamptz null,
  is_active boolean not null default true,
  notes text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Format guard: uppercase letters, digits, and dashes; 4–32 chars
  constraint promo_codes_code_format check (code ~ '^[A-Z0-9-]{4,32}$'),
  -- Unlock codes must specify either a course or be intentionally global (course_id null = any course)
  -- Discount codes shape: must have a value matching their type
  constraint promo_codes_value_shape check (
    (type = 'unlock' and percent_off is null and amount_off_cents is null)
    or (type = 'percent_off' and percent_off is not null and amount_off_cents is null)
    or (type = 'amount_off' and amount_off_cents is not null and percent_off is null)
  )
);

create unique index if not exists promo_codes_code_uidx on promo_codes (upper(code));
create index if not exists promo_codes_active_idx on promo_codes (is_active) where is_active = true;
create index if not exists promo_codes_course_idx on promo_codes (course_id) where course_id is not null;

create trigger promo_codes_updated_at before update on promo_codes
  for each row execute function update_updated_at();

comment on table promo_codes is 'Admin-issued promo codes. Redemption is atomic via redeem_promo_code() RPC; clients cannot read or write this table directly.';
comment on column promo_codes.code is 'Canonical uppercase code (e.g. WALLI-7K3M-PQXY or SUMMER2026). Unique case-insensitively.';
comment on column promo_codes.course_id is 'For unlock codes: the course granted. NULL = any course (caller must specify which course to unlock).';
comment on column promo_codes.per_user_limit is 'Always 1 today (enforced by promo_redemptions unique constraint). Column reserved for future >1 uses.';

-- ============================================================
-- promo_redemptions
-- ============================================================
create table if not exists promo_redemptions (
  id uuid primary key default uuid_generate_v4(),
  promo_code_id uuid not null references promo_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid null references courses(id) on delete set null,
  redeemed_at timestamptz not null default now(),
  unique (promo_code_id, user_id)
);

create index if not exists promo_redemptions_user_idx on promo_redemptions (user_id);
create index if not exists promo_redemptions_code_idx on promo_redemptions (promo_code_id);

comment on table promo_redemptions is 'One row per (code, user). Unique constraint enforces per_user_limit=1.';

-- ============================================================
-- enrollments
-- ============================================================
create table if not exists enrollments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  source text not null check (source in ('promo', 'purchase', 'free', 'admin')),
  promo_code_id uuid null references promo_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists enrollments_user_idx on enrollments (user_id);
create index if not exists enrollments_course_idx on enrollments (course_id);

comment on table enrollments is 'Account-level course access. Backs the isEnrolled UI flag. Source distinguishes promo / purchase / free / admin grants.';

-- ============================================================
-- RLS
-- ============================================================
alter table promo_codes enable row level security;
alter table promo_redemptions enable row level security;
alter table enrollments enable row level security;

-- promo_codes: locked down. Admin reads via service role; users never
-- read this table directly — the RPC handles validation and returns
-- only the fields the caller needs.
drop policy if exists "promo_codes deny all" on promo_codes;
create policy "promo_codes deny all" on promo_codes
  for all using (false) with check (false);

-- promo_redemptions: users see their own redemptions only.
-- Writes happen exclusively through the SECURITY DEFINER RPC.
drop policy if exists "promo_redemptions read own" on promo_redemptions;
create policy "promo_redemptions read own" on promo_redemptions
  for select using (auth.uid() = user_id);

-- enrollments: users see their own enrollments.
-- Writes go through RPC or server-side service role.
drop policy if exists "enrollments read own" on enrollments;
create policy "enrollments read own" on enrollments
  for select using (auth.uid() = user_id);

-- ============================================================
-- redeem_promo_code(p_code, p_course_id)
--
-- Atomic redemption:
--   • normalises the code (uppercases, trims)
--   • validates active / not-expired / has redemptions left
--   • checks the user has not already redeemed this code
--   • for unlock: resolves which course to grant
--   • for discount types: refuses (returns 'requires_checkout')
--   • inserts promo_redemptions, enrollments; bumps redemption_count
--
-- Returns one row:
--   status                  ok | not_found | inactive | expired | exhausted
--                           | already_redeemed | already_enrolled
--                           | course_required | requires_checkout
--   course_id, course_slug  (when status='ok')
--   promo_id                (when status='ok')
--   message                 short, code-safe (UI handles i18n)
-- ============================================================
create or replace function redeem_promo_code(p_code text, p_course_id uuid default null)
returns table (
  status text,
  course_id uuid,
  promo_id uuid,
  message text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_promo promo_codes%rowtype;
  v_target_course uuid;
begin
  if v_user_id is null then
    return query select 'unauthenticated'::text, null::uuid, null::uuid, 'Sign in to redeem a code.'::text;
    return;
  end if;

  -- Lock the matching row so concurrent redemptions can't oversell.
  select * into v_promo
  from promo_codes
  where upper(code) = upper(trim(p_code))
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::uuid, 'Code not found.'::text;
    return;
  end if;

  if not v_promo.is_active then
    return query select 'inactive'::text, null::uuid, null::uuid, 'Code is no longer active.'::text;
    return;
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return query select 'expired'::text, null::uuid, null::uuid, 'Code has expired.'::text;
    return;
  end if;

  if v_promo.max_redemptions is not null and v_promo.redemption_count >= v_promo.max_redemptions then
    return query select 'exhausted'::text, null::uuid, null::uuid, 'Code has reached its redemption limit.'::text;
    return;
  end if;

  if exists (
    select 1 from promo_redemptions
    where promo_code_id = v_promo.id and user_id = v_user_id
  ) then
    return query select 'already_redeemed'::text, null::uuid, null::uuid, 'You have already redeemed this code.'::text;
    return;
  end if;

  -- Discount-code types are stored but not redeemable until checkout exists.
  if v_promo.type in ('percent_off', 'amount_off') then
    return query select 'requires_checkout'::text, null::uuid, null::uuid,
      'This code applies a discount at checkout, which is not available yet.'::text;
    return;
  end if;

  -- type = 'unlock' → resolve target course
  v_target_course := coalesce(v_promo.course_id, p_course_id);
  if v_target_course is null then
    return query select 'course_required'::text, null::uuid, null::uuid,
      'Pick a course to apply this code to.'::text;
    return;
  end if;

  -- Sanity: the course referenced must exist
  if not exists (select 1 from courses where id = v_target_course) then
    return query select 'not_found'::text, null::uuid, null::uuid, 'Course not found.'::text;
    return;
  end if;

  -- If user is already enrolled in that course, don't burn the code
  if exists (
    select 1 from enrollments where user_id = v_user_id and course_id = v_target_course
  ) then
    return query select 'already_enrolled'::text, v_target_course, v_promo.id,
      'You already have access to this course.'::text;
    return;
  end if;

  insert into promo_redemptions (promo_code_id, user_id, course_id)
  values (v_promo.id, v_user_id, v_target_course);

  insert into enrollments (user_id, course_id, source, promo_code_id)
  values (v_user_id, v_target_course, 'promo', v_promo.id);

  update promo_codes
  set redemption_count = redemption_count + 1
  where id = v_promo.id;

  return query select 'ok'::text, v_target_course, v_promo.id, 'Course unlocked.'::text;
end;
$$;

revoke all on function redeem_promo_code(text, uuid) from public;
grant execute on function redeem_promo_code(text, uuid) to authenticated;

comment on function redeem_promo_code(text, uuid) is 'Atomic promo-code redemption. Authenticated only. Returns single-row status; never raises for expected failures.';

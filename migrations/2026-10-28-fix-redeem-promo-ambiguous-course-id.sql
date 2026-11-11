-- ============================================================
-- Fix: redeem_promo_code() failed for every valid unlock code with
--   "column reference "course_id" is ambiguous"
-- because RETURNS TABLE (..., course_id, ...) declares an OUT variable
-- that collides with enrollments.course_id in the already-enrolled check.
-- The API turned that into a generic "Something went wrong".
--
-- Only change vs 2026-05-19-promo-codes.sql: that check now uses a
-- table alias (e.course_id / e.user_id).
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
    select 1 from enrollments e where e.user_id = v_user_id and e.course_id = v_target_course
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

-- ============================================================
-- Follow-up to 2026-05-19-promo-codes.sql
--
-- The original migration enabled RLS on `enrollments` and added a
-- SELECT policy ("enrollments read own") but no INSERT policy.
-- That broke the "Start learning" / free-enroll path which goes
-- through the user's own Supabase client (POST /api/enrollments).
--
-- Add an INSERT policy that lets a signed-in user insert one row
-- for themselves with source='free'. All other write paths bypass
-- RLS already:
--   - promo redemption  → redeem_promo_code() SECURITY DEFINER RPC
--   - purchase / admin  → service-role client (src/lib/promo-codes.ts pattern)
-- ============================================================

drop policy if exists "enrollments insert own free" on enrollments;
create policy "enrollments insert own free" on enrollments
  for insert
  with check (
    auth.uid() = user_id
    and source = 'free'
    and promo_code_id is null
  );

comment on policy "enrollments insert own free" on enrollments is
  'Lets a signed-in user create their own free enrollment (the "Start learning" button). Promo / purchase / admin grants run with definer or service-role and bypass RLS.';

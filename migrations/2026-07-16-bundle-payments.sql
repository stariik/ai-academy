-- ============================================================
-- Bundle payments — run in the Supabase SQL Editor
--
-- Lets a `payments` row represent a category bundle purchase instead of a
-- single course, so the catalog's "buy the bundle" CTA can go through Bank
-- of Georgia like a single-course buy already does.
--
-- A bundle is a bulk course purchase: on 'paid' it grants one enrollment per
-- course in the category *at that moment* — courses added to the category
-- later are not included — and a refund revokes exactly that set.
--
-- Every row targets exactly one thing: a course OR a category, never both,
-- never neither. Existing rows all have course_id set, so they satisfy the
-- new constraint as-is.
-- ============================================================

alter table payments alter column course_id drop not null;

alter table payments
  add column if not exists category_slug text null;

-- `!=` on two booleans is XOR: exactly one target must be present.
alter table payments drop constraint if exists payments_target_ck;
alter table payments add constraint payments_target_ck
  check ((course_id is not null) != (category_slug is not null));

comment on column payments.course_id is
  'Single-course purchase target. NULL when this payment buys a category bundle.';
comment on column payments.category_slug is
  'Category bundle target (category_images.slug). NULL when this payment buys a single course. Mutually exclusive with course_id.';
comment on table payments is
  'BOG e-commerce checkout attempts, for one course (course_id) or one category bundle (category_slug). status=paid backs source=purchase enrollments.';

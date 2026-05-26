-- ============================================================
-- Move AI-generated cover images from courses to categories.
--
-- Categories are not a DB table — they are the 9 canonical strings in
-- src/lib/constants/categories.ts. This table stores one admin-generated
-- cover image per category, keyed by the category's stable slug
-- (e.g. 'ai-foundations'; see CATEGORY_VISUALS in src/lib/v2/data.ts).
--
-- Course covers are removed entirely (see ROADMAP / product decision).
-- ============================================================

create table if not exists category_images (
  slug text primary key,
  image_url text,
  prompt text,
  updated_at timestamptz not null default now()
);

comment on table category_images is
  'Per-category AI-generated cover image (Replicate). Keyed by the category slug from CATEGORY_VISUALS. 3:2 ratio.';

-- Course covers are no longer used; drop the column and its data.
alter table courses
  drop column if exists image_url;

-- ============================================================
-- Add image_url column to courses
-- Stores the AI-generated cover image URL (Replicate output)
-- ============================================================

alter table courses
  add column if not exists image_url text;

comment on column courses.image_url is 'Course cover image URL (AI-generated via Replicate). 4:3 ratio intended for slider/card display.';

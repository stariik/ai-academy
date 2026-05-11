-- ============================================================
-- WIPE ALL COURSES AND DERIVED DATA
-- Run this in Supabase SQL Editor to clear test courses
-- before uploading real ones through the new full-PDF flow.
--
-- This deletes:
--   - All courses
--   - All lessons (and their pages, content blocks, quiz questions)
--   - All student progress, quiz attempts, chat history
--   - All review items and earned badges
--
-- DOES NOT delete:
--   - student_sessions / student_profiles (user identities)
--   - auth users
--
-- If you want to also wipe user progress/profiles for a clean
-- slate, uncomment the marked lines at the bottom.
-- ============================================================

begin;

-- Derived tables that reference lessons/courses
delete from chat_history;
delete from quiz_attempts;
delete from review_items;
delete from user_badges;
delete from lesson_progress;

-- Lesson content
delete from content_blocks;
delete from quiz_questions;
delete from lesson_pages;
delete from lessons;

-- Courses themselves
delete from courses;

-- Uncomment to also reset user-level data:
-- delete from student_profiles;
-- delete from student_sessions;

commit;

-- Verify
select 'courses' as table_name, count(*) from courses
union all
select 'lessons', count(*) from lessons
union all
select 'lesson_pages', count(*) from lesson_pages
union all
select 'content_blocks', count(*) from content_blocks
union all
select 'quiz_questions', count(*) from quiz_questions
union all
select 'lesson_progress', count(*) from lesson_progress
union all
select 'chat_history', count(*) from chat_history
union all
select 'quiz_attempts', count(*) from quiz_attempts;

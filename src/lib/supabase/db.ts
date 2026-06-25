// Supabase Database Layer — split into domain modules under ./db/
// This barrel preserves the '@/lib/supabase/db' import path for all call sites.

export * from './db/analytics';
export * from './db/content-blocks';
export * from './db/courses';
export * from './db/gamification';
export * from './db/lessons';
export * from './db/profile';
export * from './db/progress';
export * from './db/review';
export * from './db/sessions';

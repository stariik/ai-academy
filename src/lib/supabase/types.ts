// ============================================================
// Supabase DB Row Types (snake_case, matches schema)
// ============================================================

export type LessonRow = {
  id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  learning_objectives: string[];
  learning_objectives_en: string[] | null;
  key_concepts: { term: string; definition: string }[];
  summary: string;
  source_document: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  status: 'draft' | 'published';
  tags: string[];
  course_id: string | null;
  position_in_course: number | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentBlockRow = {
  id: string;
  lesson_id: string;
  page_id: string | null;
  type: string;
  content: string;
  content_en: string | null;
  metadata: Record<string, unknown> | null;
  order: number;
};

export type QuizQuestionRow = {
  id: string;
  lesson_id: string;
  page_id: string | null;
  type: string;
  question: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  scope: 'check' | 'final';
  bloom_level: string | null;
  metadata: Record<string, unknown> | null;
};

export type LessonPageRow = {
  id: string;
  lesson_id: string;
  page_number: number;
  title: string;
  title_en: string | null;
  key_concepts: { term: string; definition: string }[];
  teaching_flow: Record<string, string> | null;
  difficulty_level: string | null;
  bridge_from_previous: string | null;
  common_misconceptions: string[] | null;
  real_world_applications: string[] | null;
  created_at: string;
};

export type CourseRow = {
  id: string;
  title: string;
  title_en: string | null;
  description: string;
  description_en: string | null;
  tags: string[];
  user_id: string | null;
  // Optional pre-migration (2026-06-12-admin-panel.sql); mappers treat
  // undefined as null so the app works before the columns exist.
  price_cents?: number | null;
  retail_price_cents?: number | null;
  created_at: string;
  updated_at: string;
};

export type CategoryImageRow = {
  slug: string;
  image_url: string | null;
  prompt: string | null;
  bundle_price_cents?: number | null;
  bundle_retail_cents?: number | null;
  updated_at: string;
};

export type StudentSessionRow = {
  id: string;
  display_name: string;
  preferences: Record<string, unknown>;
  share_token: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type LessonProgressRow = {
  id: string;
  session_id: string;
  lesson_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  scroll_percentage: number;
  time_spent_seconds: number;
  current_page: number;
  completed_pages: number[];
  created_at: string;
  updated_at: string;
};

export type QuizAttemptRow = {
  id: string;
  session_id: string;
  lesson_id: string;
  score: number;
  total_points: number;
  percentage: number;
  passed: boolean;
  answers: { questionId: string; answer: string; isCorrect: boolean; feedback: string }[];
  created_at: string;
};

export type ChatHistoryRow = {
  id: string;
  session_id: string;
  lesson_id: string;
  page_number: number | null;
  messages: { id: string; role: string; content: string; timestamp: string }[];
  created_at: string;
  updated_at: string;
};

export type StudentProfileRow = {
  id: string;
  session_id: string;
  weak_topics: { topic: string; score: number }[];
  strong_topics: { topic: string; score: number }[];
  preferred_style: 'direct' | 'socratic' | 'exploratory';
  total_quizzes: number;
  average_score: number;
  total_time_spent: number;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ReviewItemRow = {
  id: string;
  session_id: string;
  question_id: string;
  lesson_id: string;
  ease: number;
  interval_days: number;
  repetitions: number;
  next_due_at: string;
  last_reviewed_at: string | null;
  last_quality: number | null;
  created_at: string;
  updated_at: string;
};

export type UserBadgeRow = {
  id: string;
  session_id: string;
  badge_code: string;
  metadata: Record<string, unknown>;
  earned_at: string;
};

// ============================================================
// Supabase DB Row Types (snake_case, matches schema)
// ============================================================

export type LessonRow = {
  id: string;
  title: string;
  description: string;
  learning_objectives: string[];
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
  concept_map: { concept_id: string; label: string; prerequisite_ids: string[] }[] | null;
  learning_path: string[] | null;
};

export type ContentBlockRow = {
  id: string;
  lesson_id: string;
  page_id: string | null;
  type: string;
  content: string;
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
  key_concepts: { term: string; definition: string }[];
  teaching_flow: Record<string, string> | null;
  prerequisites: string[] | null;
  concepts_introduced: string[] | null;
  difficulty_level: string | null;
  bridge_from_previous: string | null;
  common_misconceptions: string[] | null;
  real_world_applications: string[] | null;
  created_at: string;
};

export type CourseRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentSessionRow = {
  id: string;
  display_name: string;
  preferences: Record<string, unknown>;
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
  created_at: string;
  updated_at: string;
};

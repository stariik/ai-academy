// ============================================================
// AI Academy - Core Types
// ============================================================

export type ContentBlock = {
  id: string;
  type: 'heading' | 'text' | 'key_concepts' | 'code' | 'callout' | 'summary';
  content: string;
  metadata?: Record<string, unknown>;
  order: number;
  pageId?: string;
};

export type QuizQuestion = {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  pageId?: string;
  scope?: 'check' | 'final';
};

export type LessonPage = {
  id: string;
  lessonId: string;
  pageNumber: number;
  title: string;
  keyConcepts: { term: string; definition: string }[];
  contentBlocks: ContentBlock[];
  checkQuestions: QuizQuestion[];
};

export type Lesson = {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  contentBlocks: ContentBlock[];
  keyConcepts: { term: string; definition: string }[];
  summary: string;
  quizQuestions: QuizQuestion[];
  sourceDocument: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDurationMinutes: number;
  createdAt: string;
  status: 'draft' | 'published';
  tags?: string[];
  courseId?: string;
  positionInCourse?: number;
  pages?: LessonPage[];
  totalPages?: number;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
};

export type QuizAttempt = {
  questionId: string;
  answer: string;
  isCorrect?: boolean;
  feedback?: string;
};

export type QuizResult = {
  score: number;
  totalPoints: number;
  percentage: number;
  passed: boolean;
  answers: QuizAttempt[];
};

export type AnalysisResult = {
  lesson: Lesson;
  rawResponse?: string;
  tokensUsed?: number;
  processingTimeMs: number;
};

export type GeminiLessonResponse = {
  title: string;
  description: string;
  learning_objectives: string[];
  content_blocks: {
    type: string;
    content: string;
    metadata?: Record<string, unknown>;
  }[];
  key_concepts: { term: string; definition: string }[];
  summary: string;
  quiz_questions: {
    question: string;
    type: 'mcq' | 'true_false' | 'short_answer';
    options?: string[];
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
  }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
};

export type GeminiPagedLessonResponse = {
  title: string;
  description: string;
  learning_objectives: string[];
  pages: {
    page_number: number;
    title: string;
    content_blocks: {
      type: string;
      content: string;
      metadata?: Record<string, unknown>;
    }[];
    key_concepts: { term: string; definition: string }[];
    check_questions: {
      question: string;
      type: 'mcq' | 'true_false';
      options: string[];
      correct_answer: string;
      explanation: string;
      difficulty: 'easy' | 'medium';
      points: number;
    }[];
  }[];
  summary: string;
  final_quiz_questions: {
    question: string;
    type: 'mcq' | 'true_false' | 'short_answer';
    options?: string[];
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
  }[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
};

// ============================================================
// New Types - Courses, Sessions, Progress, Profiles
// ============================================================

export type Course = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentSession = {
  id: string;
  displayName: string;
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type LessonProgress = {
  id: string;
  sessionId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  scrollPercentage: number;
  timeSpentSeconds: number;
  currentPage: number;
  completedPages: number[];
  createdAt: string;
  updatedAt: string;
};

export type StudentProfile = {
  id: string;
  sessionId: string;
  weakTopics: { topic: string; score: number }[];
  strongTopics: { topic: string; score: number }[];
  preferredStyle: 'direct' | 'socratic' | 'exploratory';
  totalQuizzes: number;
  averageScore: number;
  totalTimeSpent: number;
  createdAt: string;
  updatedAt: string;
};

// ============================================================
// AI Academy - Core Types
// ============================================================

export type ContentBlock = {
  id: string;
  type:
    | 'heading'
    | 'text'
    | 'key_concepts'
    | 'code'
    | 'callout'
    | 'summary'
    | 'table'
    | 'list'
    | 'example'
    | 'analogy'
    | 'step_by_step'
    | 'diagram_description'
    | 'definition'
    | 'warning'
    | 'tip'
    | 'quote';
  content: string;
  contentEn?: string | null;
  metadata?: Record<string, unknown>;
  order: number;
  pageId?: string;
};

export type QuizQuestion = {
  id: string;
  type: 'mcq' | 'true_false' | 'short_answer' | 'ordering' | 'fill_in_blank' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  pageId?: string;
  scope?: 'check' | 'final';
  bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  metadata?: Record<string, unknown>;
};

export type TeachingFlow = {
  reflectionPrompt: string;
  // Legacy fields from earlier generations — present in older DB rows, never generated for new lessons.
  introduction?: string;
  coreExplanation?: string;
  practiceHint?: string;
};

export type LessonPage = {
  id: string;
  lessonId: string;
  pageNumber: number;
  title: string;
  titleEn?: string | null;
  keyConcepts: { term: string; definition: string }[];
  contentBlocks: ContentBlock[];
  checkQuestions: QuizQuestion[];
  teachingFlow?: TeachingFlow;
  difficultyLevel?: 'foundational' | 'intermediate' | 'advanced' | 'synthesis';
  bridgeFromPrevious?: string;
  commonMisconceptions?: string[];
  realWorldApplications?: string[];
};

export type Lesson = {
  id: string;
  title: string;
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  learningObjectives: string[];
  learningObjectivesEn?: string[] | null;
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
      type: string;
      options?: string[];
      correct_answer: string;
      explanation: string;
      difficulty: 'easy' | 'medium' | 'hard';
      points: number;
      metadata?: Record<string, unknown>;
    }[];
    teaching_flow?: { reflection_prompt: string };
    difficulty_level?: string;
    bridge_from_previous?: string | null;
    common_misconceptions?: string[];
    real_world_applications?: string[];
  }[];
  summary: string;
  final_quiz_questions: {
    question: string;
    type: string;
    options?: string[];
    correct_answer: string;
    explanation: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    metadata?: Record<string, unknown>;
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
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  tags: string[];
  imageUrl?: string | null;
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
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewItem = {
  id: string;
  sessionId: string;
  questionId: string;
  lessonId: string;
  ease: number;
  intervalDays: number;
  repetitions: number;
  nextDueAt: string;
  lastReviewedAt: string | null;
  lastQuality: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ReviewQueueItem = {
  reviewItem: ReviewItem;
  question: QuizQuestion;
  lessonId: string;
  lessonTitle: string;
};

export type UserBadge = {
  id: string;
  sessionId: string;
  badgeCode: string;
  metadata: Record<string, unknown>;
  earnedAt: string;
};

export type LeaderboardEntry = {
  sessionId: string;
  displayName: string;
  xp: number;
  lessonsCompleted: number;
  rank: number;
};

// ============================================================
// Course Generation (multi-lesson from single PDF)
// ============================================================

export type CourseGenerationProgress = {
  status:
    | 'parsing_syllabus'
    | 'extracting_outline'
    | 'expanding_lessons'
    | 'generating_lesson'
    | 'saving'
    | 'complete'
    | 'error';
  totalLessons: number;
  currentLesson: number;
  currentLessonTitle: string;
  courseId?: string;
  courseName?: string;
  lessons: { id: string; title: string; pages: number; position: number }[];
  // Only set during 'expanding_lessons' — how many syllabus lessons have been expanded so far
  expansionProgress?: { current: number; total: number };
  error?: string;
};

// ============================================================
// Leads (onboarding funnel)
// ============================================================

export type Lead = {
  id: string;
  email: string | null;
  phone: string | null;
  ageGroup: 'child' | 'adult';
  topics: string[];
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  createdAt: string;
};

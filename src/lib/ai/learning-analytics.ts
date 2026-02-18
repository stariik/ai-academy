// ============================================================
// Learning Analytics - Quiz analysis, topic tracking, recommendations
// ============================================================

import type { Lesson, QuizQuestion, StudentProfile } from '@/types';

type GradingResult = {
  questionId: string;
  isCorrect: boolean;
  feedback: string;
  points: number;
  maxPoints: number;
};

type TopicAnalysis = {
  weakTopics: { topic: string; score: number }[];
  strongTopics: { topic: string; score: number }[];
};

/**
 * Maps wrong answers to lesson key_concepts to extract topic names.
 */
export function analyzeQuizWeaknesses(
  questions: QuizQuestion[],
  gradingResults: GradingResult[],
  lesson: Lesson
): TopicAnalysis {
  const weakTopics: { topic: string; score: number }[] = [];
  const strongTopics: { topic: string; score: number }[] = [];

  for (const result of gradingResults) {
    const question = questions.find((q) => q.id === result.questionId);
    if (!question) continue;

    // Find the most related key concept for this question
    const relatedConcept = findRelatedConcept(question.question, lesson.keyConcepts);
    const topicName = relatedConcept?.term ?? extractTopicFromQuestion(question.question);

    if (result.isCorrect) {
      strongTopics.push({ topic: topicName, score: result.points / result.maxPoints });
    } else {
      weakTopics.push({ topic: topicName, score: 1 - result.points / result.maxPoints });
    }
  }

  return { weakTopics, strongTopics };
}

/**
 * Merge new analysis with existing profile topics.
 * Deduplicates, updates scores, moves topics between weak/strong.
 */
export function mergeTopicAnalysis(
  existingProfile: StudentProfile,
  newAnalysis: TopicAnalysis
): TopicAnalysis {
  const weakMap = new Map<string, number>();
  const strongMap = new Map<string, number>();

  // Load existing
  for (const t of existingProfile.weakTopics) {
    weakMap.set(t.topic.toLowerCase(), t.score);
  }
  for (const t of existingProfile.strongTopics) {
    strongMap.set(t.topic.toLowerCase(), t.score);
  }

  // Merge new weak topics
  for (const t of newAnalysis.weakTopics) {
    const key = t.topic.toLowerCase();
    const existing = weakMap.get(key) ?? 0;
    weakMap.set(key, (existing + t.score) / (existing ? 2 : 1));
    // Remove from strong if it appeared there
    strongMap.delete(key);
  }

  // Merge new strong topics
  for (const t of newAnalysis.strongTopics) {
    const key = t.topic.toLowerCase();
    const existingWeak = weakMap.get(key);
    if (existingWeak !== undefined) {
      // Was weak, now correct - reduce weakness score
      const newScore = existingWeak * 0.5;
      if (newScore < 0.3) {
        weakMap.delete(key);
        strongMap.set(key, t.score);
      } else {
        weakMap.set(key, newScore);
      }
    } else {
      const existing = strongMap.get(key) ?? 0;
      strongMap.set(key, (existing + t.score) / (existing ? 2 : 1));
    }
  }

  return {
    weakTopics: Array.from(weakMap.entries()).map(([topic, score]) => ({ topic, score })),
    strongTopics: Array.from(strongMap.entries()).map(([topic, score]) => ({ topic, score })),
  };
}

/**
 * Determines the best teaching style based on student's average quiz performance.
 */
export function determineTeachingStyle(
  profile: Pick<StudentProfile, 'averageScore'>
): 'direct' | 'socratic' | 'exploratory' {
  if (profile.averageScore < 50) return 'direct';
  if (profile.averageScore <= 85) return 'socratic';
  return 'exploratory';
}

/**
 * Scores a lesson for recommendation based on student profile.
 */
export function scoreLessonForRecommendation(
  lesson: Lesson,
  profile: StudentProfile,
  completedIds: string[]
): number {
  if (completedIds.includes(lesson.id)) return -1;

  let score = 0;

  // +10 for weak topic overlap
  const weakTopicNames = profile.weakTopics.map((t) => t.topic.toLowerCase());
  const lessonTopics = [
    ...lesson.keyConcepts.map((c) => c.term.toLowerCase()),
    ...(lesson.tags ?? []).map((t) => t.toLowerCase()),
  ];
  const overlap = lessonTopics.filter((t) =>
    weakTopicNames.some((wt) => t.includes(wt) || wt.includes(t))
  ).length;
  score += overlap * 10;

  // +5 for appropriate difficulty
  if (profile.averageScore < 50 && lesson.difficulty === 'beginner') score += 5;
  else if (profile.averageScore >= 50 && profile.averageScore < 85 && lesson.difficulty === 'intermediate') score += 5;
  else if (profile.averageScore >= 85 && lesson.difficulty === 'advanced') score += 5;

  // +8 for next-in-course
  if (lesson.courseId && lesson.positionInCourse !== undefined) {
    score += 8;
  }

  return score;
}

// ---- Helpers ----

function findRelatedConcept(
  questionText: string,
  keyConcepts: { term: string; definition: string }[]
): { term: string; definition: string } | null {
  const lower = questionText.toLowerCase();
  return (
    keyConcepts.find(
      (c) =>
        lower.includes(c.term.toLowerCase()) ||
        c.definition.toLowerCase().split(' ').some((w) => w.length > 4 && lower.includes(w))
    ) ?? null
  );
}

function extractTopicFromQuestion(question: string): string {
  // Extract a meaningful topic from the question text
  const cleaned = question
    .replace(/^(what|which|how|why|when|where|who|is|are|does|do|can|could|would|should)\s+/i, '')
    .replace(/\?$/, '')
    .trim();
  // Take first ~5 meaningful words
  const words = cleaned.split(/\s+/).slice(0, 5);
  return words.join(' ');
}

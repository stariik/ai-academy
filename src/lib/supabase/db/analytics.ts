import { SupabaseClient } from '@supabase/supabase-js';


// ============================================================
// Admin Analytics (Task 14)
// ============================================================

export type LessonPassRate = {
  lessonId: string;
  lessonTitle: string;
  courseId: string | null;
  attempts: number;
  passed: number;
  passRate: number; // 0–100
  averagePercentage: number;
};

export async function getLessonPassRates(
  supabase: SupabaseClient,
  limit = 50
): Promise<LessonPassRate[]> {
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('lesson_id, passed, percentage');
  if (!attempts || attempts.length === 0) return [];

  type Row = { lesson_id: string; passed: boolean; percentage: number };
  const by = new Map<string, { attempts: number; passed: number; sumPct: number }>();
  for (const a of attempts as Row[]) {
    const agg = by.get(a.lesson_id) ?? { attempts: 0, passed: 0, sumPct: 0 };
    agg.attempts += 1;
    if (a.passed) agg.passed += 1;
    agg.sumPct += a.percentage ?? 0;
    by.set(a.lesson_id, agg);
  }

  const lessonIds = Array.from(by.keys());
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, title, course_id')
    .in('id', lessonIds);
  const byLesson = new Map(
    ((lessonRows ?? []) as { id: string; title: string; course_id: string | null }[]).map((l) => [l.id, l])
  );

  const entries: LessonPassRate[] = lessonIds.map((id) => {
    const agg = by.get(id)!;
    const lesson = byLesson.get(id);
    return {
      lessonId: id,
      lessonTitle: lesson?.title ?? id,
      courseId: lesson?.course_id ?? null,
      attempts: agg.attempts,
      passed: agg.passed,
      passRate: agg.attempts > 0 ? Math.round((agg.passed / agg.attempts) * 100) : 0,
      averagePercentage: agg.attempts > 0 ? Math.round(agg.sumPct / agg.attempts) : 0,
    };
  });

  // Most-attempted first, then worst pass-rate — the combo surfaces "tough lessons with real traffic".
  entries.sort((a, b) => {
    if (b.attempts !== a.attempts) return b.attempts - a.attempts;
    return a.passRate - b.passRate;
  });
  return entries.slice(0, limit);
}

export type PageDropOff = {
  lessonId: string;
  lessonTitle: string;
  totalStudents: number;
  completedLesson: number;
  stuckOnPage: { page: number; count: number }[]; // most-common last pages
};

export async function getPageDropOff(
  supabase: SupabaseClient,
  limit = 20
): Promise<PageDropOff[]> {
  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, current_page');
  if (!progress || progress.length === 0) return [];

  type Row = { lesson_id: string; status: string; current_page: number };
  const byLesson = new Map<string, { students: number; completed: number; pages: Map<number, number> }>();
  for (const p of progress as Row[]) {
    const agg =
      byLesson.get(p.lesson_id) ?? { students: 0, completed: 0, pages: new Map<number, number>() };
    agg.students += 1;
    if (p.status === 'completed') agg.completed += 1;
    else {
      // Only count the non-completed students against the stuck-on-page histogram.
      const pg = p.current_page ?? 1;
      agg.pages.set(pg, (agg.pages.get(pg) ?? 0) + 1);
    }
    byLesson.set(p.lesson_id, agg);
  }

  const lessonIds = Array.from(byLesson.keys());
  const { data: lessonRows } = await supabase
    .from('lessons')
    .select('id, title')
    .in('id', lessonIds);
  const titleById = new Map(
    ((lessonRows ?? []) as { id: string; title: string }[]).map((l) => [l.id, l.title])
  );

  const entries: PageDropOff[] = lessonIds.map((id) => {
    const agg = byLesson.get(id)!;
    const pages = Array.from(agg.pages.entries())
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return {
      lessonId: id,
      lessonTitle: titleById.get(id) ?? id,
      totalStudents: agg.students,
      completedLesson: agg.completed,
      stuckOnPage: pages,
    };
  });

  // Lessons with the most non-completion count first.
  entries.sort((a, b) => {
    const aStuck = a.totalStudents - a.completedLesson;
    const bStuck = b.totalStudents - b.completedLesson;
    return bStuck - aStuck;
  });
  return entries.slice(0, limit);
}

export type CourseCompletionStat = {
  courseId: string;
  courseTitle: string;
  totalLessons: number;
  fullCompleters: number;
  averageMinutes: number | null;
};

export async function getCourseCompletionStats(
  supabase: SupabaseClient
): Promise<CourseCompletionStat[]> {
  const [{ data: courses }, { data: lessons }, { data: progress }] = await Promise.all([
    supabase.from('courses').select('id, title'),
    supabase.from('lessons').select('id, course_id'),
    supabase.from('lesson_progress').select('session_id, lesson_id, status, time_spent_seconds'),
  ]);
  if (!courses || courses.length === 0) return [];

  type Lsn = { id: string; course_id: string | null };
  type Prog = { session_id: string; lesson_id: string; status: string; time_spent_seconds: number };

  const lessonsByCourse = new Map<string, string[]>();
  for (const l of (lessons ?? []) as Lsn[]) {
    if (!l.course_id) continue;
    const arr = lessonsByCourse.get(l.course_id) ?? [];
    arr.push(l.id);
    lessonsByCourse.set(l.course_id, arr);
  }

  // Group progress rows by session+course
  const bySessionCourse = new Map<string, { completedLessons: Set<string>; totalSeconds: number }>();
  const lessonToCourse = new Map<string, string>();
  for (const l of (lessons ?? []) as Lsn[]) {
    if (l.course_id) lessonToCourse.set(l.id, l.course_id);
  }
  for (const p of (progress ?? []) as Prog[]) {
    const courseId = lessonToCourse.get(p.lesson_id);
    if (!courseId) continue;
    const key = `${p.session_id}::${courseId}`;
    const entry = bySessionCourse.get(key) ?? { completedLessons: new Set<string>(), totalSeconds: 0 };
    if (p.status === 'completed') entry.completedLessons.add(p.lesson_id);
    entry.totalSeconds += p.time_spent_seconds ?? 0;
    bySessionCourse.set(key, entry);
  }

  return (courses as { id: string; title: string }[]).map((c) => {
    const lessonIds = lessonsByCourse.get(c.id) ?? [];
    const totalLessons = lessonIds.length;

    let fullCompleters = 0;
    const completionSeconds: number[] = [];
    for (const [key, entry] of bySessionCourse.entries()) {
      if (!key.endsWith(`::${c.id}`)) continue;
      if (totalLessons > 0 && entry.completedLessons.size === totalLessons) {
        fullCompleters += 1;
        completionSeconds.push(entry.totalSeconds);
      }
    }

    const averageMinutes =
      completionSeconds.length > 0
        ? Math.round(
            completionSeconds.reduce((a, b) => a + b, 0) / completionSeconds.length / 60
          )
        : null;

    return {
      courseId: c.id,
      courseTitle: c.title,
      totalLessons,
      fullCompleters,
      averageMinutes,
    };
  });
}

// ============================================================
// Admin panel data layer (server-only).
//
// Every reader here uses the service-role client: admin views need to
// see across all users/sessions, and several tables (enrollments,
// promo_codes, ai_usage) are RLS-restricted to "own rows" or deny-all.
// Callers MUST be behind getAdminUser() — the /admin layout and every
// /api/admin route enforce that.
// ============================================================

import 'server-only';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  OnboardingAnswer,
  OnboardingTranscriptMessage,
} from '@/lib/onboarding';

let cached: SupabaseClient | null = null;

export function adminDb(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — required for the admin panel');
  }
  cached = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function countRows(
  db: SupabaseClient,
  table: string,
  filter?: (q: ReturnType<ReturnType<SupabaseClient['from']>['select']>) => typeof q,
): Promise<number> {
  let q = db.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = filter(q);
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}

/** auth.users id -> email map. Paginates; fine for a few thousand users. */
async function getUserEmailMap(db: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    for (let page = 1; page <= 10; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) {
        if (u.email) map.set(u.id, u.email);
      }
      if (data.users.length < 1000) break;
    }
  } catch {
    // No auth-admin access — emails just render as "—".
  }
  return map;
}

// ============================================================
// Overview (dashboard)
// ============================================================

export type OverviewData = {
  totals: {
    // totalSessions = every anonymous student_sessions row (inflated by bots
    // / dev visits — a row is minted whenever someone opens a lesson page).
    // engagedStudents = sessions that actually did something (progress / chat
    // / quiz). registeredUsers = real auth.users accounts. Lead with the last
    // two; totalSessions is shown only as context.
    totalSessions: number;
    engagedStudents: number;
    registeredUsers: number;
    emptySessions: number;
    courses: number;
    lessonsPublished: number;
    lessonsTotal: number;
    enrollments: number;
    leads: number;
    quizAttempts: number;
  };
  week: {
    newStudents: number;
    activeStudents: number;
    quizAttempts: number;
    enrollments: number;
    leads: number;
  };
  ai: {
    available: boolean;
    cost7d: number;
    cost30d: number;
    calls7d: number;
    tokens7d: number;
  };
  recentEnrollments: {
    id: string;
    email: string | null;
    courseTitle: string;
    source: string;
    createdAt: string;
  }[];
  recentLeads: {
    id: string;
    contact: string;
    ageGroup: string;
    topics: string[];
    createdAt: string;
  }[];
  recentStudents: {
    id: string;
    displayName: string;
    email: string | null;
    createdAt: string;
  }[];
};

export async function getOverview(): Promise<OverviewData> {
  const db = adminDb();
  const sevenDays = daysAgoIso(7);
  const thirtyDays = daysAgoIso(30);

  const [
    totalSessions,
    registeredUsersMap,
    courses,
    lessonsTotal,
    lessonsPublished,
    enrollments,
    leads,
    quizAttempts,
    newStudents7,
    activeProgressRows,
    quizAttempts7,
    enrollments7,
    leads7,
    aiRows30,
    recentEnrollRows,
    recentLeadRows,
    recentSessionRows,
    progressSessions,
    chatSessions,
    quizSessions,
  ] = await Promise.all([
    countRows(db, 'student_sessions'),
    getUserEmailMap(db),
    countRows(db, 'courses'),
    countRows(db, 'lessons'),
    countRows(db, 'lessons', (q) => q.eq('status', 'published')),
    countRows(db, 'enrollments'),
    countRows(db, 'leads'),
    countRows(db, 'quiz_attempts'),
    countRows(db, 'student_sessions', (q) => q.gte('created_at', sevenDays)),
    // "Active this week" = sessions with lesson progress touched in the last
    // 7 days (the truthful learning-activity signal; session.updated_at only
    // bumps on profile/session edits, not on lesson views).
    db.from('lesson_progress').select('session_id').gte('updated_at', sevenDays),
    countRows(db, 'quiz_attempts', (q) => q.gte('created_at', sevenDays)),
    countRows(db, 'enrollments', (q) => q.gte('created_at', sevenDays)),
    countRows(db, 'leads', (q) => q.gte('created_at', sevenDays)),
    db
      .from('ai_usage')
      .select('created_at, cost_usd, input_tokens, output_tokens')
      .gte('created_at', thirtyDays)
      .order('created_at', { ascending: false })
      .limit(20000),
    db
      .from('enrollments')
      .select('id, user_id, course_id, source, created_at, courses(title)')
      .order('created_at', { ascending: false })
      .limit(8),
    db
      .from('leads')
      .select('id, email, phone, age_group, topics, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    db
      .from('student_sessions')
      .select('id, display_name, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
    // Distinct sessions that ever engaged (any progress / chat / quiz row) —
    // the honest "learners" count, vs the inflated raw session total.
    db.from('lesson_progress').select('session_id'),
    db.from('chat_history').select('session_id'),
    db.from('quiz_attempts').select('session_id'),
  ]);

  const activeStudents7 = new Set(
    ((activeProgressRows.data ?? []) as { session_id: string }[]).map((r) => r.session_id),
  ).size;

  const engagedSet = new Set<string>();
  for (const rows of [progressSessions.data, chatSessions.data, quizSessions.data]) {
    for (const r of (rows ?? []) as { session_id: string }[]) engagedSet.add(r.session_id);
  }
  const engagedStudents = engagedSet.size;

  let ai: OverviewData['ai'] = { available: false, cost7d: 0, cost30d: 0, calls7d: 0, tokens7d: 0 };
  if (!aiRows30.error && aiRows30.data) {
    ai = { available: true, cost7d: 0, cost30d: 0, calls7d: 0, tokens7d: 0 };
    for (const r of aiRows30.data as {
      created_at: string;
      cost_usd: number;
      input_tokens: number;
      output_tokens: number;
    }[]) {
      const cost = Number(r.cost_usd) || 0;
      ai.cost30d += cost;
      if (r.created_at >= sevenDays) {
        ai.cost7d += cost;
        ai.calls7d += 1;
        ai.tokens7d += (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
      }
    }
  }

  type EnrollRow = {
    id: string;
    user_id: string;
    source: string;
    created_at: string;
    courses: { title: string } | { title: string }[] | null;
  };
  const recentEnrollments = ((recentEnrollRows.data ?? []) as EnrollRow[]).map((r) => {
    const course = Array.isArray(r.courses) ? r.courses[0] : r.courses;
    return {
      id: r.id,
      email: registeredUsersMap.get(r.user_id) ?? null,
      courseTitle: course?.title ?? '(deleted course)',
      source: r.source,
      createdAt: r.created_at,
    };
  });

  const recentLeads = ((recentLeadRows.data ?? []) as {
    id: string;
    email: string | null;
    phone: string | null;
    age_group: string;
    topics: string[];
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    contact: r.email ?? r.phone ?? '—',
    ageGroup: r.age_group,
    topics: r.topics ?? [],
    createdAt: r.created_at,
  }));

  const recentStudents = ((recentSessionRows.data ?? []) as {
    id: string;
    display_name: string;
    user_id: string | null;
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    displayName: r.display_name,
    email: r.user_id ? (registeredUsersMap.get(r.user_id) ?? null) : null,
    createdAt: r.created_at,
  }));

  return {
    totals: {
      totalSessions,
      engagedStudents,
      registeredUsers: registeredUsersMap.size,
      emptySessions: Math.max(0, totalSessions - engagedStudents),
      courses,
      lessonsPublished,
      lessonsTotal,
      enrollments,
      leads,
      quizAttempts,
    },
    week: {
      newStudents: newStudents7,
      activeStudents: activeStudents7,
      quizAttempts: quizAttempts7,
      enrollments: enrollments7,
      leads: leads7,
    },
    ai,
    recentEnrollments,
    recentLeads,
    recentStudents,
  };
}

// ============================================================
// Students
// ============================================================

export type StudentListItem = {
  sessionId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  totalXp: number;
  currentStreak: number;
  totalQuizzes: number;
  averageScore: number;
  lessonsCompleted: number;
  lessonsInProgress: number;
  chatMessages: number;
  enrollments: number;
  /** True if this session ever did anything (progress / chat / quiz). */
  hasActivity: boolean;
  createdAt: string;
  lastActiveAt: string;
};

export async function listStudents(): Promise<StudentListItem[]> {
  const db = adminDb();

  const [sessionsRes, profilesRes, progressRes, chatRes, quizRes, enrollRes, emailMap] =
    await Promise.all([
      db
        .from('student_sessions')
        .select('id, display_name, user_id, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(2000),
      db
        .from('student_profiles')
        .select('session_id, total_xp, current_streak, total_quizzes, average_score'),
      db.from('lesson_progress').select('session_id, status'),
      db.from('chat_history').select('session_id'),
      db.from('quiz_attempts').select('session_id'),
      db.from('enrollments').select('user_id'),
      getUserEmailMap(db),
    ]);

  const profiles = new Map(
    ((profilesRes.data ?? []) as {
      session_id: string;
      total_xp: number;
      current_streak: number;
      total_quizzes: number;
      average_score: number;
    }[]).map((p) => [p.session_id, p]),
  );

  const completed = new Map<string, number>();
  const inProgress = new Map<string, number>();
  const touchedProgress = new Set<string>();
  for (const p of (progressRes.data ?? []) as { session_id: string; status: string }[]) {
    touchedProgress.add(p.session_id);
    if (p.status === 'completed') {
      completed.set(p.session_id, (completed.get(p.session_id) ?? 0) + 1);
    } else if (p.status === 'in_progress') {
      inProgress.set(p.session_id, (inProgress.get(p.session_id) ?? 0) + 1);
    }
  }

  const chatCounts = new Map<string, number>();
  for (const c of (chatRes.data ?? []) as { session_id: string }[]) {
    chatCounts.set(c.session_id, (chatCounts.get(c.session_id) ?? 0) + 1);
  }
  const quizSessions = new Set(
    ((quizRes.data ?? []) as { session_id: string }[]).map((q) => q.session_id),
  );

  const enrollCounts = new Map<string, number>();
  for (const e of (enrollRes.data ?? []) as { user_id: string }[]) {
    enrollCounts.set(e.user_id, (enrollCounts.get(e.user_id) ?? 0) + 1);
  }

  return ((sessionsRes.data ?? []) as {
    id: string;
    display_name: string;
    user_id: string | null;
    created_at: string;
    updated_at: string;
  }[]).map((s) => {
    const profile = profiles.get(s.id);
    const hasActivity =
      touchedProgress.has(s.id) || chatCounts.has(s.id) || quizSessions.has(s.id);
    return {
      sessionId: s.id,
      displayName: s.display_name,
      email: s.user_id ? (emailMap.get(s.user_id) ?? null) : null,
      userId: s.user_id,
      totalXp: profile?.total_xp ?? 0,
      currentStreak: profile?.current_streak ?? 0,
      totalQuizzes: profile?.total_quizzes ?? 0,
      averageScore: Math.round(profile?.average_score ?? 0),
      lessonsCompleted: completed.get(s.id) ?? 0,
      lessonsInProgress: inProgress.get(s.id) ?? 0,
      chatMessages: chatCounts.get(s.id) ?? 0,
      enrollments: s.user_id ? (enrollCounts.get(s.user_id) ?? 0) : 0,
      hasActivity,
      createdAt: s.created_at,
      lastActiveAt: s.updated_at,
    };
  });
}

export type StudentDetail = {
  sessionId: string;
  displayName: string;
  email: string | null;
  userId: string | null;
  createdAt: string;
  lastActiveAt: string;
  profile: {
    totalXp: number;
    currentStreak: number;
    longestStreak: number;
    totalQuizzes: number;
    averageScore: number;
    totalTimeSpentMinutes: number;
    preferredStyle: string;
    weakTopics: { topic: string; score: number }[];
    strongTopics: { topic: string; score: number }[];
  } | null;
  badges: { code: string; earnedAt: string }[];
  progress: {
    lessonId: string;
    lessonTitle: string;
    courseTitle: string | null;
    status: string;
    currentPage: number;
    timeSpentMinutes: number;
    updatedAt: string;
  }[];
  quizAttempts: {
    id: string;
    lessonTitle: string;
    percentage: number;
    passed: boolean;
    createdAt: string;
  }[];
  enrollments: {
    id: string;
    courseId: string;
    courseTitle: string;
    source: string;
    createdAt: string;
  }[];
  reviewQueueDue: number;
  ai: {
    available: boolean;
    calls: number;
    tokens: number;
    costUsd: number;
  };
  onboarding: {
    status: 'in_progress' | 'completed';
    questionCount: number;
    primaryGoal: string;
    desiredOutcome: string;
    experienceLevel: string;
    learningPreferences: string[];
    weeklyCommitment: string;
    barriers: string[];
    summary: string;
    segmentLabel: string;
    verbatimQuote: string;
    transcript: OnboardingTranscriptMessage[];
  } | null;
};

export async function getStudentDetail(sessionId: string): Promise<StudentDetail | null> {
  const db = adminDb();

  const sessionRes = await db
    .from('student_sessions')
    .select('id, display_name, user_id, created_at, updated_at')
    .eq('id', sessionId)
    .maybeSingle();
  if (sessionRes.error || !sessionRes.data) return null;
  const session = sessionRes.data as {
    id: string;
    display_name: string;
    user_id: string | null;
    created_at: string;
    updated_at: string;
  };

  const [profileRes, badgesRes, progressRes, attemptsRes, lessonsRes, coursesRes, dueRes, aiRes] =
    await Promise.all([
      db.from('student_profiles').select('*').eq('session_id', sessionId).maybeSingle(),
      db
        .from('user_badges')
        .select('badge_code, earned_at')
        .eq('session_id', sessionId)
        .order('earned_at', { ascending: false }),
      db
        .from('lesson_progress')
        .select('lesson_id, status, current_page, time_spent_seconds, updated_at')
        .eq('session_id', sessionId)
        .order('updated_at', { ascending: false }),
      db
        .from('quiz_attempts')
        .select('id, lesson_id, percentage, passed, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50),
      db.from('lessons').select('id, title, course_id'),
      db.from('courses').select('id, title'),
      db
        .from('review_items')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .lte('next_due_at', new Date().toISOString()),
      db
        .from('ai_usage')
        .select('input_tokens, output_tokens, cost_usd')
        .eq('session_id', sessionId)
        .limit(20000),
    ]);

  const lessonById = new Map(
    ((lessonsRes.data ?? []) as { id: string; title: string; course_id: string | null }[]).map(
      (l) => [l.id, l],
    ),
  );
  const courseById = new Map(
    ((coursesRes.data ?? []) as { id: string; title: string }[]).map((c) => [c.id, c.title]),
  );

  let email: string | null = null;
  if (session.user_id) {
    try {
      const { data } = await db.auth.admin.getUserById(session.user_id);
      email = data?.user?.email ?? null;
    } catch {
      email = null;
    }
  }

  let enrollments: StudentDetail['enrollments'] = [];
  if (session.user_id) {
    const enrollRes = await db
      .from('enrollments')
      .select('id, course_id, source, created_at')
      .eq('user_id', session.user_id)
      .order('created_at', { ascending: false });
    enrollments = ((enrollRes.data ?? []) as {
      id: string;
      course_id: string;
      source: string;
      created_at: string;
    }[]).map((e) => ({
      id: e.id,
      courseId: e.course_id,
      courseTitle: courseById.get(e.course_id) ?? '(deleted course)',
      source: e.source,
      createdAt: e.created_at,
    }));
  }

  let onboarding: StudentDetail['onboarding'] = null;
  if (session.user_id) {
    const onboardingRes = await db
      .from('onboarding_profiles')
      .select(
        'status, question_count, primary_goal, desired_outcome, experience_level, learning_preferences, weekly_commitment, barriers, ai_summary, segment_label, verbatim_quote, transcript',
      )
      .eq('user_id', session.user_id)
      .maybeSingle();
    if (onboardingRes.data) {
      const row = onboardingRes.data as Record<string, unknown>;
      const strings = (value: unknown) =>
        Array.isArray(value)
          ? value.filter((item): item is string => typeof item === 'string')
          : [];
      onboarding = {
        status: row.status === 'completed' ? 'completed' : 'in_progress',
        questionCount: Number(row.question_count) || 0,
        primaryGoal: typeof row.primary_goal === 'string' ? row.primary_goal : '',
        desiredOutcome: typeof row.desired_outcome === 'string' ? row.desired_outcome : '',
        experienceLevel: typeof row.experience_level === 'string' ? row.experience_level : '',
        learningPreferences: strings(row.learning_preferences),
        weeklyCommitment: typeof row.weekly_commitment === 'string' ? row.weekly_commitment : '',
        barriers: strings(row.barriers),
        summary: typeof row.ai_summary === 'string' ? row.ai_summary : '',
        segmentLabel: typeof row.segment_label === 'string' ? row.segment_label : '',
        verbatimQuote: typeof row.verbatim_quote === 'string' ? row.verbatim_quote : '',
        transcript: Array.isArray(row.transcript)
          ? (row.transcript as OnboardingTranscriptMessage[])
          : [],
      };
    }
  }

  const profileRow = profileRes.data as {
    total_xp: number;
    current_streak: number;
    longest_streak: number;
    total_quizzes: number;
    average_score: number;
    total_time_spent: number;
    preferred_style: string;
    weak_topics: { topic: string; score: number }[];
    strong_topics: { topic: string; score: number }[];
  } | null;

  const ai: StudentDetail['ai'] = { available: !aiRes.error, calls: 0, tokens: 0, costUsd: 0 };
  if (!aiRes.error && aiRes.data) {
    for (const r of aiRes.data as { input_tokens: number; output_tokens: number; cost_usd: number }[]) {
      ai.calls += 1;
      ai.tokens += (r.input_tokens ?? 0) + (r.output_tokens ?? 0);
      ai.costUsd += Number(r.cost_usd) || 0;
    }
  }

  return {
    sessionId: session.id,
    displayName: session.display_name,
    email,
    userId: session.user_id,
    createdAt: session.created_at,
    lastActiveAt: session.updated_at,
    profile: profileRow
      ? {
          totalXp: profileRow.total_xp ?? 0,
          currentStreak: profileRow.current_streak ?? 0,
          longestStreak: profileRow.longest_streak ?? 0,
          totalQuizzes: profileRow.total_quizzes ?? 0,
          averageScore: Math.round(profileRow.average_score ?? 0),
          totalTimeSpentMinutes: Math.round((profileRow.total_time_spent ?? 0) / 60),
          preferredStyle: profileRow.preferred_style,
          weakTopics: profileRow.weak_topics ?? [],
          strongTopics: profileRow.strong_topics ?? [],
        }
      : null,
    badges: ((badgesRes.data ?? []) as { badge_code: string; earned_at: string }[]).map((b) => ({
      code: b.badge_code,
      earnedAt: b.earned_at,
    })),
    enrollments,
    progress: ((progressRes.data ?? []) as {
      lesson_id: string;
      status: string;
      current_page: number;
      time_spent_seconds: number;
      updated_at: string;
    }[]).map((p) => {
      const lesson = lessonById.get(p.lesson_id);
      return {
        lessonId: p.lesson_id,
        lessonTitle: lesson?.title ?? p.lesson_id,
        courseTitle: lesson?.course_id ? (courseById.get(lesson.course_id) ?? null) : null,
        status: p.status,
        currentPage: p.current_page,
        timeSpentMinutes: Math.round((p.time_spent_seconds ?? 0) / 60),
        updatedAt: p.updated_at,
      };
    }),
    quizAttempts: ((attemptsRes.data ?? []) as {
      id: string;
      lesson_id: string;
      percentage: number;
      passed: boolean;
      created_at: string;
    }[]).map((a) => ({
      id: a.id,
      lessonTitle: lessonById.get(a.lesson_id)?.title ?? a.lesson_id,
      percentage: a.percentage,
      passed: a.passed,
      createdAt: a.created_at,
    })),
    reviewQueueDue: dueRes.count ?? 0,
    ai,
    onboarding,
  };
}

// ============================================================
// Onboarding research
// ============================================================

export type OnboardingInsight = {
  id: string;
  userId: string;
  sessionId: string | null;
  displayName: string;
  email: string | null;
  locale: 'ka' | 'en';
  status: 'in_progress' | 'completed';
  questionCount: number;
  interests: string[];
  primaryGoal: string;
  desiredOutcome: string;
  experienceLevel: string;
  learningPreferences: string[];
  weeklyCommitment: string;
  barriers: string[];
  motivation: string;
  summary: string;
  segmentLabel: string;
  opportunitySignals: string[];
  verbatimQuote: string;
  answers: OnboardingAnswer[];
  transcript: OnboardingTranscriptMessage[];
  createdAt: string;
  completedAt: string | null;
};

export type OnboardingInsightData = {
  available: boolean;
  rows: OnboardingInsight[];
};

export async function listOnboardingInsights(): Promise<OnboardingInsightData> {
  const db = adminDb();
  const profilesRes = await db
    .from('onboarding_profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(2000);

  if (profilesRes.error) {
    return { available: false, rows: [] };
  }

  const [sessionsRes, emailMap] = await Promise.all([
    db.from('student_sessions').select('id, user_id, display_name').not('user_id', 'is', null),
    getUserEmailMap(db),
  ]);
  const sessionsByUser = new Map(
    ((sessionsRes.data ?? []) as {
      id: string;
      user_id: string;
      display_name: string;
    }[]).map((session) => [session.user_id, session]),
  );
  const strings = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];

  const rows = ((profilesRes.data ?? []) as Record<string, unknown>[]).map((row) => {
    const userId = String(row.user_id);
    const session = sessionsByUser.get(userId);
    const email = emailMap.get(userId) ?? null;
    return {
      id: String(row.id),
      userId,
      sessionId:
        typeof row.session_id === 'string'
          ? row.session_id
          : session?.id ?? null,
      displayName: session?.display_name || email?.split('@')[0] || 'Student',
      email,
      locale: row.locale === 'en' ? 'en' : 'ka',
      status: row.status === 'completed' ? 'completed' : 'in_progress',
      questionCount: Number(row.question_count) || 0,
      interests: strings(row.interests),
      primaryGoal: typeof row.primary_goal === 'string' ? row.primary_goal : '',
      desiredOutcome: typeof row.desired_outcome === 'string' ? row.desired_outcome : '',
      experienceLevel: typeof row.experience_level === 'string' ? row.experience_level : '',
      learningPreferences: strings(row.learning_preferences),
      weeklyCommitment: typeof row.weekly_commitment === 'string' ? row.weekly_commitment : '',
      barriers: strings(row.barriers),
      motivation: typeof row.motivation === 'string' ? row.motivation : '',
      summary: typeof row.ai_summary === 'string' ? row.ai_summary : '',
      segmentLabel: typeof row.segment_label === 'string' ? row.segment_label : '',
      opportunitySignals: strings(row.opportunity_signals),
      verbatimQuote: typeof row.verbatim_quote === 'string' ? row.verbatim_quote : '',
      answers: Array.isArray(row.answers) ? (row.answers as OnboardingAnswer[]) : [],
      transcript: Array.isArray(row.transcript)
        ? (row.transcript as OnboardingTranscriptMessage[])
        : [],
      createdAt: String(row.created_at),
      completedAt: typeof row.completed_at === 'string' ? row.completed_at : null,
    } satisfies OnboardingInsight;
  });

  return { available: true, rows };
}

// ============================================================
// AI usage
// ============================================================

export type AiUsageSummary = {
  available: boolean;
  days: number;
  totals: { calls: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; costUsd: number; failures: number };
  byDay: { day: string; costUsd: number; calls: number; tokens: number }[];
  byFeature: { feature: string; calls: number; inputTokens: number; outputTokens: number; costUsd: number }[];
  byModel: { provider: string; model: string; calls: number; inputTokens: number; outputTokens: number; costUsd: number }[];
  topSessions: { sessionId: string; displayName: string | null; calls: number; tokens: number; costUsd: number }[];
  recent: {
    id: string;
    createdAt: string;
    provider: string;
    model: string;
    feature: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    durationMs: number | null;
    success: boolean;
  }[];
};

export async function getAiUsageSummary(days: number): Promise<AiUsageSummary> {
  const db = adminDb();
  const since = daysAgoIso(days);

  const { data, error } = await db
    .from('ai_usage')
    .select(
      'id, created_at, provider, model, feature, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, duration_ms, success, session_id',
    )
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20000);

  const empty: AiUsageSummary = {
    available: !error,
    days,
    totals: { calls: 0, inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costUsd: 0, failures: 0 },
    byDay: [],
    byFeature: [],
    byModel: [],
    topSessions: [],
    recent: [],
  };
  if (error || !data) return empty;

  type Row = {
    id: string;
    created_at: string;
    provider: string;
    model: string;
    feature: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_write_tokens: number;
    cost_usd: number;
    duration_ms: number | null;
    success: boolean;
    session_id: string | null;
  };
  const rows = data as Row[];

  const summary = empty;
  const byDay = new Map<string, { costUsd: number; calls: number; tokens: number }>();
  const byFeature = new Map<string, { calls: number; inputTokens: number; outputTokens: number; costUsd: number }>();
  const byModel = new Map<string, { provider: string; model: string; calls: number; inputTokens: number; outputTokens: number; costUsd: number }>();
  const bySession = new Map<string, { calls: number; tokens: number; costUsd: number }>();

  for (const r of rows) {
    const cost = Number(r.cost_usd) || 0;
    const tokens = (r.input_tokens ?? 0) + (r.output_tokens ?? 0);

    summary.totals.calls += 1;
    summary.totals.inputTokens += r.input_tokens ?? 0;
    summary.totals.outputTokens += r.output_tokens ?? 0;
    summary.totals.cacheReadTokens += r.cache_read_tokens ?? 0;
    summary.totals.costUsd += cost;
    if (!r.success) summary.totals.failures += 1;

    const day = r.created_at.slice(0, 10);
    const d = byDay.get(day) ?? { costUsd: 0, calls: 0, tokens: 0 };
    d.costUsd += cost;
    d.calls += 1;
    d.tokens += tokens;
    byDay.set(day, d);

    const f = byFeature.get(r.feature) ?? { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
    f.calls += 1;
    f.inputTokens += r.input_tokens ?? 0;
    f.outputTokens += r.output_tokens ?? 0;
    f.costUsd += cost;
    byFeature.set(r.feature, f);

    const mKey = `${r.provider}/${r.model}`;
    const m = byModel.get(mKey) ?? {
      provider: r.provider,
      model: r.model,
      calls: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
    };
    m.calls += 1;
    m.inputTokens += r.input_tokens ?? 0;
    m.outputTokens += r.output_tokens ?? 0;
    m.costUsd += cost;
    byModel.set(mKey, m);

    if (r.session_id) {
      const s = bySession.get(r.session_id) ?? { calls: 0, tokens: 0, costUsd: 0 };
      s.calls += 1;
      s.tokens += tokens;
      s.costUsd += cost;
      bySession.set(r.session_id, s);
    }
  }

  // Fill every day in the window so the chart has no gaps.
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const d = byDay.get(day) ?? { costUsd: 0, calls: 0, tokens: 0 };
    summary.byDay.push({ day, ...d });
  }

  summary.byFeature = [...byFeature.entries()]
    .map(([feature, v]) => ({ feature, ...v }))
    .sort((a, b) => b.costUsd - a.costUsd);
  summary.byModel = [...byModel.values()].sort((a, b) => b.costUsd - a.costUsd);

  const topSessionIds = [...bySession.entries()]
    .sort((a, b) => b[1].costUsd - a[1].costUsd)
    .slice(0, 10);
  let nameMap = new Map<string, string>();
  if (topSessionIds.length > 0) {
    const { data: sessions } = await db
      .from('student_sessions')
      .select('id, display_name')
      .in('id', topSessionIds.map(([id]) => id));
    nameMap = new Map(
      ((sessions ?? []) as { id: string; display_name: string }[]).map((s) => [s.id, s.display_name]),
    );
  }
  summary.topSessions = topSessionIds.map(([sessionId, v]) => ({
    sessionId,
    displayName: nameMap.get(sessionId) ?? null,
    ...v,
  }));

  summary.recent = rows.slice(0, 30).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    provider: r.provider,
    model: r.model,
    feature: r.feature,
    inputTokens: r.input_tokens ?? 0,
    outputTokens: r.output_tokens ?? 0,
    costUsd: Number(r.cost_usd) || 0,
    durationMs: r.duration_ms,
    success: r.success,
  }));

  return summary;
}

// ============================================================
// Courses with stats
// ============================================================

export type AdminCourseListItem = {
  id: string;
  title: string;
  titleEn: string | null;
  tags: string[];
  priceCents: number | null;
  retailPriceCents: number | null;
  lessonsTotal: number;
  lessonsPublished: number;
  enrollments: number;
  studentsActive: number;
  createdAt: string;
};

export async function listCoursesWithStats(): Promise<AdminCourseListItem[]> {
  const db = adminDb();

  const [coursesRes, lessonsRes, enrollRes, progressRes] = await Promise.all([
    db.from('courses').select('*').order('created_at', { ascending: false }),
    db.from('lessons').select('id, course_id, status'),
    db.from('enrollments').select('course_id'),
    db.from('lesson_progress').select('lesson_id'),
  ]);

  const lessons = (lessonsRes.data ?? []) as { id: string; course_id: string | null; status: string }[];
  const lessonCourse = new Map<string, string>();
  const totals = new Map<string, { total: number; published: number }>();
  for (const l of lessons) {
    if (!l.course_id) continue;
    lessonCourse.set(l.id, l.course_id);
    const t = totals.get(l.course_id) ?? { total: 0, published: 0 };
    t.total += 1;
    if (l.status === 'published') t.published += 1;
    totals.set(l.course_id, t);
  }

  const enrollCounts = new Map<string, number>();
  for (const e of (enrollRes.data ?? []) as { course_id: string }[]) {
    enrollCounts.set(e.course_id, (enrollCounts.get(e.course_id) ?? 0) + 1);
  }

  const activeCounts = new Map<string, number>();
  for (const p of (progressRes.data ?? []) as { lesson_id: string }[]) {
    const courseId = lessonCourse.get(p.lesson_id);
    if (courseId) activeCounts.set(courseId, (activeCounts.get(courseId) ?? 0) + 1);
  }

  return ((coursesRes.data ?? []) as {
    id: string;
    title: string;
    title_en: string | null;
    tags: string[];
    price_cents?: number | null;
    retail_price_cents?: number | null;
    created_at: string;
  }[]).map((c) => ({
    id: c.id,
    title: c.title,
    titleEn: c.title_en ?? null,
    tags: c.tags ?? [],
    priceCents: c.price_cents ?? null,
    retailPriceCents: c.retail_price_cents ?? null,
    lessonsTotal: totals.get(c.id)?.total ?? 0,
    lessonsPublished: totals.get(c.id)?.published ?? 0,
    enrollments: enrollCounts.get(c.id) ?? 0,
    studentsActive: activeCounts.get(c.id) ?? 0,
    createdAt: c.created_at,
  }));
}

// ============================================================
// Leads
// ============================================================

export type AdminLead = {
  id: string;
  email: string | null;
  phone: string | null;
  ageGroup: string;
  topics: string[];
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
};

export async function listLeads(): Promise<AdminLead[]> {
  const db = adminDb();
  const { data } = await db
    .from('leads')
    .select('id, email, phone, age_group, topics, utm_source, utm_medium, utm_campaign, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);

  return ((data ?? []) as {
    id: string;
    email: string | null;
    phone: string | null;
    age_group: string;
    topics: string[];
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    created_at: string;
  }[]).map((r) => ({
    id: r.id,
    email: r.email,
    phone: r.phone,
    ageGroup: r.age_group,
    topics: r.topics ?? [],
    utmSource: r.utm_source,
    utmMedium: r.utm_medium,
    utmCampaign: r.utm_campaign,
    createdAt: r.created_at,
  }));
}

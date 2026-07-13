import { notFound } from 'next/navigation';
import CourseDetailClient from './_components/CourseDetailClient';
import { getCoursePayload } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { getCurrentUserEnrollments } from '@/lib/enrollments';
import { createClient } from '@/lib/supabase/server';
import { findSessionForUser, getProgressForSession } from '@/lib/supabase/db';

export const dynamic = 'force-dynamic';

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const payload = await getCoursePayload(id, locale);
  if (!payload) return notFound();
  const dict = getDict(locale);
  const user = await getAuthUser();
  const authed = Boolean(user);
  const enrolledCourseIds = user ? await getCurrentUserEnrollments() : [];

  // Completed lessons from the account's canonical session, so progress
  // follows the student across devices. (Read-only: getSession() would try
  // to set cookies, which server components can't.)
  let completedLessonIds: string[] = [];
  if (user) {
    const supabase = await createClient();
    const session = await findSessionForUser(supabase, user.id);
    if (session) {
      const progress = await getProgressForSession(supabase, session.id);
      completedLessonIds = progress
        .filter((row) => row.status === 'completed')
        .map((row) => row.lessonId);
    }
  }

  return (
    <CourseDetailClient
      course={payload.course}
      category={payload.category}
      detail={payload.detail}
      related={payload.related}
      dict={dict}
      locale={locale}
      authed={authed}
      authUser={user}
      enrolledCourseIds={enrolledCourseIds}
      completedLessonIds={completedLessonIds}
    />
  );
}

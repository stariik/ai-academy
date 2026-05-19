import { notFound } from 'next/navigation';
import CourseDetailClient from './_components/CourseDetailClient';
import { getCoursePayload } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { getCurrentUserEnrollments } from '@/lib/enrollments';

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

  return (
    <CourseDetailClient
      course={payload.course}
      category={payload.category}
      detail={payload.detail}
      related={payload.related}
      dict={dict}
      locale={locale}
      authed={authed}
      enrolledCourseIds={enrolledCourseIds}
    />
  );
}

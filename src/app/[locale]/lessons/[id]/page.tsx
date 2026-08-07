import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LessonClient from './_components/LessonClient';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getLessonMetadata, FREE_LESSON_ID } from '@/lib/v2/db';
import { isCurrentUserEnrolled } from '@/lib/enrollments';
import { isAdmin } from '@/lib/admin-auth';
import { localizedAlternates, SITE_URL } from '@/lib/seo';

// force-dynamic: the access check below reads the signed-in user, so this
// render is user-specific and must not be cached per lesson+locale.
export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) return {};
  const locale: Locale = localeParam;
  const lesson = await getLessonMetadata(id, locale);
  if (!lesson) return {};
  const description =
    lesson.description ||
    (locale === 'en'
      ? `${lesson.title}, a lesson from ${lesson.courseTitle} on walle.academy.`
      : `${lesson.title} — კურსის „${lesson.courseTitle}“ გაკვეთილი walle.academy-ზე.`);
  return {
    title: lesson.title,
    description,
    alternates: localizedAlternates(locale, `lessons/${id}`),
    openGraph: {
      title: lesson.title,
      description,
      url: `${SITE_URL}/${locale}/lessons/${id}`,
      locale: locale === 'en' ? 'en_US' : 'ka_GE',
      alternateLocale: locale === 'en' ? ['ka_GE'] : ['en_US'],
      type: 'article',
    },
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;

  // Paywall. The single free lesson is open to everyone; everything else needs
  // an enrollment on the owning course. Anyone else is sent to the course page,
  // which is where they can buy it.
  if (id !== FREE_LESSON_ID) {
    const meta = await getLessonMetadata(id, locale);
    if (!meta) notFound();
    const allowed = (await isCurrentUserEnrolled(meta.courseId)) || (await isAdmin());
    if (!allowed) redirect(`/${locale}/courses/${meta.courseId}#buy`);
  }

  const dict = getDict(locale);
  return <LessonClient lessonId={id} dict={dict} locale={locale} />;
}

import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import LessonClient from './_components/LessonClient';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getLessonMetadata } from '@/lib/v2/db';
import { getLessonAccess } from '@/lib/lesson-access';
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

  // Paywall. Enrolled users get the whole lesson; any course's opening lesson
  // is on the free tutor trial for signed-in users, so guests are sent to sign
  // up first. Anyone else is sent to the course page, where they can buy it.
  const meta = await getLessonMetadata(id, locale);
  if (!meta) notFound();
  const access = await getLessonAccess(id, meta.courseId);
  if (access === 'signin') {
    redirect(`/${locale}/register?next=${encodeURIComponent(`/${locale}/lessons/${id}`)}`);
  }
  if (access === 'none') redirect(`/${locale}/courses/${meta.courseId}#buy`);

  const dict = getDict(locale);
  return <LessonClient lessonId={id} dict={dict} locale={locale} />;
}

import { use } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LessonClient from './_components/LessonClient';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getLessonMetadata } from '@/lib/v2/db';
import { localizedAlternates, SITE_URL } from '@/lib/seo';

// No force-dynamic: this route ships a client shell and fetches the lesson,
// progress and session from the browser, so the server render holds nothing
// user-specific and can be cached per lesson+locale.

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

export default function LessonPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: localeParam, id } = use(params);
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);
  return <LessonClient lessonId={id} dict={dict} locale={locale} />;
}

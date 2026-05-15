import { use } from 'react';
import { notFound } from 'next/navigation';
import LessonClient from './_components/LessonClient';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';

export const dynamic = 'force-dynamic';

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

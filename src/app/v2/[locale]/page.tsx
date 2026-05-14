import { notFound } from 'next/navigation';
import LandingClient from './_components/LandingClient';
import { getCategories, getCourses } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';

export const dynamic = 'force-dynamic';

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);
  const [categories, courses] = await Promise.all([
    getCategories(locale),
    getCourses(locale),
  ]);
  return (
    <LandingClient
      categories={categories}
      courses={courses}
      dict={dict}
      locale={locale}
    />
  );
}

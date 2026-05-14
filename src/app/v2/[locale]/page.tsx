import { notFound } from 'next/navigation';
import LandingClient from './_components/LandingClient';
import { getCategories, getCourses } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

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
  const [categories, courses, authUser] = await Promise.all([
    getCategories(locale),
    getCourses(locale),
    getAuthUser(),
  ]);
  return (
    <LandingClient
      categories={categories}
      courses={courses}
      dict={dict}
      locale={locale}
      authUser={authUser}
    />
  );
}

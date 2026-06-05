import { notFound } from 'next/navigation';
import AboutClient from './_components/AboutClient';
import { getCategories } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);
  const [categories, authUser] = await Promise.all([getCategories(locale), getAuthUser()]);

  return <AboutClient dict={dict} locale={locale} authUser={authUser} categories={categories} />;
}

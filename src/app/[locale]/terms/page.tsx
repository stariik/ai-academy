import { notFound } from 'next/navigation';
import LegalPageClient from './_components/LegalPageClient';
import { getCategories } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { termsEn } from '@/lib/legal/en';
import { termsKa } from '@/lib/legal/ka';

export const dynamic = 'force-dynamic';

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);
  const doc = locale === 'en' ? termsEn : termsKa;
  const [categories, authUser] = await Promise.all([getCategories(locale), getAuthUser()]);

  return (
    <LegalPageClient doc={doc} dict={dict} locale={locale} authUser={authUser} categories={categories} />
  );
}

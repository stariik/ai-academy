import { notFound } from 'next/navigation';
import ProfileClient from './_components/ProfileClient';
import { getProfilePayload } from '@/lib/v2/profile';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);
  const payload = await getProfilePayload();

  return <ProfileClient payload={payload} dict={dict} locale={locale} />;
}

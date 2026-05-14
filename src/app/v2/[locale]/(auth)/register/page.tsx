import { notFound, redirect } from 'next/navigation';
import RegisterForm from '../_components/RegisterForm';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;

  const authed = await getAuthUser();
  if (authed) redirect(`/v2/${locale}/profile`);

  const dict = getDict(locale);
  return <RegisterForm dict={dict} locale={locale} />;
}

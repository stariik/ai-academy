import { notFound, redirect } from 'next/navigation';
import LoginForm from '../_components/LoginForm';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ confirm?: string }>;
}) {
  const { locale: localeParam } = await params;
  const { confirm } = await searchParams;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;

  // If already authed, send straight to profile.
  const authed = await getAuthUser();
  if (authed) redirect(`/v2/${locale}/profile`);

  const dict = getDict(locale);
  return <LoginForm dict={dict} locale={locale} confirmNotice={confirm === '1'} />;
}

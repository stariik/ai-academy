import { notFound, redirect } from 'next/navigation';
import RegisterForm from '../_components/RegisterForm';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function sanitizeRedeem(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{4,32}$/.test(code) ? code : undefined;
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redeem?: string }>;
}) {
  const { locale: localeParam } = await params;
  const { redeem } = await searchParams;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const redeemCode = sanitizeRedeem(redeem);

  const authed = await getAuthUser();
  if (authed) {
    redirect(redeemCode ? `/${locale}/redeem/${redeemCode}` : `/${locale}`);
  }

  const dict = getDict(locale);
  return <RegisterForm dict={dict} locale={locale} redeemCode={redeemCode} />;
}

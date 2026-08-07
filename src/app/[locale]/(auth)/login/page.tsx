import { notFound, redirect } from 'next/navigation';
import LoginForm from '../_components/LoginForm';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function sanitizeRedeem(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{4,32}$/.test(code) ? code : undefined;
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ confirm?: string; redeem?: string }>;
}) {
  const { locale: localeParam } = await params;
  const { confirm, redeem } = await searchParams;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const redeemCode = sanitizeRedeem(redeem);

  // If already authed, fast-forward — straight to redeem if a code is in the URL.
  const authed = await getAuthUser();
  if (authed) {
    redirect(redeemCode ? `/${locale}/redeem/${redeemCode}` : `/${locale}`);
  }

  const dict = getDict(locale);
  return (
    <LoginForm
      dict={dict}
      locale={locale}
      confirmNotice={confirm === '1'}
      redeemCode={redeemCode}
    />
  );
}

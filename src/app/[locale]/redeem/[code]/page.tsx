// ============================================================
// /[locale]/redeem/[code] — auto-redemption landing page.
//
// Logged-out users get bounced to /[locale]/login?redeem=CODE.
// (The login handler — wired in step 5 polish — completes the redemption
// after successful sign-in. Until then, signing in lands the user back
// here and the client island will fire the redeem itself.)
//
// Logged-in users hit this page once: the client island POSTs to
// /api/promo/redeem on mount and shows the result.
// ============================================================

import { notFound, redirect } from 'next/navigation';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import RedeemAutoClient from './_components/RedeemAutoClient';

export const dynamic = 'force-dynamic';

export default async function RedeemAutoPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: localeParam, code } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);

  const user = await getAuthUser();
  if (!user) {
    // Send the user to login, preserving the code so we can come back.
    redirect(`/${locale}/login?redeem=${encodeURIComponent(code)}`);
  }

  return <RedeemAutoClient code={code} locale={locale} dict={dict} />;
}

import { notFound, redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { isLocale, type Locale } from '@/lib/v2/i18n';
import OnboardingChat from './_components/OnboardingChat';

export const dynamic = 'force-dynamic';

function sanitizeRedeem(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9-]{4,32}$/.test(code) ? code : undefined;
}

export default async function WelcomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redeem?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { redeem } = await searchParams;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  const redeemCode = sanitizeRedeem(redeem);
  const user = await getAuthUser();

  if (!user) {
    const suffix = redeemCode ? `?redeem=${encodeURIComponent(redeemCode)}` : '';
    redirect(`/${locale}/login${suffix}`);
  }

  if (user.onboardingCompleted && !user.onboardingRequired) {
    redirect(
      redeemCode
        ? `/${locale}/redeem/${encodeURIComponent(redeemCode)}`
        : `/${locale}`,
    );
  }

  return (
    <OnboardingChat
      locale={locale}
      displayName={user.displayName ?? (locale === 'ka' ? 'მეგობარო' : 'friend')}
      redeemCode={redeemCode}
    />
  );
}

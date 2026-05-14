import { notFound } from 'next/navigation';
import PublicProfileClient from './_components/PublicProfileClient';
import { getPublicProfileByToken } from '@/lib/v2/profile';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';

export const dynamic = 'force-dynamic';

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale: localeParam, token } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);
  const payload = await getPublicProfileByToken(token);
  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">🔍</p>
          <h1
            className="text-2xl font-bold tracking-tight mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {dict.profile.publicViewNotFound}
          </h1>
          <a
            href={`/v2/${locale}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-pulse text-primary-foreground px-5 py-2.5 text-sm font-bold shadow-[0_4px_16px_var(--pulse-glow)] hover:-translate-y-0.5 transition-all"
          >
            {dict.meta.brandName}
            <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    );
  }

  return <PublicProfileClient payload={payload} dict={dict} locale={locale} />;
}

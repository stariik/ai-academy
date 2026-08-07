import { notFound } from 'next/navigation';
import { isLocale, LOCALES } from '@/lib/v2/i18n';
import IpWarnBanner from './_components/IpWarnBanner';
import PaymentFailedBanner from './_components/PaymentFailedBanner';
import WalleBot from '@/components/walle/WalleBot';

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div lang={locale} className="contents">
      {children}
      <IpWarnBanner locale={locale} />
      <PaymentFailedBanner locale={locale} />
      <WalleBot />
    </div>
  );
}

import { notFound } from 'next/navigation';
import { ForgotPasswordForm } from '../_components/PasswordResetForms';
import { getDict, isLocale } from '@/lib/v2/i18n';

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ForgotPasswordForm dict={getDict(locale)} locale={locale} />;
}

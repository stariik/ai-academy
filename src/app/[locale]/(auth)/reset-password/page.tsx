import { notFound } from 'next/navigation';
import { ResetPasswordForm } from '../_components/PasswordResetForms';
import { getDict, isLocale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // The email link (via /api/auth/confirm) signs the user in; no session = bad/expired link.
  const linkValid = Boolean(await getAuthUser());
  return <ResetPasswordForm dict={getDict(locale)} locale={locale} linkValid={linkValid} />;
}

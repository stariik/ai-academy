import { notFound } from 'next/navigation';
import LandingClient from './_components/LandingClient';
import { getCategories, getCourses } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { getCurrentUserEnrollments } from '@/lib/enrollments';
import { reconcileBundlePurchase } from '@/lib/payments-fulfill';

export const dynamic = 'force-dynamic';

export default async function LandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment?: string; category?: string }>;
}) {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const dict = getDict(locale);

  // Just back from a BOG bundle payment? Confirm it with BOG and grant access
  // even if the webhook was missed — the callback stays the primary path, this
  // is the fallback so a paid customer is never left without their courses.
  // Must run before reading enrollments, so the grant shows on this render.
  const { payment: paymentResult, category } = await searchParams;
  if (paymentResult === 'success' && category) {
    const user = await getAuthUser();
    if (user) await reconcileBundlePurchase(user.id, category);
  }

  const [categories, courses, authUser, enrolledCourseIds] = await Promise.all([
    getCategories(locale),
    getCourses(locale),
    getAuthUser(),
    getCurrentUserEnrollments(),
  ]);
  return (
    <LandingClient
      categories={categories}
      courses={courses}
      dict={dict}
      locale={locale}
      authUser={authUser}
      enrolledCourseIds={enrolledCourseIds}
    />
  );
}

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseDetailClient from './_components/CourseDetailClient';
import { getCoursePayload } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { getCurrentUserEnrollments } from '@/lib/enrollments';
import { reconcileCoursePurchase } from '@/lib/payments-fulfill';
import { createClient } from '@/lib/supabase/server';
import { findSessionForUser, getProgressForSession } from '@/lib/supabase/db';
import { localizedAlternates, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) return {};
  const locale: Locale = localeParam;
  const payload = await getCoursePayload(id, locale);
  if (!payload) return {};
  const description =
    payload.course.description ||
    (locale === 'en'
      ? `Learn ${payload.course.title} through ${payload.course.lessons} practical online lessons.`
      : `ისწავლე ${payload.course.title} ${payload.course.lessons} პრაქტიკული ონლაინ გაკვეთილით.`);
  return {
    title: payload.course.title,
    description,
    alternates: localizedAlternates(locale, `courses/${id}`),
    openGraph: {
      title: payload.course.title,
      description,
      url: `${SITE_URL}/${locale}/courses/${id}`,
      locale: locale === 'en' ? 'en_US' : 'ka_GE',
      alternateLocale: locale === 'en' ? ['ka_GE'] : ['en_US'],
      type: 'website',
    },
  };
}

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { locale: localeParam, id } = await params;
  if (!isLocale(localeParam)) notFound();
  const locale: Locale = localeParam;
  const [payload, user, { payment: paymentResult }] = await Promise.all([
    getCoursePayload(id, locale),
    getAuthUser(),
    searchParams,
  ]);
  if (!payload) return notFound();
  const dict = getDict(locale);
  const authed = Boolean(user);

  // Just back from a BOG payment? Confirm it with BOG and grant access even if
  // the webhook was missed — the callback stays the primary path, this is the
  // fallback so a paid customer is never left without their course.
  // Must run before reading enrollments, so the grant shows on this render.
  if (user && paymentResult === 'success') {
    await reconcileCoursePurchase(user.id, id);
  }

  // Enrollments and progress are independent reads — in series they cost a
  // logged-in student three extra round-trips before the page renders.
  // Completed lessons come from the account's canonical session, so progress
  // follows the student across devices. (Read-only: getSession() would try
  // to set cookies, which server components can't.)
  const [enrolledCourseIds, completedLessonIds]: [string[], string[]] = user
    ? await Promise.all([
        getCurrentUserEnrollments(),
        (async () => {
          const supabase = await createClient();
          const session = await findSessionForUser(supabase, user.id);
          if (!session) return [];
          const progress = await getProgressForSession(supabase, session.id);
          return progress
            .filter((row) => row.status === 'completed')
            .map((row) => row.lessonId);
        })(),
      ])
    : [[], []];

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: payload.course.title,
    description: payload.course.description,
    url: `${SITE_URL}/${locale}/courses/${id}`,
    inLanguage: locale,
    educationalLevel: payload.course.level,
    provider: {
      '@type': 'Organization',
      name: 'walle.academy',
      sameAs: SITE_URL,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${payload.course.hours}H`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <CourseDetailClient
        course={payload.course}
        category={payload.category}
        detail={payload.detail}
        related={payload.related}
        dict={dict}
        locale={locale}
        authed={authed}
        authUser={user}
        enrolledCourseIds={enrolledCourseIds}
        completedLessonIds={completedLessonIds}
      />
    </>
  );
}

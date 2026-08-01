import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LandingClient from './_components/LandingClient';
import { getCategories, getCourses } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { getCurrentUserEnrollments } from '@/lib/enrollments';
import { reconcileBundlePurchase } from '@/lib/payments-fulfill';
import { localizedAlternates, SITE_URL } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: localeParam } = await params;
  if (!isLocale(localeParam)) return {};
  const locale: Locale = localeParam;
  const isEn = locale === 'en';
  const title = isEn
    ? 'Practical AI Courses Online | walle.academy'
    : 'AI კურსები ქართულად | walle.academy';
  const description = isEn
    ? 'Learn AI tools, prompt engineering, coding, marketing, and business skills through practical online courses with Walli, your AI tutor.'
    : 'ისწავლე ხელოვნური ინტელექტი ქართულად: AI ინსტრუმენტები, პრომპტ ინჟინერია, პროგრამირება, მარკეტინგი და ბიზნესი პრაქტიკული ონლაინ კურსებით.';
  return {
    title: { absolute: title },
    description,
    alternates: localizedAlternates(locale),
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      locale: isEn ? 'en_US' : 'ka_GE',
      alternateLocale: isEn ? ['ka_GE'] : ['en_US'],
      type: 'website',
    },
  };
}

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
  const courseListJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'walle.academy',
        url: SITE_URL,
        inLanguage: locale,
      },
      {
        '@type': 'ItemList',
        name:
          locale === 'en'
            ? 'Practical AI courses'
            : 'ხელოვნური ინტელექტის პრაქტიკული კურსები',
        numberOfItems: courses.length,
        itemListElement: courses.map((course, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Course',
            name: course.title,
            description: course.description,
            url: `${SITE_URL}/${locale}/courses/${course.id}`,
            provider: {
              '@type': 'Organization',
              name: 'walle.academy',
              sameAs: SITE_URL,
            },
          },
        })),
      },
    ],
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(courseListJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <LandingClient
        categories={categories}
        courses={courses}
        dict={dict}
        locale={locale}
        authUser={authUser}
        enrolledCourseIds={enrolledCourseIds}
      />
    </>
  );
}

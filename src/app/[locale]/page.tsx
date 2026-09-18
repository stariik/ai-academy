import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LandingClient from './_components/LandingClient';
import { getCategories, getCourses } from '@/lib/v2/db';
import { getDict, isLocale, type Locale } from '@/lib/v2/i18n';
import { getAuthUser } from '@/lib/auth';
import { getCurrentUserEnrollments } from '@/lib/enrollments';
import { reconcileBundlePurchase } from '@/lib/payments-fulfill';
import { localizedAlternates, SITE_URL } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import type { OnboardingAnswer } from '@/lib/onboarding';

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
    ? 'Learn AI tools, prompt engineering, coding, marketing, and business skills through practical online courses with Walle, your AI tutor.'
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

  // Get recommended course IDs and reorder categories if user is logged in
  let recommendedCourseIds: string[] = [];
  let orderedCategories = categories;

  if (authUser) {
    try {
      // Get full user data from Supabase to access user_metadata
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      const onboarding = data.user?.user_metadata?.onboarding;
      if (onboarding && Array.isArray(onboarding)) {
        // Extract interests and goals
        const interests: string[] = [];
        const goals: string[] = [];
        const goalIds: string[] = [];
        onboarding.forEach((answer: OnboardingAnswer) => {
          if (answer.questionId === 'progress_goal') {
            goals.push(...answer.selectedLabels);
            goalIds.push(...answer.selectedOptionIds);
          }
          if (answer.selectedLabels) {
            interests.push(...answer.selectedLabels);
          }
          if (answer.freeText) {
            interests.push(answer.freeText.toLowerCase());
          }
        });

        // Score courses
        const scoredCourses = courses.map(course => {
          let score = 0;
          const courseTags = [course.categoryId];
          const courseText = `${course.title} ${course.description}`.toLowerCase();

          goals.forEach(goal => {
            if (courseText.includes(goal.toLowerCase())) score += 3;
            courseTags.forEach((tag: string) => {
              if (tag.toLowerCase().includes(goal.toLowerCase()) ||
                  goal.toLowerCase().includes(tag.toLowerCase())) score += 2;
            });
          });

          interests.forEach(interest => {
            if (courseText.includes(interest.toLowerCase())) score += 1;
            courseTags.forEach((tag: string) => {
              if (tag.toLowerCase().includes(interest.toLowerCase()) ||
                  interest.toLowerCase().includes(tag.toLowerCase())) score += 1;
            });
          });

          return { ...course, score };
        });

        scoredCourses.sort((a, b) => b.score - a.score);
        // Get top 3 recommended courses with score > 0
        recommendedCourseIds = scoredCourses
          .filter(c => c.score > 0)
          .slice(0, 3)
          .map(c => c.id);

        // Score and reorder categories based on user goals and interests
        const categoryGoalMap: Record<string, string[]> = {
          'work_smarter': ['ai-business', 'prompt-engineering', 'ai-agents'],
          'grow_business': ['ai-marketing', 'ai-business', 'ai-agents'],
          'create': ['ai-creative', 'ai-marketing', 'prompt-engineering'],
          'build': ['ai-coding', 'ai-agents', 'ai-foundations'],
          'career': ['ai-foundations', 'prompt-engineering', 'ai-coding'],
          'confidence': ['ai-foundations', 'prompt-engineering', 'ai-business'],
        };

        const scoredCategories = categories.map(category => {
          let score = 0;
          const categoryText = `${category.name} ${category.tagline}`.toLowerCase();

          // Match goals to category slugs using goalIds
          goalIds.forEach(goalId => {
            const relevantSlugs = categoryGoalMap[goalId] || [];
            if (relevantSlugs.includes(category.id)) {
              score += 5;
            }
          });

          // Also check text matching with goal labels
          goals.forEach(goal => {
            if (categoryText.includes(goal.toLowerCase())) {
              score += 2;
            }
          });

          // Match interests to category
          interests.forEach(interest => {
            if (categoryText.includes(interest.toLowerCase())) {
              score += 1;
            }
          });

          return { category, score };
        });

        scoredCategories.sort((a, b) => b.score - a.score);
        orderedCategories = scoredCategories.map(sc => sc.category);

        // Debug logging
        console.log('[landing] Onboarding goals:', goalIds);
        console.log('[landing] Recommended category order:', scoredCategories.map(sc => ({ id: sc.category.id, name: sc.category.name, score: sc.score })));
      }
    } catch (error) {
      console.error('[landing] Error getting recommendations:', error);
    }
  }
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
        categories={orderedCategories}
        courses={courses}
        dict={dict}
        locale={locale}
        authUser={authUser}
        enrolledCourseIds={enrolledCourseIds}
        recommendedCourseIds={recommendedCourseIds}
      />
    </>
  );
}

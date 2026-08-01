import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { getCourses } from '@/lib/v2/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [coursesKa, coursesEn] = await Promise.all([
    getCourses('ka'),
    getCourses('en'),
  ]);
  const englishIds = new Set(coursesEn.map((course) => course.id));
  const staticPaths = ['', '/about', '/contact', '/privacy', '/terms'];
  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    (['ka', 'en'] as const).map((locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      changeFrequency: path === '' ? ('daily' as const) : ('monthly' as const),
      priority: path === '' ? 1 : 0.4,
      alternates: {
        languages: {
          ka: `${SITE_URL}/ka${path}`,
          en: `${SITE_URL}/en${path}`,
          'x-default': `${SITE_URL}/ka${path}`,
        },
      },
    })),
  );
  const courseEntries: MetadataRoute.Sitemap = coursesKa.flatMap((course) => {
    const languages = {
      ka: `${SITE_URL}/ka/courses/${course.id}`,
      ...(englishIds.has(course.id)
        ? { en: `${SITE_URL}/en/courses/${course.id}` }
        : {}),
      'x-default': `${SITE_URL}/ka/courses/${course.id}`,
    };
    return (['ka', 'en'] as const)
      .filter((locale) => locale === 'ka' || englishIds.has(course.id))
      .map((locale) => ({
        url: `${SITE_URL}/${locale}/courses/${course.id}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: { languages },
      }));
  });
  return [...staticEntries, ...courseEntries];
}

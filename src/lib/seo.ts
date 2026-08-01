import type { Locale } from '@/lib/v2/i18n';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://walle.academy'
).replace(/\/+$/, '');

export function absoluteUrl(path = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized === '/' ? '' : normalized}`;
}

export function localizedAlternates(
  locale: Locale,
  path = '',
): {
  canonical: string;
  languages: Record<string, string>;
} {
  const normalized = path ? `/${path.replace(/^\/+/, '')}` : '';
  return {
    canonical: absoluteUrl(`/${locale}${normalized}`),
    languages: {
      ka: absoluteUrl(`/ka${normalized}`),
      en: absoluteUrl(`/en${normalized}`),
      'x-default': absoluteUrl(`/ka${normalized}`),
    },
  };
}

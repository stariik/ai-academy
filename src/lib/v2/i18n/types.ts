export const LOCALES = ['ka', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'ka';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localePath(locale: Locale, path = ''): string {
  const trimmed = path.replace(/^\/+/, '');
  return trimmed ? `/${locale}/${trimmed}` : `/${locale}`;
}

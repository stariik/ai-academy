import { ka } from './ka';
import { en } from './en';
import type { Locale } from './types';
import type { Dict } from './schema';

const DICTS: Record<Locale, Dict> = { ka, en };

export function getDict(locale: Locale): Dict {
  return DICTS[locale];
}

export type { Dict };
export * from './types';

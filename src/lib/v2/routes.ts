export const FREE_LESSON_ID = 'lesson_1776730632601_t3jqpim';
export const FREE_LESSON_PATH = `lessons/${FREE_LESSON_ID}`;

/**
 * Validates the `?next=` destination used to bring a guest back after sign-in.
 * Only our own home and course pages pass, so the param can't be used as an
 * open redirect.
 */
export function safeAuthNext(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  return /^\/(?:ka|en)(?:\/courses\/[\w-]+)?(?:#[\w-]+)?$/.test(raw) ? raw : undefined;
}

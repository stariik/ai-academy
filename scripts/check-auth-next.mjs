// Run: node scripts/check-auth-next.mjs
// The ?next= param is user-controlled, so it must never leave the site.
import assert from 'node:assert/strict';
import { safeAuthNext } from '../src/lib/v2/routes.ts';

for (const ok of ['/ka', '/en#categories', '/ka/courses/9e6a3836-d91e-4130-aecf-5e50b25b4295#buy']) {
  assert.equal(safeAuthNext(ok), ok);
}
for (const bad of [
  null,
  '',
  'https://evil.example',
  '//evil.example',
  '/\\evil.example',
  '/ka/../admin',
  '/ka/courses/x/../../admin',
  '/admin',
  '/fr',
  '/ka/profile',
  '/ka\n/courses/x',
]) {
  assert.equal(safeAuthNext(bad), undefined, String(bad));
}
console.log('ok');

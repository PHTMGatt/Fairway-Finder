// server/test/security.test.mjs — headers, golf proxy input validation, TTL cache
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

test('security headers forbid framing and sniffing; HSTS only in production', async () => {
  const { securityHeaders } = await dist('utils/securityHeaders.js');
  const run = (prod) => {
    const headers = {};
    securityHeaders(prod)({}, { setHeader: (k, v) => (headers[k] = v) }, () => {});
    return headers;
  };
  const prod = run(true);
  assert.equal(prod['X-Frame-Options'], 'DENY');
  assert.match(prod['Content-Security-Policy'], /frame-ancestors 'none'/);
  assert.equal(prod['X-Content-Type-Options'], 'nosniff');
  assert.ok(prod['Strict-Transport-Security']);
  assert.equal(run(false)['Strict-Transport-Security'], undefined);
});

test('golf proxy rejects path tricks and junk before spending quota', async () => {
  const { isValidCourseId, cleanSearchQuery } = await dist('routes/golfRoutes.js');
  assert.equal(isValidCourseId('86gj0vqf'), true);
  assert.equal(isValidCourseId('12345'), true);
  for (const bad of ['../admin', '..%2f..%2fadmin', 'a/b', '', 'x'.repeat(33), undefined]) {
    assert.equal(isValidCourseId(bad), false, String(bad));
  }
  assert.equal(cleanSearchQuery('  Chemung   Hills '), 'Chemung Hills');
  assert.equal(cleanSearchQuery("St. Andrew's"), "St. Andrew's");
  assert.equal(cleanSearchQuery('a'), null);
  assert.equal(cleanSearchQuery('x'.repeat(81)), null);
  assert.equal(cleanSearchQuery(['array']), null);
});

test('ttl cache expires entries and evicts the oldest past capacity', async () => {
  const { createTtlCache, cacheKey } = await dist('utils/ttlCache.js');
  const cache = createTtlCache({ ttlMs: 20, maxEntries: 2 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.equal(cache.get('a'), undefined, 'oldest evicted');
  assert.equal(cache.get('c'), 3);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(cache.get('c'), undefined, 'expired');
  assert.equal(cacheKey('  Elmira   NY '), 'elmira ny');
});

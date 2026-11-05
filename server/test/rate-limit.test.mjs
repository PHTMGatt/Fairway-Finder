// server/test/rate-limit.test.mjs — trust proxy and /api limiter over real HTTP (no database)

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { dist } from './helpers.mjs';

const { apiLimiter, rateLimitMiddleware, resolveTrustProxy } = await dist('utils/rateLimit.js');

// Note; Mirrors the middleware order in server.ts
const startApp = (nodeEnv) => {
  const app = express();
  app.set('trust proxy', resolveTrustProxy(undefined, nodeEnv));
  app.get('/api/debug/client-ip', (req, res) => res.json({ ip: req.ip }));
  app.use('/api', rateLimitMiddleware(apiLimiter));
  app.get('/api/ping', (_req, res) => res.json({ ok: true }));
  app.get('/health', (_req, res) => res.send('OK'));
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () =>
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` })
    );
  });
};

let prod, dev;
before(async () => {
  prod = await startApp('production');
  dev = await startApp('development');
});
after(() => {
  prod?.server.close();
  dev?.server.close();
});

const get = (app, path, forwardedFor) =>
  fetch(app.base + path, { headers: forwardedFor ? { 'x-forwarded-for': forwardedFor } : {} });

test('resolveTrustProxy: 1 hop in production, off elsewhere, env override wins', () => {
  assert.equal(resolveTrustProxy(undefined, 'production'), 1);
  assert.equal(resolveTrustProxy('', 'production'), 1);
  assert.equal(resolveTrustProxy(undefined, 'development'), false);
  assert.equal(resolveTrustProxy('3', 'production'), 3);
  assert.equal(resolveTrustProxy('false', 'production'), false);
  assert.equal(resolveTrustProxy('true', 'development'), true);
  assert.equal(resolveTrustProxy('loopback', 'production'), 'loopback');
});

test('production: req.ip is the proxy-appended address; forged leading entries are ignored', async () => {
  assert.equal((await (await get(prod, '/api/debug/client-ip', '198.51.100.7')).json()).ip, '198.51.100.7');
  assert.equal((await (await get(prod, '/api/debug/client-ip', '1.2.3.4, 198.51.100.7')).json()).ip, '198.51.100.7');
});

test('development: X-Forwarded-For is ignored', async () => {
  const { ip } = await (await get(dev, '/api/debug/client-ip', '198.51.100.99')).json();
  assert.notEqual(ip, '198.51.100.99');
});

test('/api allows 120 requests per minute per IP, then 429 with Retry-After', async () => {
  const ip = '203.0.113.10';
  for (let i = 1; i <= 120; i++) {
    assert.equal((await get(prod, '/api/ping', ip)).status, 200, `request ${i}`);
  }
  const blocked = await get(prod, '/api/ping', ip);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  assert.match((await blocked.json()).error, /^Too many requests/);

  assert.equal((await get(prod, '/api/ping', `9.9.9.9, ${ip}`)).status, 429, 'forging XFF does not reset the bucket');
  assert.equal((await get(prod, '/api/ping', '203.0.113.11')).status, 200, 'other IPs unaffected');
  assert.equal((await get(prod, '/health', ip)).status, 200, '/health is not limited');
});

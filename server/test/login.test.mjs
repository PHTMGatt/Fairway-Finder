// server/test/login.test.mjs — login messages, timing and rate limiting against an in-memory MongoDB

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN, ME } from './helpers.mjs';

let db, api;

before(async () => {
  db = await startTestDb('ff_login');
  const { default: Profile } = await dist('models/Profile.js');
  await Profile.init();
  await Profile.create({ name: 'Real', email: 'real@example.com', password: 'correct-horse' });
  api = await startGraphQL();
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

const login = (email, password, ip) => api.gql(LOGIN, { email, password }, { ip });

test('correct password returns a token that authorizes `me`', async () => {
  const res = await login(' REAL@example.com ', 'correct-horse');
  const me = await api.gql(ME, {}, { token: res.data?.login?.token });
  assert.equal(me.data?.me?.email, 'real@example.com');
});

test('`me` without a token is rejected', async () => {
  const res = await api.gql(ME);
  assert.equal(res.error?.message, 'Not authenticated');
});

test('unknown email and wrong password give the same message', async () => {
  const unknown = await login('nobody@example.com', 'whatever-pass');
  const wrong = await login('real@example.com', 'whatever-pass');
  assert.equal(unknown.error?.message, 'Invalid email or password');
  assert.equal(wrong.error?.message, unknown.error?.message);
});

test('unknown email takes about as long as a wrong password', async () => {
  const time = async (email) => {
    const start = process.hrtime.bigint();
    await login(email, 'whatever-pass');
    return Number(process.hrtime.bigint() - start) / 1e6;
  };
  const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
  for (let i = 0; i < 3; i++) { await time('warm@example.com'); await time('real@example.com'); }

  const unknown = [], wrong = [];
  for (let i = 0; i < 15; i++) {
    unknown.push(await time(`nobody${i}@example.com`));
    wrong.push(await time('real@example.com'));
  }
  // Note; Without equalization the unknown-email path is ~30x faster; allow generous CI noise
  const ratio = median(unknown) / median(wrong);
  assert.ok(ratio > 0.5, `unknown ${median(unknown).toFixed(1)} ms vs wrong ${median(wrong).toFixed(1)} ms`);
});

test('the 11th login attempt from one IP within 15 minutes is rate limited', async () => {
  const ip = '192.0.2.50';
  for (let i = 1; i <= 10; i++) {
    const res = await login('real@example.com', 'bad-password', ip);
    assert.equal(res.error?.message, 'Invalid email or password', `attempt ${i}`);
  }
  const blocked = await login('real@example.com', 'correct-horse', ip);
  assert.equal(blocked.error?.extensions?.code, 'RATE_LIMITED');

  const otherIp = await login('real@example.com', 'correct-horse', '192.0.2.51');
  assert.ok(otherIp.data?.login?.token);
});

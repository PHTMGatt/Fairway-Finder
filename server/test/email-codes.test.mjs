// server/test/email-codes.test.mjs: email-code sign-up and password reset (in-memory MongoDB, captured mail)
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Profile, EmailCode, setTestMailer;
let outbox = [];
let ipCounter = 0;
// Fresh IP per call so the per-IP limiters never interfere with these flows.
const call = (query, variables) => api.gql(query, variables, { ip: `10.9.${Math.floor(ipCounter / 250)}.${(ipCounter++ % 250) + 1}` });
const lastCode = (to) => {
  const mail = [...outbox].reverse().find((m) => m.to === to);
  return mail?.text.match(/\b(\d{6})\b/)?.[1];
};

const REQUEST = `mutation($input: SignupInput!) { requestSignupCode(input: $input) }`;
const VERIFY = `mutation($e: String!, $c: String!) { verifyEmail(email: $e, code: $c) { token profile { email } } }`;
const FORGOT = `mutation($e: String!) { requestPasswordReset(email: $e) }`;
const RESET = `mutation($e: String!, $c: String!, $p: String!) { resetPassword(email: $e, code: $c, password: $p) { token } }`;

before(async () => {
  db = await startTestDb('ff_email_codes');
  ({ default: Profile } = await dist('models/Profile.js'));
  ({ default: EmailCode } = await dist('models/EmailCode.js'));
  ({ setTestMailer } = await dist('utils/mailer.js'));
  await Promise.all([Profile.init(), EmailCode.init()]);
  setTestMailer(async (message) => {
    outbox.push(message);
  });
  api = await startGraphQL();
});

after(async () => {
  setTestMailer(null);
  await api?.stop();
  await db?.stop();
});

beforeEach(() => {
  outbox = [];
});

test('authOptions reports email codes when a mailer is configured', async () => {
  const r = await call(`{ authOptions { emailCodes } }`);
  assert.equal(r.data.authOptions.emailCodes, true);
});

test('sign-up: code emailed, login blocked until verified, wrong codes lock out, right code logs in', async () => {
  const email = 'mom@example.com';
  assert.equal((await call(REQUEST, { input: { name: 'GolfMom', email, password: 'birdie1234' } })).data.requestSignupCode, true);
  const code = lastCode(email);
  assert.match(code, /^\d{6}$/);
  assert.equal(await EmailCode.countDocuments({ email }), 1);
  const stored = await EmailCode.findOne({ email }).lean();
  assert.notEqual(stored.codeHash, code, 'only a hash is stored');

  const blocked = await call(LOGIN, { email, password: 'birdie1234' });
  assert.match(blocked.error.message, /Check your email/);

  const wrong = code === '000000' ? '111111' : '000000';
  const first = await call(VERIFY, { e: email, c: wrong });
  assert.match(first.error.message, /isn't right/);

  const ok = await call(VERIFY, { e: email, c: code });
  assert.equal(ok.error, null);
  assert.ok(ok.data.verifyEmail.token);
  assert.equal(await EmailCode.countDocuments({ email }), 0, 'code consumed');

  const login = await call(LOGIN, { email, password: 'birdie1234' });
  assert.equal(login.error, null);
  const profile = await Profile.findOne({ email }).lean();
  assert.equal(profile.emailVerified, true);
  assert.equal(profile.unverifiedExpiresAt, undefined);
});

test('five wrong codes lock the code; resend is rate limited for 60 seconds', async () => {
  const email = 'locked@example.com';
  await call(REQUEST, { input: { name: 'Locked', email, password: 'birdie1234' } });
  const code = lastCode(email);
  const wrong = code === '123456' ? '654321' : '123456';
  for (let i = 0; i < 5; i += 1) await call(VERIFY, { e: email, c: wrong });
  const after5 = await call(VERIFY, { e: email, c: code });
  assert.match(after5.error.message, /Too many wrong codes/);

  const again = await call(REQUEST, { input: { name: 'Locked', email, password: 'birdie1234' } });
  assert.match(again.error.message, /Wait \d+ seconds/);
});

test('signing up with an already-registered email answers the same and sends nothing', async () => {
  await Profile.create({ name: 'Existing', email: 'taken@example.com', password: 'whatever123' });
  const r = await call(REQUEST, { input: { name: 'Someone', email: 'taken@example.com', password: 'birdie1234' } });
  assert.equal(r.data.requestSignupCode, true);
  assert.equal(outbox.length, 0);
  const stillOld = await Profile.findOne({ email: 'taken@example.com' }).lean();
  assert.equal(stillOld.name, 'Existing');
});

test('password reset: unknown email looks identical; real account gets a code and a new password', async () => {
  assert.equal((await call(FORGOT, { e: 'nobody@example.com' })).data.requestPasswordReset, true);
  assert.equal(outbox.length, 0);

  await Profile.create({ name: 'Resetter', email: 'reset@example.com', password: 'oldpass123' });
  assert.equal((await call(FORGOT, { e: 'reset@example.com' })).data.requestPasswordReset, true);
  const code = lastCode('reset@example.com');
  assert.match(code, /^\d{6}$/);

  const shortPw = await call(RESET, { e: 'reset@example.com', c: code, p: 'short' });
  assert.match(shortPw.error.message, /Password must be/);

  const done = await call(RESET, { e: 'reset@example.com', c: code, p: 'newpass456' });
  assert.equal(done.error, null);
  assert.equal((await call(LOGIN, { email: 'reset@example.com', password: 'oldpass123' })).error.message, 'Invalid email or password');
  assert.equal((await call(LOGIN, { email: 'reset@example.com', password: 'newpass456' })).error, null);

  const reused = await call(RESET, { e: 'reset@example.com', c: code, p: 'another789' });
  assert.ok(reused.error, 'a used code cannot be reused');
});

test('a sign-up code cannot be used as a reset code', async () => {
  const email = 'cross@example.com';
  await call(REQUEST, { input: { name: 'Cross', email, password: 'birdie1234' } });
  const signupCode = lastCode(email);
  const r = await call(RESET, { e: email, c: signupCode, p: 'hijacked123' });
  assert.ok(r.error);
});

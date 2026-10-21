// server/test/invite-signup.test.mjs — invite-only account creation against an in-memory MongoDB

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'child_process';
import path from 'path';
import { SERVER_DIR, dist, startTestDb, startGraphQL, ADD_PROFILE, LOGIN, ME } from './helpers.mjs';

let db, api, Profile, Invite, hashInviteCode;

// Note; Create invites by running the real CLI against the test database
const createInvite = (...args) => {
  const out = execFileSync(process.execPath, [path.join(SERVER_DIR, 'dist/scripts/createInvite.js'), ...args], {
    env: { ...process.env, MONGODB_URI: db.uri },
    encoding: 'utf8',
  });
  return out.match(/Invite code: (\S+)/)[1];
};
const inviteFor = (code) => Invite.findOne({ codeHash: hashInviteCode(code) }).lean();
const signup = (input) => api.gql(ADD_PROFILE, { input: { password: 'goodpass1', ...input } });
const INVALID_INVITE = 'Invalid or expired invite code';
const BAD_PASSWORD = 'Password must be 8 to 72 characters';

before(async () => {
  db = await startTestDb('ff_invite_signup');
  ({ default: Profile } = await dist('models/Profile.js'));
  ({ default: Invite, hashInviteCode } = await dist('models/Invite.js'));
  await Promise.all([Profile.init(), Invite.init()]);
  api = await startGraphQL();
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

test('invites.codeHash has a real unique index', async () => {
  const code = createInvite();
  const indexes = await Invite.collection.indexes();
  assert.ok(indexes.some((i) => i.key.codeHash === 1 && i.unique));
  await assert.rejects(
    Invite.create({ codeHash: hashInviteCode(code), expiresAt: new Date(Date.now() + 60_000) }),
    (err) => err.code === 11000
  );
});

test('existing accounts with short legacy passwords can still log in', async () => {
  await Profile.create({ name: 'Legacy', email: 'legacy@example.com', password: 'abcde' });
  const res = await api.gql(LOGIN, { email: 'legacy@example.com', password: 'abcde' });
  assert.ok(res.data?.login?.token, res.error?.message);
});

test('sign-up without an inviteCode is rejected by the schema', async () => {
  const res = await signup({ name: 'A', email: 'a@example.com' });
  assert.match(res.error?.message ?? '', /inviteCode/);
});

test('a fake invite code cannot be used to check whether an email is registered', async () => {
  const taken = await signup({ name: 'Probe', email: 'legacy@example.com', inviteCode: 'made-up-code' });
  const free = await signup({ name: 'Probe', email: 'nobody-here@example.com', inviteCode: 'made-up-code' });
  assert.equal(taken.error?.message, INVALID_INVITE);
  assert.equal(free.error?.message, INVALID_INVITE);
});

test('rejections do not consume the invite', async () => {
  const code = createInvite();
  const cases = [
    [{ name: 'A', email: 'a@example.com', inviteCode: 'not-a-real-code' }, INVALID_INVITE],
    [{ name: 'A', email: 'a@example.com', inviteCode: code, password: 'short7!' }, BAD_PASSWORD],
    [{ name: 'A', email: 'a@example.com', inviteCode: code, password: 'a'.repeat(73) }, BAD_PASSWORD],
    [{ name: 'A', email: 'a@example.com', inviteCode: code, password: 'é'.repeat(37) }, BAD_PASSWORD], // 74 bytes
    [{ name: 'A', email: 'LEGACY@example.com', inviteCode: code }, 'Email already in use'],
  ];
  for (const [input, message] of cases) {
    const res = await signup(input);
    assert.equal(res.error?.message, message, JSON.stringify(input));
  }
  assert.equal((await inviteFor(code)).usedAt, null);
});

test('valid invite creates the account, records usage, and cannot be reused', async () => {
  const code = createInvite();
  const res = await signup({ name: '  Alice  ', email: 'Alice@Example.com', password: 'a'.repeat(72), inviteCode: ` ${code} ` });
  assert.ok(res.data?.addProfile?.token, res.error?.message);

  const alice = await Profile.findOne({ email: 'alice@example.com' }).select('+password').lean();
  assert.equal(alice.name, 'Alice');
  assert.match(alice.password, /^\$2[aby]\$10\$/);
  assert.ok(!('inviteCode' in alice));

  const used = await inviteFor(code);
  assert.ok(used.usedAt instanceof Date);
  assert.equal(String(used.usedBy), String(alice._id));

  const login = await api.gql(LOGIN, { email: 'alice@example.com', password: 'a'.repeat(72) });
  const me = await api.gql(ME, {}, { token: login.data?.login?.token });
  assert.equal(me.data?.me?.email, 'alice@example.com');

  const reuse = await signup({ name: 'Bob', email: 'bob@example.com', inviteCode: code });
  assert.equal(reuse.error?.message, INVALID_INVITE);
});

test('expired invites are rejected', async () => {
  const code = createInvite('--days', '1');
  await Invite.updateOne({ codeHash: hashInviteCode(code) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  const res = await signup({ name: 'Late', email: 'late@example.com', inviteCode: code });
  assert.equal(res.error?.message, INVALID_INVITE);
});

test('email-locked invites only work for their email (any case)', async () => {
  const code = createInvite('--email', 'Locked@Example.com');
  const wrong = await signup({ name: 'Other', email: 'other@example.com', inviteCode: code });
  assert.equal(wrong.error?.message, INVALID_INVITE);
  assert.equal((await inviteFor(code)).usedAt, null);

  const right = await signup({ name: 'Locky', email: ' LOCKED@example.COM ', inviteCode: code });
  assert.ok(right.data?.addProfile?.token, right.error?.message);
});

test('a taken username releases the invite so the same code works on retry', async () => {
  await Profile.create({ name: 'Taken', email: 'taken@example.com', password: 'goodpass1' });
  const code = createInvite();
  const dup = await signup({ name: 'Taken', email: 'fresh@example.com', inviteCode: code });
  assert.equal(dup.error?.message, 'Username already taken');
  assert.equal((await inviteFor(code)).usedAt, null);

  const retry = await signup({ name: 'Fresh', email: 'fresh@example.com', inviteCode: code });
  assert.ok(retry.data?.addProfile?.token, retry.error?.message);
});

test('concurrent sign-ups on one invite create exactly one account', async () => {
  const code = createInvite();
  const before = await Profile.countDocuments();
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, i) => signup({ name: `Racer${i}`, email: `racer${i}@example.com`, inviteCode: code }))
  );
  assert.equal(results.filter((r) => r.data?.addProfile?.token).length, 1);
  assert.equal(results.filter((r) => r.error?.message === INVALID_INVITE).length, 7);
  assert.equal(await Profile.countDocuments(), before + 1);
});

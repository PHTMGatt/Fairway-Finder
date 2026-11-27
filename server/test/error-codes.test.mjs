// server/test/error-codes.test.mjs — the error codes and extensions the client relies on

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, token;

before(async () => {
  db = await startTestDb('ff_error_codes');
  const { default: Profile } = await dist('models/Profile.js');
  await Profile.init();
  await Profile.create({ name: 'Cara', email: 'cara@example.com', password: 'goodpass1' });
  api = await startGraphQL();
  token = (await api.gql(LOGIN, { email: 'cara@example.com', password: 'goodpass1' })).data.login.token;
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

test('rejected input reports BAD_USER_INPUT and names the argument', async () => {
  const res = await api.gql(
    'mutation($input: TripInput!) { addTrip(input: $input) { _id } }',
    { input: { name: '   ', date: '2026-12-01', course: { name: 'Links' } } },
    { token }
  );
  assert.equal(res.error?.extensions?.code, 'BAD_USER_INPUT');
  assert.deepEqual(res.error?.extensions?.invalidArgs, ['name']);
});

test('a bad login reports UNAUTHENTICATED', async () => {
  const res = await api.gql(LOGIN, { email: 'cara@example.com', password: 'wrongpass1' });
  assert.equal(res.error?.extensions?.code, 'UNAUTHENTICATED');
});

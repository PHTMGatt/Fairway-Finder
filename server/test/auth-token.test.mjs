// server/test/auth-token.test.mjs — JWT signing and verification (no database)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { dist, TEST_JWT_SECRET } from './helpers.mjs';

const { signToken, authenticateToken } = await dist('utils/auth.js');

const USER = { username: 'alice', email: 'alice@example.com', _id: '64b000000000000000000001' };
const userFrom = (authorization) => {
  const req = { headers: authorization === undefined ? {} : { authorization } };
  authenticateToken({ req });
  return req.user;
};
const token = signToken(USER.username, USER.email, USER._id);
const decoded = jwt.decode(token, { complete: true });

test('signToken issues an HS256 token with { data } payload and 8h expiry', () => {
  assert.equal(decoded.header.alg, 'HS256');
  assert.deepEqual(decoded.payload.data, USER);
  assert.equal(decoded.payload.exp - decoded.payload.iat, 8 * 3600);
});

test('valid token authenticates with or without the Bearer prefix', () => {
  assert.deepEqual(userFrom(`Bearer ${token}`), USER);
  assert.deepEqual(userFrom(token), USER);
});

test('missing or empty Authorization header leaves the request anonymous', () => {
  assert.equal(userFrom(undefined), undefined);
  assert.equal(userFrom('Bearer '), undefined);
});

test('tampered, wrong-secret, unsigned and expired tokens are rejected', () => {
  const [header, payload, signature] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ ...decoded.payload, data: { ...USER, _id: 'attacker' } })).toString('base64url');
  assert.equal(userFrom(`Bearer ${header}.${forged}.${signature}`), undefined, 'tampered payload');

  const otherSecret = jwt.sign({ data: USER }, 'some-other-secret', { expiresIn: '8h' });
  assert.equal(userFrom(`Bearer ${otherSecret}`), undefined, 'wrong secret');

  const unsigned = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${payload}.`;
  assert.equal(userFrom(`Bearer ${unsigned}`), undefined, 'alg=none');

  const expired = jwt.sign({ data: USER, exp: Math.floor(Date.now() / 1000) - 60 }, TEST_JWT_SECRET);
  assert.equal(userFrom(`Bearer ${expired}`), undefined, 'expired tokens are not silently renewed');
});

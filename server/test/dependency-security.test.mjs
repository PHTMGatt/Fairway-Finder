// server/test/dependency-security.test.mjs — regression for the Apollo 5 / nodemailer 10 / bcrypt 6 upgrade (advisories)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import express from 'express';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';

const major = (name) =>
  Number(JSON.parse(readFileSync(new URL(`../node_modules/${name}/package.json`, import.meta.url), 'utf8')).version.split('.')[0]);

test('patched major versions stay installed', () => {
  assert.ok(major('@apollo/server') >= 5);
  assert.ok(major('nodemailer') >= 10);
  assert.ok(major('bcrypt') >= 6);
});

test('Apollo 5 serves GraphQL over the express4 middleware', async () => {
  const apollo = new ApolloServer({
    typeDefs: 'type Query { ping: String }',
    resolvers: { Query: { ping: () => 'pong' } },
  });
  await apollo.start();
  const app = express();
  app.use('/graphql', express.json(), expressMiddleware(apollo));
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ ping }' }),
    });
    assert.deepEqual((await res.json()).data, { ping: 'pong' });
  } finally {
    server.close();
    await apollo.stop();
  }
});

test('bcrypt 6 hashes and verifies', async () => {
  const hash = await bcrypt.hash('correct-horse', 4);
  assert.equal(await bcrypt.compare('correct-horse', hash), true);
  assert.equal(await bcrypt.compare('wrong', hash), false);
});

test('nodemailer 10 builds a transport', () => {
  assert.equal(typeof nodemailer.createTransport({ jsonTransport: true }).sendMail, 'function');
});

// server/test/helpers.mjs
//
// Shared setup for the server test suite. Tests run against the compiled
// dist/ output and a throwaway in-memory MongoDB on 127.0.0.1 — never a real
// or remote database. `npm test` builds first.

import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';

export const SERVER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TEST_JWT_SECRET = 'test-secret-not-for-production';

// Note; Set before any dist module loads, so nothing can pick up a real secret from server/.env
process.env.JWT_SECRET_KEY = TEST_JWT_SECRET;

/** Import a compiled server module, e.g. dist('models/Invite.js'). */
export const dist = (relativePath) =>
  import(pathToFileURL(path.join(SERVER_DIR, 'dist', relativePath)).href);

/**
 * Start an in-memory MongoDB, point MONGODB_URI at it, and connect mongoose.
 * Refuses to continue unless the database is on 127.0.0.1.
 */
export const startTestDb = async (dbName = 'ff_test', { ttlMonitorSleepSecs } = {}) => {
  // Note; MongoDB's TTL cleanup normally runs every 60s; TTL tests can shorten it
  const args = ttlMonitorSleepSecs ? ['--setParameter', `ttlMonitorSleepSecs=${ttlMonitorSleepSecs}`] : [];
  const mem = await MongoMemoryServer.create({ instance: { args } });
  const uri = `${mem.getUri()}${dbName}`;
  if (new URL(uri).hostname !== '127.0.0.1') {
    await mem.stop();
    throw new Error(`Refusing to run tests against non-local database: ${new URL(uri).hostname}`);
  }
  process.env.MONGODB_URI = uri;

  const { connectDatabase } = await dist('config/connection.js');
  await connectDatabase();
  if (mongoose.connection.host !== '127.0.0.1') {
    throw new Error(`Connected to unexpected host ${mongoose.connection.host}`);
  }

  return {
    uri,
    stop: async () => {
      await mongoose.disconnect();
      await mem.stop();
    },
  };
};

/**
 * Start Apollo with the real schema and return a gql() helper that builds the
 * same context as server.ts. Each call gets a fresh IP unless one is given,
 * so the per-IP auth limits don't interfere with unrelated tests.
 */
export const startGraphQL = async () => {
  const { schema } = await dist('schemas/index.js');
  const { authenticateToken } = await dist('utils/auth.js');
  const apollo = new ApolloServer({ typeDefs: schema.typeDefs, resolvers: schema.resolvers });
  await apollo.start();

  let ipCounter = 0;
  const gql = async (query, variables = {}, { token, ip } = {}) => {
    const req = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
      ip: ip ?? `10.${Math.floor(++ipCounter / 250) % 250}.${ipCounter % 250}.1`,
    };
    authenticateToken({ req });
    const res = await apollo.executeOperation(
      { query, variables },
      { contextValue: { user: req.user, ip: req.ip } }
    );
    const single = res.body.singleResult;
    return { data: single.data, error: single.errors?.[0] ?? null };
  };

  return { gql, stop: () => apollo.stop() };
};

export const ADD_PROFILE = `mutation($input: ProfileInput!) {
  addProfile(input: $input) { token profile { _id name email } }
}`;
export const LOGIN = `mutation($email: String!, $password: String!) {
  login(email: $email, password: $password) { token profile { _id name } }
}`;
export const ME = `query { me { _id name email } }`;

// Note; authenticateToken logs each rejected token; keep test output readable
const originalWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].startsWith('Token verification failed')) return;
  originalWarn(...args);
};

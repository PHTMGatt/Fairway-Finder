import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb } from './helpers.mjs';

let db;
let models;

before(async () => {
  db = await startTestDb('ff_model_index_init');
  models = await dist('models/index.js');
});

after(async () => {
  await db?.stop();
});

test('startup index initializer creates guest TTL and invite uniqueness indexes', async () => {
  const initializeModelIndexes = models.initializeModelIndexes;
  assert.equal(typeof initializeModelIndexes, 'function');

  await Promise.all([
    models.Profile.collection.dropIndexes().catch(() => undefined),
    models.Trip.collection.dropIndexes().catch(() => undefined),
    models.Invite.collection.dropIndexes().catch(() => undefined),
  ]);

  await initializeModelIndexes();

  for (const Model of [models.Profile, models.Trip]) {
    const ttl = (await Model.collection.indexes()).find((index) => index.key.expiresAt === 1);
    assert.equal(ttl?.expireAfterSeconds, 0, `${Model.modelName} TTL`);
    assert.deepEqual(ttl?.partialFilterExpression, { isGuest: true }, `${Model.modelName} TTL filter`);
  }

  const inviteCodeHash = (await models.Invite.collection.indexes()).find(
    (index) => index.key.codeHash === 1
  );
  assert.equal(inviteCodeHash?.unique, true, 'Invite codeHash must be unique');
});

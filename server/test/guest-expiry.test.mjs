// server/test/guest-expiry.test.mjs — Guest Demo fields and TTL auto-deletion against an in-memory MongoDB

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb } from './helpers.mjs';

let db, Profile, Trip;

before(async () => {
  db = await startTestDb('ff_guest_expiry', { ttlMonitorSleepSecs: 1 });
  ({ default: Profile } = await dist('models/Profile.js'));
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
});

after(async () => {
  await db?.stop();
});

const raw = (Model, _id) => Model.collection.findOne({ _id });
const waitFor = async (condition, timeoutMs = 15_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
};

test('profiles and trips have TTL indexes on expiresAt', async () => {
  for (const Model of [Profile, Trip]) {
    const ttl = (await Model.collection.indexes()).find((i) => i.key.expiresAt === 1);
    assert.equal(ttl?.expireAfterSeconds, 0, Model.modelName);
  }
});

test('permanent profiles and trips never store guest fields', async () => {
  const profile = await Profile.create({ name: 'Perm', email: 'perm@example.com', password: 'goodpass1' });
  const trip = await Trip.create({ name: 'Perm trip', date: '2026-11-01' });
  const storedProfile = await raw(Profile, profile._id);
  const storedTrip = await raw(Trip, trip._id);
  assert.ok(!('isGuest' in storedProfile) && !('expiresAt' in storedProfile));
  assert.ok(!('expiresAt' in storedTrip));
});

test('existing documents keep working and gain no fields when loaded and saved', async () => {
  // Note; Shape of documents already in production: written before these fields existed
  const { insertedId: profileId } = await Profile.collection.insertOne({
    name: 'Old', email: 'old@example.com', password: '$2b$10$abcdefghijklmnopqrstuuJ8wH2tYx0Cq4q0Q3oQyQ0dQkzv1y6gG', trips: [], handicap: null,
  });
  const { insertedId: tripId } = await Trip.collection.insertOne({ name: 'Old trip', date: '2025-06-01', courses: [], players: [], handicap: null });

  const profile = await Profile.findById(profileId);
  profile.handicap = 12.4;
  await profile.save();
  const trip = await Trip.findById(tripId);
  trip.handicap = 3;
  await trip.save();

  const storedProfile = await raw(Profile, profileId);
  const storedTrip = await raw(Trip, tripId);
  assert.equal(storedProfile.handicap, 12.4);
  assert.ok(!('isGuest' in storedProfile) && !('expiresAt' in storedProfile));
  assert.equal(storedTrip.handicap, 3);
  assert.ok(!('expiresAt' in storedTrip));
});

test('MongoDB deletes expired guest profiles and trips, and leaves everything else', async () => {
  const past = new Date(Date.now() - 1000);
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const expiredGuest = await Profile.create({ name: 'guest-old', email: 'old@guest.invalid', password: 'goodpass1', isGuest: true, expiresAt: past });
  const expiredTrip = await Trip.create({ name: 'Guest trip', date: '2026-11-01', expiresAt: past });
  const activeGuest = await Profile.create({ name: 'guest-new', email: 'new@guest.invalid', password: 'goodpass1', isGuest: true, expiresAt: future });
  const activeTrip = await Trip.create({ name: 'Active guest trip', date: '2026-11-01', expiresAt: future });
  const permanent = await Profile.create({ name: 'Keeper', email: 'keeper@example.com', password: 'goodpass1' });
  const permanentTrip = await Trip.create({ name: 'Keeper trip', date: '2026-11-01' });

  const gone = await waitFor(async () => !(await raw(Profile, expiredGuest._id)) && !(await raw(Trip, expiredTrip._id)));
  assert.ok(gone, 'expired guest profile and trip were deleted');

  for (const [Model, doc] of [[Profile, activeGuest], [Trip, activeTrip], [Profile, permanent], [Trip, permanentTrip]]) {
    assert.ok(await raw(Model, doc._id), `${Model.modelName} ${doc.name} still exists`);
  }
});

// server/test/guest-session.test.mjs — Guest Demo sessions against an in-memory MongoDB

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Profile, Trip, sweepExpiredGuests;

const START = `mutation { startGuestSession { token profile { _id name email isGuest expiresAt } } }`;
const ME = `query { me { _id isGuest expiresAt trips { _id name date courses { name source address location { lat lng } rating courseRating slope } } } }`;
const TRIP = `query($id: ID!) { trip(id: $id) { _id name date courses { name source address location { lat lng } rating courseRating slope } players { name score total handicap } } }`;
const RESET = `mutation { resetGuestDemo { _id isGuest expiresAt } }`;
const ADD_TRIP = `mutation($input: TripInput!) { addTrip(input: $input) { _id } }`;
const ADD_PLAYER = `mutation($tripId: ID!, $name: String!) { addPlayer(tripId: $tripId, name: $name) { _id } }`;
const UPDATE_SCORE = `mutation($tripId: ID!, $player: String!, $hole: Int!, $score: Int!) { updateScore(tripId: $tripId, player: $player, hole: $hole, score: $score) { _id } }`;
const tripInput = (name) => ({ input: { name, date: '2026-11-01', courseName: 'Links' } });
const DAY_MS = 24 * 60 * 60 * 1000;

const startGuest = async (ip) => {
  const res = await api.gql(START, {}, ip ? { ip } : {});
  return { ...res.data?.startGuestSession, error: res.error };
};

before(async () => {
  db = await startTestDb('ff_guest_session');
  ({ default: Profile } = await dist('models/Profile.js'));
  ({ default: Trip } = await dist('models/Trip.js'));
  ({ sweepExpiredGuests } = await dist('utils/guestCleanup.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  api = await startGraphQL();
});

after(async () => {
  delete process.env.GUEST_MAX_ACTIVE;
  await api?.stop();
  await db?.stop();
});

test('startGuestSession creates a 24h guest and a token that ends with it', async () => {
  const before = Date.now();
  const { token, profile, error } = await startGuest();
  assert.equal(error, null);
  assert.equal(profile.isGuest, true);
  assert.match(profile.name, /^guest-[0-9a-f]{24}$/);
  assert.match(profile.email, /^[0-9a-f]{24}@guest\.invalid$/);

  const expiresAt = new Date(profile.expiresAt).getTime();
  assert.ok(Math.abs(expiresAt - (before + DAY_MS)) < 5000, 'expires ~24h from now');
  const { exp, data } = jwt.decode(token);
  assert.equal(exp, Math.floor(expiresAt / 1000), 'token expires exactly when the guest does');
  assert.equal(data.isGuest, true);

  const stored = await Profile.findById(profile._id).select('+password').lean();
  assert.equal(stored.isGuest, true);
  assert.match(stored.password, /^\$2[aby]\$10\$/);

  const me = await api.gql(ME, {}, { token });
  assert.equal(me.data?.me?.isGuest, true);
});

test('new guests start with one isolated seeded demo trip', async () => {
  const first = await startGuest();
  const second = await startGuest();
  assert.equal(first.error, null);
  assert.equal(second.error, null);
  assert.notEqual(first.profile._id, second.profile._id);

  const [firstMe, secondMe] = await Promise.all([
    api.gql(ME, {}, { token: first.token }),
    api.gql(ME, {}, { token: second.token }),
  ]);

  const firstTrips = firstMe.data?.me?.trips ?? [];
  const secondTrips = secondMe.data?.me?.trips ?? [];
  assert.equal(firstTrips.length, 1);
  assert.equal(secondTrips.length, 1);
  assert.notEqual(firstTrips[0]._id, secondTrips[0]._id);

  const seeded = firstTrips[0];
  assert.equal(seeded.name, 'Fairway Finder Demo Round');
  assert.match(seeded.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(seeded.courses.length, 1);
  assert.equal(seeded.courses[0].name, 'Fairway Finder Demo Course');
  assert.equal(seeded.courses[0].source, 'demo');
  assert.equal(seeded.courses[0].address, 'Ann Arbor, MI');

  const seededDetails = await api.gql(TRIP, { id: seeded._id }, { token: first.token });
  assert.equal(seededDetails.error, null);
  const players = seededDetails.data.trip.players;
  assert.equal(players.length, 2);
  assert.deepEqual(players.map((player) => player.name), ['Alex', 'Jordan']);
  assert.equal(players[0].score.H1, 4);
  assert.ok(players[0].total > 0);

  const storedSeed = await Trip.findById(seeded._id).lean();
  assert.equal(storedSeed.isGuest, true);
  assert.equal(storedSeed.expiresAt.toISOString(), first.profile.expiresAt);
});

test('permanent accounts report isGuest false and no expiry', async () => {
  await Profile.create({ name: 'Perm', email: 'perm@example.com', password: 'goodpass1' });
  const login = await api.gql(LOGIN, { email: 'perm@example.com', password: 'goodpass1' });
  const me = await api.gql(ME, {}, { token: login.data.login.token });
  assert.equal(me.data?.me?.isGuest, false);
  assert.equal(me.data?.me?.expiresAt, null);
});

test('guest trips expire with the guest, and the seeded trip counts toward the 3-trip cap', async () => {
  const { token, profile } = await startGuest();
  for (let i = 1; i <= 2; i++) {
    const res = await api.gql(ADD_TRIP, tripInput(`Guest trip ${i}`), { token });
    assert.equal(res.error, null, `trip ${i}`);
  }
  const fourthTotal = await api.gql(ADD_TRIP, tripInput('One too many'), { token });
  assert.equal(fourthTotal.error?.message, 'The guest demo is limited to 3 trips');

  const storedProfile = await Profile.findById(profile._id).lean();
  const ownedTrips = await Trip.find({ _id: { $in: storedProfile.trips } }).lean();
  assert.equal(ownedTrips.length, 3);
  for (const trip of ownedTrips) {
    assert.equal(trip.isGuest, true);
    assert.equal(trip.expiresAt.toISOString(), profile.expiresAt);
  }
});

test('concurrent guest trip creation cannot race past the 3-trip cap or leave orphans', async () => {
  const { token, profile } = await startGuest();
  const attempts = await Promise.all(
    Array.from({ length: 8 }, (_, i) =>
      api.gql(ADD_TRIP, tripInput(`Concurrent guest trip ${i + 1}`), { token })
    )
  );

  const successes = attempts.filter((result) => result.error === null);
  const rejected = attempts.filter(
    (result) => result.error?.message === 'The guest demo is limited to 3 trips'
  );
  assert.equal(successes.length, 2);
  assert.equal(rejected.length, 6);

  const storedProfile = await Profile.findById(profile._id).lean();
  assert.equal(storedProfile.trips.length, 3);

  const storedTrips = await Trip.find({ name: /^Concurrent guest trip/ }).lean();
  assert.equal(storedTrips.length, 2, 'losing concurrent creates are cleaned up');
  const concurrentIds = storedTrips.map((trip) => String(trip._id)).sort();
  assert.ok(concurrentIds.every((id) => storedProfile.trips.map(String).includes(id)));
});

test('resetGuestDemo removes only that guest data and restores the canonical seed', async () => {
  const { token, profile } = await startGuest();
  const before = await api.gql(ME, {}, { token });
  const originalSeedId = before.data.me.trips[0]._id;

  assert.equal((await api.gql(ADD_PLAYER, { tripId: originalSeedId, name: 'Tester' }, { token })).error, null);
  assert.equal((await api.gql(UPDATE_SCORE, { tripId: originalSeedId, player: 'Alex', hole: 1, score: 9 }, { token })).error, null);
  const extra = await api.gql(ADD_TRIP, tripInput('Temporary demo trip'), { token });
  assert.equal(extra.error, null);
  const oldIds = [originalSeedId, extra.data.addTrip._id];

  const reset = await api.gql(RESET, {}, { token });
  assert.equal(reset.error, null);
  assert.equal(reset.data.resetGuestDemo.isGuest, true);

  const afterReset = await api.gql(ME, {}, { token });
  const resetTrips = afterReset.data.me.trips;
  assert.equal(resetTrips.length, 1);
  assert.equal(resetTrips[0].name, 'Fairway Finder Demo Round');
  assert.notEqual(resetTrips[0]._id, originalSeedId);

  const resetDetails = await api.gql(TRIP, { id: resetTrips[0]._id }, { token });
  assert.equal(resetDetails.error, null);
  assert.deepEqual(resetDetails.data.trip.players.map((player) => player.name), ['Alex', 'Jordan']);
  assert.equal(resetDetails.data.trip.players[0].score.H1, 4);

  for (const oldId of oldIds) {
    assert.equal(await Trip.findById(oldId), null, `old guest trip ${oldId} deleted`);
  }
  const storedProfile = await Profile.findById(profile._id).lean();
  assert.deepEqual(storedProfile.trips.map(String), [resetTrips[0]._id]);
});

test('permanent users cannot reset demo data and their trips are untouched', async () => {
  const profile = await Profile.create({ name: 'ResetPerm', email: 'resetperm@example.com', password: 'goodpass1' });
  const login = await api.gql(LOGIN, { email: profile.email, password: 'goodpass1' });
  const added = await api.gql(ADD_TRIP, tripInput('Permanent reset guard'), { token: login.data.login.token });
  assert.equal(added.error, null);

  const reset = await api.gql(RESET, {}, { token: login.data.login.token });
  assert.equal(reset.error?.message, 'Demo reset is only available in Demo Mode');

  const storedProfile = await Profile.findById(profile._id).lean();
  assert.ok(storedProfile.trips.map(String).includes(added.data.addTrip._id));
  assert.ok(await Trip.findById(added.data.addTrip._id));
});

test('permanent users have no trip limit and their trips carry no guest fields', async () => {
  const login = await api.gql(LOGIN, { email: 'perm@example.com', password: 'goodpass1' });
  for (let i = 1; i <= 4; i++) {
    assert.equal((await api.gql(ADD_TRIP, tripInput(`Perm trip ${i}`), { token: login.data.login.token })).error, null);
  }
  const trip = await Trip.collection.findOne({ name: 'Perm trip 4' });
  assert.ok(!('isGuest' in trip) && !('expiresAt' in trip));
});

test('guests can never log in by password', async () => {
  const guest = await Profile.create({ name: 'guest-known', email: 'known@guest.invalid', password: 'knownpass1', isGuest: true, expiresAt: new Date(Date.now() + DAY_MS) });
  const res = await api.gql(LOGIN, { email: guest.email, password: 'knownpass1' });
  assert.equal(res.error?.message, 'Invalid email or password');
});

test('an expired guest is refused immediately, before TTL deletes it', async () => {
  const { token, profile } = await startGuest();
  await Profile.updateOne({ _id: profile._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
  for (const [label, res] of [
    ['me', await api.gql(ME, {}, { token })],
    ['addTrip', await api.gql(ADD_TRIP, tripInput('Too late'), { token })],
  ]) {
    assert.equal(res.error?.message, 'Your guest demo has ended', label);
    assert.equal(res.error?.extensions?.code, 'UNAUTHENTICATED', label);
    assert.equal(res.error?.extensions?.reason, 'GUEST_EXPIRED', label);
  }
});

test('the 4th guest from one IP within an hour is rate limited', async () => {
  const ip = '198.51.100.40';
  for (let i = 1; i <= 3; i++) assert.equal((await startGuest(ip)).error, null, `guest ${i}`);
  assert.equal((await startGuest(ip)).error?.extensions?.code, 'RATE_LIMITED');
});

test('new guests are refused once the site-wide cap is reached', async () => {
  const active = await Profile.countDocuments({ isGuest: true, expiresAt: { $gt: new Date() } });
  process.env.GUEST_MAX_ACTIVE = String(active + 1);
  try {
    assert.equal((await startGuest()).error, null, 'one more fits');
    const refused = await startGuest();
    assert.equal(refused.error?.extensions?.code, 'GUEST_CAPACITY');
  } finally {
    delete process.env.GUEST_MAX_ACTIVE;
  }
});

test('the backup sweep deletes only expired guests and their trips', async () => {
  const past = new Date(Date.now() - 60_000);
  const future = new Date(Date.now() + DAY_MS);
  const mkTrip = (name, extra = {}) => Trip.create({ name, date: '2026-11-01', ...extra });

  const t1 = await mkTrip('Sweep guest trip', { isGuest: true, expiresAt: past });
  const expiredGuest = await Profile.create({ name: 'guest-sweep', email: 'sweep@guest.invalid', password: 'goodpass1', isGuest: true, expiresAt: past, trips: [t1._id] });
  const orphan = await mkTrip('Sweep orphan trip', { isGuest: true, expiresAt: past });
  const activeGuest = await Profile.create({ name: 'guest-alive', email: 'alive@guest.invalid', password: 'goodpass1', isGuest: true, expiresAt: future });
  const strayPerm = await Profile.create({ name: 'StrayPerm', email: 'strayperm@example.com', password: 'goodpass1', expiresAt: past });
  const strayTrip = await mkTrip('Stray perm trip', { expiresAt: past });
  const permTrip = await mkTrip('Plain perm trip');

  const result = await sweepExpiredGuests();
  assert.ok(result.profiles >= 1 && result.trips >= 2, JSON.stringify(result));

  assert.equal(await Profile.findById(expiredGuest._id), null);
  assert.equal(await Trip.findById(t1._id), null);
  assert.equal(await Trip.findById(orphan._id), null);
  for (const [Model, doc] of [[Profile, activeGuest], [Profile, strayPerm], [Trip, strayTrip], [Trip, permTrip]]) {
    assert.ok(await Model.findById(doc._id), `${doc.name} survived`);
  }
  const permanentCount = await Profile.countDocuments({ isGuest: { $ne: true } });
  assert.ok(permanentCount >= 2, 'permanent profiles untouched');
});

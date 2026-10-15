import test from 'node:test';
import assert from 'node:assert/strict';
import { boundedText, validScore, validHandicap, validTripDate } from '../server/dist/utils/validation.js';
process.env.JWT_SECRET_KEY = 'local-test-only-not-a-production-secret';
const { default: resolvers } = await import('../server/dist/schemas/resolvers.js');
const { default: Profile } = await import('../server/dist/models/Profile.js');
const { default: Trip } = await import('../server/dist/models/Trip.js');
const tripId = '507f1f77bcf86cd799439011';
const user = { user: { _id: '507f191e810c19729de860ea' } };
test('bcrypt upgrade still accepts an existing bcrypt-5 fixture', async () => {
  const { default: bcrypt } = await import('../server/node_modules/bcrypt/bcrypt.js');
  const oldHash = '$2b$10$f/NY3EX/.e1wmHNUQO8fzulSTvkj6Ii7TDkMFnz4dyC4RL6szbcAa';
  assert(await bcrypt.compare('local-fixture-password', oldHash));
  assert(!await bcrypt.compare('wrong-password', oldHash));
  assert(await bcrypt.compare('new-fixture-password', await bcrypt.hash('new-fixture-password', 10)));
});

test('validates bounded labels without losing meaningful text', () => {
  assert.equal(boundedText(' Ann Arbor ', 'Name'), 'Ann Arbor');
  for (const value of ['', ' ', null, 'a'.repeat(121)]) assert.throws(() => boundedText(value, 'Name'));
});
test('score inputs reject impossible holes and non-integer or negative scores', () => {
  assert.doesNotThrow(() => validScore(1, 0));
  assert.doesNotThrow(() => validScore(18, 5));
  for (const args of [[0, 1], [19, 1], [1.5, 3], [1, -1], [1, 100], [1, 2.5]]) assert.throws(() => validScore(...args));
});
test('handicap and calendar dates reject invalid input', () => {
  assert.doesNotThrow(() => validTripDate('2028-02-29'));
  for (const value of ['2026-02-29', '2026-04-31', 'invalid']) assert.throws(() => validTripDate(value));
  for (const value of [NaN, Infinity, -11, 55]) assert.throws(() => validHandicap(value));
});
test('unauthenticated and malformed trip reads stop before database access', async () => {
  await assert.rejects(resolvers.Query.trip(null, { id: tripId }, {}), /Not authenticated/);
  await assert.rejects(resolvers.Query.trip(null, { id: 'bad-id' }, user), /Invalid trip ID/);
});
test('another users trip cannot be read, removed, scored or modified', async t => {
  t.mock.method(Profile, 'findById', async () => ({ trips: [] }));
  const dbRead = t.mock.method(Trip, 'findById', () => { throw new Error('must not read trip'); });
  const calls = [
    [resolvers.Query.trip, { id: tripId }],
    [resolvers.Mutation.deleteTrip, { tripId }],
    [resolvers.Mutation.removeCourseFromTrip, { tripId, courseName: 'Course' }],
    [resolvers.Mutation.updateScore, { tripId, player: 'Player', hole: 1, score: 4 }],
    [resolvers.Mutation.addPlayer, { tripId, name: 'Player' }],
  ];
  for (const [resolve, args] of calls) await assert.rejects(resolve(null, args, user), /Not authorized/);
  assert.equal(dbRead.mock.callCount(), 0);
});
test('course removal targets only the explicitly owned trip', async t => {
  t.mock.method(Profile, 'findById', async () => ({ trips: [tripId] }));
  t.mock.method(Trip, 'findById', async () => ({ _id: tripId }));
  const update = t.mock.method(Trip, 'findOneAndUpdate', async filter => ({ _id: filter._id }));
  await resolvers.Mutation.removeCourseFromTrip(null, { tripId, courseName: ' Shared Course ' }, user);
  assert.deepEqual(update.mock.calls[0].arguments[0], { _id: tripId, 'courses.name': 'Shared Course' });
});
test('adding duplicate player names is rejected', async t => {
  t.mock.method(Profile, 'findById', async () => ({ trips: [tripId] }));
  t.mock.method(Trip, 'findById', async () => ({ players: [{ name: 'Bryen' }] }));
  await assert.rejects(resolvers.Mutation.addPlayer(null, { tripId, name: ' bryen ' }, user), /already on this trip/);
});

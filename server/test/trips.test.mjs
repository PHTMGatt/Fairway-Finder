// server/test/trips.test.mjs — trip ownership and input limits against an in-memory MongoDB

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Trip, alice, bob;

const ADD_TRIP = `mutation($input: TripInput!) { addTrip(input: $input) { _id name } }`;
const TRIP = `query($id: ID!) { trip(id: $id) { _id name players { name total } } }`;

const loginAs = async (email, password) => (await api.gql(LOGIN, { email, password })).data.login.token;
const asUser = (token) => (query, variables) => api.gql(query, variables, { token });

before(async () => {
  db = await startTestDb('ff_trips');
  const { default: Profile } = await dist('models/Profile.js');
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  await Profile.create({ name: 'Alice', email: 'alice@example.com', password: 'goodpass1' });
  await Profile.create({ name: 'Bob', email: 'bob@example.com', password: 'goodpass1' });
  api = await startGraphQL();
  alice = asUser(await loginAs('alice@example.com', 'goodpass1'));
  bob = asUser(await loginAs('bob@example.com', 'goodpass1'));
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

const newTrip = async (name = 'Limits trip') =>
  (await alice(ADD_TRIP, { input: { name, date: '2026-11-01', courseName: 'Links' } })).data.addTrip._id;
const ADD_PLAYER = `mutation($t: ID!, $n: String!) { addPlayer(tripId: $t, name: $n) { _id } }`;
const ADD_COURSE = `mutation($t: ID!, $c: String!) { addCourseToTrip(tripId: $t, courseName: $c) { _id } }`;
const REMOVE_COURSE = `mutation($t: ID!, $c: ID!) { removeCourseFromTrip(tripId: $t, courseId: $c) { _id courses { _id name } } }`;
const UPDATE_SCORE = `mutation($t: ID!, $p: String!, $h: Int!, $s: Int!) { updateScore(tripId: $t, player: $p, hole: $h, score: $s) { _id } }`;
const PLAYER_HCP = `mutation($t: ID!, $n: String!, $h: Float!) { updatePlayerHandicap(tripId: $t, name: $n, handicap: $h) { _id } }`;
const TRIP_HCP = `mutation($t: ID!, $h: Float!) { updateTripHandicap(tripId: $t, handicap: $h) { _id } }`;

test('trip, course and player names must be 1 to N characters', async () => {
  const long = (n) => 'x'.repeat(n);
  const cases = [
    [ADD_TRIP, { input: { name: long(81), date: '2026-11-01', courseName: 'Links' } }, 'Trip name must be 1 to 80 characters'],
    [ADD_TRIP, { input: { name: '   ', date: '2026-11-01', courseName: 'Links' } }, 'Trip name must be 1 to 80 characters'],
    [ADD_TRIP, { input: { name: 'Ok', date: long(41), courseName: 'Links' } }, 'Trip date must be 1 to 40 characters'],
    [ADD_TRIP, { input: { name: 'Ok', date: '2026-11-01', courseName: long(151) } }, 'Course name must be 1 to 150 characters'],
  ];
  for (const [query, variables, message] of cases) {
    assert.equal((await alice(query, variables)).error?.message, message);
  }
  const tripId = await newTrip(long(80));
  assert.equal((await alice(ADD_PLAYER, { t: tripId, n: long(41) })).error?.message, 'Player name must be 1 to 40 characters');
  assert.equal((await alice(ADD_COURSE, { t: tripId, c: long(151) })).error?.message, 'Course name must be 1 to 150 characters');
  assert.equal((await alice(ADD_PLAYER, { t: tripId, n: long(40) })).error, null, 'exactly 40 is fine');
});

test('hole must be 1-18 and score 0-30', async () => {
  const tripId = await newTrip();
  await alice(ADD_PLAYER, { t: tripId, n: 'Ann' });
  for (const [h, s, message] of [
    [0, 4, 'Hole must be between 1 and 18'],
    [19, 4, 'Hole must be between 1 and 18'],
    [99999, 4, 'Hole must be between 1 and 18'],
    [1, -1, 'Score must be between 0 and 30'],
    [1, 31, 'Score must be between 0 and 30'],
  ]) {
    assert.equal((await alice(UPDATE_SCORE, { t: tripId, p: 'Ann', h, s })).error?.message, message);
  }
  for (const [h, s] of [[1, 0], [18, 30], [9, 5]]) {
    assert.equal((await alice(UPDATE_SCORE, { t: tripId, p: 'Ann', h, s })).error, null, `hole ${h} score ${s}`);
  }
  const stored = (await Trip.findById(tripId).lean()).players[0].scores;
  assert.equal(stored.length, 18, 'no extra score entries were pushed');
  assert.equal(stored.find((x) => x.hole === 18).score, 30);
});

test('handicaps must be between -10 and 54', async () => {
  const tripId = await newTrip();
  await alice(ADD_PLAYER, { t: tripId, n: 'Ann' });
  for (const h of [-10.1, 54.1, 1000]) {
    assert.equal((await alice(PLAYER_HCP, { t: tripId, n: 'Ann', h })).error?.message, 'Handicap must be between -10 and 54');
    assert.equal((await alice(TRIP_HCP, { t: tripId, h })).error?.message, 'Handicap must be between -10 and 54');
  }
  for (const h of [-10, 0, 12.4, 54]) {
    assert.equal((await alice(PLAYER_HCP, { t: tripId, n: 'Ann', h })).error, null, `player ${h}`);
    assert.equal((await alice(TRIP_HCP, { t: tripId, h })).error, null, `trip ${h}`);
  }
});

test('players are unique per trip and capped at 24; courses capped at 20', async () => {
  const tripId = await newTrip();
  assert.equal((await alice(ADD_PLAYER, { t: tripId, n: 'Ann' })).error, null);
  assert.equal((await alice(ADD_PLAYER, { t: tripId, n: ' Ann ' })).error?.message, 'That player is already on this trip');

  for (let i = 2; i <= 24; i++) await alice(ADD_PLAYER, { t: tripId, n: `P${i}` });
  assert.equal((await alice(ADD_PLAYER, { t: tripId, n: 'P25' })).error?.message, 'A trip can have at most 24 players');

  for (let i = 2; i <= 20; i++) await alice(ADD_COURSE, { t: tripId, c: `C${i}` }); // trip starts with 1 course
  assert.equal((await alice(ADD_COURSE, { t: tripId, c: 'C21' })).error?.message, 'A trip can have at most 20 courses');

  const trip = await Trip.findById(tripId).lean();
  assert.equal(trip.players.length, 24);
  assert.equal(trip.courses.length, 20);
});

test('concurrent player adds cannot exceed the cap', async () => {
  const tripId = await newTrip();
  for (let i = 1; i <= 20; i++) await alice(ADD_PLAYER, { t: tripId, n: `P${i}` });
  await Promise.all(Array.from({ length: 10 }, (_, i) => alice(ADD_PLAYER, { t: tripId, n: `Late${i}` })));
  assert.equal((await Trip.findById(tripId).lean()).players.length, 24);
});

test('concurrent duplicate player adds store the player only once', async () => {
  const tripId = await newTrip('Concurrent duplicate');
  const results = await Promise.all(
    Array.from({ length: 8 }, () => alice(ADD_PLAYER, { t: tripId, n: '  Same Player  ' }))
  );

  assert.equal(results.filter((result) => !result.error).length, 1, 'exactly one add succeeds');
  assert.equal(
    results.filter((result) => result.error?.message === 'That player is already on this trip').length,
    7,
    'all racing duplicates get the duplicate-player error'
  );

  const stored = await Trip.findById(tripId).lean();
  assert.equal(stored.players.length, 1);
  assert.equal(stored.players[0].name, 'Same Player', 'stored player name is normalized');
});

test("someone else's trip looks the same as a missing one, and is not an auth error", async () => {
  const { data } = await alice(ADD_TRIP, { input: { name: 'Pebble', date: '2026-11-01', courseName: 'Links' } });
  const tripId = data.addTrip._id;

  const missingId = '64b000000000000000000099';
  for (const [label, res] of [
    ['read other', await bob(TRIP, { id: tripId })],
    ['delete other', await bob(`mutation($t: ID!) { deleteTrip(tripId: $t) { _id } }`, { t: tripId })],
    ['add player other', await bob(`mutation($t: ID!) { addPlayer(tripId: $t, name: "Mallory") { _id } }`, { t: tripId })],
    ['read missing', await bob(TRIP, { id: missingId })],
  ]) {
    assert.equal(res.error?.message, 'Trip not found', label);
    assert.notEqual(res.error?.extensions?.code, 'UNAUTHENTICATED', label);
  }

  const stillThere = await Trip.findById(tripId).lean();
  assert.equal(stillThere.players.length, 0, "Bob's add-player did not touch Alice's trip");
  assert.equal((await alice(TRIP, { id: tripId })).data?.trip?.name, 'Pebble', 'owner still sees it');
});

test('course removal targets one owned trip and one embedded course id', async () => {
  const firstTripId = await newTrip('Course target A');
  const secondTripId = await newTrip('Course target B');
  const firstBefore = await Trip.findById(firstTripId).lean();
  const secondBefore = await Trip.findById(secondTripId).lean();
  const firstCourseId = firstBefore.courses[0]._id.toString();

  assert.equal(firstBefore.courses[0].name, 'Links');
  assert.equal(secondBefore.courses[0].name, 'Links');

  const removed = await alice(REMOVE_COURSE, { t: firstTripId, c: firstCourseId });
  assert.equal(removed.error, null);

  const [firstAfter, secondAfter] = await Promise.all([
    Trip.findById(firstTripId).lean(),
    Trip.findById(secondTripId).lean(),
  ]);
  assert.equal(firstAfter.courses.length, 0, 'target trip lost only the requested course');
  assert.equal(secondAfter.courses.length, 1, 'same-named course on another trip remains');
  assert.equal(secondAfter.courses[0].name, 'Links');
});

test('course removal enforces trip ownership before touching a course', async () => {
  const tripId = await newTrip('Owned removal');
  const tripBefore = await Trip.findById(tripId).lean();
  const courseId = tripBefore.courses[0]._id.toString();
  const missingTripId = '64b000000000000000000099';

  assert.equal((await bob(REMOVE_COURSE, { t: tripId, c: courseId })).error?.message, 'Trip not found');
  assert.equal((await bob(REMOVE_COURSE, { t: missingTripId, c: courseId })).error?.message, 'Trip not found');

  const tripAfter = await Trip.findById(tripId).lean();
  assert.equal(tripAfter.courses.length, 1, 'unauthorized removal did not mutate the trip');
});

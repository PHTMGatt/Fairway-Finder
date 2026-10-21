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

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Profile, Trip, alice;

const ADD_TRIP = `mutation($input: TripInput!) { addTrip(input: $input) { _id name } }`;
const DELETE_TRIP = `mutation($tripId: ID!) { deleteTrip(tripId: $tripId) { _id } }`;

before(async () => {
  db = await startTestDb('ff_trip_consistency');
  ({ default: Profile } = await dist('models/Profile.js'));
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  await Profile.create({
    name: 'Alice',
    email: 'alice-consistency@example.com',
    password: 'goodpass1',
  });
  api = await startGraphQL();
  const login = await api.gql(LOGIN, {
    email: 'alice-consistency@example.com',
    password: 'goodpass1',
  });
  alice = (query, variables) => api.gql(query, variables, { token: login.data.login.token });
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

test('addTrip removes the new Trip if saving the profile reference fails', async () => {
  const beforeCount = await Trip.countDocuments();
  const originalSave = Profile.prototype.save;
  let failed = false;

  Profile.prototype.save = async function (...args) {
    if (!failed && this.email === 'alice-consistency@example.com') {
      failed = true;
      throw new Error('simulated profile save failure');
    }
    return originalSave.apply(this, args);
  };

  try {
    await alice(ADD_TRIP, {
      input: {
        name: 'Should roll back',
        date: '2026-11-08',
        courseName: 'Rollback Links',
      },
    });
  } finally {
    Profile.prototype.save = originalSave;
  }

  assert.equal(await Trip.countDocuments(), beforeCount, 'failed profile link must not leave an orphan Trip');
  const profile = await Profile.findOne({ email: 'alice-consistency@example.com' }).lean();
  assert.equal(profile.trips.length, 0, 'failed add must not leave a profile reference either');
});

test('deleteTrip restores the profile reference if deleting the Trip document fails', async () => {
  const created = await alice(ADD_TRIP, {
    input: {
      name: 'Delete compensation',
      date: '2026-11-09',
      courseName: 'Safe Links',
    },
  });
  const tripId = created.data.addTrip._id;
  const originalDeleteOne = Trip.prototype.deleteOne;
  let failed = false;

  Trip.prototype.deleteOne = async function (...args) {
    if (!failed && this._id.toString() === tripId) {
      failed = true;
      throw new Error('simulated trip delete failure');
    }
    return originalDeleteOne.apply(this, args);
  };

  try {
    await alice(DELETE_TRIP, { tripId });
  } finally {
    Trip.prototype.deleteOne = originalDeleteOne;
  }

  const [profile, trip] = await Promise.all([
    Profile.findOne({ email: 'alice-consistency@example.com' }).lean(),
    Trip.findById(tripId).lean(),
  ]);
  assert.ok(trip, 'failed delete must leave the Trip document intact');
  assert.ok(
    profile.trips.some((id) => id.toString() === tripId),
    'failed delete must restore the ownership reference'
  );
});

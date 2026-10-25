import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Profile, Trip, alice;

const ADD_TRIP = `mutation($input: TripInput!) {
  addTrip(input: $input) { _id name courses { name } }
}`;

const REMOVE_COURSE = `mutation($tripId: ID!, $courseName: String!) {
  removeCourseFromTrip(tripId: $tripId, courseName: $courseName) {
    _id
    courses { name }
  }
}`;

const loginAs = async (email, password) =>
  (await api.gql(LOGIN, { email, password })).data.login.token;

before(async () => {
  db = await startTestDb('ff_course_removal');
  ({ default: Profile } = await dist('models/Profile.js'));
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  await Profile.create({
    name: 'Alice',
    email: 'alice-remove@example.com',
    password: 'goodpass1',
  });
  api = await startGraphQL();
  const token = await loginAs('alice-remove@example.com', 'goodpass1');
  alice = (query, variables) => api.gql(query, variables, { token });
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

test('removeCourseFromTrip removes a course only from the explicitly targeted trip', async () => {
  const first = await alice(ADD_TRIP, {
    input: { name: 'First trip', date: '2026-11-01', courseName: 'Shared Links' },
  });
  const second = await alice(ADD_TRIP, {
    input: { name: 'Second trip', date: '2026-11-02', courseName: 'Shared Links' },
  });

  const firstId = first.data.addTrip._id;
  const secondId = second.data.addTrip._id;

  const removed = await alice(REMOVE_COURSE, {
    tripId: secondId,
    courseName: 'Shared Links',
  });

  assert.equal(removed.error, null);
  assert.deepEqual(removed.data.removeCourseFromTrip.courses, []);

  const [storedFirst, storedSecond] = await Promise.all([
    Trip.findById(firstId).lean(),
    Trip.findById(secondId).lean(),
  ]);

  assert.deepEqual(storedFirst.courses.map((course) => course.name), ['Shared Links']);
  assert.deepEqual(storedSecond.courses.map((course) => course.name), []);
});

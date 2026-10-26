// server/test/trip-primary-course.test.mjs — the first course anchors trip context

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Trip, user;

const ADD_TRIP = `mutation($input: TripInput!) {
  addTrip(input: $input) { _id courses { _id name } }
}`;
const ADD_COURSE = `mutation($tripId: ID!, $course: TripCourseInput!) {
  addCourseToTrip(tripId: $tripId, course: $course) { _id courses { _id name } }
}`;
const REMOVE_COURSE = `mutation($tripId: ID!, $courseId: ID!) {
  removeCourseFromTrip(tripId: $tripId, courseId: $courseId) { _id courses { _id name } }
}`;

before(async () => {
  db = await startTestDb('ff_trip_primary_course');
  const { default: Profile } = await dist('models/Profile.js');
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  await Profile.create({
    name: 'PrimaryCourseOwner',
    email: 'primary-course@example.com',
    password: 'goodpass1',
  });
  api = await startGraphQL();
  const login = await api.gql(LOGIN, {
    email: 'primary-course@example.com',
    password: 'goodpass1',
  });
  user = (query, variables) => api.gql(query, variables, { token: login.data.login.token });
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

const createTrip = async (name) => {
  const result = await user(ADD_TRIP, {
    input: {
      name,
      date: '2026-11-24',
      course: { name: 'Primary Links', source: 'google', providerId: `${name}-primary` },
    },
  });
  assert.equal(result.error, null);
  return result.data.addTrip._id;
};

test('the primary course cannot be removed from a one-course trip', async () => {
  const tripId = await createTrip('Primary-only trip');
  const before = await Trip.findById(tripId).lean();
  const primaryId = before.courses[0]._id.toString();

  const result = await user(REMOVE_COURSE, { tripId, courseId: primaryId });

  assert.equal(result.error?.message, 'The primary course cannot be removed from a trip');
  const stored = await Trip.findById(tripId).lean();
  assert.equal(stored.courses.length, 1);
  assert.equal(stored.courses[0]._id.toString(), primaryId);
});

test('secondary courses stay removable while the primary course stays protected', async () => {
  const tripId = await createTrip('Two-course trip');
  const added = await user(ADD_COURSE, {
    tripId,
    course: { name: 'Second Links', source: 'google', providerId: 'two-course-secondary' },
  });
  assert.equal(added.error, null);

  const before = await Trip.findById(tripId).lean();
  const primaryId = before.courses[0]._id.toString();
  const secondaryId = before.courses[1]._id.toString();

  const blocked = await user(REMOVE_COURSE, { tripId, courseId: primaryId });
  assert.equal(blocked.error?.message, 'The primary course cannot be removed from a trip');

  const removed = await user(REMOVE_COURSE, { tripId, courseId: secondaryId });
  assert.equal(removed.error, null);

  const stored = await Trip.findById(tripId).lean();
  assert.equal(stored.courses.length, 1);
  assert.equal(stored.courses[0]._id.toString(), primaryId);
});

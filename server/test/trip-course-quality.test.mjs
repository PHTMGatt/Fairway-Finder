// server/test/trip-course-quality.test.mjs — canonical course data-quality guardrails

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Trip, user;

const ADD_TRIP = `mutation($input: TripInput!) {
  addTrip(input: $input) { _id courses { _id name source providerId slope } }
}`;

const ADD_COURSE = `mutation($tripId: ID!, $course: TripCourseInput!) {
  addCourseToTrip(tripId: $tripId, course: $course) {
    _id
    courses { _id name source providerId slope }
  }
}`;

before(async () => {
  db = await startTestDb('ff_trip_course_quality');
  const { default: Profile } = await dist('models/Profile.js');
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  await Profile.create({
    name: 'QualityOwner',
    email: 'course-quality@example.com',
    password: 'goodpass1',
  });
  api = await startGraphQL();
  const login = await api.gql(LOGIN, {
    email: 'course-quality@example.com',
    password: 'goodpass1',
  });
  user = (query, variables) => api.gql(query, variables, { token: login.data.login.token });
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

test('new canonical course metadata enforces the official 55-155 slope range', async () => {
  for (const slope of [54, 156]) {
    const name = `Invalid slope ${slope}`;
    const result = await user(ADD_TRIP, {
      input: {
        name,
        date: '2026-11-20',
        course: { name: 'Slope Check Links', slope },
      },
    });

    assert.equal(result.error?.message, 'Course slope rating must be between 55 and 155');
    assert.equal(await Trip.countDocuments({ name }), 0);
  }

  for (const slope of [55, 113, 155]) {
    const result = await user(ADD_TRIP, {
      input: {
        name: `Valid slope ${slope}`,
        date: '2026-11-21',
        course: { name: `Slope ${slope} Links`, slope },
      },
    });
    assert.equal(result.error, null, `slope ${slope} should be accepted`);
  }
});

test('the same provider course cannot be added twice to one trip', async () => {
  const created = await user(ADD_TRIP, {
    input: {
      name: 'Duplicate course trip',
      date: '2026-11-22',
      course: {
        name: 'Canonical Links',
        source: 'google',
        providerId: 'same-google-place',
      },
    },
  });
  const tripId = created.data.addTrip._id;

  const duplicate = await user(ADD_COURSE, {
    tripId,
    course: {
      name: 'Canonical Links renamed by provider',
      source: 'google',
      providerId: 'same-google-place',
    },
  });

  assert.equal(duplicate.error?.message, 'That course is already on this trip');
  const stored = await Trip.findById(tripId).lean();
  assert.equal(stored.courses.length, 1);
});

test('concurrent double-adds of one provider course persist only one copy', async () => {
  const created = await user(ADD_TRIP, {
    input: {
      name: 'Concurrent duplicate course trip',
      date: '2026-11-23',
      course: { name: 'First Links', source: 'google', providerId: 'first-place' },
    },
  });
  const tripId = created.data.addTrip._id;
  const course = {
    name: 'Second Links',
    source: 'google',
    providerId: 'second-place-once',
  };

  const results = await Promise.all([
    user(ADD_COURSE, { tripId, course }),
    user(ADD_COURSE, { tripId, course }),
  ]);

  assert.equal(results.filter((result) => !result.error).length, 1);
  assert.equal(
    results.filter((result) => result.error?.message === 'That course is already on this trip').length,
    1
  );

  const stored = await Trip.findById(tripId).lean();
  assert.equal(
    stored.courses.filter(
      (entry) => entry.source === 'google' && entry.providerId === 'second-place-once'
    ).length,
    1
  );
});

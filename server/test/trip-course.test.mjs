// server/test/trip-course.test.mjs — canonical selected-course persistence with legacy compatibility

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { dist, startTestDb, startGraphQL, LOGIN } from './helpers.mjs';

let db, api, Trip, user;

const COURSE_FIELDS = `
  _id
  name
  source
  providerId
  address
  location { lat lng }
  rating
  golfCourseApiId
  courseRating
  slope
`;

const ADD_TRIP = `mutation($input: TripInput!) {
  addTrip(input: $input) {
    _id
    name
    date
    courses { ${COURSE_FIELDS} }
  }
}`;

const TRIP = `query($id: ID!) {
  trip(id: $id) {
    _id
    name
    date
    courses { ${COURSE_FIELDS} }
  }
}`;

before(async () => {
  db = await startTestDb('ff_trip_course');
  const { default: Profile } = await dist('models/Profile.js');
  ({ default: Trip } = await dist('models/Trip.js'));
  await Promise.all([Profile.init(), Trip.init()]);
  await Profile.create({
    name: 'CourseOwner',
    email: 'course-owner@example.com',
    password: 'goodpass1',
  });
  api = await startGraphQL();
  const login = await api.gql(LOGIN, {
    email: 'course-owner@example.com',
    password: 'goodpass1',
  });
  user = (query, variables) => api.gql(query, variables, { token: login.data.login.token });
});

after(async () => {
  await api?.stop();
  await db?.stop();
});

test('structured TripCourse identity and metadata persist end to end', async () => {
  const input = {
    name: 'Arcadia weekend',
    date: '2026-11-08',
    course: {
      name: 'Arcadia Bluffs Golf Club',
      source: 'google',
      providerId: 'ChIJ-fairway-arcadia',
      address: '14710 Northwood Hwy, Arcadia, MI 49613',
      location: { lat: 44.508, lng: -86.242 },
      rating: 4.8,
      golfCourseApiId: '12345',
      courseRating: 74.2,
      slope: 142,
    },
  };

  const created = await user(ADD_TRIP, { input });
  assert.equal(created.error, null);
  const course = created.data.addTrip.courses[0];
  assert.ok(course._id);
  assert.equal(course.name, input.course.name);
  assert.equal(course.source, input.course.source);
  assert.equal(course.providerId, input.course.providerId);
  assert.equal(course.address, input.course.address);
  assert.equal(course.location.lat, input.course.location.lat);
  assert.equal(course.location.lng, input.course.location.lng);
  assert.equal(course.rating, input.course.rating);
  assert.equal(course.golfCourseApiId, input.course.golfCourseApiId);
  assert.equal(course.courseRating, input.course.courseRating);
  assert.equal(course.slope, input.course.slope);

  const stored = await Trip.findById(created.data.addTrip._id).lean();
  assert.equal(stored.courses[0].source, 'google');
  assert.equal(stored.courses[0].providerId, 'ChIJ-fairway-arcadia');
  assert.equal(stored.courses[0].address, input.course.address);
  assert.deepEqual(stored.courses[0].location, input.course.location);
  assert.equal(stored.courses[0].rating, 4.8);
  assert.equal(stored.courses[0].golfCourseApiId, '12345');
  assert.equal(stored.courses[0].courseRating, 74.2);
  assert.equal(stored.courses[0].slope, 142);
});

test('structured TripCourse accepts name-only partial provider data', async () => {
  const created = await user(ADD_TRIP, {
    input: {
      name: 'Unknown provider trip',
      date: '2026-11-09',
      course: { name: 'Local Links' },
    },
  });

  assert.equal(created.error, null);
  assert.equal(created.data.addTrip.courses[0].name, 'Local Links');
  assert.equal(created.data.addTrip.courses[0].source, null);
  assert.equal(created.data.addTrip.courses[0].providerId, null);
});

test('legacy courseName-only TripInput remains compatible', async () => {
  const created = await user(ADD_TRIP, {
    input: {
      name: 'Legacy trip',
      date: '2026-11-10',
      courseName: 'Legacy Links',
    },
  });

  assert.equal(created.error, null);
  const fetched = await user(TRIP, { id: created.data.addTrip._id });
  assert.equal(fetched.error, null);
  assert.equal(fetched.data.trip.courses[0].name, 'Legacy Links');
  assert.equal(fetched.data.trip.courses[0].source, null);
  assert.equal(fetched.data.trip.courses[0].providerId, null);
});

test('TripInput rejects creation when neither course nor courseName is provided', async () => {
  const result = await user(ADD_TRIP, {
    input: {
      name: 'No course trip',
      date: '2026-11-11',
    },
  });

  assert.equal(result.error?.message, 'A course is required');
  assert.equal(await Trip.countDocuments({ name: 'No course trip' }), 0);
});

test('structured TripCourse rejects impossible coordinates and display ratings', async () => {
  const cases = [
    [{ location: { lat: 91, lng: -86 } }, 'Course latitude must be between -90 and 90'],
    [{ location: { lat: 44, lng: -181 } }, 'Course longitude must be between -180 and 180'],
    [{ rating: -0.1 }, 'Course display rating must be between 0 and 5'],
    [{ rating: 5.1 }, 'Course display rating must be between 0 and 5'],
  ];

  for (const [index, [coursePatch, message]] of cases.entries()) {
    const name = `Invalid numeric course ${index}`;
    const result = await user(ADD_TRIP, {
      input: {
        name,
        date: '2026-11-12',
        course: { name: 'Bad Data Links', ...coursePatch },
      },
    });

    assert.equal(result.error?.message, message);
    assert.equal(await Trip.countDocuments({ name }), 0);
  }
});

test('structured TripCourse caps optional provider metadata before persistence', async () => {
  const cases = [
    [{ source: 's'.repeat(41) }, 'Course source must be 1 to 40 characters'],
    [{ providerId: 'p'.repeat(201) }, 'Course provider ID must be 1 to 200 characters'],
    [{ address: 'a'.repeat(301) }, 'Course address must be 1 to 300 characters'],
    [{ golfCourseApiId: 'g'.repeat(101) }, 'Golf course API ID must be 1 to 100 characters'],
  ];

  for (const [index, [coursePatch, message]] of cases.entries()) {
    const name = `Invalid text course ${index}`;
    const result = await user(ADD_TRIP, {
      input: {
        name,
        date: '2026-11-13',
        course: { name: 'Oversized Links', ...coursePatch },
      },
    });

    assert.equal(result.error?.message, message);
    assert.equal(await Trip.countDocuments({ name }), 0);
  }
});

test('TripInput requires a real YYYY-MM-DD calendar date for new trips', async () => {
  const invalidDates = ['not-a-date', '2026-02-30', '2026-13-01', '26-11-14'];

  for (const [index, date] of invalidDates.entries()) {
    const name = `Invalid date trip ${index}`;
    const result = await user(ADD_TRIP, {
      input: {
        name,
        date,
        course: { name: 'Date Check Links' },
      },
    });

    assert.equal(result.error?.message, 'Trip date must be a valid YYYY-MM-DD date');
    assert.equal(await Trip.countDocuments({ name }), 0);
  }

  const leapDay = await user(ADD_TRIP, {
    input: {
      name: 'Valid leap day trip',
      date: '2028-02-29',
      course: { name: 'Leap Links' },
    },
  });
  assert.equal(leapDay.error, null);
  assert.equal(leapDay.data.addTrip.date, '2028-02-29');
});

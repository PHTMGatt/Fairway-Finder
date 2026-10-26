// server/test/db-trip-data-integrity.test.mjs — embedded trip/course integrity without writes

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

const { analyzeTripDataIntegrity } = await dist('utils/dbIntegrity.js');
const id = (value) => ({ toString: () => value });

test('trip data report flags empty trips, bad dates, duplicate courses, and bad provider metadata', () => {
  const trips = [
    {
      _id: id('good'),
      date: '2026-11-01',
      courses: [
        {
          name: 'Good Links',
          source: 'google',
          providerId: 'good-place',
          location: { lat: 44, lng: -85 },
          rating: 4.6,
          slope: 113,
        },
      ],
    },
    { _id: id('empty'), date: '2026-11-02', courses: [] },
    {
      _id: id('bad-date'),
      date: '2026-02-30',
      courses: [{ name: 'Date Links' }],
    },
    {
      _id: id('duplicate-provider'),
      date: '2026-11-03',
      courses: [
        { name: 'One', source: 'google', providerId: 'same-place' },
        { name: 'Renamed One', source: 'google', providerId: 'same-place' },
      ],
    },
    {
      _id: id('duplicate-legacy'),
      date: '2026-11-04',
      courses: [{ name: 'Legacy Links' }, { name: ' legacy links ' }],
    },
    {
      _id: id('bad-location'),
      date: '2026-11-05',
      courses: [{ name: 'Location Links', location: { lat: 91, lng: -85 } }],
    },
    {
      _id: id('bad-rating'),
      date: '2026-11-06',
      courses: [{ name: 'Rating Links', rating: 5.5 }],
    },
    {
      _id: id('bad-slope'),
      date: '2026-11-07',
      courses: [{ name: 'Slope Links', slope: 200 }],
    },
  ];

  assert.deepEqual(analyzeTripDataIntegrity(trips), {
    trips: 8,
    tripsWithoutCourses: 1,
    invalidDateTrips: 1,
    duplicateCourseTrips: 2,
    invalidLocationTrips: 1,
    invalidDisplayRatingTrips: 1,
    invalidSlopeTrips: 1,
    tripIdsWithoutCourses: ['empty'],
    invalidDateTripIds: ['bad-date'],
    duplicateCourseTripIds: ['duplicate-legacy', 'duplicate-provider'],
    invalidLocationTripIds: ['bad-location'],
    invalidDisplayRatingTripIds: ['bad-rating'],
    invalidSlopeTripIds: ['bad-slope'],
  });
});

test('trip data report tolerates legacy name-only courses and missing optional metadata', () => {
  const report = analyzeTripDataIntegrity([
    {
      _id: id('legacy'),
      date: '2026-11-08',
      courses: [{ name: 'Legacy Links' }],
    },
  ]);

  assert.equal(report.tripsWithoutCourses, 0);
  assert.equal(report.invalidDateTrips, 0);
  assert.equal(report.duplicateCourseTrips, 0);
  assert.equal(report.invalidLocationTrips, 0);
  assert.equal(report.invalidDisplayRatingTrips, 0);
  assert.equal(report.invalidSlopeTrips, 0);
});

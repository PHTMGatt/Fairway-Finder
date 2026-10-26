// server/test/db-integrity.test.mjs — ownership/reference integrity without a database

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

const { analyzeTripReferenceIntegrity } = await dist('utils/dbIntegrity.js');

const id = (value) => ({ toString: () => value });

test('integrity report identifies dangling refs, orphan trips, and multi-owned trips', () => {
  const profiles = [
    { _id: id('p1'), trips: [id('t1'), id('missing-1'), id('t2')] },
    { _id: id('p2'), trips: [id('t2'), id('missing-2')] },
    { _id: id('p3'), trips: [] },
  ];
  const trips = [{ _id: id('t1') }, { _id: id('t2') }, { _id: id('orphan') }];

  assert.deepEqual(analyzeTripReferenceIntegrity(profiles, trips), {
    profiles: 3,
    trips: 3,
    references: 5,
    resolvedReferences: 3,
    danglingReferences: 2,
    duplicateReferences: 0,
    orphanTrips: 1,
    multiOwnedTrips: 1,
    dangling: [
      { profileId: 'p1', tripId: 'missing-1' },
      { profileId: 'p2', tripId: 'missing-2' },
    ],
    orphanTripIds: ['orphan'],
    multiOwnedTripIds: ['t2'],
  });
});

test('duplicate refs inside one profile are reported but do not count as multiple owners', () => {
  const profiles = [{ _id: id('p1'), trips: [id('t1'), id('t1')] }];
  const trips = [{ _id: id('t1') }];

  const report = analyzeTripReferenceIntegrity(profiles, trips);
  assert.equal(report.references, 2);
  assert.equal(report.resolvedReferences, 2);
  assert.equal(report.duplicateReferences, 1);
  assert.equal(report.multiOwnedTrips, 0);
  assert.deepEqual(report.multiOwnedTripIds, []);
});

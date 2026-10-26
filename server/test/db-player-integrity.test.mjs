// server/test/db-player-integrity.test.mjs — player/score integrity without writes

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

const { analyzeTripPlayerIntegrity } = await dist('utils/dbIntegrity.js');
const id = (value) => ({ toString: () => value });
const fullScores = () => Array.from({ length: 18 }, (_, index) => ({ hole: index + 1, score: 4 }));

test('player integrity flags duplicate names and malformed scorecards', () => {
  const duplicateScores = fullScores();
  duplicateScores[17] = { hole: 17, score: 4 };

  const trips = [
    {
      _id: id('good'),
      players: [{ name: 'Alice', scores: fullScores() }],
    },
    {
      _id: id('duplicate-player'),
      players: [
        { name: 'Bob', scores: fullScores() },
        { name: ' bob ', scores: fullScores() },
      ],
    },
    {
      _id: id('missing-hole'),
      players: [{ name: 'Carol', scores: fullScores().slice(0, 17) }],
    },
    {
      _id: id('duplicate-hole'),
      players: [{ name: 'Dan', scores: duplicateScores }],
    },
    {
      _id: id('bad-hole'),
      players: [{ name: 'Eve', scores: [{ hole: 19, score: 4 }] }],
    },
    {
      _id: id('bad-score'),
      players: [{ name: 'Frank', scores: [{ hole: 1, score: 31 }] }],
    },
  ];

  assert.deepEqual(analyzeTripPlayerIntegrity(trips), {
    trips: 6,
    duplicatePlayerTrips: 1,
    malformedScorecardTrips: 4,
    duplicatePlayerTripIds: ['duplicate-player'],
    malformedScorecardTripIds: ['bad-hole', 'bad-score', 'duplicate-hole', 'missing-hole'],
  });
});

test('player integrity tolerates trips without players', () => {
  assert.deepEqual(analyzeTripPlayerIntegrity([{ _id: id('empty'), players: [] }]), {
    trips: 1,
    duplicatePlayerTrips: 0,
    malformedScorecardTrips: 0,
    duplicatePlayerTripIds: [],
    malformedScorecardTripIds: [],
  });
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

const { createNominatimGeocoder } = await dist('services/nominatim.js');

const response = (body) => ({
  ok: true,
  json: async () => body,
});

test('Nominatim geocoder caches successful lookups by normalized query', async () => {
  let fetchCalls = 0;
  const geocode = createNominatimGeocoder({
    fetchImpl: async () => {
      fetchCalls += 1;
      return response([{ lat: '42.9634', lon: '-85.6681' }]);
    },
    sleepImpl: async () => {},
    now: () => 1_000,
    requestSpacingMs: 0,
    cacheTtlMs: 60_000,
  });

  assert.deepEqual(await geocode(' Grand Rapids, MI '), {
    lat: 42.9634,
    lng: -85.6681,
  });
  assert.deepEqual(await geocode('grand rapids, mi'), {
    lat: 42.9634,
    lng: -85.6681,
  });
  assert.equal(fetchCalls, 1);
});

test('Nominatim geocoder deduplicates concurrent requests for the same query', async () => {
  let fetchCalls = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });

  const geocode = createNominatimGeocoder({
    fetchImpl: async () => {
      fetchCalls += 1;
      await gate;
      return response([{ lat: '44.7631', lon: '-85.6206' }]);
    },
    sleepImpl: async () => {},
    now: () => 1_000,
    requestSpacingMs: 0,
    cacheTtlMs: 60_000,
  });

  const first = geocode('Traverse City, MI');
  const second = geocode('Traverse City, MI');
  release();

  assert.deepEqual(await first, { lat: 44.7631, lng: -85.6206 });
  assert.deepEqual(await second, { lat: 44.7631, lng: -85.6206 });
  assert.equal(fetchCalls, 1);
});

test('Nominatim geocoder spaces distinct public requests', async () => {
  let now = 10_000;
  const sleeps = [];
  const fetchQueries = [];

  const geocode = createNominatimGeocoder({
    fetchImpl: async (url) => {
      fetchQueries.push(new URL(url).searchParams.get('q'));
      return response([{ lat: '42', lon: '-84' }]);
    },
    sleepImpl: async (milliseconds) => {
      sleeps.push(milliseconds);
      now += milliseconds;
    },
    now: () => now,
    requestSpacingMs: 1_000,
    cacheTtlMs: 60_000,
  });

  await geocode('Ann Arbor, MI');
  await geocode('Lansing, MI');

  assert.deepEqual(fetchQueries, ['Ann Arbor, MI', 'Lansing, MI']);
  assert.deepEqual(sleeps, [1_000]);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

const weatherLocation = await dist('utils/weatherLocation.js');
const { parseWeatherRequest } = weatherLocation;

test('weather request accepts persisted course coordinates', () => {
  assert.deepEqual(
    parseWeatherRequest({ lat: '44.508', lng: '-86.242', name: 'Arcadia Bluffs' }),
    {
      kind: 'coordinates',
      latitude: 44.508,
      longitude: -86.242,
      name: 'Arcadia Bluffs',
    }
  );
});

test('weather request keeps city lookup backwards compatible', () => {
  assert.deepEqual(parseWeatherRequest({ city: 'Detroit, MI' }), {
    kind: 'city',
    city: 'Detroit, MI',
  });
});

test('weather request rejects incomplete or invalid coordinates', () => {
  assert.deepEqual(parseWeatherRequest({ lat: '44.5' }), {
    kind: 'invalid',
    error: 'Both lat and lng are required when using coordinates',
  });
  assert.deepEqual(parseWeatherRequest({ lat: '91', lng: '-83' }), {
    kind: 'invalid',
    error: 'Weather coordinates are out of range',
  });
});

test('weather request requires either a city or coordinates', () => {
  assert.deepEqual(parseWeatherRequest({}), {
    kind: 'invalid',
    error: 'Provide city or lat/lng for weather',
  });
});

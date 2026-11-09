import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dist } from './helpers.mjs';

const { tripForecastForDate } = await dist('utils/weatherForecast.js');

const daily = {
  time: ['2026-10-25', '2026-10-26', '2026-10-27'],
  weather_code: [1, 61, 3],
  temperature_2m_max: [58, 55, 52],
  temperature_2m_min: [41, 39, 37],
  precipitation_sum: [0, 4.2, 0.3],
  wind_speed_10m_max: [11, 18, 9],
};

test('extracts the saved trip date from Open-Meteo daily arrays', () => {
  assert.deepEqual(tripForecastForDate('2026-10-26', daily), {
    date: '2026-10-26',
    weatherCode: 61,
    tempMax: 55,
    tempMin: 39,
    precipitation: 4.2,
    windSpeed: 18,
  });
});

test('returns null when the trip date is outside the provider forecast window', () => {
  assert.equal(tripForecastForDate('2026-11-30', daily), null);
});

test('rejects malformed trip dates and incomplete daily payloads', () => {
  assert.equal(tripForecastForDate('10/26/2026', daily), null);
  assert.equal(
    tripForecastForDate('2026-10-26', { ...daily, temperature_2m_max: [] }),
    null
  );
});

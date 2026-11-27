import { describe, expect, it } from 'vitest';
import { WeatherData } from '../../utils/weatherApi';
import { toConditions } from './weatherConditions';

const body: WeatherData = {
  name: 'Austin',
  main: { temp: 71.4, humidity: 40 },
  weather: [{ description: 'light rain', main: 'Rain', icon: '10d' }],
  wind: { speed: 5 },
  rain: { '1h': 1.2 },
};

describe('toConditions', () => {
  it('flattens the provider body', () => {
    expect(toConditions(body)).toEqual({
      tempF: 71.4, humidity: 40, precipitation: 1.2, windSpeed: 5,
      iconCode: '10d', main: 'Rain', description: 'light rain', name: 'Austin',
    });
  });

  it('is null when there is no condition or temperature', () => {
    expect(toConditions({ ...body, weather: [] })).toBeNull();
    expect(toConditions({} as WeatherData)).toBeNull();
  });
});

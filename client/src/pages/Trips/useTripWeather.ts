// client/src/pages/Trips/useTripWeather.ts
// Weather for a trip: loads from the saved course coordinates, or from a city the golfer types.
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { PersistedTripCourse, weatherParamsForCourse } from './tripDetailsCourse';

export interface TripForecastData {
  date: string;
  weather: { description: string }[];
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

export interface TripWeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string }[];
  wind: { speed: number };
  rain?: { '1h': number };
  snow?: { '1h': number };
  forecastStatus?: 'available' | 'outside-window';
  forecast?: TripForecastData | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const useTripWeather = (course?: PersistedTripCourse | null, tripDate?: string | null) => {
  const [city, setCity] = useState('');
  const [data, setData] = useState<TripWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [missingCity, setMissingCity] = useState(false);

  const load = useCallback(async (params: URLSearchParams) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      setData(await response.json());
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const params = weatherParamsForCourse(course, tripDate);
    if (params) void load(params);
  }, [course, load, tripDate]);

  const submitCity = (event: FormEvent) => {
    event.preventDefault();
    const trimmedCity = city.trim();

    if (!trimmedCity) {
      setMissingCity(true);
      return;
    }

    setMissingCity(false);
    const params = new URLSearchParams({ city: trimmedCity });
    if (typeof tripDate === 'string' && ISO_DATE.test(tripDate)) params.set('date', tripDate);
    void load(params);
  };

  return {
    data,
    loading,
    error,
    city,
    setCity,
    submitCity,
    missingCity,
    dismissMissingCity: () => setMissingCity(false),
  };
};

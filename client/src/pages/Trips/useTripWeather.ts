// client/src/pages/Trips/useTripWeather.ts
// Weather for a trip: loads from the saved course coordinates, or from a city the golfer types.
import { FormEvent, useEffect, useState } from 'react';
import { useWeather } from '../../utils/useWeather';
import { PersistedTripCourse, weatherParamsForCourse } from './tripDetailsCourse';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const useTripWeather = (course?: PersistedTripCourse | null, tripDate?: string | null) => {
  const [city, setCity] = useState('');
  const { data, loading, error, load } = useWeather();
  const [missingCity, setMissingCity] = useState(false);

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

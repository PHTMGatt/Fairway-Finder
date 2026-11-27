// client/src/utils/useWeather.ts
// Loading and error state around fetchWeather.
import { useCallback, useState } from 'react';
import { WeatherData, fetchWeather } from './weatherApi';

export const useWeather = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (params: URLSearchParams | Record<string, string>) => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchWeather(params));
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Drop the current result, optionally showing a message instead. */
  const reset = useCallback((message = '') => {
    setData(null);
    setError(message);
  }, []);

  return { data, loading, error, load, reset };
};

// client/src/utils/weatherApi.ts
// The /api/weather contract, shared by the Weather page and the trip weather panel.

export interface TripForecastData {
  date: string;
  weather: { description: string }[];
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

export interface WeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string; main?: string; icon?: string }[];
  wind: { speed: number };
  rain?: { '1h': number };
  snow?: { '1h': number };
  forecastStatus?: 'available' | 'outside-window';
  forecast?: TripForecastData | null;
}

export const fetchWeather = async (
  params: URLSearchParams | Record<string, string>
): Promise<WeatherData> => {
  const response = await fetch(`/api/weather?${new URLSearchParams(params).toString()}`);
  if (!response.ok) throw new Error('Failed to fetch weather');
  return response.json();
};

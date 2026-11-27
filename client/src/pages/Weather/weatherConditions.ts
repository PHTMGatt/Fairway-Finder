// client/src/pages/Weather/weatherConditions.ts
import { WeatherData } from '../../utils/weatherApi';

export interface Conditions {
  tempF: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  iconCode: string;
  main: string;
  description: string;
  name: string;
}

/** What the Weather page shows, or null when the provider sent an incomplete body. */
export const toConditions = (data: WeatherData): Conditions | null => {
  const now = data.weather?.[0];
  if (!now || data.main?.temp == null) return null;

  return {
    tempF: data.main.temp,
    humidity: data.main.humidity,
    precipitation: data.rain?.['1h'] ?? data.snow?.['1h'] ?? 0,
    windSpeed: data.wind?.speed ?? 0,
    iconCode: now.icon ?? '',
    main: now.main ?? '',
    description: now.description,
    name: data.name,
  };
};

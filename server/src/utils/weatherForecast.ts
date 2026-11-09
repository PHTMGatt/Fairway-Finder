export interface TripForecast {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

interface DailyForecastPayload {
  time?: unknown;
  weather_code?: unknown;
  temperature_2m_max?: unknown;
  temperature_2m_min?: unknown;
  precipitation_sum?: unknown;
  wind_speed_10m_max?: unknown;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const numericAt = (value: unknown, index: number): number | null => {
  if (!Array.isArray(value)) return null;
  const number = Number(value[index]);
  return Number.isFinite(number) ? number : null;
};

export const normalizedForecastDate = (value?: string | null): string | null => {
  const date = value?.trim() || '';
  return ISO_DATE.test(date) ? date : null;
};

export const tripForecastForDate = (
  dateValue: string | undefined,
  daily: DailyForecastPayload | null | undefined
): TripForecast | null => {
  const date = normalizedForecastDate(dateValue);
  if (!date || !Array.isArray(daily?.time)) return null;

  const index = daily.time.indexOf(date);
  if (index < 0) return null;

  const weatherCode = numericAt(daily.weather_code, index);
  const tempMax = numericAt(daily.temperature_2m_max, index);
  const tempMin = numericAt(daily.temperature_2m_min, index);
  const precipitation = numericAt(daily.precipitation_sum, index);
  const windSpeed = numericAt(daily.wind_speed_10m_max, index);

  if (
    weatherCode === null ||
    tempMax === null ||
    tempMin === null ||
    precipitation === null ||
    windSpeed === null
  ) {
    return null;
  }

  return {
    date,
    weatherCode,
    tempMax,
    tempMin,
    precipitation,
    windSpeed,
  };
};

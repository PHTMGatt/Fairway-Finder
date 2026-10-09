// server/src/routes/weatherRoutes.ts

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country_code?: string;
}

interface WeatherCondition {
  main: string;
  description: string;
  icon: string;
}

const weatherCondition = (code: number, isDay: boolean): WeatherCondition => {
  const suffix = isDay ? 'd' : 'n';

  if (code === 0) return { main: 'Clear', description: 'clear sky', icon: `01${suffix}` };
  if (code === 1) return { main: 'Clear', description: 'mainly clear', icon: `02${suffix}` };
  if (code === 2) return { main: 'Clouds', description: 'partly cloudy', icon: `03${suffix}` };
  if (code === 3) return { main: 'Clouds', description: 'overcast', icon: `04${suffix}` };
  if ([45, 48].includes(code)) return { main: 'Fog', description: 'foggy', icon: `50${suffix}` };
  if ([51, 53, 55, 56, 57].includes(code)) return { main: 'Drizzle', description: 'drizzle', icon: `09${suffix}` };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { main: 'Rain', description: 'rain', icon: `10${suffix}` };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { main: 'Snow', description: 'snow', icon: `13${suffix}` };
  if ([95, 96, 99].includes(code)) return { main: 'Thunderstorm', description: 'thunderstorms', icon: `11${suffix}` };

  return { main: 'Clouds', description: 'variable conditions', icon: `03${suffix}` };
};

const geocodeCity = async (city: string): Promise<GeocodingResult | null> => {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', city);
  url.searchParams.set('count', '1');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Geocoding request failed with status ${response.status}`);
  }

  const payload: any = await response.json();
  return payload.results?.[0] ?? null;
};

/**
 * GET /api/weather?city=Detroit
 *
 * Uses Open-Meteo geocoding + current weather. The response intentionally
 * matches the shape the existing React pages expect, so the UI does not need
 * provider-specific logic or an API key.
 */
router.get(
  '/weather',
  async (
    req: Request<object, any, object, { city?: string }>,
    res: Response
  ) => {
    const city = req.query.city?.trim();
    if (!city) {
      return res.status(400).json({ error: 'Query parameter "city" is required' });
    }

    try {
      const location = await geocodeCity(city);
      if (!location) {
        return res.status(404).json({ error: 'City not found' });
      }

      const url = new URL('https://api.open-meteo.com/v1/forecast');
      url.searchParams.set('latitude', String(location.latitude));
      url.searchParams.set('longitude', String(location.longitude));
      url.searchParams.set(
        'current',
        'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,is_day'
      );
      url.searchParams.set('temperature_unit', 'fahrenheit');
      url.searchParams.set('wind_speed_unit', 'mph');
      url.searchParams.set('precipitation_unit', 'mm');
      url.searchParams.set('timezone', 'auto');

      const weatherResponse = await fetch(url.toString());
      if (!weatherResponse.ok) {
        throw new Error(`Weather request failed with status ${weatherResponse.status}`);
      }

      const payload: any = await weatherResponse.json();
      const current = payload.current;
      if (!current) {
        throw new Error('Weather provider returned no current conditions');
      }

      const condition = weatherCondition(
        Number(current.weather_code),
        Number(current.is_day) === 1
      );
      const precipitation = Number(current.precipitation ?? 0);

      return res.json({
        name: location.name,
        main: {
          temp: Number(current.temperature_2m),
          humidity: Number(current.relative_humidity_2m),
        },
        weather: [condition],
        wind: {
          speed: Number(current.wind_speed_10m),
        },
        ...(condition.main === 'Snow'
          ? { snow: { '1h': precipitation } }
          : { rain: { '1h': precipitation } }),
      });
    } catch (err) {
      console.error('Weather proxy failed:', err instanceof Error ? err.message : err);
      return res.status(502).json({ error: 'Unable to load weather right now' });
    }
  }
);

export default router;

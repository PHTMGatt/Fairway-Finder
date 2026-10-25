export interface WeatherRequestQuery {
  city?: string;
  lat?: string;
  lng?: string;
  name?: string;
}

export type ParsedWeatherRequest =
  | { kind: 'coordinates'; latitude: number; longitude: number; name: string }
  | { kind: 'city'; city: string }
  | { kind: 'invalid'; error: string };

const present = (value?: string) => typeof value === 'string' && value.trim().length > 0;

export const parseWeatherRequest = (
  query: WeatherRequestQuery
): ParsedWeatherRequest => {
  const hasLat = present(query.lat);
  const hasLng = present(query.lng);

  if (hasLat || hasLng) {
    if (!hasLat || !hasLng) {
      return {
        kind: 'invalid',
        error: 'Both lat and lng are required when using coordinates',
      };
    }

    const latitude = Number(query.lat);
    const longitude = Number(query.lng);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return { kind: 'invalid', error: 'Weather coordinates are out of range' };
    }

    return {
      kind: 'coordinates',
      latitude,
      longitude,
      name: query.name?.trim() || 'Selected location',
    };
  }

  const city = query.city?.trim();
  if (city) return { kind: 'city', city };

  return { kind: 'invalid', error: 'Provide city or lat/lng for weather' };
};

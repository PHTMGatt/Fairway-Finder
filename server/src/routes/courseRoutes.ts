// server/src/routes/courseRoutes.ts

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

const GOOGLE_API_KEY = process.env.PLACES_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error('Missing PLACES_API_KEY in server environment');
}

interface CourseQuery {
  city?: string;
  limit?: string;
  maxDistance?: string;
}

export interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
  location: { lat: number; lng: number } | null;
}

const geocodeCity = async (city: string) => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', `${city}, USA`);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload: any = await response.json();
  return payload.results?.[0]?.geometry?.location ?? null;
};

const searchPlacesNew = async (
  city: string,
  limit: number,
  maxDistanceMiles?: number
): Promise<Course[] | null> => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': GOOGLE_API_KEY,
    'X-Goog-FieldMask':
      'places.id,places.displayName,places.formattedAddress,places.rating,places.location',
  };

  let body: Record<string, unknown> = {
    textQuery: `golf courses in ${city}, USA`,
    includedType: 'golf_course',
    strictTypeFiltering: true,
    regionCode: 'US',
  };

  if (maxDistanceMiles && maxDistanceMiles > 0) {
    const location = await geocodeCity(city);
    if (location) {
      body = {
        ...body,
        locationBias: {
          circle: {
            center: {
              latitude: location.lat,
              longitude: location.lng,
            },
            radius: Math.min(50000, Math.max(1000, maxDistanceMiles * 1609.34)),
          },
        },
      };
    }
  }

  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    return null;
  }

  const payload: any = await response.json();
  const places = Array.isArray(payload.places) ? payload.places : [];

  return places
    .map((place: any): Course => ({
      name: place.displayName?.text || 'Unnamed golf course',
      address: place.formattedAddress || 'Address N/A',
      rating: typeof place.rating === 'number' ? place.rating : null,
      place_id: place.id || '',
      location:
        typeof place.location?.latitude === 'number' &&
        typeof place.location?.longitude === 'number'
          ? {
              lat: place.location.latitude,
              lng: place.location.longitude,
            }
          : null,
    }))
    .filter((course: Course) => course.place_id)
    .sort((a: Course, b: Course) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
};

const searchPlacesLegacy = async (
  city: string,
  limit: number,
  maxDistanceMiles?: number
): Promise<Course[]> => {
  let places: any[] = [];

  if (maxDistanceMiles && maxDistanceMiles > 0) {
    const location = await geocodeCity(city);
    if (!location) throw new Error('Geocoding failed for city');

    const nearbyUrl = new URL(
      'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    );
    nearbyUrl.searchParams.set('location', `${location.lat},${location.lng}`);
    nearbyUrl.searchParams.set(
      'radius',
      String(Math.min(50000, Math.max(1000, maxDistanceMiles * 1609.34)))
    );
    nearbyUrl.searchParams.set('type', 'golf_course');
    nearbyUrl.searchParams.set('key', GOOGLE_API_KEY);

    const response = await fetch(nearbyUrl.toString());
    const payload: any = await response.json();
    places = Array.isArray(payload.results) ? payload.results : [];
  } else {
    const textUrl = new URL(
      'https://maps.googleapis.com/maps/api/place/textsearch/json'
    );
    textUrl.searchParams.set('query', `golf courses in ${city}, USA`);
    textUrl.searchParams.set('region', 'us');
    textUrl.searchParams.set('key', GOOGLE_API_KEY);

    const response = await fetch(textUrl.toString());
    const payload: any = await response.json();
    places = Array.isArray(payload.results) ? payload.results : [];
  }

  return places
    .map((place: any): Course => ({
      name: place.name || 'Unnamed golf course',
      address: place.formatted_address || place.vicinity || 'Address N/A',
      rating: typeof place.rating === 'number' ? place.rating : null,
      place_id: place.place_id || '',
      location: place.geometry?.location ?? null,
    }))
    .filter((course: Course) => course.place_id)
    .sort((a: Course, b: Course) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, limit);
};

router.get<object, Course[], object, CourseQuery>(
  '/courses',
  async (req: Request<object, Course[], object, CourseQuery>, res: Response) => {
    const city = req.query.city?.trim() || '';
    if (!city) {
      return res
        .status(400)
        .json({ error: 'The "city" query parameter is required.' } as any);
    }

    const limit = Math.max(1, Math.min(20, Number(req.query.limit) || 10));
    const miles = Number(req.query.maxDistance);
    const maxDistanceMiles = Number.isFinite(miles) && miles > 0 ? miles : undefined;

    try {
      const modernResults = await searchPlacesNew(city, limit, maxDistanceMiles);
      if (modernResults) {
        return res.json(modernResults);
      }

      console.warn('Places API (New) unavailable; using legacy fallback.');
      const legacyResults = await searchPlacesLegacy(city, limit, maxDistanceMiles);
      return res.json(legacyResults);
    } catch (error) {
      console.error(
        'Course discovery failed:',
        error instanceof Error ? error.message : error
      );
      return res
        .status(502)
        .json({ error: 'Unable to load golf courses right now' } as any);
    }
  }
);

export default router;

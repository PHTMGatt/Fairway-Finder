// server/src/routes/courseRoutes.ts

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

const GOOGLE_API_KEY = process.env.PLACES_API_KEY;
const GOLF_API_KEY = process.env.GOLF_API_KEY;
const GOLF_API_BASE = 'https://api.golfcourseapi.com/v1';

if (!GOOGLE_API_KEY) {
  throw new Error('Missing PLACES_API_KEY in server environment');
}
if (!GOLF_API_KEY) {
  throw new Error('Missing GOLF_API_KEY in server environment');
}

interface CourseQuery {
  city?: string;
  limit?: string;
  maxDistance?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

export interface Course {
  name: string;
  address: string;
  rating: number | null;
  place_id: string;
  location: Coordinates | null;
}

const geocodeGoogle = async (query: string): Promise<Coordinates | null> => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload: any = await response.json();
  if (payload.status !== 'OK') return null;

  const location = payload.results?.[0]?.geometry?.location;
  return Number.isFinite(location?.lat) && Number.isFinite(location?.lng)
    ? { lat: location.lat, lng: location.lng }
    : null;
};

const geocodeOpenStreetMap = async (
  query: string
): Promise<Coordinates | null> => {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Fairway-Finder/1.0',
      Accept: 'application/json',
    },
  });
  if (!response.ok) return null;

  const payload: any = await response.json();
  const first = Array.isArray(payload) ? payload[0] : null;
  const lat = Number(first?.lat);
  const lng = Number(first?.lon);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const geocodeCity = async (city: string): Promise<Coordinates | null> =>
  (await geocodeGoogle(`${city}, USA`)) ??
  (await geocodeOpenStreetMap(`${city}, USA`));

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
    pageSize: Math.min(20, limit),
  };

  const location = await geocodeCity(city);
  if (location) {
    const radius = maxDistanceMiles && maxDistanceMiles > 0
      ? Math.min(50000, Math.max(2000, maxDistanceMiles * 1609.34))
      : 40000;

    body = {
      ...body,
      locationBias: {
        circle: {
          center: {
            latitude: location.lat,
            longitude: location.lng,
          },
          radius,
        },
      },
    };
  }

  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) return null;

  const payload: any = await response.json();
  const places = Array.isArray(payload.places) ? payload.places : [];

  const courses = places
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

  return courses.length ? courses : null;
};

const searchPlacesLegacy = async (
  city: string,
  limit: number,
  maxDistanceMiles?: number
): Promise<Course[]> => {
  const location = await geocodeCity(city);
  if (!location) return [];

  const radius = maxDistanceMiles && maxDistanceMiles > 0
    ? Math.min(50000, Math.max(2000, maxDistanceMiles * 1609.34))
    : 40000;

  const nearbyUrl = new URL(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
  );
  nearbyUrl.searchParams.set('location', `${location.lat},${location.lng}`);
  nearbyUrl.searchParams.set('radius', String(radius));
  nearbyUrl.searchParams.set('type', 'golf_course');
  nearbyUrl.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(nearbyUrl.toString());
  if (!response.ok) return [];

  const payload: any = await response.json();
  if (payload.status !== 'OK' || !Array.isArray(payload.results)) return [];

  return payload.results
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

const buildOsmAddress = (tags: Record<string, string> = {}) => {
  const street = [tags['addr:housenumber'], tags['addr:street']]
    .filter(Boolean)
    .join(' ');
  const city = tags['addr:city'] || tags['addr:place'];
  const state = tags['addr:state'];
  const postcode = tags['addr:postcode'];

  return [street, city, state, postcode]
    .filter(Boolean)
    .join(', ') || 'Address N/A';
};

const searchOpenStreetMap = async (
  city: string,
  limit: number,
  maxDistanceMiles?: number
): Promise<Course[]> => {
  const center = await geocodeOpenStreetMap(`${city}, USA`);
  if (!center) return [];

  const radius = Math.round(
    Math.min(
      50000,
      Math.max(
        5000,
        maxDistanceMiles && maxDistanceMiles > 0
          ? maxDistanceMiles * 1609.34
          : 40000
      )
    )
  );

  const query = `[out:json][timeout:15];(node["leisure"="golf_course"](around:${radius},${center.lat},${center.lng});way["leisure"="golf_course"](around:${radius},${center.lat},${center.lng});relation["leisure"="golf_course"](around:${radius},${center.lat},${center.lng}););out center tags ${Math.max(20, limit * 3)};`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Fairway-Finder/1.0',
    },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!response.ok) return [];

  const payload: any = await response.json();
  const elements = Array.isArray(payload.elements) ? payload.elements : [];

  return elements
    .map((element: any): Course | null => {
      const lat = Number(element.lat ?? element.center?.lat);
      const lng = Number(element.lon ?? element.center?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      const name = String(element.tags?.name || '').trim();
      if (!name) return null;

      return {
        name,
        address: buildOsmAddress(element.tags || {}),
        rating: null,
        place_id: `osm-${element.type}-${element.id}`,
        location: { lat, lng },
      };
    })
    .filter((course: Course | null): course is Course => course !== null)
    .slice(0, limit);
};

const searchGolfCourseApi = async (
  city: string,
  limit: number
): Promise<Course[]> => {
  const url = new URL(`${GOLF_API_BASE}/search`);
  url.searchParams.set('search_query', city.split(',')[0].trim());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Key ${GOLF_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.warn(`GolfCourseAPI search unavailable: ${response.status}`);
    return [];
  }

  const payload: any = await response.json();
  let courses = Array.isArray(payload.courses) ? payload.courses : [];
  const requestedRegion = city.split(',')[1]?.trim().toUpperCase();

  if (requestedRegion) {
    courses = courses.filter((course: any) => {
      const state = String(course.location?.state || '').trim().toUpperCase();
      return state === requestedRegion || state.startsWith(requestedRegion);
    });
  }

  return courses
    .map((course: any): Course => {
      const clubName = String(course.club_name || '').trim();
      const courseName = String(course.course_name || '').trim();
      const name =
        clubName && courseName && clubName.toLowerCase() !== courseName.toLowerCase()
          ? `${clubName} — ${courseName}`
          : courseName || clubName || 'Unnamed golf course';

      const loc = course.location || {};
      const address =
        loc.address ||
        [loc.city, loc.state, loc.country].filter(Boolean).join(', ') ||
        'Address N/A';

      const lat = Number(loc.latitude);
      const lng = Number(loc.longitude);

      return {
        name,
        address,
        rating: null,
        place_id: course.id ? `golfcourseapi-${course.id}` : '',
        location:
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lng }
            : null,
      };
    })
    .filter((course: Course) => course.place_id)
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
      if (modernResults?.length) return res.json(modernResults);

      console.warn('Places API (New) unavailable or empty; trying legacy Places.');
      const legacyResults = await searchPlacesLegacy(city, limit, maxDistanceMiles);
      if (legacyResults.length) return res.json(legacyResults);

      console.warn('Google Places unavailable or empty; trying OpenStreetMap.');
      const osmResults = await searchOpenStreetMap(city, limit, maxDistanceMiles);
      if (osmResults.length) return res.json(osmResults);

      console.warn('OpenStreetMap course search empty; trying GolfCourseAPI.');
      const golfResults = await searchGolfCourseApi(city, limit);
      return res.json(golfResults);
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

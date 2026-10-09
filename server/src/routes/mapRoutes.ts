// server/src/routes/mapRoutes.ts

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

const GOOGLE_API_KEY = process.env.PLACES_API_KEY;
if (!GOOGLE_API_KEY) {
  throw new Error('Missing PLACES_API_KEY in server environment');
}

interface RouteShape {
  overview_polyline: { points: string };
  summary: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface PlacesSearchArgs {
  type: string;
  city?: string;
  location: Coordinates | null;
  radiusMeters: number;
}

const geocodeGoogle = async (query: string): Promise<Coordinates | null> => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload: any = await response.json();
  if (payload.status !== 'OK') return null;

  return payload.results?.[0]?.geometry?.location ?? null;
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
  const result = Array.isArray(payload) ? payload[0] : null;
  const lat = Number(result?.lat);
  const lng = Number(result?.lon);

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
};

const geocode = async (query: string): Promise<Coordinates | null> =>
  (await geocodeGoogle(query)) ?? (await geocodeOpenStreetMap(query));

const travelMode = (mode: string) => {
  switch (mode.toLowerCase()) {
    case 'walking':
      return 'WALK';
    case 'bicycling':
    case 'cycling':
      return 'BICYCLE';
    case 'transit':
      return 'TRANSIT';
    default:
      return 'DRIVE';
  }
};

const directionsNew = async (
  origin: string,
  destination: string,
  mode: string
): Promise<RouteShape[] | null> => {
  const response = await fetch(
    'https://routes.googleapis.com/directions/v2:computeRoutes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'routes.polyline.encodedPolyline,routes.description',
      },
      body: JSON.stringify({
        origin: { address: origin },
        destination: { address: destination },
        travelMode: travelMode(mode),
        polylineEncoding: 'ENCODED_POLYLINE',
        polylineQuality: 'OVERVIEW',
      }),
    }
  );

  if (!response.ok) return null;

  const payload: any = await response.json();
  if (!Array.isArray(payload.routes) || payload.routes.length === 0) {
    return null;
  }

  const routes = payload.routes
    .map((route: any) => ({
      overview_polyline: {
        points: route.polyline?.encodedPolyline || '',
      },
      summary: route.description || '',
    }))
    .filter((route: RouteShape) => route.overview_polyline.points);

  return routes.length ? routes : null;
};

const directionsLegacy = async (
  origin: string,
  destination: string,
  mode: string
): Promise<RouteShape[] | null> => {
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('mode', mode);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload: any = await response.json();
  if (payload.status !== 'OK' || !Array.isArray(payload.routes)) {
    return null;
  }

  const routes = payload.routes
    .map((route: any) => ({
      overview_polyline: route.overview_polyline || {},
      summary: route.summary || '',
    }))
    .filter((route: RouteShape) => route.overview_polyline?.points);

  return routes.length ? routes : null;
};

const osrmProfile = (mode: string) => {
  switch (mode.toLowerCase()) {
    case 'walking':
      return 'foot';
    case 'bicycling':
    case 'cycling':
      return 'bike';
    default:
      return 'driving';
  }
};

const directionsOpenStreetMap = async (
  origin: string,
  destination: string,
  mode: string
): Promise<RouteShape[] | null> => {
  const [start, end] = await Promise.all([
    geocodeOpenStreetMap(origin),
    geocodeOpenStreetMap(destination),
  ]);

  if (!start || !end) return null;

  const profile = osrmProfile(mode);
  const url = new URL(
    `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}`
  );
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'polyline');
  url.searchParams.set('steps', 'false');

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Fairway-Finder/1.0' },
  });
  if (!response.ok) return null;

  const payload: any = await response.json();
  const encoded = payload.routes?.[0]?.geometry;
  if (payload.code !== 'Ok' || typeof encoded !== 'string' || !encoded) {
    return null;
  }

  return [
    {
      overview_polyline: { points: encoded },
      summary: 'OpenStreetMap route',
    },
  ];
};

router.get(
  '/map/directions',
  async (
    req: Request<
      object,
      { routes: RouteShape[] } | { error: string },
      object,
      { origin?: string; destination?: string; mode?: string }
    >,
    res: Response
  ) => {
    const { origin, destination, mode = 'driving' } = req.query;

    if (!origin?.trim() || !destination?.trim()) {
      return res.status(400).json({
        error: 'Both origin and destination query parameters are required',
      });
    }

    const start = origin.trim();
    const end = destination.trim();

    try {
      const modernRoutes = await directionsNew(start, end, mode);
      if (modernRoutes) return res.json({ routes: modernRoutes });

      console.warn('Routes API unavailable; trying legacy Directions API.');
      const legacyRoutes = await directionsLegacy(start, end, mode);
      if (legacyRoutes) return res.json({ routes: legacyRoutes });

      console.warn('Google directions unavailable; using OpenStreetMap fallback.');
      const fallbackRoutes = await directionsOpenStreetMap(start, end, mode);
      if (fallbackRoutes) return res.json({ routes: fallbackRoutes });

      return res.status(502).json({ error: 'Unable to calculate route right now' });
    } catch (err) {
      console.error(
        'Directions proxy failed:',
        err instanceof Error ? err.message : err
      );
      return res.status(502).json({ error: 'Unable to calculate route right now' });
    }
  }
);

const humanizeType = (type: string) => type.replace(/_/g, ' ');

const parseLocation = (value?: string) => {
  if (!value) return null;
  const [latValue, lngValue] = value.split(',').map((part) => Number(part.trim()));
  if (!Number.isFinite(latValue) || !Number.isFinite(lngValue)) return null;
  return { lat: latValue, lng: lngValue };
};

const placesNew = async ({
  type,
  city,
  location,
  radiusMeters,
}: PlacesSearchArgs) => {
  let center = location;
  if (!center && city) center = await geocode(`${city}, USA`);

  const body: Record<string, unknown> = {
    textQuery: city
      ? `${humanizeType(type)} near ${city}`
      : humanizeType(type),
    pageSize: 20,
  };

  if (center) {
    body.locationBias = {
      circle: {
        center: {
          latitude: center.lat,
          longitude: center.lng,
        },
        radius: Math.min(50000, Math.max(500, radiusMeters)),
      },
    };
  }

  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'places.displayName,places.location,places.iconMaskBaseUri',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) return null;

  const payload: any = await response.json();
  const places = Array.isArray(payload.places)
    ? payload.places
        .map((place: any) => ({
          name: place.displayName?.text || humanizeType(type),
          location: {
            lat: place.location?.latitude,
            lng: place.location?.longitude,
          },
          icon: place.iconMaskBaseUri,
        }))
        .filter(
          (place: any) =>
            Number.isFinite(place.location?.lat) &&
            Number.isFinite(place.location?.lng)
        )
    : [];

  return places.length ? places : null;
};

const placesLegacy = async ({
  type,
  city,
  location,
  radiusMeters,
}: PlacesSearchArgs) => {
  let center = location;
  if (!center && city) center = await geocode(`${city}, USA`);
  if (!center) return null;

  const url = new URL(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
  );
  url.searchParams.set('location', `${center.lat},${center.lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('type', type);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload: any = await response.json();
  if (payload.status !== 'OK' || !Array.isArray(payload.results)) return null;

  const places = payload.results
    .map((place: any) => ({
      name: place.name,
      location: {
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      },
      icon: place.icon,
    }))
    .filter(
      (place: any) =>
        Number.isFinite(place.location?.lat) &&
        Number.isFinite(place.location?.lng)
    );

  return places.length ? places : null;
};

const overpassSelector = (type: string) => {
  switch (type) {
    case 'golf_course':
      return '["leisure"="golf_course"]';
    case 'restaurant':
      return '["amenity"="restaurant"]';
    case 'gas_station':
      return '["amenity"="fuel"]';
    case 'rest_area':
      return '["highway"="rest_area"]';
    default:
      return '';
  }
};

const placesOpenStreetMap = async ({
  type,
  city,
  location,
  radiusMeters,
}: PlacesSearchArgs) => {
  const selector = overpassSelector(type);
  if (!selector) return null;

  let center = location;
  if (!center && city) {
    center = await geocodeOpenStreetMap(`${city}, USA`);
  }
  if (!center) return null;

  const radius = Math.min(50000, Math.max(500, Math.round(radiusMeters)));
  const query = `[out:json][timeout:12];(node${selector}(around:${radius},${center.lat},${center.lng});way${selector}(around:${radius},${center.lat},${center.lng});relation${selector}(around:${radius},${center.lat},${center.lng}););out center tags 30;`;

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Fairway-Finder/1.0',
    },
    body: new URLSearchParams({ data: query }).toString(),
  });
  if (!response.ok) return null;

  const payload: any = await response.json();
  const elements = Array.isArray(payload.elements) ? payload.elements : [];

  const places = elements
    .map((element: any) => {
      const lat = Number(element.lat ?? element.center?.lat);
      const lng = Number(element.lon ?? element.center?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

      return {
        name:
          element.tags?.name ||
          element.tags?.brand ||
          humanizeType(type),
        location: { lat, lng },
      };
    })
    .filter(Boolean);

  return places.length ? places : null;
};

/**
 * GET /api/map/places
 * Supports both the original location/radius contract and the client contract
 * (city/maxDistance), with OpenStreetMap as a keyless resilience fallback.
 */
router.get(
  '/map/places',
  async (
    req: Request<
      object,
      any,
      object,
      {
        location?: string;
        radius?: string;
        type?: string;
        city?: string;
        maxDistance?: string;
      }
    >,
    res: Response
  ) => {
    const { location, radius, type, city, maxDistance } = req.query;

    if (!type || (!location && !city)) {
      return res.status(400).json({
        error: 'type and either city or location are required',
      });
    }

    const parsedLocation = parseLocation(location);
    const miles = Number(maxDistance);
    const explicitRadius = Number(radius);
    const radiusMeters =
      Number.isFinite(explicitRadius) && explicitRadius > 0
        ? Math.min(50000, explicitRadius)
        : Number.isFinite(miles) && miles > 0
          ? Math.min(50000, miles * 1609.34)
          : 8000;
    const normalizedCity = city?.trim();

    try {
      const args: PlacesSearchArgs = {
        type,
        ...(normalizedCity ? { city: normalizedCity } : {}),
        location: parsedLocation,
        radiusMeters,
      };

      const modernPlaces = await placesNew(args);
      if (modernPlaces) return res.json({ places: modernPlaces });

      console.warn('Places API (New) unavailable; trying legacy Places API.');
      const legacyPlaces = await placesLegacy(args);
      if (legacyPlaces) return res.json({ places: legacyPlaces });

      console.warn('Google Places unavailable; using OpenStreetMap fallback.');
      const fallbackPlaces = await placesOpenStreetMap(args);
      return res.json({ places: fallbackPlaces ?? [] });
    } catch (err) {
      console.error(
        'Map places proxy failed:',
        err instanceof Error ? err.message : err
      );
      return res.status(502).json({ error: 'Unable to load nearby places right now' });
    }
  }
);

export default router;

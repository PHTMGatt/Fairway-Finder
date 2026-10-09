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

const geocode = async (query: string) => {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', query);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) return null;

  const payload: any = await response.json();
  return payload.results?.[0]?.geometry?.location ?? null;
};

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
  if (!Array.isArray(payload.routes)) return [];

  return payload.routes
    .map((route: any) => ({
      overview_polyline: {
        points: route.polyline?.encodedPolyline || '',
      },
      summary: route.description || '',
    }))
    .filter((route: RouteShape) => route.overview_polyline.points);
};

const directionsLegacy = async (
  origin: string,
  destination: string,
  mode: string
): Promise<RouteShape[]> => {
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
  url.searchParams.set('origin', origin);
  url.searchParams.set('destination', destination);
  url.searchParams.set('mode', mode);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Legacy directions request failed with ${response.status}`);
  }

  const payload: any = await response.json();
  return Array.isArray(payload.routes)
    ? payload.routes.map((route: any) => ({
        overview_polyline: route.overview_polyline || {},
        summary: route.summary || '',
      }))
    : [];
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

    try {
      const modernRoutes = await directionsNew(
        origin.trim(),
        destination.trim(),
        mode
      );
      if (modernRoutes) {
        return res.json({ routes: modernRoutes });
      }

      console.warn('Routes API unavailable; using Directions API legacy fallback.');
      const routes = await directionsLegacy(
        origin.trim(),
        destination.trim(),
        mode
      );
      return res.json({ routes });
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
}: {
  type: string;
  city?: string;
  location?: { lat: number; lng: number } | null;
  radiusMeters: number;
}) => {
  let center = location ?? null;
  if (!center && city) {
    center = await geocode(`${city}, USA`);
  }

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
  return Array.isArray(payload.places)
    ? payload.places.map((place: any) => ({
        name: place.displayName?.text || humanizeType(type),
        location: {
          lat: place.location?.latitude,
          lng: place.location?.longitude,
        },
        icon: place.iconMaskBaseUri,
      }))
    : [];
};

const placesLegacy = async ({
  type,
  city,
  location,
  radiusMeters,
}: {
  type: string;
  city?: string;
  location?: { lat: number; lng: number } | null;
  radiusMeters: number;
}) => {
  let center = location ?? null;
  if (!center && city) {
    center = await geocode(`${city}, USA`);
  }
  if (!center) {
    throw new Error('Unable to determine search location');
  }

  const url = new URL(
    'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
  );
  url.searchParams.set('location', `${center.lat},${center.lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('type', type);
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Legacy Places request failed with ${response.status}`);
  }

  const payload: any = await response.json();
  return Array.isArray(payload.results)
    ? payload.results.map((place: any) => ({
        name: place.name,
        location: {
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
        },
        icon: place.icon,
      }))
    : [];
};

/**
 * GET /api/map/places
 *
 * Supports both the old location/radius contract and the actual client contract
 * (city/maxDistance). This fixes the long-standing mismatch without breaking
 * existing callers.
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
    const radiusMeters = Number.isFinite(explicitRadius) && explicitRadius > 0
      ? Math.min(50000, explicitRadius)
      : Number.isFinite(miles) && miles > 0
        ? Math.min(50000, miles * 1609.34)
        : 8000;

    try {
      const args = {
        type,
        city: city?.trim() || undefined,
        location: parsedLocation,
        radiusMeters,
      };

      const modernPlaces = await placesNew(args);
      if (modernPlaces) {
        return res.json({ places: modernPlaces });
      }

      console.warn('Places API (New) unavailable; using legacy fallback.');
      const places = await placesLegacy(args);
      return res.json({ places });
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

import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

// Note; Load Google API key from environment
const DIRECTIONS_API_KEY = process.env.PLACES_API_KEY;
if (!DIRECTIONS_API_KEY) {
  throw new Error('Missing PLACES_API_KEY in server environment');
}

/**
 * @route   GET /api/map/directions
 * @query   origin, destination, mode? (default: driving)
 * @returns simplified route with overview polyline + summary
 */
router.get(
  '/map/directions',
  async (
    req: Request<
      object,
      { routes: RouteShape[] },
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
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
      url.searchParams.set('origin', origin.trim());
      url.searchParams.set('destination', destination.trim());
      url.searchParams.set('mode', mode);
      url.searchParams.set('key', DIRECTIONS_API_KEY);

      const apiRes = await fetch(url.toString());
      if (!apiRes.ok) {
        const text = await apiRes.text();
        throw new Error(`Google Directions API error: ${apiRes.status} ${text}`);
      }
      const data = await apiRes.json();

      const routes = Array.isArray(data.routes)
        ? data.routes.map((r: any) => ({
            overviewPolyline: r.overview_polyline?.points || '',
            summary: r.summary || '',
          }))
        : [];

      return res.json({ routes });
    } catch (err) {
      console.error('❌ /api/map/directions error:', err);
      return res.status(500).json({ error: 'Internal server error fetching directions' });
    }
  }
);

/**
 * @route   GET /api/map/places
 * @query   location — required (e.g., "42.5,-83.1")
 * @query   radius   — optional (default 5000)
 * @query   type     — required (golf_course, restaurant, gas_station, etc.)
 * @returns simplified list of POIs
 */
router.get(
  '/map/places',
  async (
    req: Request<
      object,
      any,
      object,
      { location?: string; radius?: string; type?: string }
    >,
    res: Response
  ) => {
    const { location, radius = '5000', type } = req.query;

    if (!location || !type) {
      return res.status(400).json({ error: 'location and type are required' });
    }

    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.set('location', location);
      url.searchParams.set('radius', radius);
      url.searchParams.set('type', type);
      url.searchParams.set('key', DIRECTIONS_API_KEY);

      const apiRes = await fetch(url.toString());
      if (!apiRes.ok) throw new Error(`Places API error: ${apiRes.status}`);

      const data = await apiRes.json();

      const places = Array.isArray(data.results)
        ? data.results.map((p: any) => ({
            name: p.name,
            location: {
              lat: p.geometry?.location?.lat,
              lng: p.geometry?.location?.lng,
            },
            icon: p.icon,
          }))
        : [];

      return res.json({ places });
    } catch (err) {
      console.error('❌ /api/map/places error:', err);
      return res.status(500).json({ error: 'Error fetching nearby places' });
    }
  }
);

export default router;

// Type definitions
interface RouteShape {
  overviewPolyline: string;
  summary: string;
}

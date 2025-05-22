// server/src/routes/mapRoutes.ts

import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Reuse your same Google API key for Directions
const API_KEY = process.env.PLACES_API_KEY;
if (!API_KEY) {
  console.error('🚨 Missing PLACES_API_KEY in environment variables');
  // Fail fast for all requests if key is absent
  router.use((_, res) =>
    res
      .status(500)
      .json({ error: 'Server configuration error: missing Google API key' })
  );
}

/**
 * GET /api/map/directions
 * Required query params:
 *   - origin (string): e.g. "Chicago,IL"
 *   - destination (string): e.g. "Milwaukee,WI"
 * Optional:
 *   - mode (string): driving | walking | bicycling | transit
 */
router.get('/directions', async (req: Request, res: Response) => {
  const origin = req.query.origin as string;
  const destination = req.query.destination as string;
  const mode = (req.query.mode as string) || 'driving';

  if (!origin || !destination) {
    return res
      .status(400)
      .json({ error: 'Both origin and destination query parameters are required' });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('mode', mode);
    url.searchParams.set('key', API_KEY!);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error('Directions API error status:', response.status);
      return res
        .status(502)
        .json({ error: 'Failed to fetch directions from Google Maps API' });
    }

    const data = await response.json();
    if (data.error_message) {
      console.error('Directions API error:', data.error_message);
      return res
        .status(502)
        .json({ error: 'Google Directions API error', details: data.error_message });
    }

    // Simplify the response for client-side consumption
    const routes = (data.routes || []).map((route: any) => ({
      summary: route.summary,
      overviewPolyline: route.overview_polyline?.points,
      legs: (route.legs || []).map((leg: any) => ({
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        distance: leg.distance,
        duration: leg.duration,
        steps: (leg.steps || []).map((step: any) => ({
          instruction: step.html_instructions,
          distance: step.distance,
          duration: step.duration,
          startLocation: step.start_location,
          endLocation: step.end_location,
          polyline: step.polyline?.points,
        })),
      })),
    }));

    return res.json({ routes });
  } catch (err) {
    console.error('Server error fetching directions:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

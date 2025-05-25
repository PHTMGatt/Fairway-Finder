// server/src/routes/mapRoutes.ts

import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const API_KEY = process.env.PLACES_API_KEY;

if (!API_KEY) {
  console.error('🚨 Missing PLACES_API_KEY');
  router.use((_, res) => res.status(500).json({ error: 'Missing API key' }));
}

router.get('/directions', async (req: Request, res: Response) => {
  const origin = req.query.origin as string;
  const destination = req.query.destination as string;
  const mode = (req.query.mode as string) || 'driving';

  if (!origin || !destination) {
    return res.status(400).json({ error: 'Missing origin or destination' });
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json');
    url.searchParams.set('origin', origin);
    url.searchParams.set('destination', destination);
    url.searchParams.set('mode', mode);
    url.searchParams.set('key', API_KEY!);

    const apiRes = await fetch(url.toString());
    const data = await apiRes.json();

    const routes = (data.routes || []).map((route: any) => ({
      overviewPolyline: route.overview_polyline?.points,
      summary: route.summary,
    }));

    return res.json({ routes });
  } catch (err) {
    console.error('Error fetching directions:', err);
    return res.status(500).json({ error: 'Failed to fetch route' });
  }
});

export default router;

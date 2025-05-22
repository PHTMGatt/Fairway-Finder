// src/routes/courseRoutes.ts

import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const router = express.Router();

//Note; Load Google API key from environment
const API_KEY = process.env.PLACES_API_KEY as string;
console.log('🔑 Loaded PLACES_API_KEY →', API_KEY);

if (!API_KEY) {
  console.error('🚨 Missing PLACES_API_KEY in environment variables');
  //Note; Fail all requests if API key is missing
  router.use((_, res) =>
    res
      .status(500)
      .json({ error: 'Server configuration error: missing Places API key' })
  );
}

//Note; GET /api/courses?city=CityName&limit=number
router.get('/courses', async (req: Request, res: Response) => {
  //Note; Extract and sanitize query params
  const city = String(req.query.city || '').trim();
  const limit = Number(req.query.limit) || 10;

  //Note; Validate city parameter
  if (!city) {
    return res
      .status(400)
      .json({ error: 'City query parameter is required' });
  }

  try {
    console.log(`[courses] Searching courses for city="${city}", limit=${limit}`);

    //Note; 1️⃣ Try a biased Text Search first
    const textUrl = new URL(
      'https://maps.googleapis.com/maps/api/place/textsearch/json'
    );
    textUrl.searchParams.set('query', `golf courses in ${city}, USA`);
    textUrl.searchParams.set('region', 'us');
    textUrl.searchParams.set('key', API_KEY);
    console.log('[courses] TextSearch URL:', textUrl.toString());

    const textRes = await fetch(textUrl.toString());
    const textData = await textRes.json();
    console.log('[courses] TextSearch result count:', textData.results?.length);

    let results: any[] = Array.isArray(textData.results) ? textData.results : [];

    //Note; 2️⃣ Fallback: geocode city → Nearby Search if no TextSearch results
    if (results.length === 0) {
      //Note; Geocode the city to get lat/lng
      const geoUrl = new URL(
        'https://maps.googleapis.com/maps/api/geocode/json'
      );
      geoUrl.searchParams.set('address', `${city}, USA`);
      geoUrl.searchParams.set('key', API_KEY);
      console.log('[courses] Geocode URL:', geoUrl.toString());

      const geoRes = await fetch(geoUrl.toString());
      const geoData = await geoRes.json();
      console.log('[courses] Geocode result count:', geoData.results?.length);
      const loc = geoData.results?.[0]?.geometry?.location;

      if (loc) {
        //Note; Nearby Search for golf courses around that location
        const nearbyUrl = new URL(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        );
        nearbyUrl.searchParams.set('location', `${loc.lat},${loc.lng}`);
        nearbyUrl.searchParams.set('radius', '50000'); // 50 km radius
        nearbyUrl.searchParams.set('type', 'golf_course');
        nearbyUrl.searchParams.set('key', API_KEY);
        console.log('[courses] NearbySearch URL:', nearbyUrl.toString());

        const nearbyRes = await fetch(nearbyUrl.toString());
        const nearbyData = await nearbyRes.json();
        console.log('[courses] NearbySearch result count:', nearbyData.results?.length);
        results = Array.isArray(nearbyData.results) ? nearbyData.results : [];
      }
    }

    //Note; Map to our course shape
    let courses = results.map((place: any) => ({
      name: place.name,
      address: place.formatted_address || place.vicinity || 'Address N/A',
      location: place.geometry?.location ?? null,
      rating: place.rating ?? null,
      place_id: place.place_id,
    }));

    //Note; Sort by rating desc, then limit
    courses.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    courses = courses.slice(0, limit);

    console.log(`[courses] Returning ${courses.length} courses`);
    return res.json(courses);
  } catch (err) {
    console.error('Server error fetching courses:', err);
    return res
      .status(500)
      .json({ error: 'Internal server error' });
  }
});

export default router;

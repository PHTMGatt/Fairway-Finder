// src/routes/weatherService.ts
import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

// Note; Helper to get lat/lon from city name via Nominatim
async function getCoords(city: string) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const response = await axios.get(url);
  if (response.data.length === 0) {
    throw new Error('City not found');
  }
  return {
    lat: response.data[0].lat,
    lon: response.data[0].lon,
  };
}

// Route: GET /api/weather?city=Austin
router.get('/', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    // 1. Get coords
    const { lat, lon } = await getCoords(city);

    // 2. Get weather from Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
    const weatherResp = await axios.get(weatherUrl);

    // 3. Return JSON with city, coords and weather data
    return res.json({
      city,
      coords: { lat, lon },
      weather: weatherResp.data.current_weather,
    });
  } catch (error: any) {
    console.error('Weather API error:', error.message);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

export default router;



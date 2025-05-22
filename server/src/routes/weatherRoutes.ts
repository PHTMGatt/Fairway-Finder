import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Note; Use your server-side OpenWeatherMap API key
const API_KEY = process.env.WEATHER_API_KEY as string;
if (!API_KEY) {
  console.error('Weather API key is missing in environment variables.');
}

// Note; GET /weather?city=CityName — returns current weather data
router.get('/weather', async (req: Request, res: Response): Promise<void> => {
  const { city } = req.query;

  // Note; Validate that city parameter is provided and is a string
  if (!city || typeof city !== 'string') {
    res.status(400).json({ error: 'City is required' });
    return; // ensures early exit
  }

  try {
    // Note; Fetch from OpenWeatherMap with imperial units
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&units=imperial&appid=${API_KEY}`
    );

    // Note; Handle non-OK responses
    if (!response.ok) {
      console.error('OpenWeatherMap API error status:', response.status);
      res.status(500).json({ error: 'Failed to fetch weather data' });
      return;
    }

    // Note; Parse and forward JSON data to client
    const data = await response.json();
    res.json(data);
  } catch (err) {
    // Note; Log and return server error on exceptions
    console.error('Weather API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

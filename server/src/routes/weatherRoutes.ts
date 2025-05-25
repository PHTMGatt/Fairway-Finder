import express, { Request, Response } from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const API_KEY = process.env.WEATHER_API_KEY as string;

if (!API_KEY) {
  console.error('Weather API key is missing in environment variables.');
}

/** ——— GET /api/weather?city=CityName — returns current weather ——— **/
router.get('/weather', async (req: Request, res: Response): Promise<void> => {
  const { city } = req.query;
  if (!city || typeof city !== 'string') {
    res.status(400).json({ error: 'City is required' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=imperial&appid=${API_KEY}`
    );

    if (!response.ok) {
      res.status(500).json({ error: 'Failed to fetch current weather' });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Current weather API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/** ——— GET /api/weather/forecast?city=CityName&date=YYYY-MM-DD ——— **/
router.get('/weather/forecast', async (req: Request, res: Response): Promise<void> => {
  const { city, date } = req.query;
  if (!city || typeof city !== 'string') {
    res.status(400).json({ error: 'City is required' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=imperial&appid=${API_KEY}`
    );

    if (!response.ok) {
      res.status(500).json({ error: 'Failed to fetch forecast' });
      return;
    }

    const forecastData = await response.json();
    const targetDate = date && typeof date === 'string' ? new Date(date) : new Date();

    const closest = forecastData.list.reduce((prev: any, curr: any) => {
      const prevDiff = Math.abs(new Date(prev.dt_txt).getTime() - targetDate.getTime());
      const currDiff = Math.abs(new Date(curr.dt_txt).getTime() - targetDate.getTime());
      return currDiff < prevDiff ? curr : prev;
    });

    res.json({
      city: forecastData.city.name,
      forecast: closest,
    });
  } catch (err) {
    console.error('Forecast API error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

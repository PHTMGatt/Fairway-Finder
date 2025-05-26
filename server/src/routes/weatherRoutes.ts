// server/src/routes/'weatherRoutes.ts'

import { Router, Request, Response } from 'express'
import fetch from 'node-fetch'

const router = Router()

// Note; Load OpenWeatherMap API key from environment
const WEATHER_API_KEY = process.env.WEATHER_API_KEY
if (!WEATHER_API_KEY) {
  throw new Error('Missing WEATHER_API_KEY in server environment')
}

/**
 * @route   GET /api/weather
 * @query   city — required, name of the city
 * @description
 *   Proxy current-weather requests to OpenWeather, keeping the API key on the server.
 */
router.get('/weather', async (req: Request<{}, any, {}, { city?: string }>, res: Response) => {
  const city = req.query.city?.trim()
  if (!city) {
    return res.status(400).json({ error: 'Query parameter "city" is required' })
  }

  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather')
    url.searchParams.set('q', city)
    url.searchParams.set('units', 'imperial')
    url.searchParams.set('appid', WEATHER_API_KEY)

    const apiRes = await fetch(url.toString())
    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}))
      return res.status(apiRes.status).json({
        error: errBody.message || 'Failed to fetch current weather'
      })
    }

    const data = await apiRes.json()
    return res.json({
      name: data.name,
      main: data.main,
      weather: data.weather,
      wind: data.wind
    })
  } catch (err) {
    console.error('❌ /api/weather error:', err)
    return res.status(500).json({ error: 'Internal server error fetching weather' })
  }
})

/**
 * @route   GET /api/weather/forecast
 * @query   city — optional, name of the city
 *          lat, lon — optional, coordinates of the location
 * @description
 *   Proxy 5-day/3-hour forecast requests to OpenWeather.
 *   Use lat/lon if provided, otherwise fall back to city.
 */
router.get('/weather/forecast', async (req: Request<{}, any, {}, { city?: string; lat?: string; lon?: string }>, res: Response) => {
  const city = req.query.city?.trim()
  const lat = req.query.lat
  const lon = req.query.lon

  // Require either city or both lat+lon
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Query parameter "city" or both "lat" and "lon" are required' })
  }

  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/forecast')
    if (lat && lon) {
      url.searchParams.set('lat', lat)
      url.searchParams.set('lon', lon)
    } else {
      url.searchParams.set('q', city!)
    }
    url.searchParams.set('units', 'imperial')
    url.searchParams.set('appid', WEATHER_API_KEY)

    const apiRes = await fetch(url.toString())
    if (!apiRes.ok) {
      const errBody = await apiRes.json().catch(() => ({}))
      return res.status(apiRes.status).json({
        error: errBody.message || 'Failed to fetch forecast'
      })
    }

    const data = await apiRes.json()
    return res.json({
      city: data.city,
      list: data.list
    })
  } catch (err) {
    console.error('❌ /api/weather/forecast error:', err)
    return res.status(500).json({ error: 'Internal server error fetching forecast' })
  }
})

export default router

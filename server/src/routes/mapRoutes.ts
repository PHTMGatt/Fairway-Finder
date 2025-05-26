// server/src/routes/mapRoutes.ts

import { Router, Request, Response } from 'express'
import fetch from 'node-fetch'

const router = Router()

// Note; Load Google Directions API key from environment
const DIRECTIONS_API_KEY = process.env.PLACES_API_KEY
if (!DIRECTIONS_API_KEY) {
  throw new Error('Missing PLACES_API_KEY in server environment')
}

/**
 * Note; Shape of a single route in our simplified response
 */
interface RouteShape {
  overviewPolyline: string
  summary: string
}

/**
 * @route   GET /api/map/directions
 * @query   origin      — required, start location string
 * @query   destination — required, end location string
 * @query   mode        — optional, travel mode (driving, walking, bicycling; default “driving”)
 * @returns JSON with `{ routes: RouteShape[] }`
 */
router.get(
  '/map/directions',
  async (
    req: Request<
      {},
      { routes: RouteShape[] },
      {},
      { origin?: string; destination?: string; mode?: string }
    >,
    res: Response
  ) => {
    const { origin, destination, mode = 'driving' } = req.query

    // Note; Validate required params
    if (!origin?.trim() || !destination?.trim()) {
      return res.status(400).json({
        error: 'Both origin and destination query parameters are required',
      })
    }

    try {
      // Note; Build the Directions API URL
      const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
      url.searchParams.set('origin', origin.trim())
      url.searchParams.set('destination', destination.trim())
      url.searchParams.set('mode', mode)
      url.searchParams.set('key', DIRECTIONS_API_KEY)

      // Note; Fetch from Google
      const apiRes = await fetch(url.toString())
      if (!apiRes.ok) {
        const text = await apiRes.text()
        throw new Error(`Google Directions API error: ${apiRes.status} ${text}`)
      }
      const data = await apiRes.json()

      // Note; Map to our simplified response shape
      const routes: RouteShape[] = Array.isArray(data.routes)
        ? data.routes.map((r: any) => ({
            overviewPolyline: r.overview_polyline?.points || '',
            summary: r.summary || '',
          }))
        : []

      // Note; Return the routes array
      return res.json({ routes })
    } catch (err) {
      console.error('❌ /api/map/directions error:', err)
      // Note; Internal server error
      return res
        .status(500)
        .json({ error: 'Internal server error fetching directions' })
    }
  }
)

export default router

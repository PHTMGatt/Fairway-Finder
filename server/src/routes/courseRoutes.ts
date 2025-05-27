// server/src/routes/courseRoutes.ts

import { Router, Request, Response } from 'express'
import fetch from 'node-fetch'

const router = Router()

// Note; Load Google Places API key from environment variables
const PLACES_API_KEY = process.env.PLACES_API_KEY
if (!PLACES_API_KEY) {
  throw new Error('Missing PLACES_API_KEY in server environment')
}

/**
 * Note; Raw shape from Google Places API for a single place entry
 */
interface GooglePlace {
  name: string
  place_id: string
  formatted_address?: string
  vicinity?: string
  rating?: number
  geometry?: { location: { lat: number; lng: number } }
}

/**
 * Note; Query parameters accepted by this endpoint
 */
interface CourseQuery {
  city?: string
  limit?: string
  maxDistance?: string
}

/**
 * Note; Shape of course data returned to the client
 */
export interface Course {
  name: string
  address: string
  rating: number | null
  place_id: string
  location: { lat: number; lng: number } | null
}

/**
 * @route   GET /api/courses
 * @query   city        — required, name of the city to search
 * @query   limit       — optional, max number of courses to return (default 10)
 * @query   maxDistance — optional, radius in miles around city center
 * @returns JSON array of Course
 */
router.get<object, Course[], object, CourseQuery>(
  '/courses',
  async (req: Request<object, Course[], object, CourseQuery>, res: Response) => {
    // Note; Validate city param
    const city = req.query.city?.trim() || ''
    if (!city) {
      return res
        .status(400)
        .json({ error: 'The "city" query parameter is required.' })
    }

    // Note; Clamp limit between 1 and 50
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10))

    // Note; Determine if radius search should be used
    const miles = Number(req.query.maxDistance)
    const useRadius = !isNaN(miles) && miles > 0
    const radiusMeters = Math.round(miles * 1609.34)

    try {
      let places: GooglePlace[] = []

      if (useRadius) {
        // Note; First geocode the city to get lat/lng
        const geoUrl = new URL('https://maps.googleapis.com/maps/api/geocode/json')
        geoUrl.searchParams.set('address', `${city}, USA`)
        geoUrl.searchParams.set('key', PLACES_API_KEY)
        const geoRes = await fetch(geoUrl.toString())
        const geoData = await geoRes.json()
        const loc = geoData.results?.[0]?.geometry?.location
        if (!loc) throw new Error('Geocoding failed for city')

        // Note; Nearby search for golf courses within radius
        const nearbyUrl = new URL(
          'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
        )
        nearbyUrl.searchParams.set('location', `${loc.lat},${loc.lng}`)
        nearbyUrl.searchParams.set('radius', radiusMeters.toString())
        nearbyUrl.searchParams.set('type', 'golf_course')
        nearbyUrl.searchParams.set('key', PLACES_API_KEY)
        const nearbyRes = await fetch(nearbyUrl.toString())
        const nearbyData = await nearbyRes.json()
        places = Array.isArray(nearbyData.results) ? nearbyData.results : []
      } else {
        // Note; Fallback to text search if no radius specified
        const textUrl = new URL(
          'https://maps.googleapis.com/maps/api/place/textsearch/json'
        )
        textUrl.searchParams.set('query', `golf courses in ${city}, USA`)
        textUrl.searchParams.set('region', 'us')
        textUrl.searchParams.set('key', PLACES_API_KEY)
        const textRes = await fetch(textUrl.toString())
        const textData = await textRes.json()
        places = Array.isArray(textData.results) ? textData.results : []
      }

      // Note; Map raw results to our Course interface
      let courses: Course[] = places.map((p) => ({
        name: p.name,
        address: p.formatted_address || p.vicinity || 'Address N/A',
        rating: p.rating ?? null,
        place_id: p.place_id,
        location: p.geometry?.location ?? null,
      }))

      // Note; Sort by rating descending, then limit results
      courses = courses
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, limit)

      // Note; Return the final list
      return res.json(courses)
    } catch (error) {
      console.error('❌ Error in /api/courses:', error)
      return res
        .status(500)
        .json({ error: 'Internal server error while fetching courses' })
    }
  }
)

export default router

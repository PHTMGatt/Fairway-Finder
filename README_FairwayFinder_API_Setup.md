# 🏌️‍♂️ Fairway Finder – API Setup

Fairway Finder keeps private provider keys on the server. Weather now uses Open-Meteo and does **not** require an API key.

---

## 🔐 Server Environment Variables

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET_KEY=your_long_random_jwt_secret
PLACES_API_KEY=your_google_server_api_key
GOLF_API_KEY=your_golfcourseapi_key
```

### Google server key

Create/manage the key in Google Cloud Console and enable:

- **Places API (New)**
- **Routes API**
- **Geocoding API**

The code currently contains compatibility fallbacks for the older Places/Directions endpoints so an existing deployment can continue working while the Google Cloud project is migrated. New requests prefer Places API (New) and Routes API.

Keep this key server-side and restrict it to only the APIs Fairway Finder needs.

### GolfCourseAPI key

Create/manage the key at GolfCourseAPI. The app uses it for golf-specific course details such as tee data, course rating, and slope rating.

---

## 💻 Client Environment Variables

```env
VITE_GOOGLE_MAPS_API_KEY=your_browser_google_maps_key
```

Enable only:

- **Maps JavaScript API**

Use a separate browser key from the server key. Restrict the browser key by HTTP referrer, for example:

- `http://localhost:3000/*`
- `http://localhost:5173/*`
- `https://fairway-finder.onrender.com/*`

The browser key is expected to appear in the built JavaScript bundle, so referrer/API restrictions are what protect it. Private provider keys must stay on the server.

---

## 🌦 Weather

No weather key is required. `/api/weather` uses Open-Meteo geocoding and current-weather data and normalizes the response for the existing Fairway Finder UI.

---

## ✅ Current Integration Summary

| Integration | Environment variable | Location | Purpose |
|---|---|---|---|
| MongoDB Atlas | `MONGODB_URI` | Server | Users, private trips, scores and handicaps |
| JWT | `JWT_SECRET_KEY` | Server | Authentication/session signing |
| Google Places / Routes / Geocoding | `PLACES_API_KEY` | Server | Course discovery, POIs and routing |
| GolfCourseAPI | `GOLF_API_KEY` | Server | Tee, rating and slope data |
| Google Maps JavaScript | `VITE_GOOGLE_MAPS_API_KEY` | Client | Interactive map rendering |
| Open-Meteo | None | Server | Current weather |

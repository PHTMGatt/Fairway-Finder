# 🏌️‍♂️ Fairway Finder – API Key Setup Instructions

This guide walks you through setting up the required API keys and environment variables for both the server and client. Replace the placeholders with your own keys.

---

## 🔐 Server Environment Variables (`.env`)

```env
PLACES_API_KEY=your_google_places_api_key
MONGODB_URI=mongodb://127.0.0.1:27017/tech-thoughts
JWT_SECRET_KEY=your_jwt_secret_key
```

- **Generate/manage your Google Places key:**  
  👉 https://console.cloud.google.com/apis/credentials

### ✅ Enable These APIs:
- Places API  
- Geocoding API  
- Directions API  

> **Note:** When setting API restrictions, you must manually **type in** each API name using the search bar.

### 🔒 Restriction Setup:
- Application restriction: `None`  
- API restriction: `Restrict key` → select all 3 APIs above

---

## 💻 Client Environment Variables (`.env` or `.env.local`)

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_WEATHER_API_KEY=your_openweather_api_key
```

- **Generate/manage your Google Maps key:**  
  👉 https://console.cloud.google.com/apis/credentials

- **Generate your OpenWeather key:**  
  👉 https://home.openweathermap.org/api_keys

### ✅ Enable These APIs:
- Maps JavaScript API (for Google Maps)

### 🔒 Restriction Setup:
- Application restriction: `Websites`  
- Allowed URLs:
  - `http://localhost:3000/*`
  - `http://localhost:5173/*`
- API restriction: `Restrict key` → select **Maps JavaScript API**

---

## ✅ Summary

| Key Use       | ENV Name                  | Where Used | Required APIs                            |
|---------------|---------------------------|------------|-------------------------------------------|
| Maps & Places | PLACES_API_KEY            | Server     | Places API, Geocoding API, Directions API |
| MongoDB       | MONGODB_URI               | Server     | N/A                                       |
| Auth Token    | JWT_SECRET_KEY            | Server     | N/A                                       |
| Maps Display  | VITE_GOOGLE_MAPS_API_KEY  | Client     | Maps JavaScript API                       |
| Weather Data  | VITE_WEATHER_API_KEY      | Client     | OpenWeather                               |

---

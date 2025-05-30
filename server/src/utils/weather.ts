import axios from 'axios';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

if (!WEATHER_API_KEY) {
  console.warn('⚠️ WEATHER_API_KEY is not set. Add it to your .env file.');
}

export async function getWeatherByCoords(lat: string, lon: string) {
  const url = `http://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=3`;

  console.log('🔍 Fetching weather from:', url); // Log the URL

  try {
    const response = await axios.get(url);
    console.log('✅ Weather API Response:', response.data); // Log response
    return response.data;
  } catch (error: any) {
    console.error('❌ Weather API error:', error.response?.data || error.message);
    throw new Error('Weather fetch failed');
  }
}

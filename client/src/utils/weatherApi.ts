// src/utils/weatherApi.ts

// Note; Minimal interface for the data we need from OpenWeatherMap API
export interface WeatherData {
  cityName: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
}

// Note; Fetch current weather for a given city using OpenWeatherMap API
export const fetchWeatherByCity = async (city: string): Promise<WeatherData> => {
  // Note; Validate city argument
  if (!city.trim()) {
    throw new Error('City is required');
  }

  // Note; Retrieve API key from environment variables
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing VITE_WEATHER_API_KEY in environment variables');
  }

  // Note; Build request URL
  const url = new URL('https://api.openweathermap.org/data/2.5/weather');
  url.searchParams.set('q', city);
  url.searchParams.set('units', 'imperial');
  url.searchParams.set('appid', apiKey);

  // Note; Perform fetch
  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (err) {
    throw new Error('Network error fetching weather');
  }

  // Note; Handle HTTP errors
  if (!res.ok) {
    let errMsg = res.statusText;
    try {
      const errBody = await res.json();
      if (errBody?.message) errMsg = errBody.message;
    } catch { /* ignore */ }
    throw new Error(`Weather API error: ${errMsg}`);
  }

  // Note; Parse and return structured weather data
  const data = await res.json();
  return {
    cityName: data.name,
    temp: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    description: data.weather?.[0]?.description ?? '',
    icon: data.weather?.[0]?.icon ?? '',
    windSpeed: data.wind.speed,
  };
};

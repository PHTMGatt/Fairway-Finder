// client/src/pages/Weather/Weather.tsx

import React, { useState, ChangeEvent } from 'react';
import {
  WiDaySunny,
  WiCloudy,
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog,
  WiStars,
  WiRaindrops,
  WiStrongWind,
} from 'react-icons/wi';
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch';
import './Weather.css';

/**
 * Shape of the data we pull from our /api/weather proxy:
 * - tempF      raw temperature in °F (server uses units=imperial)
 * - humidity   relative humidity %
 * - precipitation  rain or snow volume (mm in last 1h)
 * - windSpeed  wind speed (mph)
 * - iconCode   OpenWeather icon code (e.g. "01d", "01n")
 * - main       high-level condition (Clear, Clouds, etc.)
 * - description detailed text
 * - name       city name
 */
interface WeatherInfo {
  tempF: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  iconCode: string;
  main: string;
  description: string;
  name: string;
}

// Map OpenWeather “main” to a day-time icon
const iconMap: Record<string, JSX.Element> = {
  Clear:        <WiDaySunny    className="weather-icon" />,
  Clouds:       <WiCloudy      className="weather-icon" />,
  Rain:         <WiRain        className="weather-icon" />,
  Drizzle:      <WiRain        className="weather-icon" />,
  Thunderstorm: <WiThunderstorm className="weather-icon" />,
  Snow:         <WiSnow        className="weather-icon" />,
  Mist:         <WiFog         className="weather-icon" />,
  Smoke:        <WiFog         className="weather-icon" />,
  Haze:         <WiFog         className="weather-icon" />,
  Dust:         <WiFog         className="weather-icon" />,
  Fog:          <WiFog         className="weather-icon" />,
  Sand:         <WiFog         className="weather-icon" />,
  Ash:          <WiFog         className="weather-icon" />,
  Squall:       <WiCloudy      className="weather-icon" />,
  Tornado:      <WiThunderstorm className="weather-icon" />,
};

/** Convert Fahrenheit → Celsius */
const fahrenheitToCelsius = (f: number) =>
  Math.round(((f - 32) * 5) / 9);

const Weather: React.FC = () => {
  // controlled inputs & flags
  const [city, setCity] = useState<string>('');
  const [isFahrenheit, setIsFahrenheit] = useState<boolean>(true);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  /** update input */
  const handleCityChange = (e: ChangeEvent<HTMLInputElement>) =>
    setCity(e.target.value);

  /** fetch from our server proxy */
  const handleSearch = async () => {
    const name = city.trim();
    if (!name) {
      setError('Please enter a city name.');
      setWeather(null);
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const res = await fetch(
        `/api/weather?city=${encodeURIComponent(name)}`
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();

      console.log('Raw weather data (°F):', data.main.temp, data);

      // validate
      if (!data.weather?.[0] || data.main?.temp == null) {
        throw new Error('Incomplete weather data');
      }

      setWeather({
        tempF: data.main.temp,
        humidity: data.main.humidity,
        precipitation: data.rain?.['1h'] ?? data.snow?.['1h'] ?? 0,
        windSpeed: data.wind.speed,
        iconCode: data.weather[0].icon,
        main: data.weather[0].main,
        description: data.weather[0].description,
        name: data.name,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load weather.');
    } finally {
      setLoading(false);
    }
  };

  /** pick day vs night icon */
  const renderIcon = () => {
    if (!weather) return null;
    // night codes end in “n”
    return weather.iconCode.endsWith('n')
      ? <WiStars className="weather-icon" />
      : iconMap[weather.main] || <WiCloudy className="weather-icon" />;
  };

  /** which temp to show */
  const displayTemp = weather == null
    ? null
    : isFahrenheit
    ? Math.round(weather.tempF)                      // raw °F
    : fahrenheitToCelsius(weather.tempF);            // to °C

  return (
    <main className="weather-page">
      <div className="weather-card">

        {/* ===== Search Panel ===== */}
        <section className="weather-card__search">
          <h2 className="weather-card__title">Weather Forecast</h2>
          <p className="weather-card__desc">
            Enter a city to view precipitation, humidity, wind, and more.
          </p>

          <div className="weather-card__toggle">
            <ToggleSwitch
              id="unitToggle"
              checked={isFahrenheit}
              onChange={setIsFahrenheit}
              label={isFahrenheit ? '°F' : '°C'}
            />
          </div>

          <div className="weather-card__input-group">
            <input
              type="text"
              className="weather-card__input"
              placeholder="Enter city"
              value={city}
              onChange={handleCityChange}
            />
            <button
              className="weather-card__btn"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Checking…' : 'Check Weather'}
            </button>
          </div>

          {error && (
            <p className="trip-details__status" style={{ color: '#b00020' }}>
              ❌ {error}
            </p>
          )}
        </section>

        {/* ===== Result Panel ===== */}
        {weather && displayTemp !== null && (
          <section className="weather-card__result">
            <div className="weather-result">
              <div className="weather-result__icon-wrapper">
                {renderIcon()}
              </div>
              <h3 className="weather-result__city">{weather.name}</h3>
              <p className="weather-result__desc">
                {weather.description}
              </p>
              <p className="weather-result__temp">
                {displayTemp}°{isFahrenheit ? 'F' : 'C'}
              </p>

              <div className="weather-result__details">
                <div className="detail">
                  <WiRain className="detail-icon" />
                  <span>Precip: <strong>{weather.precipitation} mm</strong></span>
                </div>
                <div className="detail">
                  <WiRaindrops className="detail-icon" />
                  <span>Humidity: <strong>{weather.humidity}%</strong></span>
                </div>
                <div className="detail">
                  <WiStrongWind className="detail-icon" />
                  <span>Wind: <strong>{weather.windSpeed} mph</strong></span>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>
    </main>
  );
};

export default Weather;

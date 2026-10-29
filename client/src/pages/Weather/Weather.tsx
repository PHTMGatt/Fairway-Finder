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

const iconMap: Record<string, JSX.Element> = {
  Clear: <WiDaySunny className="weather-icon" />,
  Clouds: <WiCloudy className="weather-icon" />,
  Rain: <WiRain className="weather-icon" />,
  Drizzle: <WiRain className="weather-icon" />,
  Thunderstorm: <WiThunderstorm className="weather-icon" />,
  Snow: <WiSnow className="weather-icon" />,
  Mist: <WiFog className="weather-icon" />,
  Smoke: <WiFog className="weather-icon" />,
  Haze: <WiFog className="weather-icon" />,
  Dust: <WiFog className="weather-icon" />,
  Fog: <WiFog className="weather-icon" />,
  Sand: <WiFog className="weather-icon" />,
  Ash: <WiFog className="weather-icon" />,
  Squall: <WiCloudy className="weather-icon" />,
  Tornado: <WiThunderstorm className="weather-icon" />,
};

const fahrenheitToCelsius = (f: number) => Math.round(((f - 32) * 5) / 9);

const Weather: React.FC = () => {
  const [city, setCity] = useState<string>('');
  const [isFahrenheit, setIsFahrenheit] = useState<boolean>(true);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleCityChange = (e: ChangeEvent<HTMLInputElement>) => setCity(e.target.value);

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
      const res = await fetch(`/api/weather?city=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();

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
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to load weather.');
    } finally {
      setLoading(false);
    }
  };

  const renderIcon = () => {
    if (!weather) return null;
    return weather.iconCode.endsWith('n')
      ? <WiStars className="weather-icon" />
      : iconMap[weather.main] || <WiCloudy className="weather-icon" />;
  };

  const displayTemp = weather == null
    ? null
    : isFahrenheit
      ? Math.round(weather.tempF)
      : fahrenheitToCelsius(weather.tempF);

  return (
    <main className="weather-page">
      <header className="weather-page__header">
        <div>
          <p className="weather-page__eyebrow">Golf-day conditions</p>
          <h1>Check the weather before you tee it up.</h1>
          <p>
            Use a city to check temperature, precipitation, humidity, and wind before the group commits to the round.
          </p>
        </div>
        <div className="weather-page__context" aria-hidden="true">
          <span>Temperature</span>
          <span>Rain</span>
          <span>Wind</span>
        </div>
      </header>

      <div className="weather-card">
        <section className="weather-card__search" aria-labelledby="weather-search-title">
          <div className="weather-card__search-heading">
            <div>
              <p className="weather-page__eyebrow">Location</p>
              <h2 id="weather-search-title" className="weather-card__title">Weather check</h2>
            </div>
            <div className="weather-card__toggle">
              <ToggleSwitch
                id="unitToggle"
                checked={isFahrenheit}
                onChange={setIsFahrenheit}
                label={isFahrenheit ? '°F' : '°C'}
              />
            </div>
          </div>
          <p className="weather-card__desc">
            Search the city near your course or lodging. Trip-specific weather is also available inside each saved trip.
          </p>

          <div className="weather-card__input-group">
            <input
              type="text"
              className="weather-card__input"
              placeholder="City, state"
              value={city}
              onChange={handleCityChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSearch();
              }}
              aria-label="Weather city"
            />
            <button
              type="button"
              className="weather-card__btn"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Checking…' : 'Check Weather'}
            </button>
          </div>

          {error && (
            <div className="weather-card__status weather-card__status--error" role="alert">
              <strong>Weather unavailable</strong>
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="weather-card__status" role="status">
              <span className="weather-card__status-dot" aria-hidden="true" />
              <div>
                <strong>Checking playing conditions…</strong>
                <span>Looking up the latest available weather for {city.trim() || 'your location'}.</span>
              </div>
            </div>
          )}
        </section>

        <section className="weather-card__result" aria-live="polite">
          {weather && displayTemp !== null ? (
            <div className="weather-result">
              <div className="weather-result__topline">
                <div className="weather-result__icon-wrapper">{renderIcon()}</div>
                <div>
                  <p className="weather-page__eyebrow">Current conditions</p>
                  <h2 className="weather-result__city">{weather.name}</h2>
                  <p className="weather-result__desc">{weather.description}</p>
                </div>
              </div>

              <p className="weather-result__temp">
                {displayTemp}°<span>{isFahrenheit ? 'F' : 'C'}</span>
              </p>

              <div className="weather-result__details">
                <div className="detail">
                  <WiRain className="detail-icon" aria-hidden="true" />
                  <span>Precipitation</span>
                  <strong>{weather.precipitation} mm</strong>
                </div>
                <div className="detail">
                  <WiRaindrops className="detail-icon" aria-hidden="true" />
                  <span>Humidity</span>
                  <strong>{weather.humidity}%</strong>
                </div>
                <div className="detail">
                  <WiStrongWind className="detail-icon" aria-hidden="true" />
                  <span>Wind</span>
                  <strong>{weather.windSpeed} mph</strong>
                </div>
              </div>
            </div>
          ) : !loading ? (
            <div className="weather-result weather-result--empty">
              <span className="weather-result__empty-icon" aria-hidden="true">☀</span>
              <p className="weather-page__eyebrow">Ready when you are</p>
              <h2>Search a golf destination.</h2>
              <p>Conditions will appear here with the details that matter most before a round.</p>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default Weather;

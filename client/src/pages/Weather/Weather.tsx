// client/src/pages/Weather/Weather.tsx

import React, { FormEvent, useState } from 'react';
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
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
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

const fahrenheitToCelsius = (fahrenheit: number) =>
  Math.round(((fahrenheit - 32) * 5) / 9);

const Weather: React.FC = () => {
  const [city, setCity] = useState<string>('');
  const [isFahrenheit, setIsFahrenheit] = useState<boolean>(true);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const name = city.trim();
    if (!name) {
      setError('Please enter a city or town.');
      setWeather(null);
      return;
    }

    setLoading(true);
    setError('');
    setWeather(null);

    try {
      const response = await fetch(`/api/weather?city=${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error('Weather is unavailable right now.');
      const data = await response.json();

      if (!data.weather?.[0] || data.main?.temp == null) {
        throw new Error('Weather is unavailable right now.');
      }

      setWeather({
        tempF: Number(data.main.temp),
        humidity: Number(data.main.humidity),
        precipitation: Number(data.rain?.['1h'] ?? data.snow?.['1h'] ?? 0),
        windSpeed: Number(data.wind?.speed ?? 0),
        iconCode: String(data.weather[0].icon || ''),
        main: String(data.weather[0].main || 'Clouds'),
        description: String(data.weather[0].description || 'Current conditions'),
        name: String(data.name || name),
      });
    } catch (requestError: unknown) {
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : 'Weather is unavailable right now.'
      );
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
        <p className="weather-page__eyebrow">Quick tool</p>
        <h1>Weather</h1>
        <p>Check current golf conditions for any U.S. city or town.</p>
      </header>

      <section className="weather-card" aria-label="Weather lookup">
        <div className="weather-card__search">
          <div className="weather-card__toggle">
            <ToggleSwitch
              id="unitToggle"
              checked={isFahrenheit}
              onChange={setIsFahrenheit}
              label={isFahrenheit ? '°F' : '°C'}
            />
          </div>

          <form className="weather-card__input-group" onSubmit={handleSearch}>
            <LocationAutocomplete
              value={city}
              onChange={setCity}
              placeholder="City, state"
              inputClassName="weather-card__input"
              disabled={loading}
              ariaLabel="Weather location"
            />
            <button className="weather-card__btn" type="submit" disabled={loading}>
              {loading ? 'Checking…' : 'Check Weather'}
            </button>
          </form>

          {error && (
            <p className="weather-card__error" role="alert">
              {error}
            </p>
          )}
        </div>

        {weather && displayTemp !== null ? (
          <div className="weather-card__result">
            <div className="weather-result__icon-wrapper" aria-hidden="true">
              {renderIcon()}
            </div>
            <div className="weather-result__summary">
              <h2 className="weather-result__city">{weather.name}</h2>
              <p className="weather-result__desc">{weather.description}</p>
              <p className="weather-result__temp">
                {displayTemp}°{isFahrenheit ? 'F' : 'C'}
              </p>
            </div>

            <div className="weather-result__details">
              <div className="weather-detail">
                <WiRain className="weather-detail__icon" aria-hidden="true" />
                <span>Precipitation</span>
                <strong>{weather.precipitation} mm</strong>
              </div>
              <div className="weather-detail">
                <WiRaindrops className="weather-detail__icon" aria-hidden="true" />
                <span>Humidity</span>
                <strong>{weather.humidity}%</strong>
              </div>
              <div className="weather-detail">
                <WiStrongWind className="weather-detail__icon" aria-hidden="true" />
                <span>Wind</span>
                <strong>{weather.windSpeed} mph</strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="weather-card__empty">
            <WiCloudy aria-hidden="true" />
            <strong>No weather loaded yet</strong>
            <span>Search a location to see current conditions.</span>
          </div>
        )}
      </section>
    </main>
  );
};

export default Weather;

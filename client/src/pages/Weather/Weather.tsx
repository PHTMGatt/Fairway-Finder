import React, { useState } from 'react';
import {
  WiDaySunny,
  WiCloud,
  WiCloudy,
  WiRain,
  WiThunderstorm,
  WiSnow,
  WiFog,
} from 'react-icons/wi';
import ToggleSwitch from '../../components/ToggleSwitch/ToggleSwitch';
import './Weather.css';

/*
  Note; Map OpenWeather “main” values to react-icons/wi components
*/
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
  Squall: <WiCloud className="weather-icon" />,
  Tornado: <WiThunderstorm className="weather-icon" />,
};

const Weather: React.FC = () => {
  const [location, setLocation] = useState('');
  const [useFahrenheit, setUseFahrenheit] = useState(true); // Note; toggle state
  const [weather, setWeather] = useState<{
    temp: number;
    main: string;
    description: string;
    name: string;
  } | null>(null);

  // Note; Fetch and parse weather based on unit toggle
  const handleSearch = async () => {
    if (!location) return alert('Please enter a city name.');

    try {
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      const units = useFahrenheit ? 'imperial' : 'metric';
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
          location
        )}&units=${units}&appid=${apiKey}`
      );
      const data = await res.json();
      if (!data?.weather?.[0] || !data?.main) throw new Error();

      setWeather({
        temp: Math.round(data.main.temp),
        main: data.weather[0].main,
        description: data.weather[0].description,
        name: data.name,
      });
    } catch (err) {
      alert('Failed to fetch weather. Check city name.');
      console.error(err);
    }
  };

  return (
    <main className="weather-page">
      <div className="weather-card">
        <section className="weather-card__search">
          <h2 className="weather-card__title">Weather Forecast</h2>
          <p className="weather-card__desc">
            Enter a city to view current golf weather conditions.
          </p>

          <div className="weather-card__toggle">
            <ToggleSwitch
              id="unitToggle"
              checked={useFahrenheit}
              onChange={setUseFahrenheit}
              label={useFahrenheit ? '°F' : '°C'}
            />
          </div>

          <div className="weather-card__input-group">
            <input
              className="weather-card__input"
              type="text"
              placeholder="Enter city"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="weather-card__btn" onClick={handleSearch}>
              Check Weather
            </button>
          </div>
        </section>

        {weather && (
          <section className="weather-card__result">
            <div className="weather-result">
              <h3 className="weather-result__city">{weather.name}</h3>
              <div className="weather-result__icon-wrapper">
                {iconMap[weather.main] || (
                  <WiCloud className="weather-icon" />
                )}
              </div>
              <p className="weather-result__desc">
                {weather.description}
              </p>
              <p className="weather-result__temp">
                {weather.temp}°{useFahrenheit ? 'F' : 'C'}
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default Weather;

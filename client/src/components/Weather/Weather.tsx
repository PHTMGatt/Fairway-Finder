import { useEffect, useState } from 'react';
import './Weather.css';

/*
  Weather Component Usage:
  ------------------------
  Use this component when you want to display quick weather info 
  (temp + icon) for a specific trip's location (e.g., in TripDetails or Dashboard).
  
  DO NOT use this if you're already using a full Weather page 
  with detailed forecast — this is meant as a lightweight preview only.
*/

const Weather: React.FC<{ location: string }> = ({ location }) => {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    // Replace with your actual weather API logic (e.g., OpenWeather)
    const fetchWeather = async () => {
      try {
        const res = await fetch(`/api/weather?location=${location}`);
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        console.error('Failed to load weather', err);
      }
    };

    fetchWeather();
  }, [location]);

  if (!weather) return <p className="weather__loading">Loading weather...</p>;

  return (
    <div className="weather">
      <h4 className="weather__title">Weather in {location}</h4>
      <div className="weather__info">
        <img src={weather.icon} alt="weather icon" className="weather__icon" />
        <p className="weather__temp">{weather.temp}&deg;C</p>
      </div>
    </div>
  );
};

export default Weather;

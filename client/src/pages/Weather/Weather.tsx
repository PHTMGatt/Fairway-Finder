import React from 'react';
import './Weather.css';

/*
  Weather Page
  ------------
  This is your full weather view. Use it to fetch and display weather data
  for planned trips using a weather API (e.g., OpenWeather or WeatherAPI).
*/

const Weather: React.FC = () => {
  return (
    <main className="weather-page">
      <h2 className="weather-page__title">Weather Forecast</h2>
      <p className="weather-page__desc">
        Select a trip or enter a location to view current golf conditions.
      </p>
    </main>
  );
};

export default Weather;

import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { QUERY_TRIP } from '../../utils/queries';
import { WiRain, WiRaindrops, WiStrongWind } from 'react-icons/wi';
import { FaMapMarkerAlt } from 'react-icons/fa';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import './TripDetails.css';

interface WeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string }[];
  wind: { speed: number };
  rain?: { '1h': number };
  snow?: { '1h': number };
}

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [tripDate, setTripDate] = useState<string>(() => localStorage.getItem(`tripDate-${tripId}`) || '');
  const [weatherCity, setWeatherCity] = useState<string>(() => localStorage.getItem(`weatherCity-${tripId}`) || '');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string>('');

  useEffect(() => {
    const nav = window.history.state?.usr;
    if (nav?.date) {
      localStorage.setItem(`tripDate-${tripId}`, nav.date);
      setTripDate(nav.date);
    }
    if (nav?.city) {
      localStorage.setItem(`weatherCity-${tripId}`, nav.city);
      setWeatherCity(nav.city);
    }
  }, [tripId]);

  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId
  });
  const trip = data?.trip;

  const fetchWeather = (city: string) => {
    setWeatherLoading(true);
    setWeatherError('');
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch weather');
        return res.json();
      })
      .then(json => setWeatherData(json))
      .catch(err => setWeatherError(err.message))
      .finally(() => setWeatherLoading(false));
  };

  useEffect(() => {
    if (weatherCity) fetchWeather(weatherCity);
  }, [weatherCity]);

  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!weatherCity.trim()) return;
    localStorage.setItem(`weatherCity-${tripId}`, weatherCity);
    fetchWeather(weatherCity);
  };

  if (!tripId) return <p className="trip-details__status">❌ No trip ID provided.</p>;
  if (loading) return <p className="trip-details__status">Loading trip details…</p>;
  if (error || !trip) return <p className="trip-details__status">❌ Error loading trip: {error?.message}</p>;

  const precip = weatherData?.rain?.['1h'] ?? weatherData?.snow?.['1h'] ?? 0;

  return (
    <div className="trip-details">
      <h2 className="trip-details__title">{trip.name}</h2>
      <p className="trip-details__label">Date: <strong>{tripDate || 'N/A'}</strong></p>

      <form className="trip-details__weather-form" onSubmit={handleCitySubmit}>
        <input
          type="text"
          className="trip-details__weather-input"
          placeholder="Enter city for weather…"
          value={weatherCity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setWeatherCity(e.target.value)}
        />
        <button type="submit" className="trip-details__weather-btn" disabled={weatherLoading}>
          {weatherLoading ? 'Loading…' : 'Get Weather'}
        </button>
      </form>
      {weatherError && <p className="trip-details__status">❌ {weatherError}</p>}

      <section className="trip-details__top">
        <div className="trip-card">
          <div className="trip-card__header">Course Info</div>
          <div className="trip-card__body">
            <h3 className="trip-card__course-name">{trip.courses?.[0]?.name ?? 'No course selected'}</h3>
            <p>{trip.courses?.[0]?.address ?? 'No address available'}</p>
            {trip.courses?.[0]?.name && (
              <a
                className="trip-card__link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip.courses[0].name)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaMapMarkerAlt /> Open in Maps
              </a>
            )}
          </div>
        </div>

        <div className="trip-card">
          <div className="trip-card__header">Current Weather</div>
          <div className="trip-card__body">
            {weatherLoading ? (
              <p>Loading weather…</p>
            ) : weatherData ? (
              <>
                <p><strong>{weatherData.name}</strong></p>
                <p>{weatherData.weather[0].description}</p>
                <p><strong>{Math.round(weatherData.main.temp)}°F</strong></p>
                <p>
                  <WiRain /> {precip} mm &nbsp;
                  <WiRaindrops /> {weatherData.main.humidity}% &nbsp;
                  <WiStrongWind /> {weatherData.wind.speed} mph
                </p>
              </>
            ) : (
              <p>No weather data. Enter a city above.</p>
            )}
          </div>
        </div>
      </section>

      <section className="trip-details__scorecard">
        <h3>Scorecard</h3>
        <ScoreCard tripId={tripId} />
      </section>

      <button className="trip-details__back-btn" onClick={() => navigate(-1)}>
        ← Go Back
      </button>
    </div>
  );
};

export default TripDetails;

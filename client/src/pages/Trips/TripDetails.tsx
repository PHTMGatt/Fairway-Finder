// src/pages/Trips/TripDetails.tsx
import React, { useEffect, useState, ChangeEvent, FormEvent, useCallback } from 'react';
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

interface GolfCourseAPIResponse {
  id: number;
  club_name: string;
  course_name: string;
  tees: {
    male: {
      tee_name: string;
      course_rating: number;
      slope_rating: number;
    }[];
    female: {
      tee_name: string;
      course_rating: number;
      slope_rating: number;
    }[];
  };
}

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  // Note; localStorage cache for trip date + city
  const [tripDate, setTripDate] = useState<string>(() =>
    localStorage.getItem(`tripDate-${tripId}`) || ''
  );
  const [weatherCity, setWeatherCity] = useState<string>(() =>
    localStorage.getItem(`weatherCity-${tripId}`) || ''
  );

  // Note; Weather + API error states
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string>('');
  const [golfApiError, setGolfApiError] = useState<string>('');

  // Note; Load state from navigation if present
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

  // Note; Query trip data from server
  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId,
  });
  const trip = data?.trip;
  const courseName = trip?.courses?.[0]?.name;

  // Note; Fetch weather from backend endpoint
  const fetchWeather = (city: string) => {
    setWeatherLoading(true);
    setWeatherError('');
    fetch(`/api/weather?city=${encodeURIComponent(city)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch weather');
        return res.json();
      })
      .then((json) => setWeatherData(json))
      .catch((err) => setWeatherError(err.message))
      .finally(() => setWeatherLoading(false));
  };

  // ✅ Note; Fetch slope/rating and store in localStorage — now using useCallback
  const fetchSlopeAndRating = useCallback(async () => {
    if (!courseName) return;
    try {
      setGolfApiError('');
      const search = await fetch(
        `https://api.golfcourseapi.com/v1/search?search_query=${encodeURIComponent(courseName)}`,
        {
          headers: {
            Authorization: 'Key GLZ24EEJI7CXSIICUB6HPVLEFM',
          },
        }
      );
      const searchJson = await search.json();
      const firstResult = searchJson.courses?.[0];
      if (!firstResult) throw new Error('No course match found');

      const details = await fetch(
        `https://api.golfcourseapi.com/v1/courses/${firstResult.id}`,
        {
          headers: {
            Authorization: 'Key GLZ24EEJI7CXSIICUB6HPVLEFM',
          },
        }
      );
      const fullData: GolfCourseAPIResponse = await details.json();

      const firstTee = fullData.tees.male?.[0];
      if (!firstTee) throw new Error('No tee data found');

      localStorage.setItem(`slopeRating-${tripId}`, String(firstTee.slope_rating));
      localStorage.setItem(`courseRating-${tripId}`, String(firstTee.course_rating));
    } catch (err: any) {
      setGolfApiError(err.message || 'Error loading slope/rating');
    }
  }, [courseName, tripId]);

  // Note; Call weather API on mount if saved city exists
  useEffect(() => {
    if (weatherCity) fetchWeather(weatherCity);
  }, [weatherCity]);

  // ✅ Note; Call slope/rating logic when trip loads
  useEffect(() => {
    if (courseName) {
      fetchSlopeAndRating();
    }
  }, [courseName, fetchSlopeAndRating]);

  // Note; Submit handler for city
  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!weatherCity.trim()) return;
    localStorage.setItem(`weatherCity-${tripId}`, weatherCity);
    fetchWeather(weatherCity);
  };

  // Note; Status / error renders
  if (!tripId)
    return <p className="trip-details__status">❌ No trip ID provided.</p>;
  if (loading)
    return <p className="trip-details__status">Loading trip details…</p>;
  if (error || !trip)
    return (
      <p className="trip-details__status">
        ❌ Error loading trip: {error?.message}
      </p>
    );

  const precip =
    weatherData?.rain?.['1h'] ?? weatherData?.snow?.['1h'] ?? 0;

  return (
    <div className="trip-details">
      <h2 className="trip-details__title">{trip.name}</h2>
      <p className="trip-details__label">
        Date: <strong>{tripDate || 'N/A'}</strong>
      </p>

      {/* Note; Weather form */}
      <form className="trip-details__weather-form" onSubmit={handleCitySubmit}>
        <input
          type="text"
          className="trip-details__weather-input"
          placeholder="Enter city for weather…"
          value={weatherCity}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setWeatherCity(e.target.value)
          }
        />
        <button
          type="submit"
          className="trip-details__weather-btn"
          disabled={weatherLoading}
        >
          {weatherLoading ? 'Loading…' : 'Get Weather'}
        </button>
      </form>

      {/* Note; Error displays */}
      {weatherError && <p className="trip-details__status">❌ {weatherError}</p>}
      {golfApiError && <p className="trip-details__status">❌ {golfApiError}</p>}

      {/* Note; Course + weather cards */}
      <section className="trip-details__top">
        <div className="trip-card">
          <div className="trip-card__header">Course Info</div>
          <div className="trip-card__body">
            <h3 className="trip-card__course-name">
              {trip.courses?.[0]?.name ?? 'No course selected'}
            </h3>
            <p>{trip.courses?.[0]?.address ?? 'No address available'}</p>
            {trip.courses?.[0]?.name && (
              <a
                className="trip-card__link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  trip.courses[0].name
                )}`}
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
                <p>
                  <strong>{weatherData.name}</strong>
                </p>
                <p>{weatherData.weather[0].description}</p>
                <p>
                  <strong>{Math.round(weatherData.main.temp)}°F</strong>
                </p>
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

      {/* Note; Scorecard section */}
      <section className="trip-details__scorecard">
        <h3>Scorecard</h3>
        <ScoreCard tripId={tripId} />
      </section>

      {/* Note; Back navigation */}
      <button
        className="trip-details__back-btn"
        onClick={() => navigate(-1)}
      >
        ← Go Back
      </button>
    </div>
  );
};

export default TripDetails;

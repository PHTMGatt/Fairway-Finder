// client/src/pages/Trips/TripDetails.tsx

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
} from 'react';
import { useQuery } from '@apollo/client';
import { Link, useParams } from 'react-router-dom';
import { QUERY_TRIP } from '../../utils/queries';
import { WiRain, WiRaindrops, WiStrongWind } from 'react-icons/wi';
import { FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import { Alert } from 'react-bootstrap';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import {
  PersistedTripCourse,
  TeeRating,
  resolveGolfCourseLookup,
  storedTeeRating,
  weatherParamsForCourse,
} from './tripDetailsCourse';
import './TripDetails.css';

interface WeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string }[];
  wind: { speed: number };
  rain?: { '1h': number };
  snow?: { '1h': number };
}

interface TripCourse extends PersistedTripCourse {
  _id?: string;
  address?: string | null;
  rating?: number | null;
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
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string>('');
  const [golfApiError, setGolfApiError] = useState<string>('');
  const [teeRating, setTeeRating] = useState<TeeRating | null>(null);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId,
  });
  const trip = data?.trip;
  const course: TripCourse | undefined = trip?.courses?.[0];

  const fetchWeather = useCallback(async (params: URLSearchParams) => {
    setWeatherLoading(true);
    setWeatherError('');
    try {
      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      setWeatherData(await response.json());
    } catch (weatherRequestError: unknown) {
      setWeatherError(
        weatherRequestError instanceof Error
          ? weatherRequestError.message
          : 'Unable to load weather'
      );
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  const loadTeeRating = useCallback(async (selectedCourse: TripCourse) => {
    const persisted = storedTeeRating(selectedCourse);
    if (persisted) {
      setTeeRating(persisted);
      setGolfApiError('');
      return;
    }

    const lookup = resolveGolfCourseLookup(selectedCourse);
    if (!lookup) {
      setTeeRating(null);
      setGolfApiError('');
      return;
    }

    try {
      setGolfApiError('');
      let courseId: string;

      if (lookup.kind === 'details') {
        courseId = lookup.id;
      } else {
        const search = await fetch(
          `/api/golf/search?search_query=${encodeURIComponent(lookup.query)}`
        );
        if (!search.ok) {
          throw new Error('Unable to search golf course details');
        }

        const searchJson = await search.json();
        const firstResult = searchJson.courses?.[0];
        if (!firstResult?.id) {
          setTeeRating(null);
          return;
        }
        courseId = String(firstResult.id);
      }

      const details = await fetch(`/api/golf/${encodeURIComponent(courseId)}`);
      if (!details.ok) {
        throw new Error('Unable to load golf course details');
      }

      const fullData: GolfCourseAPIResponse = await details.json();
      const firstTee = fullData.tees.male?.[0];
      if (!firstTee) throw new Error('No tee data found');

      setTeeRating({
        slopeRating: firstTee.slope_rating,
        courseRating: firstTee.course_rating,
      });
    } catch (golfRequestError: unknown) {
      setGolfApiError(
        golfRequestError instanceof Error
          ? golfRequestError.message
          : 'Error loading slope/rating'
      );
      setTeeRating(null);
    }
  }, []);

  useEffect(() => {
    const params = weatherParamsForCourse(course);
    if (params) void fetchWeather(params);
  }, [course, fetchWeather]);

  useEffect(() => {
    if (course) {
      void loadTeeRating(course);
    } else {
      setTeeRating(null);
    }
  }, [course, loadTeeRating]);

  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    const city = weatherCity.trim();

    if (!city) {
      setShowAlert(true);
      return;
    }

    setShowAlert(false);
    void fetchWeather(new URLSearchParams({ city }));
  };

  if (!tripId) {
    return <p className="trip-details__status">❌ No trip ID provided.</p>;
  }
  if (loading) {
    return <p className="trip-details__status">Loading trip details…</p>;
  }
  if (error || !trip) {
    return (
      <p className="trip-details__status">
        ❌ Error loading trip: {error?.message}
      </p>
    );
  }

  const precip = weatherData?.rain?.['1h'] ?? weatherData?.snow?.['1h'] ?? 0;
  const mapsQuery = [course?.name, course?.address].filter(Boolean).join(' ');
  const routeDestination = mapsQuery || course?.name || '';
  const hasGooglePlace = course?.source === 'google' && course?.providerId;
  const mapsUrl = course?.name
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery || course.name)}${
        hasGooglePlace
          ? `&query_place_id=${encodeURIComponent(course.providerId as string)}`
          : ''
      }`
    : '';

  return (
    <div className="trip-details">
      <h2 className="trip-details__title">{trip.name}</h2>
      <p className="trip-details__label">
        Date: <strong>{trip.date || 'N/A'}</strong>
      </p>

      {showAlert && (
        <Alert
          variant="danger"
          onClose={() => setShowAlert(false)}
          dismissible
          className="trip-details__alert"
        >
          Please enter a weather location.
        </Alert>
      )}

      <form className="trip-details__weather-form" onSubmit={handleCitySubmit}>
        <input
          type="text"
          className="trip-details__weather-input"
          placeholder="Weather location (city, state)..."
          value={weatherCity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setWeatherCity(e.target.value)}
        />
        <button
          type="submit"
          className="trip-details__weather-btn"
          disabled={weatherLoading}
        >
          {weatherLoading ? 'Loading…' : 'Update Weather'}
        </button>
      </form>

      {weatherError && <p className="trip-details__status">❌ {weatherError}</p>}
      {golfApiError && <p className="trip-details__status">❌ {golfApiError}</p>}

      <section className="trip-details__top">
        <div className="trip-card">
          <div className="trip-card__header">Course Info</div>
          <div className="trip-card__body">
            <h3 className="trip-card__course-name">
              {course?.name ?? 'No course selected'}
            </h3>
            <p>{course?.address ?? 'No address available'}</p>
            {typeof course?.rating === 'number' && <p>⭐ {course.rating}</p>}
            {teeRating && (
              <p>
                Course rating {teeRating.courseRating} · Slope {teeRating.slopeRating}
              </p>
            )}
            {course?.name && (
              <div className="trip-card__actions">
                {mapsUrl && (
                  <a
                    className="trip-card__link"
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaMapMarkerAlt /> Open in Maps
                  </a>
                )}
                <Link
                  className="trip-card__link"
                  to="/routing"
                  state={{ destination: routeDestination }}
                >
                  <FaRoute /> Plan Route
                </Link>
              </div>
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
              <p>
                {course?.location
                  ? 'No weather data available right now.'
                  : 'No saved course location. Enter a weather location above.'}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="trip-details__scorecard">
        <h3>Scorecard</h3>
        <ScoreCard tripId={tripId} />
      </section>
    </div>
  );
};

export default TripDetails;

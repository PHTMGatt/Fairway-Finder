// client/src/pages/Trips/TripDetails.tsx

import React, {
  useEffect,
  useState,
  ChangeEvent,
  FormEvent,
  useCallback,
} from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Link, useParams } from 'react-router-dom';
import { QUERY_TRIP } from '../../utils/queries';
import { REMOVE_COURSE_FROM_TRIP } from '../../utils/mutations';
import { WiRain, WiRaindrops, WiStrongWind } from 'react-icons/wi';
import { FaCalendarAlt, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import { Alert } from 'react-bootstrap';
import ScoreCard from '../../components/ScoreCard/ScoreCard';
import {
  PersistedTripCourse,
  TeeRating,
  courseRemovalPrompt,
  resolveGolfCourseLookup,
  secondaryTripCourses,
  storedTeeRating,
  weatherParamsForCourse,
} from './tripDetailsCourse';
import './TripDetails.css';

interface TripForecastData {
  date: string;
  weather: { description: string }[];
  tempMax: number;
  tempMin: number;
  precipitation: number;
  windSpeed: number;
}

interface WeatherData {
  name: string;
  main: { temp: number; humidity: number };
  weather: { description: string }[];
  wind: { speed: number };
  rain?: { '1h': number };
  snow?: { '1h': number };
  forecastStatus?: 'available' | 'outside-window';
  forecast?: TripForecastData | null;
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const displayDate = (value: string) => {
  if (!ISO_DATE.test(value)) return value;
  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const mapsUrlForCourse = (selectedCourse?: TripCourse): string => {
  if (!selectedCourse?.name) return '';

  const query = [selectedCourse.name, selectedCourse.address].filter(Boolean).join(' ');
  const hasGooglePlace = selectedCourse.source === 'google' && selectedCourse.providerId;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query || selectedCourse.name
  )}${
    hasGooglePlace
      ? `&query_place_id=${encodeURIComponent(selectedCourse.providerId as string)}`
      : ''
  }`;
};

const TripDetails: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const [weatherCity, setWeatherCity] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');
  const [golfApiError, setGolfApiError] = useState('');
  const [courseActionError, setCourseActionError] = useState('');
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);
  const [teeRating, setTeeRating] = useState<TeeRating | null>(null);
  const [showAlert, setShowAlert] = useState(false);

  const { loading, error, data, refetch } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId,
  });
  const [removeCourseFromTrip] = useMutation(REMOVE_COURSE_FROM_TRIP);
  const trip = data?.trip;
  const courses: TripCourse[] = trip?.courses ?? [];
  const course = courses[0];

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
        if (!search.ok) throw new Error('Unable to search golf course details');

        const searchJson = await search.json();
        const firstResult = searchJson.courses?.[0];
        if (!firstResult?.id) {
          setTeeRating(null);
          return;
        }
        courseId = String(firstResult.id);
      }

      const details = await fetch(`/api/golf/${encodeURIComponent(courseId)}`);
      if (!details.ok) throw new Error('Unable to load golf course details');

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
    const params = weatherParamsForCourse(course, trip?.date);
    if (params) void fetchWeather(params);
  }, [course, fetchWeather, trip?.date]);

  useEffect(() => {
    if (course) void loadTeeRating(course);
    else setTeeRating(null);
  }, [course, loadTeeRating]);

  const handleCitySubmit = (event: FormEvent) => {
    event.preventDefault();
    const city = weatherCity.trim();

    if (!city) {
      setShowAlert(true);
      return;
    }

    setShowAlert(false);
    const params = new URLSearchParams({ city });
    if (typeof trip?.date === 'string' && ISO_DATE.test(trip.date)) {
      params.set('date', trip.date);
    }
    void fetchWeather(params);
  };

  const handleRemoveSecondaryCourse = async (selectedCourse: TripCourse) => {
    if (!tripId || !selectedCourse._id) return;

    const courseName = selectedCourse.name?.trim() || 'this course';
    if (!window.confirm(courseRemovalPrompt(courseName))) return;

    setCourseActionError('');
    setRemovingCourseId(selectedCourse._id);
    try {
      await removeCourseFromTrip({
        variables: { tripId, courseId: selectedCourse._id },
      });
      await refetch();
    } catch (removeError: unknown) {
      setCourseActionError(
        removeError instanceof Error && removeError.message
          ? removeError.message
          : 'Could not remove that course from the trip.'
      );
    } finally {
      setRemovingCourseId(null);
    }
  };

  if (!tripId) return <p className="trip-details__status">No trip ID provided.</p>;
  if (loading) return <p className="trip-details__status">Loading trip details…</p>;
  if (error || !trip) {
    return (
      <p className="trip-details__status trip-details__status--error">
        Error loading trip: {error?.message || 'Trip not found'}
      </p>
    );
  }

  const additionalCourses = secondaryTripCourses(courses);
  const precip = weatherData?.rain?.['1h'] ?? weatherData?.snow?.['1h'] ?? 0;
  const forecast = weatherData?.forecast ?? null;
  const routeDestination = [course?.name, course?.address].filter(Boolean).join(' ') || course?.name || '';
  const mapsUrl = mapsUrlForCourse(course);
  const hasSavedLocation = Boolean(course?.location);

  return (
    <main className="trip-details">
      <header className="trip-details__hero">
        <p className="trip-details__eyebrow">Trip hub</p>
        <h1 className="trip-details__title">{trip.name}</h1>
        <div className="trip-details__meta">
          <span>
            <FaCalendarAlt aria-hidden="true" />{' '}
            {trip.date ? displayDate(trip.date) : 'Date not set'}
          </span>
          <span>{courses.length} {courses.length === 1 ? 'course' : 'courses'}</span>
          {course?.name && <span>{course.name}</span>}
        </div>
      </header>

      <section className="trip-details__overview" aria-label="Trip overview">
        <article className="trip-details__card">
          <div className="trip-details__card-header">Course</div>
          <div className="trip-details__card-body">
            <h2 className="trip-details__course-name">
              {course?.name ?? 'No course selected'}
            </h2>
            <p className="trip-details__muted">
              {course?.address ?? 'No address available'}
            </p>
            <div className="trip-details__facts">
              {typeof course?.rating === 'number' && (
                <span>★ {course.rating} Google rating</span>
              )}
              {teeRating && (
                <span>
                  Rating {teeRating.courseRating} · Slope {teeRating.slopeRating}
                </span>
              )}
            </div>
            {golfApiError && (
              <p className="trip-details__inline-error">{golfApiError}</p>
            )}
            {courseActionError && (
              <p className="trip-details__inline-error" role="alert">
                {courseActionError}
              </p>
            )}

            {additionalCourses.length > 0 && (
              <div className="trip-details__additional-courses">
                <h3>Also on this trip</h3>
                <ul>
                  {additionalCourses.map((additionalCourse, index) => {
                    const additionalMapsUrl = mapsUrlForCourse(additionalCourse);
                    const isRemoving = removingCourseId === additionalCourse._id;
                    return (
                      <li key={additionalCourse._id ?? `${additionalCourse.name}-${index}`}>
                        <div>
                          <strong>{additionalCourse.name || 'Unnamed course'}</strong>
                          {additionalCourse.address && <span>{additionalCourse.address}</span>}
                        </div>
                        <div className="trip-details__course-row-actions">
                          {additionalMapsUrl && (
                            <a
                              href={additionalMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Maps
                            </a>
                          )}
                          {additionalCourse._id && (
                            <button
                              type="button"
                              className="trip-details__remove-course"
                              disabled={Boolean(removingCourseId)}
                              onClick={() => void handleRemoveSecondaryCourse(additionalCourse)}
                            >
                              {isRemoving ? 'Removing…' : 'Remove'}
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="trip-details__card-actions">
              {mapsUrl && (
                <a
                  className="trip-details__action-link"
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaMapMarkerAlt aria-hidden="true" /> Open in Maps
                </a>
              )}
              {course?.name && (
                <Link
                  className="trip-details__action-link trip-details__action-link--primary"
                  to="/routing"
                  state={{ destination: routeDestination }}
                >
                  <FaRoute aria-hidden="true" /> Plan Route
                </Link>
              )}
              {courses.length < 20 ? (
                <Link
                  className="trip-details__action-link"
                  to="/courses"
                  state={{ addToTripId: tripId }}
                >
                  + Add another course
                </Link>
              ) : (
                <span className="trip-details__limit-note">20-course limit reached</span>
              )}
            </div>
          </div>
        </article>

        <article className="trip-details__card">
          <div className="trip-details__card-header">Weather</div>
          <div className="trip-details__card-body">
            {weatherLoading ? (
              <p className="trip-details__muted">Loading weather…</p>
            ) : weatherData ? (
              <div className="trip-details__weather-summary">
                <div>
                  <strong>{weatherData.name}</strong>
                  <span>
                    {forecast
                      ? `Trip forecast · ${displayDate(forecast.date)}`
                      : weatherData.weather[0]?.description || 'Current conditions'}
                  </span>
                </div>
                {forecast ? (
                  <>
                    <strong className="trip-details__temperature">
                      {Math.round(forecast.tempMax)}° / {Math.round(forecast.tempMin)}°F
                    </strong>
                    <div className="trip-details__weather-facts">
                      <span><WiRain aria-hidden="true" /> {forecast.precipitation} mm</span>
                      <span><WiStrongWind aria-hidden="true" /> {forecast.windSpeed} mph max</span>
                    </div>
                  </>
                ) : (
                  <>
                    <strong className="trip-details__temperature">
                      {Math.round(weatherData.main.temp)}°F
                    </strong>
                    <div className="trip-details__weather-facts">
                      <span><WiRain aria-hidden="true" /> {precip} mm</span>
                      <span><WiRaindrops aria-hidden="true" /> {weatherData.main.humidity}%</span>
                      <span><WiStrongWind aria-hidden="true" /> {weatherData.wind.speed} mph</span>
                    </div>
                  </>
                )}
                {weatherData.forecastStatus === 'outside-window' && trip.date && (
                  <p className="trip-details__muted">
                    Trip-date forecast becomes available within 16 days. Showing current conditions for now.
                  </p>
                )}
              </div>
            ) : (
              <p className="trip-details__muted">
                {hasSavedLocation
                  ? 'Weather is unavailable right now.'
                  : 'This older trip has no saved course coordinates yet.'}
              </p>
            )}

            {weatherError && (
              <p className="trip-details__inline-error">{weatherError}</p>
            )}

            <details className="trip-details__weather-override" open={!hasSavedLocation}>
              <summary>
                {hasSavedLocation ? 'Check another location' : 'Enter a weather location'}
              </summary>
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
                  placeholder="City, state"
                  value={weatherCity}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setWeatherCity(event.target.value)
                  }
                />
                <button
                  type="submit"
                  className="trip-details__weather-btn"
                  disabled={weatherLoading}
                >
                  {weatherLoading ? 'Loading…' : 'Update Weather'}
                </button>
              </form>
            </details>
          </div>
        </article>
      </section>

      <section className="trip-details__scorecard">
        <div className="trip-details__section-heading">
          <p className="trip-details__eyebrow">Game day</p>
          <h2>Players & scorecard</h2>
        </div>
        <ScoreCard tripId={tripId} />
      </section>
    </main>
  );
};

export default TripDetails;

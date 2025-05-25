import { useQuery } from '@apollo/client';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QUERY_TRIP } from '../../utils/queries';
import ScoreCard from './ScoreCard';
import './TripResults.css';

const TripResults: React.FC = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [tripDate, setTripDate] = useState(() => localStorage.getItem(`tripDate-${tripId}`) || '');
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    const navState = window.history.state?.usr;
    if (navState?.tripDate) {
      localStorage.setItem(`tripDate-${tripId}`, navState.tripDate);
      setTripDate(navState.tripDate);
    }
  }, [tripId]);

  const { loading, error, data } = useQuery(QUERY_TRIP, {
    variables: { id: tripId },
    skip: !tripId,
  });

  useEffect(() => {
    const fetchWeather = async () => {
      if (!tripDate) return;
      try {
        setWeatherLoading(true);
        const response = await fetch(`/api/weather?city=Howell`); // TODO: Dynamically set city
        const result = await response.json();
        setWeatherData(result);
      } catch (err) {
        console.error('Failed to fetch weather:', err);
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, [tripDate]);

  if (!tripId) return <p className="trip-results__status">❌ No trip ID provided.</p>;
  if (loading) return <p className="trip-results__status">Loading trip details...</p>;
  if (error || !data?.trip) return <p className="trip-results__status">❌ Error loading trip: {error?.message}</p>;

  const trip = data.trip;
  const selectedCourse = trip?.courses?.[0];

  return (
    <div className="trip-results">
      <h2 className="trip-results__title">{trip.name}</h2>
      <p className="trip-results__label">Date: <strong>{tripDate || 'N/A'}</strong></p>

      <div className="trip-results__top">
        <div className="trip-results__card trip-results__course-card">
          <h3>{selectedCourse?.name || 'No course selected'}</h3>
          <p>{selectedCourse?.address || 'No address available'}</p>
          {selectedCourse?.name && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                selectedCourse.name
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="trip-results__map-link"
            >
              Open in Maps
            </a>
          )}
        </div>

        <div className="trip-results__card trip-results__weather-card">
          <h3>Weather Forecast</h3>
          {weatherLoading ? (
            <p>Loading weather for <strong>{tripDate}</strong>...</p>
          ) : weatherData ? (
            <>
              <p><strong>{weatherData.name}</strong></p>
              <p>{weatherData.weather?.[0]?.description || 'No description available'}</p>
              <p><strong>{Math.round(weatherData.main?.temp)}°F</strong></p>
            </>
          ) : (
            <p>No weather data available for <strong>{tripDate}</strong>.</p>
          )}
        </div>
      </div>

      <section className="trip-results__scorecard">
        <h3>Scorecard</h3>
        <ScoreCard tripId={trip._id} />
      </section>

      <button className="trip-results__back-btn" onClick={() => navigate(-1)}>← Go Back</button>
    </div>
  );
};

export default TripResults;

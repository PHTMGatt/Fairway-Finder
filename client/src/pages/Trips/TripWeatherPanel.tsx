// client/src/pages/Trips/TripWeatherPanel.tsx
import React from 'react';
import { WiRain, WiRaindrops, WiStrongWind } from 'react-icons/wi';
import Notice from '../../components/ui/Notice';
import { Button, Chip, Field, Panel } from '../../components/ui/primitives';
import { PersistedTripCourse } from './tripDetailsCourse';
import { WeatherData } from '../../utils/weatherApi';
import { useTripWeather } from './useTripWeather';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const displayDate = (value: string) => {
  if (!ISO_DATE.test(value)) return value;
  return new Date(`${value}T12:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const Conditions: React.FC<{ weather: WeatherData; tripDate?: string | null }> = ({
  weather,
  tripDate,
}) => {
  const forecast = weather.forecast ?? null;
  const precip = weather.rain?.['1h'] ?? weather.snow?.['1h'] ?? 0;

  return (
    <div className="trip-details__weather">
      <p className="trip-details__weather-where">
        <strong>{weather.name}</strong>
        <span>
          {forecast
            ? `Trip forecast · ${displayDate(forecast.date)}`
            : weather.weather[0]?.description || 'Current conditions'}
        </span>
      </p>
      <p className="trip-details__temperature">
        {forecast
          ? `${Math.round(forecast.tempMax)}° / ${Math.round(forecast.tempMin)}°F`
          : `${Math.round(weather.main.temp)}°F`}
      </p>
      <div className="trip-details__chips">
        <Chip icon={<WiRain />}>{forecast ? forecast.precipitation : precip} mm</Chip>
        {!forecast && <Chip icon={<WiRaindrops />}>{weather.main.humidity}%</Chip>}
        <Chip icon={<WiStrongWind />}>
          {forecast ? `${forecast.windSpeed} mph max` : `${weather.wind.speed} mph`}
        </Chip>
      </div>
      {weather.forecastStatus === 'outside-window' && tripDate && (
        <p className="trip-details__muted">
          Trip-date forecast becomes available within 16 days. Showing current conditions for now.
        </p>
      )}
    </div>
  );
};

interface TripWeatherPanelProps {
  course?: PersistedTripCourse | null;
  tripDate?: string | null;
}

const TripWeatherPanel: React.FC<TripWeatherPanelProps> = ({ course, tripDate }) => {
  const weather = useTripWeather(course, tripDate);
  const hasSavedLocation = Boolean(course?.location);

  return (
    <Panel title="Weather">
      {weather.loading ? (
        <p className="trip-details__muted" role="status">
          Loading weather…
        </p>
      ) : weather.data ? (
        <Conditions weather={weather.data} tripDate={tripDate} />
      ) : (
        <p className="trip-details__muted">
          {hasSavedLocation
            ? 'Weather is unavailable right now.'
            : 'This older trip has no saved course coordinates yet.'}
        </p>
      )}

      {weather.error && (
        <Notice tone="danger" className="trip-details__alert">
          {weather.error}
        </Notice>
      )}

      <details className="trip-details__override" open={!hasSavedLocation}>
        <summary>{hasSavedLocation ? 'Check another location' : 'Enter a weather location'}</summary>
        {weather.missingCity && (
          <Notice tone="danger" onClose={weather.dismissMissingCity} className="trip-details__alert">
            Please enter a weather location.
          </Notice>
        )}
        <form className="trip-details__weather-form" onSubmit={weather.submitCity}>
          <Field label="Weather location" hideLabel>
            <input
              type="text"
              placeholder="City, state"
              value={weather.city}
              onChange={(event) => weather.setCity(event.target.value)}
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={weather.loading}>
            {weather.loading ? 'Loading…' : 'Update Weather'}
          </Button>
        </form>
      </details>
    </Panel>
  );
};

export default TripWeatherPanel;

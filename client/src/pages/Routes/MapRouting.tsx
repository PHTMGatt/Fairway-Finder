// client/src/pages/Routes/MapRouting.tsx

import React, { useState, FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFlagCheckered, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import { hasGoogleMapsKey } from '../../utils/mapCapability';
import { canPlanRoute, readRoutePlannerPrefill } from './routePlanner';
import './MapRouting.css';

type FilterType = 'golf_course' | 'restaurant' | 'gas_station' | 'rest_area';

const MapRouting: React.FC = () => {
  const location = useLocation();
  const [initialState] = useState(() => readRoutePlannerPrefill(location.state));
  const [origin, setOrigin] = useState(initialState.origin);
  const [destination, setDestination] = useState(initialState.destination);
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [submitted, setSubmitted] = useState(initialState.submitted);
  const interactiveMapAvailable = hasGoogleMapsKey(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  );

  const toggleFilter = (type: FilterType) => {
    setFilters((prev) =>
      prev.includes(type) ? prev.filter((filter) => filter !== type) : [...prev, type]
    );
  };

  const handleOriginChange = (value: string) => {
    setOrigin(value);
    setSubmitted(false);
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setSubmitted(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canPlanRoute(origin, destination)) return;
    setSubmitted(true);
  };

  const readyToPlan = canPlanRoute(origin, destination);
  const externalDirectionsUrl = readyToPlan
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.trim())}&destination=${encodeURIComponent(destination.trim())}`
    : '';

  return (
    <main className="map-routing">
      <header className="map-routing__hero">
        <div>
          <p className="map-routing__eyebrow">Trip routing</p>
          <h1 className="map-routing__title">Get the group from here to the first tee.</h1>
          <p className="map-routing__intro">
            {destination
              ? 'Your saved course is ready. Add where you are starting, then build the route and nearby stops.'
              : 'Choose a start and destination. Fairway Finder keeps the map quiet until you are ready to load the route.'}
          </p>
        </div>
        <div className="map-routing__hero-mark" aria-hidden="true">
          <FaRoute />
        </div>
      </header>

      <section className="map-routing__workspace" aria-labelledby="route-controls-title">
        <div className="map-routing__controls">
          <div className="map-routing__controls-heading">
            <div>
              <p className="map-routing__eyebrow">Drive plan</p>
              <h2 id="route-controls-title">Build your route</h2>
            </div>
            <span className={`map-routing__readiness${readyToPlan ? ' is-ready' : ''}`}>
              {readyToPlan ? 'Ready to route' : 'Add both locations'}
            </span>
          </div>

          <form className="map-routing__form" onSubmit={handleSubmit}>
            <label className="map-routing__field">
              <span><FaMapMarkerAlt aria-hidden="true" /> Starting point</span>
              <LocationAutocomplete
                value={origin}
                onChange={handleOriginChange}
                placeholder="Start location"
                inputClassName="map-routing__input"
                ariaLabel="Route start location"
              />
            </label>
            <label className="map-routing__field">
              <span><FaFlagCheckered aria-hidden="true" /> Course / destination</span>
              <LocationAutocomplete
                value={destination}
                onChange={handleDestinationChange}
                placeholder="Destination"
                inputClassName="map-routing__input"
                ariaLabel="Route destination"
              />
            </label>
            <button className="map-routing__btn" type="submit" disabled={!readyToPlan}>
              <FaRoute aria-hidden="true" />
              Plan Route
            </button>
          </form>

          {interactiveMapAvailable ? (
            <div className="map-routing__poi">
              <span className="map-routing__poi-label">Show along the route</span>
              <div className="map-routing__filters" aria-label="Route points of interest">
                <button
                  type="button"
                  onClick={() => toggleFilter('golf_course')}
                  className={`filter-btn ${filters.includes('golf_course') ? 'active' : ''}`}
                  aria-pressed={filters.includes('golf_course')}
                >
                  ⛳ Golf
                </button>
                <button
                  type="button"
                  onClick={() => toggleFilter('restaurant')}
                  className={`filter-btn ${filters.includes('restaurant') ? 'active' : ''}`}
                  aria-pressed={filters.includes('restaurant')}
                >
                  🍔 Food
                </button>
                <button
                  type="button"
                  onClick={() => toggleFilter('gas_station')}
                  className={`filter-btn ${filters.includes('gas_station') ? 'active' : ''}`}
                  aria-pressed={filters.includes('gas_station')}
                >
                  ⛽ Gas
                </button>
                <button
                  type="button"
                  onClick={() => toggleFilter('rest_area')}
                  className={`filter-btn ${filters.includes('rest_area') ? 'active' : ''}`}
                  aria-pressed={filters.includes('rest_area')}
                >
                  💤 Rest
                </button>
              </div>
            </div>
          ) : (
            <div className="map-routing__capability" role="status">
              <strong>Interactive map unavailable here.</strong>
              <span>Fairway Finder can still hand the route off to Google Maps.</span>
            </div>
          )}
        </div>

        <div className={`map-routing__map${submitted ? '' : ' map-routing__map--empty'}`}>
          {submitted && interactiveMapAvailable ? (
            <>
              <div className="map-overlay">Drag the map to explore your route</div>
              <GoogleMapView
                origin={origin}
                destination={destination}
                maxDistance="30"
                filters={filters}
              />
            </>
          ) : (
            <div className="map-routing__empty">
              <span className="map-routing__empty-icon" aria-hidden="true">⌖</span>
              <strong>
                {submitted && !interactiveMapAvailable
                  ? 'Interactive map unavailable.'
                  : 'No route loaded yet.'}
              </strong>
              <span>
                {submitted && !interactiveMapAvailable
                  ? 'Use the external directions link below.'
                  : destination
                    ? 'Add your starting point, then select Plan Route.'
                    : 'Choose a start and destination, then select Plan Route.'}
              </span>
              {submitted && externalDirectionsUrl && (
                <a
                  className="map-routing__btn map-routing__btn--external"
                  href={externalDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open directions in Google Maps
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default MapRouting;

// client/src/pages/Routes/MapRouting.tsx

import React, { useState, FormEvent } from 'react';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import { canPlanRoute, createInitialRoutePlannerState } from './routePlanner';
import './MapRouting.css';

type FilterType = 'golf_course' | 'restaurant' | 'gas_station' | 'rest_area';

const MapRouting: React.FC = () => {
  const initialState = createInitialRoutePlannerState();
  const [origin, setOrigin] = useState(initialState.origin);
  const [destination, setDestination] = useState(initialState.destination);
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [submitted, setSubmitted] = useState(initialState.submitted);

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

  return (
    <main className="map-routing">
      <h2 className="map-routing__title">Route Planner</h2>
      <p className="map-routing__intro">
        Enter where you are starting and where you are headed. Fairway Finder only loads a route after you ask for one.
      </p>

      <form className="map-routing__form" onSubmit={handleSubmit}>
        <LocationAutocomplete
          value={origin}
          onChange={handleOriginChange}
          placeholder="Start location"
          inputClassName="map-routing__input"
          ariaLabel="Route start location"
        />
        <LocationAutocomplete
          value={destination}
          onChange={handleDestinationChange}
          placeholder="Destination"
          inputClassName="map-routing__input"
          ariaLabel="Route destination"
        />
        <button className="map-routing__btn" type="submit" disabled={!readyToPlan}>
          Plan Route
        </button>
      </form>

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

      <div className={`map-routing__map${submitted ? '' : ' map-routing__map--empty'}`}>
        {submitted ? (
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
            <strong>No route loaded yet.</strong>
            <span>Choose a start and destination, then select Plan Route.</span>
          </div>
        )}
      </div>
    </main>
  );
};

export default MapRouting;

// client/src/pages/Routes/MapRouting.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import LocationAutocomplete from '../../components/LocationAutocomplete/LocationAutocomplete';
import './MapRouting.css';

type FilterType = 'golf_course' | 'restaurant' | 'gas_station' | 'rest_area';

const MapRouting: React.FC = () => {
  const [origin, setOrigin] = useState('Detroit, Michigan');
  const [destination, setDestination] = useState('Ann Arbor, Michigan');
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setSubmitted(true);
  }, []);

  const toggleFilter = (type: FilterType) => {
    setFilters((prev) =>
      prev.includes(type) ? prev.filter((filter) => filter !== type) : [...prev, type]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;
    setSubmitted(true);
  };

  return (
    <main className="map-routing">
      <h2 className="map-routing__title">Route Planner</h2>

      <form className="map-routing__form" onSubmit={handleSubmit}>
        <LocationAutocomplete
          value={origin}
          onChange={setOrigin}
          placeholder="Start Location"
          inputClassName="map-routing__input"
          ariaLabel="Route start location"
        />
        <LocationAutocomplete
          value={destination}
          onChange={setDestination}
          placeholder="End Location"
          inputClassName="map-routing__input"
          ariaLabel="Route destination"
        />
        <button className="map-routing__btn" type="submit">
          Go
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

      <div className="map-routing__map">
        <div className="map-overlay">Drag the map to explore your route</div>
        {submitted && (
          <GoogleMapView
            origin={origin}
            destination={destination}
            maxDistance="30"
            filters={filters}
          />
        )}
      </div>
    </main>
  );
};

export default MapRouting;

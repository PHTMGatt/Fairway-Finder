// src/pages/MapRouting.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import './MapRouting.css';

type FilterType = 'golf_course' | 'restaurant' | 'gas_station' | 'rest_area';

const MapRouting: React.FC = () => {
  const [origin, setOrigin] = useState('Detroit, MI'); // Note; Default origin on load
  const [destination, setDestination] = useState('Ann Arbor, MI'); // Note; Default destination
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Note; Auto-submit map load once default values are set
  useEffect(() => {
    setSubmitted(true);
  }, []);

  const toggleFilter = (type: FilterType) => {
    setFilters((prev) =>
      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="map-routing">
      <h2 className="map-routing__title">Route Planner</h2>

      <form className="map-routing__form" onSubmit={handleSubmit}>
        <input
          className="map-routing__input"
          type="text"
          placeholder="Start Location"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          className="map-routing__input"
          type="text"
          placeholder="End Location"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <button className="map-routing__btn" type="submit">
          Go
        </button>
      </form>

      <div className="map-routing__filters">
        <button
          onClick={() => toggleFilter('golf_course')}
          className={`filter-btn ${filters.includes('golf_course') ? 'active' : ''}`}
        >
          ⛳ Golf
        </button>
        <button
          onClick={() => toggleFilter('restaurant')}
          className={`filter-btn ${filters.includes('restaurant') ? 'active' : ''}`}
        >
          🍔 Food
        </button>
        <button
          onClick={() => toggleFilter('gas_station')}
          className={`filter-btn ${filters.includes('gas_station') ? 'active' : ''}`}
        >
          ⛽ Gas
        </button>
        <button
          onClick={() => toggleFilter('rest_area')}
          className={`filter-btn ${filters.includes('rest_area') ? 'active' : ''}`}
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
            maxDistance="0"
            filters={filters}
          />
        )}
      </div>
    </main>
  );
};

export default MapRouting;

// 'src/pages/MapRouting.tsx'

import React, { useState, useEffect, FormEvent } from 'react';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import './MapRouting.css';

type FilterType = 'golf_course' | 'restaurant' | 'gas_station' | 'rest_area';

const MapRouting: React.FC = () => {
  // Note; Default origin/destination
  const [origin, setOrigin] = useState('Detroit, MI');
  const [destination, setDestination] = useState('Ann Arbor, MI');

  // Note; POI filters + submission control
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Note; Trigger map load on initial mount
  useEffect(() => {
    setSubmitted(true);
  }, []);

  // Note; Toggle individual POI filter
  const toggleFilter = (type: FilterType) => {
    setFilters((prev) =>
      prev.includes(type) ? prev.filter((f) => f !== type) : [...prev, type]
    );
  };

  // Note; Submit origin/destination form
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="map-routing">
      {/* Note; Animated title */}
      <h2 className="map-routing__title">Route Planner</h2>

      {/* Note; Origin/Destination form */}
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

      {/* Note; POI Filter Buttons */}
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

      {/* Note; Map container with overlay prompt */}
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

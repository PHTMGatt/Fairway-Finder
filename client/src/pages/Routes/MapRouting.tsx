// src/pages/Routes/MapRouting.tsx

import React, { useState, FormEvent } from 'react';
import GoogleMapView from '../../components/MapView/GoogleMapView';
import './MapRouting.css';

interface RouteParams {
  origin: string;        // Note; Start location for your trip
  destination: string;   // Note; End location for your trip
  maxDistance: string;   // Note; Maximum distance filter for courses
}

const MapRouting: React.FC = () => {
  // Note; Controlled form inputs
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [maxDistance, setMaxDistance] = useState<string>('');

  // Note; Consolidated params that drive the map drawing
  const [routeParams, setRouteParams] = useState<RouteParams>({
    origin: '',
    destination: '',
    maxDistance: '',
  });

  // Note; Update routeParams when the form is submitted
  const handleRouteSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRouteParams({ origin, destination, maxDistance });
  };

  return (
    <main className="map-routing">
      {/* Note; Page heading */}
      <h2 className="map-routing__title">Route Planner</h2>

      {/* Note; User inputs for origin, destination, and max distance */}
      <form className="map-routing__form" onSubmit={handleRouteSubmit}>
        <input
          className="map-routing__input"
          type="text"
          placeholder="Start Location"
          value={origin}
          onChange={e => setOrigin(e.target.value)}
        />
        <input
          className="map-routing__input"
          type="text"
          placeholder="End Location"
          value={destination}
          onChange={e => setDestination(e.target.value)}
        />
        <input
          className="map-routing__input"
          type="text"
          placeholder="Max Distance (miles)"
          value={maxDistance}
          onChange={e => setMaxDistance(e.target.value)}
        />
        <button className="btn map-routing__btn" type="submit">
          Go
        </button>
      </form>

      {/* Note; Map container with overlay instructions */}
      <div className="map-routing__map">
        <div className="map-overlay">
          Drag the map to explore your route
        </div>
        <GoogleMapView
          key={`${routeParams.origin}-${routeParams.destination}-${routeParams.maxDistance}`}
          origin={routeParams.origin}
          destination={routeParams.destination}
          maxDistance={routeParams.maxDistance}
        />
      </div>
    </main>
  );
};

export default MapRouting;

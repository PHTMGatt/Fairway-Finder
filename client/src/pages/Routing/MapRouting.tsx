// src/pages/Routing/MapRouting.tsx

import React, { useState, FormEvent } from 'react';
import GoogleMapView from '../../components/GoogleMap/GoogleMapView';
import './MapRouting.css';

const MapRouting: React.FC = () => {
  // Note; Origin & destination controlled by the form
  const [origin, setOrigin] = useState('Orlando,FL');
  const [destination, setDestination] = useState('Tampa,FL');
  // Note; Trigger a new render of GoogleMapView when user submits
  const [routeParams, setRouteParams] = useState<{
    origin: string;
    destination: string;
  }>({ origin, destination });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRouteParams({ origin, destination });
  };

  return (
    <main className="map-routing">
      <h2 className="map-routing__title">Route Planner</h2>

      <form className="map-routing__form" onSubmit={handleSubmit}>
        {/* Note; Start location input */}
        <input
          className="map-routing__input"
          placeholder="Start Location"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        {/* Note; End location input */}
        <input
          className="map-routing__input"
          placeholder="End Location"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        {/* Note; Search button */}
        <button className="btn map-routing__btn" type="submit">
          Go
        </button>
      </form>

      {/* Note; Map container with draggable overlay */}
      <div className="map-routing__map">
        {/* Note; Black glass “drag me” overlay */}
        <div className="map-overlay">
          Drag the map to explore your route
        </div>
        {/* Note; Pass the latest search parameters into the map component */}
        <GoogleMapView
          origin={routeParams.origin}
          destination={routeParams.destination}
        />
      </div>
    </main>
  );
};

export default MapRouting;

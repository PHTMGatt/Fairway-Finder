import React, { useState, FormEvent } from 'react';
import GoogleMapView from '../../components/GoogleMap/GoogleMapView';
import './MapRouting.css';

const MapRouting: React.FC = () => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [routeParams, setRouteParams] = useState<{
    origin: string;
    destination: string;
    maxDistance: string;
  }>({ origin: '', destination: '', maxDistance: '' });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setRouteParams({ origin, destination, maxDistance });
  };

  return (
    <main className="map-routing">
      <h2 className="map-routing__title">Route Planner</h2>

      <form className="map-routing__form" onSubmit={handleSubmit}>
        <input
          className="map-routing__input"
          placeholder="Start Location"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        />
        <input
          className="map-routing__input"
          placeholder="End Location"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        <input
          className="map-routing__input"
          placeholder="Max Distance (miles)"
          value={maxDistance}
          onChange={(e) => setMaxDistance(e.target.value)}
        />
        <button className="btn map-routing__btn" type="submit">
          Go
        </button>
      </form>

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

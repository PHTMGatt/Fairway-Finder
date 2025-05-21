import React from 'react';
import GoogleMapView from '../../components/GoogleMap/GoogleMapView';
import './MapRouting.css';

/*
  MapRouting Component
  --------------------
  This is your main map interaction page.
  Ideal place to embed routing logic using Google Maps API or similar.
*/

const MapRouting: React.FC = () => {
  return (
    <main className="map-routing container">
      <h2 className="map-routing__title">Trip Planner</h2>
      <p className="map-routing__desc">
        Use the map below to plan and visualize your golf route.
      </p>

      <div className="map-routing__map-container">
        <GoogleMapView />
      </div>
    </main>
  );
};

export default MapRouting;

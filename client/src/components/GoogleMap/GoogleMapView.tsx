import React from 'react';
import { Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import './GoogleMapView.css';

const GoogleMapView: React.FC = () => {
  const handleCameraChange = (ev: MapCameraChangedEvent) => {
    const { center, zoom } = ev.detail;
    console.log('camera changed:', center, 'zoom:', zoom);
  };

  return (
    <div className="google-map">
      <Map
        defaultZoom={7}
        defaultCenter={{ lat: 27.6648, lng: -81.5158 }}
        onCameraChanged={handleCameraChange}
      />
    </div>
  );
};

export default GoogleMapView;

// import { APIProvider, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps'; is in App.tsx

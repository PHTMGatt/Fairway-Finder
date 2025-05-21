import React from 'react';
import { Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';

const GoogleMapView: React.FC = () => {
  const handleCameraChange = (ev: MapCameraChangedEvent) => {
    const { center, zoom } = ev.detail;
    console.log('camera changed:', center, 'zoom:', zoom);
  };

  return (
    <Map
      defaultZoom={7}
      defaultCenter={{ lat: 27.6648, lng: -81.5158 }}
      onCameraChanged={handleCameraChange}
    />
  );
};

export default GoogleMapView;

// import { APIProvider, Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps'; will go in App.tsx

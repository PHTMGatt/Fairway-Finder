import React from 'react';
import { Map, MapCameraChangedEvent } from '@vis.gl/react-google-maps';

const MyMap: React.FC = () => (
  <Map
    defaultZoom={7}
    defaultCenter={{ lat: 27.6648, lng: -81.5158 }}
    onCameraChanged={(ev: MapCameraChangedEvent) =>
      console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
    }
  />
);

export default MyMap;

//import {APIProvider, Map, MapCameraChangedEvent} from '@vis.gl/react-google-maps'; will go in App.tsx
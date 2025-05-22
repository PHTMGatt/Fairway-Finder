// src/components/GoogleMapView/GoogleMapView.tsx

import React, { useRef, useEffect } from 'react';

type GoogleMapViewProps = {
  origin: string;
  destination: string;
};

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  origin,
  destination,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const MAP_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!MAP_KEY) {
      console.error('Missing VITE_GOOGLE_MAPS_API_KEY');
      return;
    }

    // Load script once
    if (!document.getElementById('gmaps-script')) {
      const script = document.createElement('script');
      script.id = 'gmaps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${MAP_KEY}&libraries=geometry`;
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (!mapRef.current || !(window as any).google) return;
      const googleMaps = (window as any).google.maps;
      const map = new googleMaps.Map(mapRef.current, {
        center: { lat: 27.6648, lng: -81.5158 },
        zoom: 7,
      });

      // Fetch and draw route
      fetch(
        `/api/map/directions?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(destination)}`
      )
        .then((r) => {
          if (!r.ok) throw new Error('Directions fetch failed');
          return r.json();
        })
        .then((data: any) => {
          const overview = data.routes?.[0]?.overviewPolyline;
          if (!overview) return;
          const path = googleMaps.geometry.encoding.decodePath(overview);
          new googleMaps.Polyline({
            map,
            path,
            strokeColor: '#1978c8',
            strokeOpacity: 0.75,
            strokeWeight: 5,
          });
          const bounds = new googleMaps.LatLngBounds();
          path.forEach((pt: any) => bounds.extend(pt));
          map.fitBounds(bounds);
        })
        .catch(console.error);
    }
  }, [origin, destination, MAP_KEY]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '400px', borderRadius: '8px' }}
    />
  );
};

export default GoogleMapView;

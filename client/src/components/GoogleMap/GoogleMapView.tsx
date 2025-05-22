import React, { useRef, useEffect } from 'react';
import './GoogleMapView.css';

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
    // Note; guard against missing API key
    if (!MAP_KEY) {
      console.error('Missing VITE_GOOGLE_MAPS_API_KEY');
      return;
    }

    // Note; load Google Maps script once
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
      // Note; ensure container and google available
      if (!mapRef.current || !(window as any).google) return;
      const googleMaps = (window as any).google.maps;

      // Note; initialize map with drag + scroll enabled
      const map = new googleMaps.Map(mapRef.current, {
        center: { lat: 27.6648, lng: -81.5158 },
        zoom: 7,
        draggable: true,              
        gestureHandling: 'greedy',    // Note; capture wheel & drag
        scrollwheel: true,            // Note; ensure older versions honor scroll
        zoomControl: true             // Note; show zoom buttons
      });

      // Note; fetch directions from backend and draw route
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

          // Note; draw route polyline
          new googleMaps.Polyline({
            map,
            path,
            strokeColor: '#1978c8',
            strokeOpacity: 0.75,
            strokeWeight: 5,
          });

          // Note; auto-fit map to route bounds
          const bounds = new googleMaps.LatLngBounds();
          path.forEach((pt: any) => bounds.extend(pt));
          map.fitBounds(bounds);
        })
        .catch(console.error);
    }
  }, [origin, destination, MAP_KEY]);

  return (
    <div className="map-container">
      {/* Note; actual map canvas */}
      <div ref={mapRef} className="google-map" />
      {/* Note; on-hover-fade instructions */}
      <div className="glass-card">
        Drag to move map • Scroll to zoom
      </div>
    </div>
  );
};

export default GoogleMapView;

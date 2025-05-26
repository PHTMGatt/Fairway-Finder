// src/components/GoogleMap/GoogleMapView.tsx

import React, { useEffect, useRef } from 'react';
import './GoogleMapView.css';

interface GoogleMapViewProps {
  origin: string;          // Note; Starting location string (e.g. "City,State")
  destination: string;     // Note; Ending location string
  maxDistance: string;     // Note; Maximum distance filter for nearby courses
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  origin,
  destination,
  maxDistance,
}) => {
  // Note; Ref to the div where the map will be rendered
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Note; Holds the Google Maps instance
  const mapInstanceRef = useRef<any>(null);

  // Note; Displays current map center coordinates
  const coordDisplayRef = useRef<HTMLDivElement>(null);

  // Note; Initialize map at default coordinates
  const initializeMap = () => {
    if (!mapContainerRef.current || !window.google?.maps) return;

    mapInstanceRef.current = new window.google.maps.Map(
      mapContainerRef.current,
      {
        center: { lat: 43.9781, lng: -83.7130 },
        zoom: 6.25,
        mapTypeId: 'roadmap',
      }
    );

    // Note; Update coordinate display whenever map becomes idle
    mapInstanceRef.current.addListener('idle', () => {
      const center = mapInstanceRef.current.getCenter();
      if (coordDisplayRef.current && center) {
        const lat = center.lat().toFixed(4);
        const lng = center.lng().toFixed(4);
        coordDisplayRef.current.innerText = `Map Center → Lat: ${lat}, Lng: ${lng}`;
      }
    });
  };

  // Note; Fetch route and nearby courses, then draw on map
  const drawRouteAndCourses = async () => {
    if (!origin || !destination || !mapInstanceRef.current) return;

    // Note; GET directions from our server proxy
    const directionsResponse = await fetch(
      `/api/map/directions?origin=${encodeURIComponent(
        origin
      )}&destination=${encodeURIComponent(destination)}`
    );
    const directionsData = await directionsResponse.json();
    const overviewPolyline =
      directionsData?.routes?.[0]?.overviewPolyline;

    if (overviewPolyline) {
      const path = window.google.maps.geometry.encoding.decodePath(
        overviewPolyline
      );
      // Note; Draw polyline on map
      new window.google.maps.Polyline({
        path,
        strokeColor: '#0077ff',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });
      // Note; Fit map bounds to route
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((pt: any) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    }

    // Note; GET nearby courses from our server proxy
    const city = origin.split(',')[0];
    const coursesResponse = await fetch(
      `/api/courses?city=${encodeURIComponent(city)}&maxDistance=${maxDistance}`
    );
    const courses = await coursesResponse.json();

    // Note; Place markers for each course
    courses.forEach((course: any) => {
      const loc = course.location;
      if (loc) {
        new window.google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map: mapInstanceRef.current,
          title: course.name,
        });
      }
    });
  };

  useEffect(() => {
    // Note; Load Google Maps JS using a server-side proxy (no client env key)
    const scriptUrl = '/api/map/js?libraries=geometry';

    // Note; Ensure script is added only once
    if (!document.querySelector(`script[src^="${scriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeMap();
        drawRouteAndCourses();
      };
      document.body.appendChild(script);
    } else {
      // Note; If already loaded, just init
      initializeMap();
      drawRouteAndCourses();
    }
  }, []); // Note; Run once on mount

  useEffect(() => {
    // Note; Redraw when origin, destination, or maxDistance changes
    if (origin && destination) {
      drawRouteAndCourses();
    }
  }, [origin, destination, maxDistance]);

  return (
    <div className="map-container">
      {/* Note; Map viewport */}
      <div ref={mapContainerRef} className="google-map" />

      {/* Note; Instruction overlay */}
      <div className="glass-card">
        Drag to move map • Scroll to zoom
      </div>

      {/* Note; Coordinate display */}
      <div ref={coordDisplayRef} className="coord-display" />
    </div>
  );
};

export default GoogleMapView;

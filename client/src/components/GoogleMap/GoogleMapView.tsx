// src/components/GoogleMap/GoogleMapView.tsx

import React, { useEffect, useRef } from 'react';
import './GoogleMapView.css';

interface Props {
  origin: string;
  destination: string;
  maxDistance: string;
}

const GoogleMapView: React.FC<Props> = ({ origin, destination, maxDistance }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const coordDisplayRef = useRef<HTMLDivElement>(null);

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 43.9781, lng: -83.7130 },
      zoom: 6.25,
      mapTypeId: 'roadmap',
    });

    mapInstance.current.addListener('idle', () => {
      const center = mapInstance.current.getCenter();
      const lat = center.lat().toFixed(4);
      const lng = center.lng().toFixed(4);
      if (coordDisplayRef.current) {
        coordDisplayRef.current.innerText = `Map Center → Lat: ${lat}, Lng: ${lng}`;
      }
    });
  };

  const drawRouteAndCourses = async () => {
    if (!origin || !destination || !mapInstance.current) return;

    try {
      const routeRes = await fetch(`/api/map/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`);
      const routeData = await routeRes.json();
      const polyline = routeData?.routes?.[0]?.overviewPolyline;

      if (polyline) {
        const path = window.google.maps.geometry.encoding.decodePath(polyline);
        const routeLine = new window.google.maps.Polyline({
          path,
          strokeColor: '#0077ff',
          strokeOpacity: 0.8,
          strokeWeight: 4,
          map: mapInstance.current,
        });
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((point: any) => bounds.extend(point));
        mapInstance.current.fitBounds(bounds);
      }

      const city = origin.split(',')[0];
      const courseRes = await fetch(`/api/courses?city=${encodeURIComponent(city)}&maxDistance=${maxDistance}`);
      const courses = await courseRes.json();

      courses.forEach((course: any) => {
        const loc = course.location;
        if (!loc) return;
        new window.google.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map: mapInstance.current,
          title: course.name,
        });
      });
    } catch (err) {
      console.error('Map draw error:', err);
    }
  };

  useEffect(() => {
    const waitForGoogle = (callback: () => void) => {
      if (window.google?.maps) {
        callback();
        return;
      }
      const interval = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(interval);
          callback();
        }
      }, 100);
    };

    const delayedInit = () => {
      setTimeout(() => {
        if (mapRef.current && window.google?.maps) {
          initializeMap();
          drawRouteAndCourses();
        }
      }, 250); // delay to ensure container is fully mounted
    };

    const loadGoogleMaps = () => {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => waitForGoogle(delayedInit);
        document.body.appendChild(script);
      } else {
        waitForGoogle(delayedInit);
      }
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (origin && destination) {
      drawRouteAndCourses();
    }
  }, [origin, destination, maxDistance]);

  return (
    <div className="map-container">
      <div ref={mapRef} className="google-map" />
      <div className="glass-card">Drag to move map • Scroll to zoom</div>
      <div ref={coordDisplayRef} className="coord-display" />
    </div>
  );
};

export default GoogleMapView;
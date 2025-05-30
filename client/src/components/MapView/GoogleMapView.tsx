// src/components/MapView/'GoogleMapView.tsx'

import React, { useEffect, useRef, useCallback } from 'react';
import './GoogleMapView.css';

interface GoogleMapViewProps {
  origin: string;
  destination: string;
  maxDistance: string;
  filters: string[];
}

// Note; Moved outside to prevent re-creating in every render (fixes warning)
const filterIcons: Record<string, string> = {
  golf_course: '⛳',
  restaurant: '🍔',
  gas_station: '⛽',
  rest_area: '💤',
};

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  origin,
  destination,
  maxDistance,
  filters,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const coordDisplayRef = useRef<HTMLDivElement>(null);

  // Note; Setup map once container is visible and Google Maps is ready
  const initializeMap = useCallback(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const initWithCenter = (center: google.maps.LatLngLiteral) => {
      mapInstanceRef.current = new window.google.maps.Map(container, {
        center,
        zoom: 6,
        mapTypeId: 'roadmap',
      });

      mapInstanceRef.current.addListener('mousemove', (e: google.maps.MapMouseEvent) => {
        if (coordDisplayRef.current && e.latLng) {
          const lat = e.latLng.lat().toFixed(4);
          const lng = e.latLng.lng().toFixed(4);
          coordDisplayRef.current.innerText = `Cursor → Lat: ${lat}, Lng: ${lng}`;
        }
      });
    };

    // Note; Use geolocation if allowed, fallback if denied
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initWithCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => initWithCenter({ lat: 43.8313, lng: -83.8415 }) // fallback location
      );
    } else {
      initWithCenter({ lat: 43.8313, lng: -83.8415 });
    }
  }, []);

  // Note; Re-run map init when ready
  useEffect(() => {
    const container = mapContainerRef.current;
    const mapsReady = () => !!window.google?.maps?.Map && !!window.google.maps.geometry;
    if (!container) return;

    const tryInit = () => {
      if (!mapsReady() || !container.offsetHeight || !container.offsetWidth) return;
      if (!mapInstanceRef.current) {
        initializeMap();
      }
    };

    const observer = new MutationObserver(tryInit);
    observer.observe(container, { attributes: true, childList: true, subtree: true });
    const fallbackTimeout = setTimeout(tryInit, 500);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimeout);
    };
  }, [initializeMap]);

  // Note; Draw route + place markers after form submission
  const drawRouteAndCourses = useCallback(async () => {
    if (!origin || !destination || !mapInstanceRef.current) return;

    try {
      // Note; Fetch directions from API
      const res = await fetch(
        `/api/map/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
      );
      const data = await res.json();

      // Note; Extract and decode Google polyline correctly
      const overviewPolyline = data?.routes?.[0]?.overview_polyline?.points;
      if (!overviewPolyline) {
        console.warn('No overview polyline returned from directions API');
        return;
      }

      // Note; Decode polyline into path and draw
      const path = window.google.maps.geometry.encoding.decodePath(overviewPolyline);
      new window.google.maps.Polyline({
        path,
        strokeColor: '#0077ff',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });

      // Note; Fit bounds around route
      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((pt: any) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    } catch (err) {
      console.error('Failed to fetch directions:', err);
    }

    // Note; Fetch and place POIs by type
    for (const type of filters) {
      try {
        const city = origin.split(',')[0];
        const res = await fetch(
          `/api/map/places?city=${encodeURIComponent(city)}&type=${type}&maxDistance=${maxDistance}`
        );
        const data = await res.json();
        const pois = data.places || [];

        pois.forEach((poi: any) => {
          if (poi.location) {
            new window.google.maps.Marker({
              position: { lat: poi.location.lat, lng: poi.location.lng },
              map: mapInstanceRef.current,
              title: `${filterIcons[type] || ''} ${poi.name}`,
              label: filterIcons[type] || '',
            });
          }
        });
      } catch (err) {
        console.error(`Failed to load POIs for ${type}:`, err);
      }
    }
  }, [origin, destination, maxDistance, filters]);

  // Note; Wait for map + geometry then draw
  useEffect(() => {
    const interval = setInterval(() => {
      if (origin && destination && mapInstanceRef.current && window.google?.maps?.geometry) {
        drawRouteAndCourses();
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [origin, destination, maxDistance, filters, drawRouteAndCourses]);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="google-map" />
      <div className="glass-card">Drag to move map • Scroll to zoom</div>
      <div ref={coordDisplayRef} className="coord-display" />
    </div>
  );
};

export default GoogleMapView;

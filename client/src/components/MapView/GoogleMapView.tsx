import React, { useEffect, useRef, useCallback } from 'react';
import './GoogleMapView.css';

interface GoogleMapViewProps {
  origin: string;
  destination: string;
  maxDistance: string;
  filters: string[];
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  origin,
  destination,
  maxDistance,
  filters,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const coordDisplayRef = useRef<HTMLDivElement>(null);

  const filterIcons: Record<string, string> = {
    golf_course: '⛳',
    restaurant: '🍔',
    gas_station: '⛽',
    rest_area: '💤',
  };

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

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initWithCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => initWithCenter({ lat: 43.8313, lng: -83.8415 }) // fallback
      );
    } else {
      initWithCenter({ lat: 43.8313, lng: -83.8415 });
    }
  }, []);

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

  const drawRouteAndCourses = useCallback(async () => {
    if (!origin || !destination || !mapInstanceRef.current) return;

    const directionsResponse = await fetch(
      `/api/map/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`
    );
    const directionsData = await directionsResponse.json();
    const overviewPolyline = directionsData?.routes?.[0]?.overviewPolyline;

    if (overviewPolyline) {
      const path = window.google.maps.geometry.encoding.decodePath(overviewPolyline);
      new window.google.maps.Polyline({
        path,
        strokeColor: '#0077ff',
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapInstanceRef.current,
      });

      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((pt: any) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds);
    }

    // POIs by filter
    for (const type of filters) {
      const city = origin.split(',')[0];
      const res = await fetch(`/api/poi?city=${encodeURIComponent(city)}&type=${type}&maxDistance=${maxDistance}`);
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
    }
  }, [origin, destination, maxDistance, filters]);

  // 🔁 Ensure route/POIs only draw when everything is loaded
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

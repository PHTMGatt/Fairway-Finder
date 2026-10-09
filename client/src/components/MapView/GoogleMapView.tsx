// client/src/components/MapView/GoogleMapView.tsx

import React, { useEffect, useRef, useCallback } from 'react';
import './GoogleMapView.css';

interface GoogleMapViewProps {
  origin: string;
  destination: string;
  maxDistance: string;
  filters: string[];
}

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
  const routePolylineRef = useRef<any>(null);
  const poiMarkersRef = useRef<any[]>([]);

  const initializeMap = useCallback(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const initWithCenter = (center: google.maps.LatLngLiteral) => {
      mapInstanceRef.current = new window.google.maps.Map(container, {
        center,
        zoom: 6,
        mapTypeId: 'roadmap',
      });

      mapInstanceRef.current.addListener(
        'mousemove',
        (event: google.maps.MapMouseEvent) => {
          if (coordDisplayRef.current && event.latLng) {
            const lat = event.latLng.lat().toFixed(4);
            const lng = event.latLng.lng().toFixed(4);
            coordDisplayRef.current.innerText = `Cursor → Lat: ${lat}, Lng: ${lng}`;
          }
        }
      );
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          initWithCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        () => initWithCenter({ lat: 43.8313, lng: -83.8415 })
      );
    } else {
      initWithCenter({ lat: 43.8313, lng: -83.8415 });
    }
  }, []);

  useEffect(() => {
    const container = mapContainerRef.current;
    const mapsReady = () =>
      !!window.google?.maps?.Map && !!window.google.maps.geometry;
    if (!container) return;

    const tryInit = () => {
      if (!mapsReady() || !container.offsetHeight || !container.offsetWidth) return;
      if (!mapInstanceRef.current) initializeMap();
    };

    const observer = new MutationObserver(tryInit);
    observer.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    const fallbackTimeout = window.setTimeout(tryInit, 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimeout);
    };
  }, [initializeMap]);

  const clearPoiMarkers = useCallback(() => {
    poiMarkersRef.current.forEach((marker) => marker.setMap(null));
    poiMarkersRef.current = [];
  }, []);

  const drawRouteAndPlaces = useCallback(async () => {
    if (!origin || !destination || !mapInstanceRef.current) return;

    clearPoiMarkers();

    try {
      const response = await fetch(
        `/api/map/directions?origin=${encodeURIComponent(
          origin
        )}&destination=${encodeURIComponent(destination)}`
      );
      if (!response.ok) throw new Error('Unable to load route');

      const data = await response.json();
      const encodedPolyline = data?.routes?.[0]?.overview_polyline?.points;
      if (!encodedPolyline) throw new Error('No route geometry returned');

      const path = window.google.maps.geometry.encoding.decodePath(encodedPolyline);
      if (!path.length) throw new Error('Route geometry was empty');

      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null);
      }

      routePolylineRef.current = new window.google.maps.Polyline({
        path,
        strokeColor: '#0077ff',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapInstanceRef.current,
      });

      const bounds = new window.google.maps.LatLngBounds();
      path.forEach((point: any) => bounds.extend(point));
      mapInstanceRef.current.fitBounds(bounds);

      if (filters.length === 0) return;

      const routeCenter = path[Math.floor(path.length / 2)];
      const centerLat = routeCenter.lat();
      const centerLng = routeCenter.lng();
      const requestedMiles = Number(maxDistance);
      const radiusMeters = Number.isFinite(requestedMiles) && requestedMiles > 0
        ? Math.min(50000, Math.round(requestedMiles * 1609.34))
        : 40000;

      const placeResults = await Promise.all(
        filters.map(async (type) => {
          try {
            const params = new URLSearchParams({
              location: `${centerLat},${centerLng}`,
              radius: String(radiusMeters),
              type,
            });
            const poiResponse = await fetch(`/api/map/places?${params.toString()}`);
            if (!poiResponse.ok) return { type, places: [] as any[] };

            const poiData = await poiResponse.json();
            return {
              type,
              places: Array.isArray(poiData.places) ? poiData.places : [],
            };
          } catch {
            return { type, places: [] as any[] };
          }
        })
      );

      const seen = new Set<string>();

      placeResults.forEach(({ type, places }) => {
        places.forEach((poi: any) => {
          const lat = Number(poi.location?.lat);
          const lng = Number(poi.location?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          const key = `${type}:${lat.toFixed(5)}:${lng.toFixed(5)}`;
          if (seen.has(key)) return;
          seen.add(key);

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: mapInstanceRef.current,
            title: `${filterIcons[type] || ''} ${poi.name || 'Point of interest'}`,
            label: {
              text: filterIcons[type] || '•',
              fontSize: '18px',
            },
          });

          poiMarkersRef.current.push(marker);
        });
      });
    } catch (error) {
      console.error('Failed to render route:', error);
    }
  }, [
    origin,
    destination,
    maxDistance,
    filters,
    clearPoiMarkers,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (
        origin &&
        destination &&
        mapInstanceRef.current &&
        window.google?.maps?.geometry
      ) {
        drawRouteAndPlaces();
        window.clearInterval(interval);
      }
    }, 300);

    return () => window.clearInterval(interval);
  }, [origin, destination, maxDistance, filters, drawRouteAndPlaces]);

  useEffect(
    () => () => {
      clearPoiMarkers();
      if (routePolylineRef.current) routePolylineRef.current.setMap(null);
    },
    [clearPoiMarkers]
  );

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="google-map" />
      <div className="glass-card">Drag to move map • Scroll to zoom</div>
      <div ref={coordDisplayRef} className="coord-display" />
    </div>
  );
};

export default GoogleMapView;

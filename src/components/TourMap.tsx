'use client';

import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { TourStop } from '@/hooks/useWalkingTour';

export type TourMapProps = {
  stops: TourStop[];
  activeIndex: number;
  onSelectStop: (index: number) => void;
};

function ensurePinStyles() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('tour-map-pin-styles');
  if (existing) return;

  const style = document.createElement('style');
  style.id = 'tour-map-pin-styles';
  style.textContent = `
    .tour-map-pin {
      width: 34px;
      height: 34px;
      border-radius: 9999px;
      background: #111827;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
      border: 2px solid rgba(17, 24, 39, 0.25);
      box-shadow: 0 10px 22px rgba(0,0,0,0.12);
      cursor: pointer;
      user-select: none;
      transform: scale(1);
      transition: transform 140ms ease, background 140ms ease, border-color 140ms ease;
    }
    .tour-map-pin--active {
      background: #d97706; /* amber-600-ish */
      border-color: rgba(217, 119, 6, 0.35);
    }
    .tour-map-pin--pulsing {
      animation: tour-pin-pulse 0.55s ease-out;
    }
    @keyframes tour-pin-pulse {
      0% { transform: scale(1); }
      35% { transform: scale(1.28); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export default function TourMap({ stops, activeIndex, onSelectStop }: TourMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<(mapboxgl.Marker | null)[]>([]);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const geojsonLine = useMemo(() => {
    if (!stops?.length) return null;

    const ordered = [...stops].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0)
    );
    const coords: [number, number][] = ordered.map((s) => [s.lng, s.lat]);
    if (coords.length < 2) return null;

    return {
      type: 'FeatureCollection' as const,
      features: [
        {
          type: 'Feature' as const,
          properties: {},
          geometry: {
            type: 'LineString' as const,
            coordinates: coords,
          },
        },
      ],
    };
  }, [stops]);

  /** Insert route under first symbol layer so it draws above roads but stays visible (Mapbox GL v3 + streets). */
  function getRouteBeforeLayerId(map: mapboxgl.Map): string | undefined {
    const layers = map.getStyle()?.layers;
    if (!layers) return undefined;
    const sym = layers.find((l) => l.type === 'symbol');
    return sym?.id;
  }

  const activeStop = stops[activeIndex];

  // Initialize map once.
  useEffect(() => {
    ensurePinStyles();
    if (!containerRef.current) return;
    if (mapRef.current) return;
    if (!token) return;
    if (!stops?.length) return;

    mapboxgl.accessToken = token;

    const first = stops[0];
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [first.lng, first.lat],
      zoom: 13,
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const map = mapRef.current;
    map.on('load', () => {
      // Center on stop 1 first, then fit the bounds for all stops.
      map.jumpTo({ center: [first.lng, first.lat], zoom: 13 });

      if (stops.length >= 2) {
        const bounds = stops.reduce(
          (b, s) => b.extend([s.lng, s.lat]),
          new mapboxgl.LngLatBounds([first.lng, first.lat], [first.lng, first.lat])
        );

        requestAnimationFrame(() => {
          setTimeout(() => {
            try {
              map.fitBounds(bounds, { padding: 80, duration: 800, maxZoom: 16 });
            } catch {
              // ignore fit errors for degenerate bounds
            }
          }, 200);
        });
      }

      // Render route + pins for the initial stops.
      renderStopsLayerAndPins();
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, stops]);

  // Cleanup on unmount to avoid memory leaks.
  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  const renderStopsLayerAndPins = () => {
    const map = mapRef.current;
    if (!map) return;
    if (!stops?.length) return;

    // Remove previous markers
    markersRef.current.forEach((m) => m?.remove());
    markersRef.current = [];

    // Remove previous route layer/source
    const routeSourceId = 'tour-route-source';
    const routeLayerId = 'tour-route-layer';
    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);

    // Add dashed route line (if at least 2 stops).
    if (geojsonLine) {
      map.addSource(routeSourceId, {
        type: 'geojson',
        data: geojsonLine,
      });

      const beforeId = getRouteBeforeLayerId(map);
      map.addLayer(
        {
          id: routeLayerId,
          type: 'line',
          source: routeSourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#6b7280',
            'line-width': 4,
            'line-opacity': 0.92,
            'line-dasharray': [2, 2.5],
          },
        },
        beforeId
      );
    }

    // Add numbered pins
    stops.forEach((stop, index) => {
      const el = document.createElement('div');
      el.className = 'tour-map-pin';
      el.textContent = String(stop.order ?? index + 1);

      // Active pin = amber
      if (index === activeIndex) el.classList.add('tour-map-pin--active');

      // Hover scaling
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.12)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = index === activeIndex ? 'scale(1.25)' : 'scale(1)';
      });

      el.addEventListener('click', () => {
        onSelectStop(index);
      });

      el.style.transform = index === activeIndex ? 'scale(1.25)' : 'scale(1)';

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([stop.lng, stop.lat])
        .addTo(map);

      markersRef.current[index] = marker;
    });
  };

  // Re-render markers when stops change.
  useEffect(() => {
    if (!mapRef.current) return;
    if (!stops?.length) return;
    if (!mapRef.current.isStyleLoaded()) return;
    renderStopsLayerAndPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops]);

  // Fly + pulse active marker when activeIndex changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!stops?.length) return;
    if (!activeStop) return;

    try {
      map.flyTo({
        center: [activeStop.lng, activeStop.lat],
        zoom: Math.min(16, Math.max(13, map.getZoom())),
        essential: true,
      });
    } catch {
      // ignore
    }

    markersRef.current.forEach((m, i) => {
      const markerEl = m?.getElement();
      if (!markerEl) return;

      markerEl.classList.toggle('tour-map-pin--active', i === activeIndex);
      markerEl.style.transform = i === activeIndex ? 'scale(1.25)' : 'scale(1)';

      if (i === activeIndex) {
        markerEl.classList.remove('tour-map-pin--pulsing');
        // Force reflow so the animation restarts.
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        markerEl.offsetHeight;
        markerEl.classList.add('tour-map-pin--pulsing');
        window.setTimeout(() => markerEl.classList.remove('tour-map-pin--pulsing'), 600);
      }
    });
  }, [activeIndex, activeStop, stops]);

  if (!token) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Mapbox token missing. Set `NEXT_PUBLIC_MAPBOX_TOKEN` in your environment.
      </div>
    );
  }

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}


'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapLabelForCity } from '@/lib/place-names';
import type { RouteMapPin } from '@/components/maps/useRouteMapPins';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

function orderMarkerIcon(order: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:#1C1917;color:#fff;
      border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:700;font-family:monospace;
    ">${order + 1}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function focusMarkerIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:#D97706;color:#fff;
      border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
    ">📍</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function MapViewport({
  positions,
  mode,
}: {
  positions: [number, number][];
  mode: 'route' | 'single';
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (mode === 'single' || positions.length === 1) {
      map.setView(positions[0], 11, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 8, animate: true });
  }, [map, positions, mode]);

  return null;
}

export interface LeafletTripMapProps {
  pins: RouteMapPin[];
  mode?: 'route' | 'single';
  focusStopId?: string | null;
  height?: number;
}

export default function LeafletTripMap({
  pins,
  mode = 'route',
  focusStopId = null,
  height = 280,
}: LeafletTripMapProps) {
  const sorted = useMemo(
    () => [...pins].sort((a, b) => a.order - b.order),
    [pins]
  );

  const visiblePins = useMemo(() => {
    if (mode === 'single' && focusStopId) {
      return sorted.filter((p) => p.stopId === focusStopId);
    }
    return sorted;
  }, [sorted, mode, focusStopId]);

  const positions = useMemo(
    () => visiblePins.map((p) => [p.lat, p.lon] as [number, number]),
    [visiblePins]
  );

  const polylinePositions = useMemo(
    () => sorted.map((p) => [p.lat, p.lon] as [number, number]),
    [sorted]
  );

  const center = positions[0] ?? [0, 0];
  const mapMode = mode === 'single' ? 'single' : 'route';
  const showRoute = mode === 'route' && polylinePositions.length > 1;

  if (visiblePins.length === 0) return null;

  return (
    <MapContainer
      center={center}
      zoom={mode === 'single' ? 11 : 5}
      style={{ height, width: '100%', borderRadius: 8, zIndex: 0 }}
      scrollWheelZoom={false}
      attributionControl
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={OSM_ATTRIBUTION} />
      <MapViewport positions={positions} mode={mapMode} />

      {showRoute && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{
            color: '#D97706',
            weight: 3,
            opacity: 0.85,
            dashArray: '8 6',
          }}
        />
      )}

      {visiblePins.map((pin) => {
        const label = mapLabelForCity(pin.city);
        const isSingle = mode === 'single';
        return (
          <Marker
            key={pin.stopId}
            position={[pin.lat, pin.lon]}
            icon={isSingle ? focusMarkerIcon() : orderMarkerIcon(pin.order)}
          >
            <Popup>
              <strong>{label}</strong>
              <br />
              {pin.nights} night{pin.nights === 1 ? '' : 's'}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

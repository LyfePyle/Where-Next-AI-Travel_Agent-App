'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { mapLabelForCity } from '@/lib/place-names';
import { offsetCollidingXY } from '@/lib/offset-colliding-pins';
import type { ItineraryMapPoint } from '@/lib/itinerary-map-points';
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

function highlightedBlockIcon(order: number): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:34px;height:34px;border-radius:50%;
      background:#D97706;color:#fff;
      border:3px solid #fff;
      box-shadow:0 0 0 3px rgba(217,119,6,.45),0 2px 8px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;font-family:monospace;
    ">${order + 1}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function highlightedCityIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:#D97706;color:#fff;
      border:3px solid #fff;
      box-shadow:0 0 0 3px rgba(217,119,6,.45),0 2px 8px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;
    ">📍</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
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
  mode: 'route' | 'single' | 'points';
}) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;

    if (mode === 'points') {
      if (positions.length === 1) {
        map.setView(positions[0], 13, { animate: true });
        return;
      }
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15, animate: true });
      return;
    }

    if (mode === 'single' || positions.length === 1) {
      map.setView(positions[0], 11, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [52, 52], maxZoom: 8, animate: true });
  }, [map, positions, mode]);

  return null;
}

function FocusHighlightedPoint({
  point,
}: {
  point: { lat: number; lng: number } | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!point) return;
    map.panTo([point.lat, point.lng], { animate: true });
  }, [map, point]);

  return null;
}

function OffsetPixelMarkers<T extends { lat: number; lon: number; key: string }>({
  items,
  render,
}: {
  items: T[];
  render: (item: T) => ReactNode;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const onView = () => setZoom(map.getZoom());
    map.on('zoomend', onView);
    map.on('moveend', onView);
    return () => {
      map.off('zoomend', onView);
      map.off('moveend', onView);
    };
  }, [map]);

  const display = useMemo(() => {
    const layer = items.map((p) => {
      const pt = map.latLngToLayerPoint(L.latLng(p.lat, p.lon));
      return { x: pt.x, y: pt.y };
    });
    const spread = offsetCollidingXY(layer);
    return items.map((p, i) => {
      const ll = map.layerPointToLatLng(L.point(spread[i].x, spread[i].y));
      return { ...p, lat: ll.lat, lon: ll.lng };
    });
  }, [items, map, zoom]);

  return <>{display.map((item) => render(item))}</>;
}

export type LeafletTripMapMode = 'route' | 'single' | 'points';

export interface LeafletTripMapProps {
  pins?: RouteMapPin[];
  points?: ItineraryMapPoint[];
  mode?: LeafletTripMapMode;
  focusStopId?: string | null;
  highlightedPointId?: string | null;
  height?: number;
}

export default function LeafletTripMap({
  pins = [],
  points = [],
  mode = 'route',
  focusStopId = null,
  highlightedPointId = null,
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

  const pinPositions = useMemo(
    () => visiblePins.map((p) => [p.lat, p.lon] as [number, number]),
    [visiblePins]
  );

  const pointPositions = useMemo(
    () => points.map((p) => [p.lat, p.lng] as [number, number]),
    [points]
  );

  const polylinePositions = useMemo(
    () => sorted.map((p) => [p.lat, p.lon] as [number, number]),
    [sorted]
  );

  const isPoints = mode === 'points';
  const positions = isPoints ? pointPositions : pinPositions;
  const center = positions[0] ?? [0, 0];
  const showRoute = mode === 'route' && polylinePositions.length > 1;

  const highlightedPoint = isPoints
    ? points.find((p) => p.id === highlightedPointId) ?? null
    : null;

  if (isPoints && points.length === 0) return null;
  if (!isPoints && visiblePins.length === 0) return null;

  return (
    <MapContainer
      center={center}
      zoom={isPoints ? 13 : mode === 'single' ? 11 : 5}
      style={{ height, width: '100%', borderRadius: 8, zIndex: 0 }}
      scrollWheelZoom={false}
      attributionControl
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution={OSM_ATTRIBUTION} />
      <MapViewport positions={positions} mode={isPoints ? 'points' : mode === 'single' ? 'single' : 'route'} />
      {isPoints && <FocusHighlightedPoint point={highlightedPoint} />}

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

      {isPoints ? (
        <OffsetPixelMarkers
          items={points.map((p) => ({ ...p, lon: p.lng, key: p.id }))}
          render={(point) => {
            const isCity = point.kind === 'city';
            const isHighlighted = point.id === highlightedPointId;
            const icon = isCity
              ? isHighlighted
                ? highlightedCityIcon()
                : focusMarkerIcon()
              : isHighlighted
                ? highlightedBlockIcon(Math.max(0, (point.order ?? 1) - 1))
                : orderMarkerIcon(Math.max(0, (point.order ?? 1) - 1));
            return (
              <Marker
                key={point.key}
                position={[point.lat, point.lon]}
                icon={icon}
                zIndexOffset={isHighlighted ? 1000 : 0}
              >
                <Popup>
                  <strong>{point.label}</strong>
                  {point.sublabel ? (
                    <>
                      <br />
                      {point.sublabel}
                    </>
                  ) : null}
                </Popup>
              </Marker>
            );
          }}
        />
      ) : (
        <OffsetPixelMarkers
          items={visiblePins.map((p) => ({ ...p, key: p.stopId }))}
          render={(pin) => {
            const label = mapLabelForCity(pin.city);
            return (
              <Marker
                key={pin.key}
                position={[pin.lat, pin.lon]}
                icon={mode === 'single' ? focusMarkerIcon() : orderMarkerIcon(pin.order)}
              >
                <Popup>
                  <strong>{label}</strong>
                  <br />
                  {pin.nights} night{pin.nights === 1 ? '' : 's'}
                </Popup>
              </Marker>
            );
          }}
        />
      )}
    </MapContainer>
  );
}

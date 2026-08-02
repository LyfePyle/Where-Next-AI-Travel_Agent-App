'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TripStop } from '@/types/trip';

interface RoutePin {
  stopId: string;
  city: string;
  country?: string;
  destination: string;
  lat: number;
  lon: number;
  nights: number;
  order: number;
}

interface TripRouteMapProps {
  tripId: string;
  stops: TripStop[];
}

function projectPins(
  pins: RoutePin[],
  width: number,
  height: number,
  padding: number
): Array<RoutePin & { x: number; y: number }> {
  if (pins.length === 0) return [];

  const lats = pins.map((p) => p.lat);
  const lons = pins.map((p) => p.lon);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);

  if (minLat === maxLat) {
    minLat -= 2;
    maxLat += 2;
  }
  if (minLon === maxLon) {
    minLon -= 2;
    maxLon += 2;
  }

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  return pins.map((pin) => {
    const x =
      padding + ((pin.lon - minLon) / (maxLon - minLon)) * innerW;
    const y =
      padding + (1 - (pin.lat - minLat) / (maxLat - minLat)) * innerH;
    return { ...pin, x, y };
  });
}

export default function TripRouteMap({ tripId, stops }: TripRouteMapProps) {
  const [pins, setPins] = useState<RoutePin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stopsKey = stops.map((s) => `${s.id}|${s.destination}|${s.nights ?? ''}`).join(';;');

  const fetchPins = useCallback(async () => {
    if (stops.length === 0) {
      setPins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/route-map`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load map');
        setPins([]);
        return;
      }
      setPins(data.pins ?? []);
    } catch {
      setError('Could not load route map');
      setPins([]);
    } finally {
      setLoading(false);
    }
  }, [tripId, stopsKey]);

  useEffect(() => {
    void fetchPins();
  }, [fetchPins, stopsKey]);

  if (stops.length === 0) return null;

  const width = 100;
  const height = 52;
  const padding = 10;
  const projected = projectPins(pins, width, height, padding);
  const linePoints = projected.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div
      style={{
        marginBottom: '1.75rem',
        background: '#FAFAF9',
        border: '1px solid #EAE3D5',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #EAE3D5',
          fontFamily: 'monospace',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#78716C',
        }}
      >
        Trip route
      </div>

      <div style={{ padding: '12px 14px 8px' }}>
        {loading && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0 12px' }}>Loading map…</p>
        )}
        {error && !loading && (
          <p style={{ fontSize: 13, color: '#B91C1C', margin: '8px 0 12px' }}>{error}</p>
        )}

        {!loading && projected.length > 0 && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: '100%', height: 'auto', display: 'block', minHeight: 140 }}
            role="img"
            aria-label="Trip route map"
          >
            <rect x={0} y={0} width={width} height={height} fill="#F5F0E8" rx={4} />

            {projected.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                stroke="#D97706"
                strokeWidth={0.6}
                strokeDasharray="2 1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )}

            {projected.map((pin, i) => (
              <g key={pin.stopId}>
                <circle cx={pin.x} cy={pin.y} r={2.8} fill="#1C1917" stroke="#fff" strokeWidth={0.6} />
                <text
                  x={pin.x}
                  y={pin.y - 4.2}
                  textAnchor="middle"
                  fontSize={3.2}
                  fontWeight={600}
                  fill="#1C1917"
                >
                  {pin.city}
                </text>
                <text
                  x={pin.x}
                  y={pin.y + 5.5}
                  textAnchor="middle"
                  fontSize={2.6}
                  fill="#78716C"
                >
                  {pin.nights}n{i < projected.length - 1 ? ' →' : ''}
                </text>
              </g>
            ))}
          </svg>
        )}

        {!loading && projected.length === 0 && !error && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0' }}>
            Could not plot stops on map.
          </p>
        )}

        {projected.length > 1 && (
          <p
            style={{
              fontSize: 11,
              color: '#A8A29E',
              marginTop: 8,
              marginBottom: 4,
              textAlign: 'center',
            }}
          >
            {projected.map((p) => p.city).join(' → ')}
          </p>
        )}
      </div>
    </div>
  );
}

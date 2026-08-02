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

type ProjectedPin = RoutePin & { x: number; y: number };

type PlacedLabel = ProjectedPin & {
  labelX: number;
  labelY: number;
  nightsY: number;
  labelAnchor: 'start' | 'middle' | 'end';
};

interface LabelBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const MIN_SPAN_DEG = 1.5;

/** Equirectangular projection with uniform lat/lon scale, centered in the view box. */
function projectPins(
  pins: RoutePin[],
  width: number,
  height: number,
  padding: number
): ProjectedPin[] {
  if (pins.length === 0) return [];

  const lats = pins.map((p) => p.lat);
  const lons = pins.map((p) => p.lon);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLon = Math.min(...lons);
  let maxLon = Math.max(...lons);

  if (maxLat - minLat < MIN_SPAN_DEG) {
    const mid = (maxLat + minLat) / 2;
    minLat = mid - MIN_SPAN_DEG / 2;
    maxLat = mid + MIN_SPAN_DEG / 2;
  }
  if (maxLon - minLon < MIN_SPAN_DEG) {
    const mid = (maxLon + minLon) / 2;
    minLon = mid - MIN_SPAN_DEG / 2;
    maxLon = mid + MIN_SPAN_DEG / 2;
  }

  const latSpan = maxLat - minLat;
  const lonSpan = maxLon - minLon;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / lonSpan, innerH / latSpan);
  const usedW = lonSpan * scale;
  const usedH = latSpan * scale;
  const offsetX = padding + (innerW - usedW) / 2;
  const offsetY = padding + (innerH - usedH) / 2;

  return pins.map((pin) => ({
    ...pin,
    x: offsetX + (pin.lon - minLon) * scale,
    y: offsetY + (maxLat - pin.lat) * scale,
  }));
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.52;
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function boxNearPoint(box: LabelBox, x: number, y: number, margin: number): boolean {
  return (
    x >= box.x - margin &&
    x <= box.x + box.w + margin &&
    y >= box.y - margin &&
    y <= box.y + box.h + margin
  );
}

function labelBox(
  labelX: number,
  labelY: number,
  anchor: 'start' | 'middle' | 'end',
  city: string,
  fontSize: number
): LabelBox {
  const w = estimateTextWidth(city, fontSize);
  const h = fontSize * 1.2;
  const x =
    anchor === 'middle' ? labelX - w / 2 : anchor === 'start' ? labelX : labelX - w;
  return { x, y: labelY - h * 0.85, w, h };
}

/** Offset labels by quadrant; nudge to avoid pin and other label overlap. */
function placeLabels(projected: ProjectedPin[], width: number, height: number): PlacedLabel[] {
  const cx = width / 2;
  const cy = height / 2;
  const placed: LabelBox[] = [];
  const pinRadius = 2.8;
  const fontSize = 3.2;
  const nightsFontSize = 2.6;

  return projected.map((pin) => {
    const dx = pin.x - cx;
    const dy = pin.y - cy;

    let labelAnchor: 'start' | 'middle' | 'end' = 'middle';
    let labelX = pin.x;
    let labelY = pin.y;
    let nightsY = pin.y + 5.5;

    if (Math.abs(dx) > Math.abs(dy) * 0.85) {
      if (dx > 0) {
        labelAnchor = 'start';
        labelX = pin.x + 4.5;
        labelY = pin.y + 0.5;
        nightsY = pin.y + 4.8;
      } else {
        labelAnchor = 'end';
        labelX = pin.x - 4.5;
        labelY = pin.y + 0.5;
        nightsY = pin.y + 4.8;
      }
    } else if (dy > 0) {
      labelY = pin.y + 6.5;
      nightsY = pin.y + 10;
    } else {
      labelY = pin.y - 5.5;
      nightsY = pin.y - 2;
    }

    let box = labelBox(labelX, labelY, labelAnchor, pin.city, fontSize);
    const nudgeStep = 2.2;

    for (let attempt = 0; attempt < 10; attempt++) {
      const hitsPin = Math.hypot(labelX - pin.x, labelY - pin.y) < pinRadius + 2.5;
      const hitsLabel = placed.some((b) => boxesOverlap(b, box));
      const hitsOtherPin = projected.some(
        (other) =>
          other.stopId !== pin.stopId && boxNearPoint(box, other.x, other.y, pinRadius + 1.5)
      );

      if (!hitsPin && !hitsLabel && !hitsOtherPin) break;

      if (Math.abs(dx) > Math.abs(dy) * 0.85) {
        labelY += dy >= 0 ? -nudgeStep : nudgeStep;
        nightsY = labelY + (dx > 0 ? 4.3 : 4.3);
      } else {
        labelY += dy >= 0 ? -nudgeStep : nudgeStep;
        nightsY = labelY + (dy >= 0 ? 3.5 : 3.5);
      }
      box = labelBox(labelX, labelY, labelAnchor, pin.city, fontSize);
    }

    placed.push(box);
    placed.push({
      x: box.x,
      y: nightsY - nightsFontSize,
      w: estimateTextWidth(`${pin.nights}n`, nightsFontSize),
      h: nightsFontSize * 1.2,
    });

    return { ...pin, labelX, labelY, nightsY, labelAnchor };
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
  const height = 62;
  const padding = 12;
  const projected = placeLabels(projectPins(pins, width, height, padding), width, height);
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
            style={{ width: '100%', height: 'auto', display: 'block', minHeight: 160 }}
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
                  x={pin.labelX}
                  y={pin.labelY}
                  textAnchor={pin.labelAnchor}
                  fontSize={3.2}
                  fontWeight={600}
                  fill="#1C1917"
                >
                  {pin.city}
                </text>
                <text
                  x={pin.labelAnchor === 'middle' ? pin.labelX : pin.labelX}
                  y={pin.nightsY}
                  textAnchor={pin.labelAnchor}
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

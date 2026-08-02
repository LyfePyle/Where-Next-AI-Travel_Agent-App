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

type ProjectedPin = RoutePin & { x: number; y: number; mapLabel: string };

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
const CLUSTER_DIST_PX = 13;
const PIN_RADIUS = 2.8;
const LABEL_FONT = 3.2;
const NIGHTS_FONT = 2.6;

const ADMIN_PREFIXES = [
  /^special\s+capital\s+region\s+of\s+/i,
  /^capital\s+region\s+of\s+/i,
  /^autonomous\s+region\s+of\s+/i,
  /^province\s+of\s+/i,
  /^city\s+of\s+/i,
  /^municipality\s+of\s+/i,
  /^district\s+of\s+/i,
  /^greater\s+/i,
  /^metropolitan\s+/i,
];

/** Short label for map pins only — strip formal/administrative prefixes. */
export function mapLabelForCity(city: string): string {
  let label = city.trim();
  if (!label) return city;

  for (const re of ADMIN_PREFIXES) {
    label = label.replace(re, '');
  }

  label = label
    .replace(/\s+(city\s+municipality|municipality|metropolitan\s+city|city|province|region)$/i, '')
    .trim();

  if (label.includes(',')) {
    label = label.split(',')[0].trim();
  }

  if (label.length > 20) {
    const words = label.split(/\s+/);
    label = words.length > 2 ? words.slice(-2).join(' ') : words[0] ?? label;
  }

  return label || city.trim();
}

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
    mapLabel: mapLabelForCity(pin.city),
    x: offsetX + (pin.lon - minLon) * scale,
    y: offsetY + (maxLat - pin.lat) * scale,
  }));
}

function estimateTextWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.52;
}

function boxesOverlap(a: LabelBox, b: LabelBox, margin = 0.8): boolean {
  return (
    a.x - margin < b.x + b.w + margin &&
    a.x + a.w + margin > b.x - margin &&
    a.y - margin < b.y + b.h + margin &&
    a.y + a.h + margin > b.y - margin
  );
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
  text: string,
  fontSize: number
): LabelBox {
  const w = estimateTextWidth(text, fontSize);
  const h = fontSize * 1.2;
  const x =
    anchor === 'middle' ? labelX - w / 2 : anchor === 'start' ? labelX : labelX - w;
  return { x, y: labelY - h * 0.85, w, h };
}

function nightsBox(
  labelX: number,
  nightsY: number,
  anchor: 'start' | 'middle' | 'end',
  text: string
): LabelBox {
  const w = estimateTextWidth(text, NIGHTS_FONT);
  const h = NIGHTS_FONT * 1.2;
  const x =
    anchor === 'middle' ? labelX - w / 2 : anchor === 'start' ? labelX : labelX - w;
  return { x, y: nightsY - h, w, h };
}

/** Group pins whose projected positions fall within CLUSTER_DIST_PX of each other. */
function findClusters(pins: ProjectedPin[]): Map<string, string[]> {
  const n = pins.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    if (parent[i] !== i) parent[i] = find(parent[i]);
    return parent[i];
  }

  function unite(a: number, b: number) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = Math.hypot(pins[i].x - pins[j].x, pins[i].y - pins[j].y);
      if (dist <= CLUSTER_DIST_PX) unite(i, j);
    }
  }

  const groups = new Map<number, string[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(pins[i].stopId);
    groups.set(root, list);
  }

  const byStop = new Map<string, string[]>();
  for (const ids of groups.values()) {
    for (const id of ids) byStop.set(id, ids);
  }
  return byStop;
}

function anchorForAngle(angle: number): 'start' | 'middle' | 'end' {
  const c = Math.cos(angle);
  if (c > 0.35) return 'start';
  if (c < -0.35) return 'end';
  return 'middle';
}

function candidatePositions(
  pin: ProjectedPin,
  clusterIds: string[],
  clusterIndex: number,
  width: number,
  height: number
): Array<{ x: number; y: number; anchor: 'start' | 'middle' | 'end' }> {
  const out: Array<{ x: number; y: number; anchor: 'start' | 'middle' | 'end' }> = [];
  const isCluster = clusterIds.length >= 2;

  if (isCluster) {
    const k = clusterIds.length;
    const idx = clusterIds.indexOf(pin.stopId);
    const baseAngle = (2 * Math.PI * idx) / k - Math.PI / 2;
    const radii = k >= 4 ? [10, 13, 16, 19, 22, 25] : [8, 11, 14, 17, 20];

    for (const r of radii) {
      for (let fan = 0; fan < 3; fan++) {
        const angle = baseAngle + (fan - 1) * 0.35;
        out.push({
          x: pin.x + Math.cos(angle) * r,
          y: pin.y + Math.sin(angle) * r * 0.85,
          anchor: anchorForAngle(angle),
        });
      }
    }
  } else {
    const cx = width / 2;
    const cy = height / 2;
    const dx = pin.x - cx;
    const dy = pin.y - cy;

    const offsets: Array<[number, number, 'start' | 'middle' | 'end']> = [];

    if (Math.abs(dx) > Math.abs(dy) * 0.85) {
      offsets.push(
        [dx > 0 ? 5 : -5, 0, dx > 0 ? 'start' : 'end'],
        [dx > 0 ? 7 : -7, -3, dx > 0 ? 'start' : 'end'],
        [dx > 0 ? 7 : -7, 3, dx > 0 ? 'start' : 'end'],
        [0, dy > 0 ? 7 : -7, 'middle'],
        [dx > 0 ? 9 : -9, dy > 0 ? -4 : 4, dx > 0 ? 'start' : 'end']
      );
    } else {
      offsets.push(
        [0, dy > 0 ? 7 : -7, 'middle'],
        [dx > 0 ? 6 : -6, dy > 0 ? 5 : -5, dx > 0 ? 'start' : 'end'],
        [dx > 0 ? -6 : 6, dy > 0 ? 5 : -5, dx > 0 ? 'end' : 'start'],
        [0, dy > 0 ? 10 : -10, 'middle'],
        [0, dy > 0 ? -10 : 10, 'middle']
      );
    }

    for (const [ox, oy, anchor] of offsets) {
      out.push({ x: pin.x + ox, y: pin.y + oy, anchor });
    }
  }

  return out;
}

function collides(
  cityBox: LabelBox,
  nightsBoxVal: LabelBox,
  placed: LabelBox[],
  allPins: ProjectedPin[],
  selfId: string
): boolean {
  for (const b of placed) {
    if (boxesOverlap(cityBox, b) || boxesOverlap(nightsBoxVal, b)) return true;
  }
  for (const p of allPins) {
    if (boxNearPoint(cityBox, p.x, p.y, PIN_RADIUS + 2)) return true;
    if (p.stopId !== selfId && boxNearPoint(nightsBoxVal, p.x, p.y, PIN_RADIUS + 1.5)) {
      return true;
    }
  }
  return false;
}

/** Place labels — fan out clusters, prefer readable over pin-proximity. */
function placeLabels(projected: ProjectedPin[], width: number, height: number): PlacedLabel[] {
  const clusters = findClusters(projected);
  const placed: LabelBox[] = [];

  const sorted = [...projected].sort((a, b) => {
    const ca = clusters.get(a.stopId)?.length ?? 1;
    const cb = clusters.get(b.stopId)?.length ?? 1;
    if (cb !== ca) return cb - ca;
    return a.y - b.y;
  });

  const results = new Map<string, PlacedLabel>();

  for (const pin of sorted) {
    const clusterIds = clusters.get(pin.stopId) ?? [pin.stopId];
    const clusterIndex = clusterIds.indexOf(pin.stopId);
    const candidates = candidatePositions(pin, clusterIds, clusterIndex, width, height);
    const nightsText = `${pin.nights}n`;

    let best: PlacedLabel | null = null;
    let bestScore = Infinity;

    for (const cand of candidates) {
      const cityB = labelBox(cand.x, cand.y, cand.anchor, pin.mapLabel, LABEL_FONT);
      const nightsY = cand.y + (cand.y > pin.y ? 3.8 : 4.2);
      const nightsB = nightsBox(cand.x, nightsY, cand.anchor, nightsText);

      if (collides(cityB, nightsB, placed, projected, pin.stopId)) continue;

      const dist = Math.hypot(cand.x - pin.x, cand.y - pin.y);
      const score = dist + (clusterIds.length >= 3 ? 0 : dist * 0.2);
      if (score < bestScore) {
        bestScore = score;
        best = {
          ...pin,
          labelX: cand.x,
          labelY: cand.y,
          nightsY,
          labelAnchor: cand.anchor,
        };
      }
    }

    if (!best) {
      const fallbackAngle =
        (2 * Math.PI * clusterIndex) / Math.max(clusterIds.length, 1) - Math.PI / 2;
      const r = clusterIds.length >= 3 ? 22 : 14;
      best = {
        ...pin,
        labelX: pin.x + Math.cos(fallbackAngle) * r,
        labelY: pin.y + Math.sin(fallbackAngle) * r * 0.85,
        nightsY: pin.y + Math.sin(fallbackAngle) * r * 0.85 + 4,
        labelAnchor: anchorForAngle(fallbackAngle),
      };
    }

    placed.push(labelBox(best.labelX, best.labelY, best.labelAnchor, pin.mapLabel, LABEL_FONT));
    placed.push(
      nightsBox(best.labelX, best.nightsY, best.labelAnchor, nightsText)
    );
    results.set(pin.stopId, best);
  }

  return projected.map((p) => results.get(p.stopId)!);
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
  const height = 68;
  const padding = 14;
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
            style={{ width: '100%', height: 'auto', display: 'block', minHeight: 170 }}
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
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r={PIN_RADIUS}
                  fill="#1C1917"
                  stroke="#fff"
                  strokeWidth={0.6}
                />
                <text
                  x={pin.labelX}
                  y={pin.labelY}
                  textAnchor={pin.labelAnchor}
                  fontSize={LABEL_FONT}
                  fontWeight={600}
                  fill="#1C1917"
                >
                  {pin.mapLabel}
                </text>
                <text
                  x={pin.labelX}
                  y={pin.nightsY}
                  textAnchor={pin.labelAnchor}
                  fontSize={NIGHTS_FONT}
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
            {projected.map((p) => p.mapLabel).join(' → ')}
          </p>
        )}
      </div>
    </div>
  );
}

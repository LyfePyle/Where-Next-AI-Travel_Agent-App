/**
 * Spread map markers that sit on top of each other so numbered pins stay readable.
 * Geographic polyline should keep original coords; only marker display is offset.
 */

import { kmBetween } from '@/lib/geocode-itinerary-block';

export const PIN_COLLISION_KM = 0.8;
/** ~2.2 km — enough to separate 26px pins at Costa Rica route zoom. */
export const PIN_OFFSET_KM = 2.2;

export interface OffsettablePin {
  lat: number;
  lon: number;
}

function offsetLatLng(
  lat: number,
  lon: number,
  distanceKm: number,
  angleRad: number
): { lat: number; lon: number } {
  const latRad = (lat * Math.PI) / 180;
  const dLat = (distanceKm * Math.cos(angleRad)) / 111.32;
  const cosLat = Math.cos(latRad);
  const dLon = cosLat === 0 ? 0 : (distanceKm * Math.sin(angleRad)) / (111.32 * cosLat);
  return { lat: lat + dLat, lon: lon + dLon };
}

/** Cluster pins whose pairwise distance is under the collision radius. */
export function collidingPinClusters<T extends OffsettablePin>(
  pins: T[],
  minSeparationKm = PIN_COLLISION_KM
): number[][] {
  const n = pins.length;
  const parent = pins.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[rb] = ra;
  };

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = kmBetween(
        { lat: pins[i].lat, lng: pins[i].lon },
        { lat: pins[j].lat, lng: pins[j].lon }
      );
      if (d < minSeparationKm) union(i, j);
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  }
  return [...groups.values()].filter((g) => g.length > 1);
}

export function offsetCollidingPins<T extends OffsettablePin>(
  pins: T[],
  minSeparationKm = PIN_COLLISION_KM,
  offsetKm = PIN_OFFSET_KM
): T[] {
  if (pins.length < 2) return pins;

  const clusters = collidingPinClusters(pins, minSeparationKm);
  if (clusters.length === 0) return pins;

  const next = pins.map((p) => ({ ...p }));
  for (const cluster of clusters) {
    const count = cluster.length;
    for (let i = 0; i < count; i++) {
      const idx = cluster[i];
      const pin = pins[idx];
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      const shifted = offsetLatLng(pin.lat, pin.lon, offsetKm, angle);
      next[idx] = { ...next[idx], lat: shifted.lat, lon: shifted.lon };
    }
  }
  return next;
}

export const PIN_COLLISION_PX = 28;
export const PIN_OFFSET_PX = 16;

export interface OffsettableXY {
  x: number;
  y: number;
}

/** Spread overlapping markers in screen/layer-pixel space (zoom-aware). */
export function offsetCollidingXY<T extends OffsettableXY>(
  points: T[],
  minSeparationPx = PIN_COLLISION_PX,
  offsetPx = PIN_OFFSET_PX
): T[] {
  if (points.length < 2) return points;

  const n = points.length;
  const parent = points.map((_, i) => i);
  const find = (i: number): number => {
    while (parent[i] !== i) i = parent[i] = parent[parent[i]];
    return i;
  };
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.hypot(dx, dy) < minSeparationPx) {
        const ra = find(i);
        const rb = find(j);
        if (ra !== rb) parent[rb] = ra;
      }
    }
  }

  const groups = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    const list = groups.get(root) ?? [];
    list.push(i);
    groups.set(root, list);
  }

  const next = points.map((p) => ({ ...p }));
  for (const cluster of groups.values()) {
    if (cluster.length < 2) continue;
    const count = cluster.length;
    for (let i = 0; i < count; i++) {
      const idx = cluster[i];
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      next[idx] = {
        ...next[idx],
        x: points[idx].x + offsetPx * Math.cos(angle),
        y: points[idx].y + offsetPx * Math.sin(angle),
      };
    }
  }
  return next;
}

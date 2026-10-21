'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TripStop } from '@/types/trip';

export interface RouteMapPin {
  stopId: string;
  city: string;
  country?: string;
  destination: string;
  lat: number;
  lon: number;
  nights: number;
  order: number;
}

export interface UnresolvedMapStop {
  stopId: string;
  city: string;
}

export function useRouteMapPins(tripId: string, stops: TripStop[]) {
  const [pins, setPins] = useState<RouteMapPin[]>([]);
  const [unresolved, setUnresolved] = useState<UnresolvedMapStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stopsKey = stops.map((s) => `${s.id}|${s.destination}|${s.nights ?? ''}`).join(';;');

  const fetchPins = useCallback(async () => {
    if (stops.length === 0) {
      setPins([]);
      setUnresolved([]);
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
        setUnresolved([]);
        return;
      }
      setPins(data.pins ?? []);
      setUnresolved(data.unresolved ?? []);
    } catch {
      setError('Could not load route map');
      setPins([]);
      setUnresolved([]);
    } finally {
      setLoading(false);
    }
  }, [tripId, stopsKey, stops.length]);

  useEffect(() => {
    void fetchPins();
  }, [fetchPins, stopsKey]);

  return { pins, unresolved, loading, error };
}

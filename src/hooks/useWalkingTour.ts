'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export type TourStop = {
  name: string;
  description: string;
  local_tip: string;
  lat: number;
  lng: number;
  order: number;
};

export type WalkingTourState = {
  loading: boolean;
  error: string | null;
  title: string | null;
  stops: TourStop[];
  activeIndex: number;
};

const initialState: WalkingTourState = {
  loading: false,
  error: null,
  title: null,
  stops: [],
  activeIndex: 0,
};

export function useWalkingTour() {
  const [state, setState] = useState<WalkingTourState>(initialState);

  const generate = useCallback(
    async (city: string, country: string, preferences?: string, tripId?: string) => {
      setState((s) => ({ ...s, loading: true, error: null, stops: [], title: null, activeIndex: 0 }));

      try {
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;
        if (!accessToken) {
          setState((s) => ({ ...s, loading: false, error: 'Please sign in to generate a tour' }));
          return;
        }

        const body: Record<string, unknown> = { city, country };
        if (preferences) body.preferences = preferences;
        if (tripId) body.trip_id = tripId;

        const res = await fetch('/api/tour/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });

        const json = await res.json().catch(() => ({}));

        if (res.status === 401) {
          setState((s) => ({ ...s, loading: false, error: 'Session expired. Please sign in again.' }));
          return;
        }
        if (!res.ok) {
          setState((s) => ({
            ...s,
            loading: false,
            error: json?.error ?? `Request failed (${res.status})`,
          }));
          return;
        }

        const { data } = json;
        const stops = Array.isArray(data?.stops) ? data.stops : [];
        const title = typeof data?.title === 'string' ? data.title : null;

        setState({
          loading: false,
          error: null,
          title,
          stops,
          activeIndex: stops.length ? 0 : 0,
        });
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Something went wrong',
        }));
      }
    },
    []
  );

  const goNext = useCallback(() => {
    setState((s) => ({
      ...s,
      activeIndex: s.stops.length ? Math.min(s.activeIndex + 1, s.stops.length - 1) : 0,
    }));
  }, []);

  const goPrev = useCallback(() => {
    setState((s) => ({ ...s, activeIndex: Math.max(0, s.activeIndex - 1) }));
  }, []);

  const setActiveIndex = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      activeIndex: Math.max(0, Math.min(index, s.stops.length - 1)),
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const loadSavedTour = useCallback(async (tourId: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setState((s) => ({ ...s, loading: false, error: 'Please sign in to view this tour' }));
        return;
      }
      const res = await fetch(`/api/tours/${encodeURIComponent(tourId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setState((s) => ({ ...s, loading: false, error: 'Session expired. Please sign in again.' }));
        return;
      }
      if (!res.ok) {
        setState((s) => ({ ...s, loading: false, error: data?.error ?? 'Failed to load tour' }));
        return;
      }
      const stops = Array.isArray(data?.stops) ? data.stops : [];
      setState({
        loading: false,
        error: null,
        title: data?.title ?? null,
        stops,
        activeIndex: stops.length ? 0 : 0,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load tour',
      }));
    }
  }, []);

  const activeStop = state.stops[state.activeIndex] ?? null;

  return {
    ...state,
    activeStop,
    generate,
    goNext,
    goPrev,
    setActiveIndex,
    reset,
    loadSavedTour,
    hasStops: state.stops.length > 0,
  };
}

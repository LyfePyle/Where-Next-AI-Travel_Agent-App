'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { shortStopLabel } from '@/lib/place-names';
import { useRouteMapPins } from '@/components/maps/useRouteMapPins';
import type { TripStop } from '@/types/trip';

const LeafletTripMap = dynamic(() => import('@/components/maps/LeafletTripMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F5F0E8',
        borderRadius: 8,
        color: '#A8A29E',
        fontSize: 13,
      }}
    >
      Loading map…
    </div>
  ),
});

interface TripItineraryMapProps {
  tripId: string;
  stops: TripStop[];
  activeStopId: string | null;
}

export default function TripItineraryMap({ tripId, stops, activeStopId }: TripItineraryMapProps) {
  const { pins, loading, error } = useRouteMapPins(tripId, stops);
  const focusId = activeStopId ?? stops[0]?.id ?? null;
  const focusPin = pins.find((p) => p.stopId === focusId);
  const focusStop = stops.find((s) => s.id === focusId);

  if (stops.length === 0) return null;

  return (
    <div
      style={{
        marginBottom: 20,
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>Stop map</span>
        {focusStop && (
          <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11, color: '#57534E' }}>
            {shortStopLabel(focusStop)}
          </span>
        )}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {loading && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0' }}>Loading map…</p>
        )}
        {error && !loading && (
          <p style={{ fontSize: 13, color: '#B91C1C', margin: '8px 0' }}>{error}</p>
        )}
        {!loading && focusPin && (
          <LeafletTripMap
            pins={pins}
            mode="single"
            focusStopId={focusId}
            height={200}
          />
        )}
        {!loading && !focusPin && !error && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0' }}>
            Could not plot this stop on the map.
          </p>
        )}
      </div>
    </div>
  );
}

/** Track which stop section is most visible while scrolling the itinerary tab. */
export function useActiveStopObserver(
  stops: TripStop[],
  enabled: boolean,
  /** Bump when stop sections mount/update so refs get observed. */
  contentVersion = 0
) {
  const [activeStopId, setActiveStopId] = useState<string | null>(stops[0]?.id ?? null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const setSectionRef = (stopId: string) => (el: HTMLElement | null) => {
    if (el) sectionRefs.current.set(stopId, el);
    else sectionRefs.current.delete(stopId);
  };

  useEffect(() => {
    setActiveStopId(stops[0]?.id ?? null);
  }, [stops]);

  useEffect(() => {
    if (!enabled || stops.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target instanceof HTMLElement) {
          const id = top.target.dataset.stopId;
          if (id) setActiveStopId(id);
        }
      },
      { root: null, rootMargin: '-20% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    for (const el of sectionRefs.current.values()) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [enabled, stops, contentVersion]);

  return { activeStopId, setSectionRef };
}

'use client';

import dynamic from 'next/dynamic';
import { mapLabelForCity } from '@/lib/place-names';
import { useRouteMapPins } from '@/components/maps/useRouteMapPins';
import type { TripStop } from '@/types/trip';

const LeafletTripMap = dynamic(() => import('@/components/maps/LeafletTripMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 280,
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

interface TripRouteMapProps {
  tripId: string;
  stops: TripStop[];
}

export default function TripRouteMap({ tripId, stops }: TripRouteMapProps) {
  const { pins, loading, error } = useRouteMapPins(tripId, stops);

  if (stops.length === 0) return null;

  const sorted = [...pins].sort((a, b) => a.order - b.order);

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

        {!loading && sorted.length > 0 && (
          <>
            <LeafletTripMap pins={sorted} mode="route" height={280} />
            {sorted.length > 1 && (
              <p
                style={{
                  fontSize: 11,
                  color: '#A8A29E',
                  marginTop: 8,
                  marginBottom: 4,
                  textAlign: 'center',
                }}
              >
                {sorted.map((p) => mapLabelForCity(p.city)).join(' → ')}
              </p>
            )}
          </>
        )}

        {!loading && sorted.length === 0 && !error && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0' }}>
            Could not plot stops on map.
          </p>
        )}
      </div>
    </div>
  );
}

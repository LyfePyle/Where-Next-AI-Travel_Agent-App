'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { shortStopLabel } from '@/lib/place-names';
import { itineraryDayMapPoints } from '@/lib/itinerary-map-points';
import { storedStopCoords } from '@/lib/place-confirmation';
import { useRouteMapPins } from '@/components/maps/useRouteMapPins';
import type { TripItineraryDay } from '@/types/itinerary';
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
  days: TripItineraryDay[];
  selectedDayId: string | null;
  highlightedPointId?: string | null;
  onSelectDay: (dayId: string) => void;
}

export default function TripItineraryMap({
  tripId,
  stops,
  days,
  selectedDayId,
  highlightedPointId = null,
  onSelectDay,
}: TripItineraryMapProps) {
  const { pins, unresolved, loading, error } = useRouteMapPins(tripId, stops);
  const selectedDay = days.find((d) => d.id === selectedDayId) ?? null;
  const selectedStop = stops.find((s) => s.id === selectedDay?.stop_id) ?? stops[0];
  const stored = selectedStop ? storedStopCoords(selectedStop) : null;
  const apiPin = pins.find((p) => p.stopId === selectedStop?.id) ?? null;
  const cityName =
    selectedStop?.city?.trim() ||
    selectedStop?.destination.split(',')[0]?.trim() ||
    apiPin?.city ||
    'Stop';
  const cityPin = stored
    ? { lat: stored.lat, lon: stored.lon, city: cityName }
    : apiPin
      ? { lat: apiPin.lat, lon: apiPin.lon, city: apiPin.city }
      : null;

  const points = useMemo(
    () =>
      itineraryDayMapPoints(
        selectedDay,
        cityPin,
        stored ? { lat: stored.lat, lng: stored.lon } : null
      ),
    [selectedDay, cityPin, stored]
  );

  const orderedDays = useMemo(
    () =>
      stops.flatMap((stop) =>
        days.filter((d) => d.stop_id === stop.id).sort((a, b) => a.day_index - b.day_index)
      ),
    [stops, days]
  );

  if (stops.length === 0) return null;

  const subtitle = selectedDay
    ? `${shortStopLabel(selectedStop ?? { destination: '' })} · Day ${selectedDay.day_index}`
    : selectedStop
      ? shortStopLabel(selectedStop)
      : '';

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
        <span>Day map</span>
        {subtitle && (
          <span style={{ textTransform: 'none', letterSpacing: 0, fontSize: 11, color: '#57534E' }}>
            {subtitle}
          </span>
        )}
      </div>

      {orderedDays.length > 1 && (
        <div
          role="tablist"
          aria-label="Itinerary days"
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 12px',
            overflowX: 'auto',
            borderBottom: '1px solid #EAE3D5',
          }}
        >
          {orderedDays.map((day) => {
            const stop = stops.find((s) => s.id === day.stop_id);
            const selected = day.id === selectedDayId;
            const multiStop = stops.length > 1;
            const label = multiStop && stop
              ? `${shortStopLabel(stop)} · Day ${day.day_index}`
              : `Day ${day.day_index}`;
            return (
              <button
                key={day.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectDay(day.id)}
                className="shrink-0 min-h-[36px] px-3 text-[12px] rounded-full border touch-manipulation"
                style={{
                  borderColor: selected ? '#D97706' : '#EAE3D5',
                  background: selected ? '#1C1917' : '#fff',
                  color: selected ? '#fff' : '#44403C',
                  fontWeight: selected ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ padding: '12px 14px' }}>
        {loading && points.length === 0 && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0' }}>Loading map…</p>
        )}
        {error && !loading && points.length === 0 && (
          <p style={{ fontSize: 13, color: '#B91C1C', margin: '8px 0' }}>{error}</p>
        )}
        {!loading && !error && points.length === 0 && (
          <p style={{ fontSize: 13, color: '#A8A29E', margin: '8px 0' }}>Location not found</p>
        )}
        {points.length > 0 && (
          <LeafletTripMap
            points={points}
            mode="points"
            highlightedPointId={highlightedPointId}
            height={200}
          />
        )}
        {!loading && points.length > 0 && unresolved.some((s) => s.stopId === selectedStop?.id) && (
          <p style={{ fontSize: 12, color: '#A8A29E', margin: '8px 0 0' }}>
            Location not found for {cityName}
          </p>
        )}
      </div>
    </div>
  );
}

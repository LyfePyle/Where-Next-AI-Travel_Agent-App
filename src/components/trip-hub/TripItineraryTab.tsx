'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { newBlankBlock } from '@/lib/generate-itinerary-days';
import { sortBlocksByTimeOfDay } from '@/lib/itinerary-blocks';
import { shortStopLabel } from '@/lib/place-names';
import TripItineraryMap, { useActiveStopObserver } from '@/components/trip-hub/TripItineraryMap';
import type { ItineraryBlock, TripItineraryDay } from '@/types/itinerary';
import type { TripStop } from '@/types/trip';

interface TripItineraryTabProps {
  tripId: string;
  stops: TripStop[];
  active: boolean;
}

const TIME_ICON: Record<string, string> = {
  morning: '🌅',
  afternoon: '☀️',
  evening: '🌆',
};

function fmtDate(d: string | null) {
  if (!d) return '';
  try {
    return new Date(`${d}T12:00:00`).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return d;
  }
}

function stopLabel(stop: TripStop): string {
  return shortStopLabel(stop);
}

export default function TripItineraryTab({ tripId, stops, active }: TripItineraryTabProps) {
  const [days, setDays] = useState<TripItineraryDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingDayId, setSavingDayId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { activeStopId, setSectionRef } = useActiveStopObserver(stops, active, days.length);

  const fetchDays = useCallback(async () => {
    const res = await fetch(`/api/trips/${tripId}/itinerary`);
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 503) {
        setError(data.error || 'Run add-itinerary-days.sql migration first.');
      } else {
        setError(data.error || 'Failed to load itinerary');
      }
      return null;
    }
    setDays(data.days ?? []);
    setComplete(!!data.complete);
    setError(null);
    return data as { days: TripItineraryDay[]; complete: boolean };
  }, [tripId]);

  const triggerGenerate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Generation failed');
        return;
      }
      setDays(data.days ?? []);
      setComplete(!!data.complete);
    } catch {
      setError('Network error during generation');
    } finally {
      setGenerating(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchDays();
      if (cancelled) return;
      setLoading(false);

      if (data && !data.complete && stops.length > 0) {
        await triggerGenerate();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, tripId, fetchDays, triggerGenerate, stops.length]);

  useEffect(() => {
    if (!active || complete || generating) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }

    pollRef.current = setInterval(() => {
      void fetchDays();
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [active, complete, generating, fetchDays]);

  useEffect(() => {
    if (!active) return;
    void fetchDays();
  }, [active, stops, fetchDays]);

  const saveDayBlocks = useCallback(
    async (dayId: string, blocks: ItineraryBlock[]) => {
      setSavingDayId(dayId);
      try {
        const res = await fetch(`/api/trips/${tripId}/itinerary`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dayId, blocks }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to save');
          return;
        }
        if (data.day) {
          setDays((prev) =>
            prev.map((d) => (d.id === dayId ? { ...d, blocks: data.day.blocks } : d))
          );
        }
      } catch {
        setError('Failed to save changes');
      } finally {
        setSavingDayId(null);
      }
    },
    [tripId]
  );

  const addBlock = (day: TripItineraryDay) => {
    const block = newBlankBlock();
    void saveDayBlocks(day.id, [...day.blocks, block]);
  };

  const removeBlock = (day: TripItineraryDay, blockId: string) => {
    void saveDayBlocks(
      day.id,
      day.blocks.filter((b) => b.id !== blockId)
    );
  };

  if (loading && days.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <p style={{ fontSize: 14, color: '#78716C' }}>Loading itinerary…</p>
      </div>
    );
  }

  if (error && days.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
        <p style={{ fontSize: 14, color: '#B91C1C', marginBottom: 12 }}>{error}</p>
        <button
          type="button"
          onClick={() => void triggerGenerate()}
          style={{
            padding: '10px 20px',
            background: '#1C1917',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Try generating
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 1.5rem' }}>
      <TripItineraryMap tripId={tripId} stops={stops} activeStopId={activeStopId} />

      {(generating || (!complete && days.length > 0)) && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            fontSize: 13,
            color: '#92400E',
          }}
        >
          {generating ? 'Generating your day-by-day plan…' : 'Still building some days…'}
        </div>
      )}

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            fontSize: 12,
            color: '#B91C1C',
          }}
        >
          {error}
        </div>
      )}

      {!complete && days.length === 0 && !generating && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontSize: 14, color: '#78716C', marginBottom: 12 }}>
            No itinerary yet — generate a light starting-point plan for each stop.
          </p>
          <button
            type="button"
            onClick={() => void triggerGenerate()}
            style={{
              padding: '12px 24px',
              background: '#D97706',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Generate itinerary
          </button>
        </div>
      )}

      {stops.map((stop) => {
        const stopDays = days
          .filter((d) => d.stop_id === stop.id)
          .sort((a, b) => a.day_index - b.day_index);

        if (stopDays.length === 0 && complete) return null;

        return (
          <section
            key={stop.id}
            ref={setSectionRef(stop.id)}
            data-stop-id={stop.id}
            style={{ marginBottom: 28 }}
          >
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#78716C',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {stopLabel(stop)}
              <span style={{ flex: 1, height: 1, background: '#EAE3D5' }} />
            </div>

            {stopDays.length === 0 && !complete && (
              <p style={{ fontSize: 13, color: '#A8A29E', fontStyle: 'italic' }}>
                Waiting for {stopLabel(stop)}…
              </p>
            )}

            {stopDays.map((day) => (
              <div
                key={day.id}
                style={{
                  marginBottom: 16,
                  border: '1px solid #EAE3D5',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#FAFAF9',
                    borderBottom: '1px solid #EAE3D5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Day {day.day_index}</span>
                    {day.date && (
                      <span style={{ fontSize: 12, color: '#78716C', marginLeft: 8 }}>
                        {fmtDate(day.date)}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => addBlock(day)}
                    disabled={savingDayId === day.id || day.blocks.length >= 6}
                    title="Add block"
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid #EAE3D5',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 16,
                      lineHeight: 1,
                    }}
                  >
                    +
                  </button>
                </div>

                <div style={{ padding: '10px 14px' }}>
                  {day.blocks.length === 0 && (
                    <p style={{ fontSize: 13, color: '#A8A29E', margin: '4px 0 8px' }}>
                      No blocks yet — tap + to add one.
                    </p>
                  )}

                  {sortBlocksByTimeOfDay(day.blocks).map((block) => (
                    <div
                      key={block.id}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 0',
                        borderBottom: '1px solid #F5F0E8',
                      }}
                    >
                      <div style={{ fontSize: 18, lineHeight: 1.2, paddingTop: 2 }}>
                        {TIME_ICON[block.time_of_day] ?? '📍'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 10,
                            fontFamily: 'monospace',
                            textTransform: 'uppercase',
                            color: '#A8A29E',
                            marginBottom: 2,
                          }}
                        >
                          {block.time_of_day}
                        </div>
                        <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4 }}>
                          {block.title || 'Untitled'}
                        </div>
                        {block.description && (
                          <div style={{ fontSize: 13, color: '#57534E', lineHeight: 1.45 }}>
                            {block.description}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBlock(day, block.id)}
                        disabled={savingDayId === day.id}
                        title="Remove block"
                        style={{
                          alignSelf: 'flex-start',
                          width: 24,
                          height: 24,
                          border: 'none',
                          background: 'transparent',
                          color: '#A8A29E',
                          cursor: 'pointer',
                          fontSize: 14,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}

      <p style={{ fontSize: 12, color: '#A8A29E', textAlign: 'center', marginTop: 8 }}>
        Starting-point plans — edit with +/× or ask chat to regenerate a day.
      </p>
    </div>
  );
}

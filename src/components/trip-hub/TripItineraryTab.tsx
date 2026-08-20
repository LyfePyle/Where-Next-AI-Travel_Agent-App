'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { newBlankBlock } from '@/lib/generate-itinerary-days';
import { sortBlocksByTimeOfDay } from '@/lib/itinerary-blocks';
import { mapPointIdForBlock } from '@/lib/itinerary-map-points';
import { travelNoteTitle } from '@/lib/itinerary-travel-note';
import { pickTourSuggestionDays } from '@/lib/itinerary-free-time';
import {
  TRIP_ITINERARY_CHANGED_EVENT,
  focusTripChat,
  itineraryDayChatDraft,
} from '@/lib/trip-chat-focus';
import { shortStopLabel } from '@/lib/place-names';
import TripItineraryMap from '@/components/trip-hub/TripItineraryMap';
import TourDaySuggestionCard, {
  type TourDaySuggestionPayload,
} from '@/components/trip-hub/TourDaySuggestionCard';
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
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dismissedStops, setDismissedStops] = useState<Set<string>>(new Set());
  const [tourSuggest, setTourSuggest] = useState<
    Record<
      string,
      {
        payload?: TourDaySuggestionPayload;
        loading: boolean;
        swapping: boolean;
        error: string | null;
        alternatives: TourDaySuggestionPayload[] | null;
        confirm: boolean;
        skipped?: boolean;
      }
    >
  >({});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissKey = `wn-tour-suggest-dismiss:${tripId}`;

  const orderedDays = useMemo(
    () =>
      stops.flatMap((stop) =>
        days.filter((d) => d.stop_id === stop.id).sort((a, b) => a.day_index - b.day_index)
      ),
    [stops, days]
  );

  useEffect(() => {
    if (orderedDays.length === 0) {
      setSelectedDayId(null);
      return;
    }
    if (selectedDayId && orderedDays.some((d) => d.id === selectedDayId)) return;
    setSelectedDayId(orderedDays[0].id);
  }, [orderedDays, selectedDayId]);

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

      // Incomplete = missing days. Do not regenerate complete trips that
      // merely lack lat/lng — those keep a city-pin fallback until the user
      // regenerates a day or the whole plan.
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

  useEffect(() => {
    const onItineraryChanged = () => {
      void fetchDays();
    };
    window.addEventListener(TRIP_ITINERARY_CHANGED_EVENT, onItineraryChanged);
    return () => window.removeEventListener(TRIP_ITINERARY_CHANGED_EVENT, onItineraryChanged);
  }, [fetchDays]);

  useEffect(() => {
    const ordered = stops.flatMap((stop) =>
      days
        .filter((d) => d.stop_id === stop.id)
        .sort((a, b) => a.day_index - b.day_index)
    );
    if (ordered.length === 0) {
      setSelectedDayId(null);
      setSelectedBlockId(null);
      return;
    }
    setSelectedDayId((prev) =>
      prev && ordered.some((d) => d.id === prev) ? prev : ordered[0].id
    );
    setSelectedBlockId((prev) =>
      prev && ordered.some((d) => d.blocks.some((b) => b.id === prev)) ? prev : null
    );
  }, [days, stops]);

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

  const selectDay = (dayId: string) => {
    setSelectedDayId(dayId);
    setSelectedBlockId(null);
  };

  const selectBlock = (day: TripItineraryDay, blockId: string) => {
    setSelectedDayId(day.id);
    setSelectedBlockId(blockId);
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(dismissKey);
      if (!raw) {
        setDismissedStops(new Set());
        return;
      }
      const ids = JSON.parse(raw) as unknown;
      setDismissedStops(
        new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [])
      );
    } catch {
      setDismissedStops(new Set());
    }
    setTourSuggest({});
  }, [dismissKey]);

  const eligibleTourDays = useMemo(() => {
    if (!complete) return [];
    return pickTourSuggestionDays(days).filter((d) => !dismissedStops.has(d.stop_id));
  }, [complete, days, dismissedStops]);

  const loadTourSuggestion = useCallback(async (dayId: string) => {
    setTourSuggest((prev) => ({
      ...prev,
      [dayId]: {
        loading: true,
        swapping: false,
        error: null,
        alternatives: prev[dayId]?.alternatives ?? null,
        confirm: false,
        payload: prev[dayId]?.payload,
      },
    }));
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/tour-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setTourSuggest((prev) => ({
          ...prev,
          [dayId]: {
            loading: false,
            swapping: false,
            error: null,
            alternatives: null,
            confirm: false,
            skipped: true,
          },
        }));
        return;
      }
      if (!res.ok) {
        setTourSuggest((prev) => ({
          ...prev,
          [dayId]: {
            loading: false,
            swapping: false,
            error: data.error || 'Could not suggest a walking tour',
            alternatives: null,
            confirm: false,
          },
        }));
        return;
      }
      setTourSuggest((prev) => ({
        ...prev,
        [dayId]: {
          payload: data.suggestion,
          loading: false,
          swapping: false,
          error: null,
          alternatives: null,
          confirm: false,
        },
      }));
    } catch {
      setTourSuggest((prev) => ({
        ...prev,
        [dayId]: {
          loading: false,
          swapping: false,
          error: 'Could not suggest a walking tour',
          alternatives: null,
          confirm: false,
        },
      }));
    }
  }, [tripId]);

  useEffect(() => {
    if (!active || generating) return;
    for (const day of eligibleTourDays) {
      const state = tourSuggest[day.id];
      if (state?.loading || state?.payload || state?.error || state?.skipped) continue;
      void loadTourSuggestion(day.id);
    }
  }, [active, generating, eligibleTourDays, tourSuggest, loadTourSuggestion]);

  const dismissTourStop = (stopId: string, dayId: string) => {
    setDismissedStops((prev) => {
      const next = new Set(prev);
      next.add(stopId);
      try {
        sessionStorage.setItem(dismissKey, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
    setTourSuggest((prev) => {
      const next = { ...prev };
      delete next[dayId];
      return next;
    });
  };

  const loadTourAlternatives = async (dayId: string) => {
    setTourSuggest((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], swapping: true, error: null, confirm: false, loading: false },
    }));
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/tour-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, alternatives: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTourSuggest((prev) => ({
          ...prev,
          [dayId]: {
            ...prev[dayId],
            swapping: false,
            error: data.error || 'Could not load other tours',
          },
        }));
        return;
      }
      setTourSuggest((prev) => ({
        ...prev,
        [dayId]: {
          ...prev[dayId],
          swapping: false,
          alternatives: data.options ?? [],
        },
      }));
    } catch {
      setTourSuggest((prev) => ({
        ...prev,
        [dayId]: { ...prev[dayId], swapping: false, error: 'Could not load other tours' },
      }));
    }
  };

  const pickTourAlternative = async (dayId: string, option: TourDaySuggestionPayload) => {
    setTourSuggest((prev) => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        payload: option,
        confirm: false,
        swapping: true,
        loading: false,
      },
    }));
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/tour-suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayId, blocks: option.blocks }),
      });
      const data = await res.json();
      if (res.ok && data.suggestion?.blocks) {
        setTourSuggest((prev) => ({
          ...prev,
          [dayId]: {
            ...prev[dayId],
            payload: { ...option, blocks: data.suggestion.blocks },
            swapping: false,
          },
        }));
        return;
      }
    } catch {
      /* keep un-geocoded option */
    }
    setTourSuggest((prev) => ({
      ...prev,
      [dayId]: { ...prev[dayId], swapping: false },
    }));
  };

  const acceptTourSuggestion = async (day: TripItineraryDay) => {
    const payload = tourSuggest[day.id]?.payload;
    if (!payload?.blocks?.length) return;
    await saveDayBlocks(day.id, payload.blocks);
    setTourSuggest((prev) => {
      const next = { ...prev };
      delete next[day.id];
      return next;
    });
  };

  const openDayInChat = (day: TripItineraryDay) => {
    const stop = stops.find((s) => s.id === day.stop_id);
    const city = stop ? stopLabel(stop) : 'this stop';
    setSelectedDayId(day.id);
    focusTripChat({
      draft: itineraryDayChatDraft(city, day.day_index),
      focusDayId: day.id,
    });
  };

  const highlightedPointId = (() => {
    if (!selectedBlockId || !selectedDayId) return null;
    const day = days.find((d) => d.id === selectedDayId);
    const block = day?.blocks.find((b) => b.id === selectedBlockId);
    if (!day || !block) return null;
    return mapPointIdForBlock(day, block);
  })();

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
      <TripItineraryMap
        tripId={tripId}
        stops={stops}
        days={days}
        selectedDayId={selectedDayId}
        highlightedPointId={highlightedPointId}
        onSelectDay={selectDay}
      />

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

            {stopDays.map((day) => {
              const selected = day.id === selectedDayId;
              return (
              <div
                key={day.id}
                style={{
                  marginBottom: 16,
                  border: selected ? '1.5px solid #D97706' : '1px solid #EAE3D5',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  onClick={() => selectDay(day.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      selectDay(day.id);
                    }
                  }}
                  style={{
                    padding: '10px 14px',
                    background: selected ? '#FFFBEB' : '#FAFAF9',
                    borderBottom: selected ? '1px solid #FDE68A' : '1px solid #EAE3D5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
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
                    onClick={(e) => {
                      e.stopPropagation();
                      addBlock(day);
                    }}
                    disabled={savingDayId === day.id || day.blocks.length >= 6}
                    title="Add block"
                    aria-label="Add block"
                    className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-md border border-[#EAE3D5] bg-white text-lg leading-none touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
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

                  {sortBlocksByTimeOfDay(day.blocks).map((block) => {
                    const isHighlighted = block.id === selectedBlockId;
                    return (
                    <div
                      key={block.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isHighlighted}
                      onClick={() => selectBlock(day, block.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          selectBlock(day, block.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        gap: 10,
                        padding: '10px 8px',
                        margin: '0 -8px',
                        borderRadius: 8,
                        borderBottom: '1px solid #F5F0E8',
                        background: isHighlighted ? '#FFFBEB' : 'transparent',
                        boxShadow: isHighlighted ? 'inset 3px 0 0 #D97706' : 'none',
                        cursor: 'pointer',
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
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(day, block.id);
                        }}
                        disabled={savingDayId === day.id}
                        title="Remove block"
                        aria-label="Remove block"
                        className="self-start min-w-[44px] min-h-[44px] flex items-center justify-center border-0 bg-transparent text-[#A8A29E] text-xl touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed hover:text-[#78716C]"
                      >
                        ×
                      </button>
                    </div>
                    );
                  })}

                  {day.travel_note && (
                    <div className="mt-2 mb-1 rounded-lg border border-amber-100 bg-amber-50 p-3">
                      <p className="mb-1 text-xs font-medium text-amber-900">
                        {travelNoteTitle(day.travel_note_kind)}
                      </p>
                      <p className="text-sm text-amber-800">{day.travel_note}</p>
                    </div>
                  )}

                  {eligibleTourDays.some((d) => d.id === day.id) &&
                    !tourSuggest[day.id]?.skipped && (
                    <TourDaySuggestionCard
                      title={tourSuggest[day.id]?.payload?.title || 'Walking tour'}
                      summary={tourSuggest[day.id]?.payload?.summary}
                      theme={tourSuggest[day.id]?.payload?.theme}
                      stopCount={tourSuggest[day.id]?.payload?.stopCount ?? 0}
                      extraStopNames={tourSuggest[day.id]?.payload?.extraStopNames ?? []}
                      loading={!tourSuggest[day.id] || tourSuggest[day.id].loading}
                      swapping={!!tourSuggest[day.id]?.swapping}
                      error={tourSuggest[day.id]?.error ?? null}
                      confirmOpen={!!tourSuggest[day.id]?.confirm}
                      alternatives={tourSuggest[day.id]?.alternatives ?? null}
                      hasExistingBlocks={day.blocks.length > 0}
                      onUse={() =>
                        setTourSuggest((prev) => ({
                          ...prev,
                          [day.id]: { ...prev[day.id], confirm: true, loading: false },
                        }))
                      }
                      onConfirmUse={() => void acceptTourSuggestion(day)}
                      onCancelConfirm={() =>
                        setTourSuggest((prev) => ({
                          ...prev,
                          [day.id]: { ...prev[day.id], confirm: false },
                        }))
                      }
                      onDismiss={() => dismissTourStop(day.stop_id, day.id)}
                      onSeeOthers={() => void loadTourAlternatives(day.id)}
                      onPickAlternative={(opt) => void pickTourAlternative(day.id, opt)}
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => openDayInChat(day)}
                    className="mt-2 w-full min-h-[44px] rounded-lg border border-[#EAE3D5] bg-white text-[13px] font-medium text-[#92400E] touch-manipulation hover:bg-[#FFFBEB]"
                  >
                    Change this day in chat
                  </button>
                </div>
              </div>
            );
            })}
          </section>
        );
      })}

      <p style={{ fontSize: 12, color: '#A8A29E', textAlign: 'center', marginTop: 8 }}>
        Starting-point plans — edit with +/× or ask chat to regenerate a day.
      </p>
    </div>
  );
}

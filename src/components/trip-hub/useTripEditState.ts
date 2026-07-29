'use client';

import { useCallback, useRef, useState } from 'react';
import {
  chainStopsFromNights,
  deriveNightsFromStop,
} from '@/lib/trip-stops';
import type { TripStop } from '@/types/trip';

function cloneStops(stops: TripStop[]): TripStop[] {
  return stops.map((s) => ({ ...s }));
}

function prepareForChain(stops: TripStop[]): TripStop[] {
  return stops.map((s) => ({ ...s, nights: deriveNightsFromStop(s) }));
}

function rechain(stops: TripStop[], tripStart: string): TripStop[] | null {
  return chainStopsFromNights(prepareForChain(stops), tripStart);
}

export interface TripEditSnapshot {
  title: string;
  tripStart: string;
  stops: TripStop[];
}

export function useTripEditState(
  initialTitle: string,
  initialStops: TripStop[],
  tripStartDate: string
) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(initialTitle);
  const [draftTripStart, setDraftTripStart] = useState('');
  const [draftStops, setDraftStops] = useState<TripStop[]>(() => cloneStops(initialStops));
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const snapshotRef = useRef<TripEditSnapshot | null>(null);
  const tripStartRef = useRef('');

  const applyChain = useCallback((stops: TripStop[], tripStart: string): TripStop[] => {
    const chained = rechain(stops, tripStart);
    return chained ?? stops;
  }, []);

  const enterEdit = useCallback(() => {
    const tripStart = tripStartDate || initialStops[0]?.startDate || '';
    const chained = applyChain(initialStops, tripStart);

    snapshotRef.current = {
      title: initialTitle,
      tripStart,
      stops: cloneStops(chained),
    };

    setDraftTitle(initialTitle);
    setDraftTripStart(tripStart);
    tripStartRef.current = tripStart;
    setDraftStops(chained);
    setSaveError(null);
    setValidationErrors({});
    setIsEditing(true);
  }, [initialTitle, initialStops, tripStartDate, applyChain]);

  const cancelEdit = useCallback(() => {
    const snap = snapshotRef.current;
    if (snap) {
      setDraftTitle(snap.title);
      setDraftTripStart(snap.tripStart);
      tripStartRef.current = snap.tripStart;
      setDraftStops(cloneStops(snap.stops));
    }
    setSaveError(null);
    setValidationErrors({});
    setIsEditing(false);
  }, []);

  const handleTripStartChange = useCallback(
    (tripStart: string) => {
      tripStartRef.current = tripStart;
      setDraftTripStart(tripStart);
      setDraftStops((prev) => applyChain(prev, tripStart));
      setValidationErrors({});
    },
    [applyChain]
  );

  const handleDraftStopsChange = useCallback(
    (nextStops: TripStop[]) => {
      setDraftStops(applyChain(nextStops, tripStartRef.current));
      setValidationErrors({});
    },
    [applyChain]
  );

  /** Fail-safe: build final chained stops for PATCH. Returns null if chain invalid. */
  const buildStopsForSave = useCallback((): TripStop[] | null => {
    if (!draftTripStart.trim()) return null;
    return rechain(draftStops, draftTripStart);
  }, [draftStops, draftTripStart]);

  const finishSave = useCallback(() => {
    setIsEditing(false);
    snapshotRef.current = null;
    setSaveError(null);
    setValidationErrors({});
  }, []);

  return {
    isEditing,
    draftTitle,
    setDraftTitle,
    draftTripStart,
    draftStops,
    saveError,
    setSaveError,
    validationErrors,
    setValidationErrors,
    enterEdit,
    cancelEdit,
    finishSave,
    handleTripStartChange,
    handleDraftStopsChange,
    buildStopsForSave,
  };
}

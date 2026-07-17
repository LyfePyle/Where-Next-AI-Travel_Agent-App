'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { stopsFromSearchParams, TripStop } from '@/types/trip';
import {
  getStopPreviewForDestination,
  parseStoredSuggestions,
  type StopPreview,
  type TripPreview,
} from '@/lib/trip-preview';
import MultiStopTripDetails from '@/components/MultiStopTripDetails';

/** Multi-stop itinerary view with per-stop AI content rehydrated from DB. */
export default function TripDetailsMultiStop() {
  const params = useParams();
  const searchParams = useSearchParams();
  const tripId = (params?.id as string) ?? '';

  const [resolvedStops, setResolvedStops] = useState<TripStop[] | null>(null);
  const [tripApiMeta, setTripApiMeta] = useState<{
    budgetAmount: number;
    adults: number;
    kids: number;
  } | null>(null);
  const [tripOverview, setTripOverview] = useState<TripPreview>({});
  const [stopPreviews, setStopPreviews] = useState<StopPreview[]>([]);
  const lastFetchedTripId = useRef<string | null>(null);

  const budgetParam = searchParams.get('budgetAmount');
  const budgetAmount =
    budgetParam !== null && budgetParam !== '' && !Number.isNaN(Number(budgetParam))
      ? Number(budgetParam)
      : tripApiMeta !== null
        ? tripApiMeta.budgetAmount
        : 0;

  const adults = searchParams.has('adults')
    ? Number(searchParams.get('adults'))
    : tripApiMeta?.adults ?? 1;
  const kids = searchParams.has('kids') ? Number(searchParams.get('kids')) : tripApiMeta?.kids ?? 0;
  const vibe = searchParams.get('vibe') ?? undefined;

  useEffect(() => {
    const urlStops = stopsFromSearchParams(searchParams);
    const hasUrlStops = urlStops.length > 0;

    if (tripId && tripId !== 'new') {
      if (lastFetchedTripId.current !== tripId) {
        if (!hasUrlStops) setResolvedStops(null);
        lastFetchedTripId.current = tripId;
      }

      let cancelled = false;
      fetch(`/api/trips/${tripId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (cancelled) return;
          if (data?.trip) {
            const trip = data.trip;
            const apiStops: TripStop[] =
              hasUrlStops && urlStops.length > 0
                ? urlStops
                : (trip.stops?.length ? trip.stops : [
                    {
                      id: 'stop-0',
                      destination: trip.destination ?? '',
                      startDate: trip.start_date ?? '',
                      endDate: trip.end_date ?? '',
                    },
                  ]);
            setResolvedStops(apiStops);

            const ba = trip.budget_amount;
            const budgetFromApi =
              typeof ba === 'number' && Number.isFinite(ba)
                ? ba
                : ba != null && !Number.isNaN(Number(ba))
                  ? Number(ba)
                  : 0;
            setTripApiMeta({
              budgetAmount: budgetFromApi,
              adults: trip.travelers?.adults ?? trip.adults ?? 1,
              kids: trip.travelers?.kids ?? trip.kids ?? 0,
            });

            const parsed = parseStoredSuggestions(trip.suggestions);
            setTripOverview(parsed.overview);
            setStopPreviews(parsed.stopPreviews);
          } else if (hasUrlStops) {
            setResolvedStops(urlStops);
            setTripApiMeta(null);
            setTripOverview({});
            setStopPreviews([]);
          } else {
            setResolvedStops([]);
            setTripApiMeta(null);
            setTripOverview({});
            setStopPreviews([]);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResolvedStops(hasUrlStops ? urlStops : []);
            setTripApiMeta(null);
            setTripOverview({});
            setStopPreviews([]);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    if (hasUrlStops) {
      setResolvedStops(urlStops);
      setTripApiMeta(null);
      setTripOverview({});
      setStopPreviews([]);
      lastFetchedTripId.current = null;
      return;
    }

    setResolvedStops([]);
    setTripApiMeta(null);
    setTripOverview({});
    setStopPreviews([]);
  }, [tripId, searchParams]);

  if (resolvedStops === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">Loading trip details…</div>
      </div>
    );
  }

  if (resolvedStops.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Trip not found.</p>
          <a href="/plan-trip" className="text-sm font-semibold text-slate-900 underline">
            Plan a new trip
          </a>
        </div>
      </div>
    );
  }

  const enrichedStopPreviews = resolvedStops.map((stop, i) => {
    const fromDb = getStopPreviewForDestination(stopPreviews, stop.destination, i);
    if (fromDb) return fromDb;
    return { destination: stop.destination };
  });

  return (
    <MultiStopTripDetails
      stops={resolvedStops}
      adults={adults}
      kids={kids}
      budgetAmount={budgetAmount}
      tripId={tripId !== 'new' ? tripId : undefined}
      vibe={vibe}
      tripOverview={tripOverview}
      stopPreviews={enrichedStopPreviews}
    />
  );
}

export function TripDetailsMultiStopShell() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <TripDetailsMultiStop />
    </Suspense>
  );
}
